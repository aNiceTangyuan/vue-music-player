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
      <audio v-if="audioUrl" :src="audioUrl" controls class="music-detail-player" />
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
    }
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
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 14px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px rgba(66,185,131,0.10);
}
.music-detail-title {
  font-size: 26px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 12px;
  text-align: center;
}
.music-detail-meta {
  width: 100%;
  text-align: center;
  margin-bottom: 16px;
}
.music-detail-singer {
  font-size: 16px;
  color: #42b983;
  margin-bottom: 4px;
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
.music-detail-select {
  width: 100%;
  margin-bottom: 18px;
  text-align: left;
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
  border-radius: 8px;
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
  width: 100%;
  margin-bottom: 18px;
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
