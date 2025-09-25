<template>
  <div id="music-search">
    <div class="search-header">
      <h1 class="search-title">音乐搜索</h1>
      <button class="fav-list-btn" @click="$router.push('/favorite')">我喜欢的音乐歌单</button>
    </div>
    <div class="search-bar">
      <select v-model="searchType" class="search-type-select">
        <option value="word">歌曲名字</option>
        <option value="id">ID/链接</option>
      </select>
      <input
        v-model="searchInput"
        @keyup.enter="handleSearchUnified"
        :placeholder="searchType === 'word' ? '请输入歌曲名或歌手' : '请输入歌曲ID'"
        class="search-input"
      />
      <button class="search-btn" @click="handleSearchUnified">搜索</button>
    </div>
    <div v-if="loading">搜索中...</div>
    <div v-if="error" class="error">{{ error }}</div>
  <MusicList v-if="results.length" :list="results" @go-detail="handleGoDetail" />
    <div v-if="resultById">
  <div class="detail-card detail-card-fancy" @click="handleGoDetail(resultById.id)">
        <img :src="resultById.cover" :alt="resultById.song" class="detail-cover detail-cover-fancy" />
        <div class="detail-info detail-info-fancy">
          <div class="detail-song detail-song-fancy">{{ resultById.song }}</div>
          <div class="detail-meta-row">
            <span class="detail-singer">歌手：{{ resultById.singer }}</span>
            <span class="detail-album">专辑：{{ resultById.album }}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-time">发行时间：{{ resultById.time || '未知' }}</span>
            <span class="detail-quality">音质：{{ resultById.quality }}</span>
          </div>
          <div class="detail-meta-row">
            <span class="detail-interval">时长：{{ resultById.interval || '未知' }}</span>
            <span class="detail-size">大小：{{ resultById.size || '未知' }}</span>
            <span class="detail-kbps">码率：{{ resultById.kbps || '未知' }}</span>
          </div>
          <div class="detail-link"><a :href="resultById.link" target="_blank">网易云播放页</a></div>
          <button class="fav-btn fancy-fav-btn" :class="{ liked: isFavorite(resultById.id) }" @click.stop="toggleFavorite(resultById.id)">
            <span v-if="isFavorite(resultById.id)">❤️ 已收藏</span>
            <span v-else>🤍 收藏</span>
          </button>
          <div v-if="resultById.url" class="detail-audio">
            <audio :src="resultById.url" controls class="audio-player-fancy" />
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!loading && !error && !results.length && !resultById">暂无结果</div>
  </div>
</template>

<script>

import { searchMusic, searchMusicByIdVkeys } from '../api/music';
import MusicList from '../components/MusicList.vue';

export default {
  name: 'MusicSearch',
  components: {
    MusicList
  },
  data() {
    return {
      favoriteIds: JSON.parse(localStorage.getItem('favoriteMusicIds') || '[]'),
      searchType: 'word',
      searchInput: '',
      results: [],
      resultById: null,
      loading: false,
      error: ''
    };
  },
  mounted() {
    // 挂载时恢复搜索状态
    this.isFavorite()
    const state = localStorage.getItem('musicSearchState');
    if (state) {
      try {
        const obj = JSON.parse(state);
        this.searchType = obj.searchType || 'word';
        this.searchInput = obj.searchInput || '';
        this.results = obj.results || [];
        this.resultById = obj.resultById || null;
      } catch (e) {
        console.error('恢复搜索状态失败：', e);
       }
    }
  },
  methods: {
        isFavorite(id) {
      return this.favoriteIds.includes(id);
    },
        toggleFavorite(id) {
      const idx = this.favoriteIds.indexOf(id);
      if (idx > -1) {
        this.favoriteIds.splice(idx, 1);
      } else {
        this.favoriteIds.push(id);
      }
      localStorage.setItem('favoriteMusicIds', JSON.stringify(this.favoriteIds));
      this.$emit('favorite-change', this.favoriteIds);
    },
    async handleSearchUnified() {
      if (!this.searchInput.trim()) {
        this.error = this.searchType === 'word' ? '请输入关键词' : '请输入歌曲ID或链接';
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
          // 支持输入网易云链接，自动提取id
          let id = this.searchInput.trim();
          const linkMatch = id.match(/id=(\d+)/);
          if (linkMatch) {
            id = linkMatch[1];
          }
          const res = await searchMusicByIdVkeys(id);
          console.log('ID/链接搜索结果:', res);
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
    },
    handleGoDetail(id) {
      // 跳转详情页前保存状态
      localStorage.setItem('musicSearchState', JSON.stringify({
        searchType: this.searchType,
        searchInput: this.searchInput,
        results: this.results,
        resultById: this.resultById
      }));
      console.log(this.searchType)
      this.$router.push({ path: `/music/${id}` });
    }
    }
  }

</script>

<style scoped>
.detail-card-fancy {
  background: linear-gradient(120deg, #eafaf3 0%, #fff 100%);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(66,185,131,0.13);
  padding: 36px 44px;
  max-width: 720px;
  margin: 40px auto 32px auto;
  transition: box-shadow 0.2s;
}
.detail-cover-fancy {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  margin-right: 44px;
  box-shadow: 0 6px 24px rgba(66,185,131,0.13);
}
.detail-info-fancy {
  gap: 8px;
  display: flex;
  flex-direction: column;
}
.detail-song-fancy {
  font-size: 30px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 12px;
  letter-spacing: 1.5px;
}
.detail-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 2px;
  font-size: 16px;
  color: #369870;
}
.fancy-fav-btn {
  margin-top: 16px;
  padding: 8px 22px;
  font-size: 17px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(90deg, #eafaf3 0%, #fff 100%);
  color: #42b983;
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.fancy-fav-btn.liked {
  background: linear-gradient(90deg, #42b983 0%, #eafaf3 100%);
  color: #e74c3c;
}
.fancy-fav-btn:hover {
  background: linear-gradient(90deg, #42b983 0%, #eafaf3 100%);
  color: #e67e22;
}
.audio-player-fancy {
  width: 100%;
  margin-top: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
  background: #f8f8f8;
}
.detail-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(66,185,131,0.10);
  margin: 30px auto;
  max-width: 650px;
  padding: 28px 32px;
  border: none;
}
.detail-cover {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  margin-right: 32px;
  box-shadow: 0 2px 8px rgba(66,185,131,0.10);
}
.detail-info {
  text-align: left;
  flex: 1;
}
.detail-song {
  font-size: 26px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
}
.detail-singer {
  font-size: 17px;
  color: #42b983;
  margin-bottom: 4px;
}
.detail-album {
  font-size: 17px;
  color: #369870;
  margin-bottom: 4px;
}
.detail-time, .detail-quality, .detail-interval, .detail-size, .detail-kbps {
  font-size: 15px;
  color: #888;
  margin-bottom: 4px;
}
.detail-link {
  margin-top: 8px;
}
.detail-link a {
  color: #42b983;
  text-decoration: underline;
  font-size: 15px;
}
.detail-audio {
  margin-top: 12px;
}
#music-search {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 40px;
}
.search-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin: 0 auto 24px auto;
  max-width: 700px;
}
.search-title {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: 2px;
}
.fav-list-btn {
  background: linear-gradient(90deg, #42b983 0%, #369870 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.fav-list-btn:hover {
  background: linear-gradient(90deg, #369870 0%, #42b983 100%);
  box-shadow: 0 4px 16px rgba(66,185,131,0.18);
}
.search-bar {
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #eafaf3 0%, #f8f8f8 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(66,185,131,0.08);
  padding: 18px 24px;
  gap: 0;
}
.search-type-select {
  padding: 10px 16px;
  font-size: 17px;
  border: none;
  border-radius: 12px 0 0 12px;
  outline: none;
  background: linear-gradient(90deg, #42b983 0%, #eafaf3 100%);
  margin-right: -1px;
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
  transition: box-shadow 0.2s, background 0.2s;
  appearance: none;
}
.search-type-select:focus, .search-type-select:hover {
  box-shadow: 0 4px 16px rgba(66,185,131,0.18);
  background: linear-gradient(90deg, #369870 0%, #eafaf3 100%);
}
.search-input {
  padding: 10px;
  width: 260px;
  font-size: 17px;
  border: none;
  border-radius: 0 12px 12px 0;
  outline: none;
  background: linear-gradient(90deg, #eafaf3 0%, #fff 100%);
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
}
.search-btn {
  padding: 10px 24px;
  margin-left: 12px;
  font-size: 17px;
  background: linear-gradient(90deg, #42b983 0%, #369870 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
  transition: background 0.2s, box-shadow 0.2s;
}
.search-type-select option {
  border-radius: 8px;
  background: #f8f8f8;
  color: #2c3e50;
  padding: 8px 16px;
  margin: 4px 0;
}
.search-btn:hover {
  background: linear-gradient(90deg, #369870 0%, #42b983 100%);
  box-shadow: 0 4px 16px rgba(66,185,131,0.18);
}
</style>
