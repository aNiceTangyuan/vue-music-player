<template>
  <div v-if="music" class="music-detail-card">
    <img :src="music.cover" :alt="music.song" class="music-detail-cover" />
    <h2 class="music-detail-title">{{ music.song }}</h2>
    <div class="music-detail-meta">
      <div class="music-detail-singer">歌手：{{ music.singer }}</div>
      <div class="music-detail-album">专辑：{{ music.album }}</div>
      <div class="music-detail-quality">音质：{{ music.quality }}</div>
      <div class="music-detail-size">大小：{{ music.size || '未知' }}</div>
    </div>
    <div class="music-detail-select">
      <label class="music-detail-label">音质：</label>
      <select v-model="selectedQuality" @change="fetchAndPlay" class="music-detail-selectbox">
        <option v-for="item in qualityOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    </div>
    <div class="music-detail-audio">

      <!-- 播放按钮 -->
       <button @click="playGlobal">播放</button>

      <!-- <audio v-if="audioUrl" :src="audioUrl" controls class="music-detail-player" /> -->
      <div v-if="!audioUrl && !loading" class="music-detail-nourl">请选择音质获取试听链接</div>
    </div>
    <div v-if="music.lyric" class="lyric-block">
      <h3>歌词</h3>
      <pre class="lyric">{{ music.lyric }}</pre>
    </div>
  </div>
  <div v-else-if="loading">加载中...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
</template>

<script>

import { searchMusicByIdVkeys } from '../api/music';

export default {
  name: 'MusicDetail',
  data() {
    return {
      music: null,
      loading: false,
      error: '',
      selectedQuality: 4, // 默认320k
      qualityOptions: [
        { value: 1, label: '	标准（64k）' },
        { value: 2, label: '标准（128k）' },
        { value: 3, label: 'HQ极高（192k）' },
        { value: 4, label: '	HQ极高（320k）' },
        { value: 5, label: 'SQ无损' },
        { value: 6, label: '高解析度无损（Hi-Res）' },
        { value: 7, label: '	高清臻音（Spatial Autio）' },
        { value: 8, label: '	沉浸环绕声（Surround Autio）' },
        { value: 9, label: '超清母带（Master）' }
      ],
      audioUrl: '',
    };
  },
  async created() {
  await this.fetchAndPlay();
  },
  methods: {
    // 选择音质后自动请求
    async fetchAndPlay() {
      const id = this.$route.params.id;
      if (!id) {
        this.error = '无效的歌曲ID';
        return;
      }
      this.loading = true;
      this.audioUrl = '';
      try {
        const res = await searchMusicByIdVkeys(id, this.selectedQuality);
        console.log('音乐详情结果:', res);
        if (res.data && res.data.code === 200) {
          this.music = res.data.data;
          this.audioUrl = res.data.data.url || '';
        } else {
          this.error = res.data?.message || '未找到该音质的播放链接';
        }
      } catch (e) {
        this.error = '请求失败，请稍后重试';
      } finally {
        this.loading = false;
      }

    },
playGlobal() {
  if (this.music) {
    // 从 MusicList.vue 拿到歌曲列表
    const playList = this.$root.player.playList || this.$route.query.playList || []; 

    // 找到当前歌曲在列表中的下标
    const playIndex = playList.findIndex(item => item.id === this.music.id);

    this.$root.player = {
      ...this.$root.player,
      ...this.music,
      playList,           // 用 MusicList.vue 的 list
      playIndex: playIndex !== -1 ? playIndex : 0
    };
  }
}


,

},
  watch: {
    selectedQuality() {
      this.fetchAndPlay();
    }
  }
};
</script>

<style scoped>
/* 详情卡片美化，纵向布局 */
.music-detail-card {
  max-width: 500px;
  margin: 40px auto;
  padding: 32px 28px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 24px rgba(66,185,131,0.10);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.music-detail-cover {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 8px 20px rgba(66,185,131,0.18);
  transition: transform 0.3s, box-shadow 0.3s;
}
.music-detail-cover:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 28px rgba(66,185,131,0.25);
}
.music-detail-title {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 16px;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.05);
}
.music-detail-meta {
  width: 100%;
  text-align: center;
  margin-bottom: 20px;
  padding: 10px 15px;
  background: linear-gradient(90deg, #f8fcfa 0%, #fff 100%);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(66,185,131,0.08);
}
.music-detail-singer {
  font-size: 16px;
  color: #42b983;
  margin-bottom: 8px;
  font-weight: 500;
}
.music-detail-album {
  font-size: 16px;
  color: #369870;
  margin-bottom: 8px;
}
.music-detail-quality, .music-detail-size {
  font-size: 15px;
  color: #666;
  margin-bottom: 6px;
}
.music-detail-select {
  width: 100%;
  margin-bottom: 24px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
.music-detail-label {
  font-size: 16px;
  margin-right: 10px;
  color: #2c3e50;
  font-weight: 500;
}
.music-detail-selectbox {
  padding: 8px 20px;
  font-size: 16px;
  border: none;
  border-radius: 10px;
  outline: none;
  background: linear-gradient(90deg, #eafaf3 0%, #fff 100%);
  box-shadow: 0 4px 12px rgba(66,185,131,0.12);
  transition: all 0.3s ease;
  cursor: pointer;
  appearance: none;
  position: relative;
  min-width: 180px;
}
.music-detail-selectbox option {
  background-color: #f5fffa;
  color: #2c3e50;
  padding: 10px;
}
.music-detail-selectbox:focus, .music-detail-selectbox:hover {
  box-shadow: 0 6px 18px rgba(66,185,131,0.25);
  background: linear-gradient(90deg, #42b983 0%, #eafaf3 100%);
  color: #fff;
}
.music-detail-audio {
  width: 100%;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}
.music-detail-audio button {
  padding: 10px 30px;
  font-size: 18px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(66,185,131,0.25);
  transition: all 0.3s ease;
}
.music-detail-audio button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(66,185,131,0.35);
  background: #369870;
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
}
.lyric-block {
  margin-top: 32px;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 16px;
}
.lyric {
  text-align: left;
  white-space: pre-wrap;
  color: #222;
  font-size: 15px;
  line-height: 1.7;
}
.cover {
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 20px;
}
.info {
  text-align: left;
  margin-bottom: 16px;
  color: #333;
}
.error {
  color: #e74c3c;
  margin-top: 40px;
  text-align: center;
}
</style>