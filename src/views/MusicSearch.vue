<template>
  <div id="music-search">
    <h1>音乐搜索</h1>
    <div class="search-bar">
      <select v-model="searchType" class="search-type-select">
        <option value="word">关键词</option>
        <option value="id">ID</option>
      </select>
      <input
        v-model="searchInput"
        @keyup.enter="handleSearchUnified"
        :placeholder="searchType === 'word' ? '请输入歌曲名或歌手' : '请输入歌曲ID'"
      />
      <button @click="handleSearchUnified">搜索</button>
    </div>
    <div v-if="loading">搜索中...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <MusicList v-if="results.length" :list="results" />
    <div v-if="resultById">
      <div class="music-item" style="margin: 30px auto; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
        <img :src="resultById.cover" :alt="resultById.song" class="cover" />
        <div class="info">
          <div class="song">{{ resultById.song }}</div>
          <div class="singer">歌手：{{ resultById.singer }}</div>
          <div class="album">专辑：{{ resultById.album }}</div>
          <div class="time">发行时间：{{ resultById.time || '未知' }}</div>
          <div class="quality">音质：{{ resultById.quality }}</div>
          <div class="interval">时长：{{ resultById.interval || '未知' }}</div>
          <div class="size">大小：{{ resultById.size || '未知' }}</div>
          <div class="kbps">码率：{{ resultById.kbps || '未知' }}</div>
          <div class="link"><a :href="resultById.link" target="_blank">网易云播放页</a></div>
          <div class="url"><a :href="resultById.url" target="_blank">无损直链试听</a></div>
        </div>
      </div>
    </div>
    <div v-else-if="!loading && !error && !results.length && !resultById">暂无结果</div>
  </div>
</template>

<script>

import { searchMusic, searchMusicById } from '../api/music';
import MusicList from '../components/MusicList.vue';

export default {
  name: 'MusicSearch',
  components: {
    MusicList
  },
  data() {
    return {
      searchType: 'word',
      searchInput: '',
      results: [],
      resultById: null,
      loading: false,
      error: ''
    };
  },
  methods: {
    async handleSearchUnified() {
      if (!this.searchInput.trim()) {
        this.error = this.searchType === 'word' ? '请输入关键词' : '请输入歌曲ID';
        this.results = [];
        this.resultById = null;
        return;
      }
      this.loading = true;
      this.error = '';
      this.results = [];
      this.resultById = null;
      try {
        if (this.searchType === 'word') {
          const res = await searchMusic(this.searchInput);
          if (res.data && res.data.code === 200) {
            this.results = res.data.data || [];
          } else {
            this.error = res.data.message || '搜索失败';
            this.results = [];
          }
        } else {
          const res = await searchMusicById(this.searchInput);
          if (res.data && res.data.code === 200 && res.data.data) {
            this.resultById = res.data.data;
          } else {
            this.error = res.data.message || '未找到该ID对应的歌曲';
            this.resultById = null;
          }
        }
      } catch (e) {
        this.error = '请求失败，请稍后重试';
        this.results = [];
        this.resultById = null;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
#music-search {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 40px;
}
.search-bar {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-type-select {
  padding: 8px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
  outline: none;
  background: #f8f8f8;
  margin-right: -1px;
}
.search-bar input {
  padding: 8px;
  width: 220px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-left: none;
  border-radius: 0 4px 4px 0;
  outline: none;
}
.search-bar button {
  padding: 8px 16px;
  margin-left: 8px;
  font-size: 16px;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.search-bar button:hover {
  background: #369870;
}
.music-list {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 600px;
}
.music-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 16px 0;
}
.cover {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 20px;
}
.info {
  text-align: left;
}
.song {
  font-size: 20px;
  font-weight: bold;
}
.singer, .album, .time, .quality {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
.error {
  color: #e74c3c;
  margin-bottom: 16px;
}
</style>
