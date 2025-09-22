<template>
  <div v-if="music" class="music-detail">
    <h2>{{ music.name }}</h2>
    <div style="margin-bottom:16px">
      <label style="font-size:15px;">音质：</label>
      <select v-model="selectedLevel" @change="fetchDetail" style="padding:4px 10px;font-size:15px;">
        <option v-for="item in levelOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    </div>
    <img :src="music.pic" :alt="music.name" class="cover" />
    <div class="info">
      <div>歌手：{{ music.ar_name }}</div>
      <div>专辑：{{ music.al_name }}</div>
      <div>音质：{{ music.level }}</div>
      <div>大小：{{ music.size || '未知' }}</div>
      <div><a :href="music.url" target="_blank">无损直链试听</a></div>
    </div>
    <audio v-if="audioUrl" :src="audioUrl" controls style="margin-top:10px;width:100%"></audio>
    <div v-if="!audioUrl && !loading" style="color:#e74c3c;margin-top:20px">请选择音质获取试听链接</div>
    <div v-if="music.lyric" class="lyric-block">
      <h3>歌词</h3>
      <pre class="lyric">{{ music.lyric }}</pre>
    </div>
  </div>
  <div v-else-if="loading">加载中...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
</template>

<script>

import { fetchMusicDetailById } from '../api/music';

export default {
  name: 'MusicDetail',
  data() {
    return {
      music: null,
      loading: false,
      error: '',
      selectedLevel: 'standard',
      levelOptions: [
        { value: 'standard', label: '标准' },
        { value: 'exhigh', label: '极高' },
        { value: 'lossless', label: '无损' },
        { value: 'hires', label: 'Hi-Res' },
        { value: 'jyeffect', label: '高清环绕' },
        { value: 'sky', label: '沉浸环绕' },
        { value: 'jymaster', label: '超清母带' }
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
        const res = await fetchMusicDetailById(id, this.selectedLevel);
        if (res.data && res.data.status === 200) {
          this.music = res.data;
          this.audioUrl = res.data.url || '';
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
    selectedLevel() {
      this.fetchAndPlay();
    }
  }
};
</script>

<style scoped>
.music-detail {
  max-width: 500px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
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
