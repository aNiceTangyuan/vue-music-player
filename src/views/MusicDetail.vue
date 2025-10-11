<template>
  <transition name="fade" mode="out-in">
    <div v-if="music" key="music-detail">
      <div v-if="music" class="music-detail-flex">

        <div class="music-detail-left">
          <img :src="music.cover" :alt="music.song" class="music-detail-cover" />
          <h2 class="music-detail-title">{{ music.song }}</h2>
          <div class="music-detail-meta">
            <div class="music-detail-singer">歌手：{{ music.singer }}</div>
            <div class="music-detail-album">专辑：{{ music.album }}</div>
            <div class="music-detail-quality">音质：{{ music.quality }}</div>
            <div class="music-detail-size">大小：{{ music.size || '未知' }}</div>
          </div>
        </div>

        <div class="music-detail-right">

          <div v-if="parsedLyric.length" class="lyric-block" ref="lyricBlock"
          @mouseenter="isHoverLyric = true"
          @mouseleave="isHoverLyric = false">
            <h3>歌词</h3>
            <div class="lyric-scroll">
              <div v-for="(line, idx) in parsedLyric" :key="idx"
                   :class="['lyric-line', { active: idx === currentLine }]"
                   :ref="idx === currentLine ? 'activeLyric' : null">
                {{ line.text }}
              </div>
            </div>
          </div>
          <div v-else-if="lyric" class="lyric-block">
            <h3>歌词</h3>
            <pre class="lyric">{{ lyric }}</pre>
          </div>

          <div class="select-audio">
            <div class="music-detail-select">
              <label class="music-detail-label">音质：</label>
              <select v-model="selectedQuality" @change="fetchAndPlay" class="music-detail-selectbox">
                <option v-for="item in qualityOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </div>
            <div class="music-detail-audio">
              <button @click="playGlobal">播放</button>
              <div v-if="!audioUrl && !loading" class="music-detail-nourl">请选择音质获取试听链接</div>
            </div>
          </div>

        </div>
      </div>

      <div v-else-if="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
    </div>
  </transition>
</template>

<script>
import { searchMusicByIdVkeys, fetchLyricById } from '../api/music';

export default {
  name: 'MusicDetail',
  data() {
    return {
      music: null,
      loading: false,
      error: '',
      selectedQuality: 4, // 默认320k
      qualityOptions: [
        { value: 1, label: '标准（64k）' },
        { value: 2, label: '标准（128k）' },
        { value: 3, label: 'HQ极高（192k）' },
        { value: 4, label: 'HQ极高（320k）' },
        { value: 5, label: 'SQ无损' },
        { value: 6, label: '高解析度无损（Hi-Res）' },
        { value: 7, label: '高清臻音（Spatial Autio）' },
        { value: 8, label: '沉浸环绕声（Surround Autio）' },
        { value: 9, label: '超清母带（Master）' }
      ],
      audioUrl: '',
      lyric: '',
      parsedLyric: [],
      currentLine: 0,
      isHoverLyric: false, // 是否悬停歌词区域
      hoverTimeout: null,  // 鼠标离开后恢复自动滚动的定时器
    };
  },
  async created() {
    await this.fetchAndPlay();
    await this.fetchLyric();
  },
  async beforeRouteUpdate(to, from, next) {
    this.music = null;
    this.audioUrl = '';
    this.lyric = '';
    this.parsedLyric = [];
    this.currentLine = 0;
    this.error = '';
    this.loading = true;

    try {
      await this.fetchAndPlayById(to.params.id);
      await this.fetchLyricById(to.params.id);
      next();
    } catch (e) {
      this.error = '加载新歌曲失败';
      next(e);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async fetchAndPlayById(id) {
      const res = await searchMusicByIdVkeys(id, this.selectedQuality);
      if (res.data && res.data.code === 200) {
        this.music = res.data.data;
        this.audioUrl = res.data.data.url || '';
      } else {
        this.error = '未找到播放链接';
      }
    },
    async fetchLyricById(id) {
      const res = await fetchLyricById(id);
      if (res.data && res.data.code === 200) {
        this.lyric = res.data.data.lrc || '';
        this.parsedLyric = this.parseLRC(this.lyric);
      } else {
        this.lyric = '暂无歌词';
      }
    },
    handleLyric(current) {
      let idx = 0;
      for (let i = 0; i < this.parsedLyric.length; i++) {
        if (current >= this.parsedLyric[i].time) idx = i;
        else break;
      }
      this.currentLine = idx;
      // 保留自动滚动
      this.scrollLyric();
    },
    async fetchAndPlay() {
      const id = this.$route.params.id;
      if (!id) {
        this.error = '无效的歌曲ID';
        return;
      }

      this.loading = true;
      this.audioUrl = '';
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        try {
          const res = await searchMusicByIdVkeys(id, this.selectedQuality);
          if (res.data && res.data.code === 200) {
            this.music = res.data.data;
            this.audioUrl = res.data.data.url || '';
            this.error = '';
            break;
          } else if (res.data && res.data.code === 503) {
            attempts++;
            if (attempts >= maxAttempts) {
              this.error = '请求失败，已重试 10 次';
            } else {
              console.warn(`503 错误，正在重试 (${attempts}/${maxAttempts})...`);
              continue;
            }
          } else {
            this.error = res.data?.message || '未找到该音质的播放链接';
            break;
          }
        } catch (e) {
          this.error = '请求失败，请稍后重试';
          break;
        } finally {
          this.loading = false;
        }
      }
    },
    async fetchLyric() {
      const id = this.$route.params.id;
      if (!id) return;

      let attempts = 0;
      let success = false;

      while (attempts < 5 && !success) {
        try {
          const res = await fetchLyricById(id);
          if (res.data && res.data.code === 200) {
            this.lyric = res.data.data.lrc || '';
            this.parsedLyric = this.parseLRC(this.lyric);
            success = true;
          } else if (res.data && res.data.code === 503) {
            attempts++;
            await new Promise(r => setTimeout(r, 500));
          } else {
            this.lyric = '暂无歌词';
            this.parsedLyric = [];
            break;
          }
        } catch (e) {
          attempts++;
          if (attempts >= 5) {
            this.lyric = '歌词获取失败';
            this.parsedLyric = [];
          }
        }
      }
    },
    parseLRC(lrc) {
      if (!lrc) return [];
      const lines = lrc.split(/\r?\n/);
      const result = [];
      const timeReg = /\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\]/g;

      for (const line of lines) {
        const matches = [...line.matchAll(timeReg)];
        const text = line.replace(timeReg, '').trim();
        for (const m of matches) {
          const min = parseInt(m[1]);
          const sec = parseFloat(m[2]);
          const time = min * 60 + sec;
          if (text) result.push({ time, text });
        }
      }
      return result.sort((a, b) => a.time - b.time);
    },
    onTimeUpdate(e) {
      const audio = e.target;
      const current = audio.currentTime;
      let idx = 0;
      for (let i = 0; i < this.parsedLyric.length; i++) {
        if (current >= this.parsedLyric[i].time) {
          idx = i;
        } else {
          break;
        }
      }
      this.currentLine = idx;
      this.scrollLyric();
    },
      // 悬停歌词区域
  onLyricMouseEnter() {
    this.isHoverLyric = true;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  },

  // 鼠标离开歌词区域
  onLyricMouseLeave() {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    this.hoverTimeout = setTimeout(() => {
      this.isHoverLyric = false; // 延迟 3 秒恢复自动滚动
    }, 3000);
  },
scrollLyric() {
  if (this.isHoverLyric) return; // 悬停时停止自动滚动
  this.$nextTick(() => {
    const block = this.$refs.lyricBlock;
    const active = this.$refs.activeLyric;
    if (block && active && active[0]) {
      const blockEl = block;
      const activeEl = active[0];
      blockEl.scrollTop =
        activeEl.offsetTop - blockEl.offsetHeight / 2 + activeEl.offsetHeight / 2;
    }
  });
},

    playGlobal() {
      if (this.music) {
        const playList = this.$root.player.playList || this.$route.query.playList || [];
        const playIndex = playList.findIndex(item => item.id === this.music.id);
        this.$root.player = {
          ...this.$root.player,
          ...this.music,
          src: this.audioUrl,
          playList,
          playIndex: playIndex !== -1 ? playIndex : 0
        };
      }
    }
  },
  watch: {
    selectedQuality() {
      this.fetchAndPlay();
      this.fetchLyric();
    },
    '$root.player.currentTime'(newTime) {
      if (this.$root.player && this.$root.player.id === this.music?.id) {
        this.handleLyric(newTime);
      }
    },
    '$root.player.id'(newId) {
      if (newId && this.$route.params.id !== String(newId)) {
        this.$router.push(`/music/${newId}`);
      }
    }
  }
};
</script>
<style scoped>

/* 详情页左右布局美化升级 */
.music-detail-flex {
  display: flex;
  max-width: 900px;
  margin: 40px auto;
  background: rgba(255,255,255,0.85);
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(66,185,131,0.18), 0 1.5px 8px rgba(66,185,131,0.10);
  padding: 0;
  backdrop-filter: blur(16px) saturate(180%);
  border: 1.5px solid rgba(66,185,131,0.08);
  transition: box-shadow 0.3s;
}
.music-detail-flex:hover {
  box-shadow: 0 16px 48px rgba(66,185,131,0.22), 0 2px 12px rgba(66,185,131,0.12);
}
.music-detail-left {
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #eafaf3 0%, #fff 100%);
  border-top-left-radius: 22px;
  border-bottom-left-radius: 22px;
  padding: 48px 0;
  box-shadow: 0 2px 12px rgba(66,185,131,0.08);
}
.music-detail-cover {
  width: 190px;
  height: 190px;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(66,185,131,0.18);
  border: 2px solid #eafaf3;
  transition: box-shadow 0.2s, border 0.2s;
}
.music-detail-cover:hover {
  box-shadow: 0 8px 32px rgba(66,185,131,0.28);
  border: 2px solid #42b983;
}
.music-detail-title {
  font-size: 30px;
  font-weight: bold;
  color: #2c3e50;
  margin: 28px 0 18px 0;
  text-align: center;
  letter-spacing: 1.5px;
  text-shadow: 0 2px 8px rgba(66,185,131,0.10);
}
.music-detail-meta {
  width: 100%;
  text-align: center;
  margin-bottom: 16px;
}
.music-detail-singer {
  font-size: 17px;
  color: #42b983;
  margin-bottom: 4px;
  font-weight: 500;
}
.music-detail-album {
  font-size: 16px;
  color: #369870;
  margin-bottom: 4px;
}
.music-detail-quality, .music-detail-size {
  font-size: 15px;
  color: #888;
  margin-bottom: 4px;
}
.music-detail-right {
  flex: 1;
  padding: 48px 48px 48px 38px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}
/* 滚动歌词美化 */
.lyric-block {
  margin-top: 0;
  background: linear-gradient(90deg, #eafaf3 0%, #fff 100%);
  border-radius: 12px;
  padding: 18px 20px;
  width: 100%;
  min-height: 180px;
  max-height: 340px;
  overflow-y: auto;
  box-shadow: 0 2px 12px rgba(66,185,131,0.10);
  animation: lyricFadeIn 0.8s;
  position: relative;
}
.lyric-scroll {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.lyric-line {
  font-size: 16px;
  color: #222;
  line-height: 2.1;
  letter-spacing: 0.5px;
  font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
  padding: 2px 10px; /* 左右保留少量内边距 */
  transition: color 0.2s, font-size 0.2s, background 0.2s, box-shadow 0.2s;
  opacity: 0.7;
  display: block;      /* 让每行独占一行 */
  width: 100%;         /* 宽度撑满父容器 */
  box-sizing: border-box; /* padding 不影响宽度 */
    position: relative; /* 让按钮绝对定位在行内右侧 */
}

.lyric-line:hover {
  background: rgba(66, 185, 131, 0.15);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
  border-radius: 6px;
}
.lyric-play-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(66, 185, 131, 0.8);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.lyric-line:hover .lyric-play-btn {
  opacity: 1; /* 鼠标悬浮显示按钮 */
}

.lyric-play-btn:hover {
  background: #42b983;
}

.lyric-line.active {
  color: #42b983;
  font-size: 19px;
  font-weight: bold;
  opacity: 1;
  text-shadow: 0 2px 8px rgba(66,185,131,0.10);
}
.select-audio {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  margin-top: 32px;
}
.music-detail-select {
  width: auto;
  margin-bottom: 0;
  text-align: left;
  margin-right: 24px;
}
.music-detail-label {
  font-size: 16px;
  margin-right: 8px;
  color: #2c3e50;
}
.music-detail-selectbox {
  padding: 7px 16px;
  font-size: 16px;
  border: none;
  border-radius: 10px;
  outline: none;
  background: linear-gradient(90deg, #eafaf3 0%, #fff 100%);
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
  transition: box-shadow 0.2s, background 0.2s;
  appearance: none;
}
.music-detail-selectbox:focus, .music-detail-selectbox:hover {
  box-shadow: 0 4px 16px rgba(66,185,131,0.18);
  background: linear-gradient(90deg, #369870 0%, #eafaf3 100%);
}
.music-detail-audio {
  width: auto;
  margin-bottom: 0;
  margin-left: 12px;
}
.music-detail-audio button {
  padding: 8px 28px;
  font-size: 17px;
  border-radius: 24px;
  background: linear-gradient(90deg, #42b983 0%, #eafaf3 100%);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px rgba(66,185,131,0.10);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s, box-shadow 0.2s;
}
.music-detail-audio button:hover {
  background: linear-gradient(90deg, #369870 0%, #42b983 100%);
  box-shadow: 0 4px 16px rgba(66,185,131,0.18);
}
.music-detail-player {
  width: 100%;
  margin-top: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
  background: #f8f8f8;
}
.music-detail-nourl {
  color: #e74c3c;
  margin-top: 20px;
  text-align: center;
  font-size: 15px;
}
.error {
  color: #e74c3c;
  margin-top: 40px;
  text-align: center;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

</style>
