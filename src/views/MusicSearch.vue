<template>
  <div id="music-search">
    <!-- 主体区域 -->
    <div class="main-content">

      <!-- 顶部搜索栏（居中） -->
      <div class="search-bar">
        <select v-model="searchType" class="search-type-select">
          <option value="word">歌曲名字 ></option>
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

      <!-- 内容区域 -->
      <div v-if="loading">搜索中...</div>
      <div v-if="error" class="error">{{ error }}</div>

      <MusicList
        v-if="results.length"
        :list="results"
        @go-detail="handleGoDetail"
        class="music-list"
      />

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
            <div class="detail-link">
              <a :href="resultById.link" target="_blank">网易云播放页</a>
            </div>
            <button
              class="fav-btn fancy-fav-btn"
              :class="{ liked: isFavorite(resultById.id) }"
              @click.stop="toggleFavorite(resultById.id)"
            >
              <span v-if="isFavorite(resultById.id)">❤️ 已收藏</span>
              <span v-else>🤍 收藏</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!loading && !error && !results.length && !resultById">暂无结果</div>
    </div>
  </div>
</template>

<script>
import { searchMusic, searchMusicByIdVkeys } from '../api/music';
import MusicList from '../components/MusicList.vue';

export default {
  name: 'MusicSearch',
  components: { MusicList },
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
      if (idx > -1) this.favoriteIds.splice(idx, 1);
      else this.favoriteIds.push(id);
      localStorage.setItem('favoriteMusicIds', JSON.stringify(this.favoriteIds));
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
          }
        } else {
          let id = this.searchInput.trim();
          const linkMatch = id.match(/id=(\d+)/);
          if (linkMatch) id = linkMatch[1];
          const res = await searchMusicByIdVkeys(id);
          if (res.data && res.data.code === 200 && res.data.data) {
            this.resultById = res.data.data;
          } else {
            this.error = res.data.message || '未找到该ID对应的歌曲';
          }
        }
      } catch (e) {
        this.error = '请求失败，请稍后重试';
      } finally {
        this.loading = false;
      }
            localStorage.setItem('musicSearchState', JSON.stringify({
        searchType: this.searchType,
        searchInput: this.searchInput,
        results: this.results,
        resultById: this.resultById
      }));
    },
    handleGoDetail(id) {

      this.$router.push({ path: `/music/${id}` });
    }
  }
};
</script>

<style scoped>
#music-search {
  background: linear-gradient(120deg, #eafaf3 0%, #fff 100%);
  color: #2c3e50;
  font-family: Avenir, Helvetica, Arial, sans-serif;
    display: flex;
  flex-direction: column;
  align-content: center;     /* 垂直方向居中对齐内容 */
  justify-content: center; /* 水平方向居中对齐内容 */
  min-height: calc(100vh - 60px); /* 减去播放器或顶部高度 */
  text-align: center;
}

/* ======================= 左侧侧边栏 ======================= */
.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #42b983 0%, #369870 100%);
  color: #fff;
  padding: 40px 20px;
  box-shadow: 2px 0 8px rgba(66,185,131,0.1);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
}
.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
}
.sidebar-btn {
  width: 100%;
  padding: 12px 0;
  background: #fff;
  color: #42b983;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.2s, transform 0.2s;
}
.sidebar-btn:hover {
  background: #eafaf3;
  transform: scale(1.05);
}

/* ======================= 主体内容区域 ======================= */
.main-content {
  /* 去掉左侧预留空白 */
  margin-left: 0;
  flex: 1;

  /* ✅ 居中对齐 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 40px 20px;
  text-align: center;
  min-height: calc(100vh - 60px); /* 保证页面居中 */
}




/* 顶部搜索栏居中 */
.search-bar {
  display: flex;
  justify-content: center;
  margin: 0 auto 40px auto;
  gap: 0;
  max-width: 600px;
  background: linear-gradient(90deg, #eafaf3 0%, #f8f8f8 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(66,185,131,0.08);
  padding: 20px 24px;

  

}

.search-type-select {
  padding: 12px 18px;
  font-size: 18px;
  border: none;
  border-radius: 12px 0 0 12px;
  background: linear-gradient(90deg, #42b983 0%, #eafaf3 100%);
  color: #fff;
  outline: none;
}

.search-input {
  padding: 12px;
  width: 300px;
  font-size: 18px;
  border: none;
  border-radius: 0 12px 12px 0;
  background: #fff;
  outline: none;
}

.search-btn {
  padding: 12px 28px;
  margin-left: 14px;
  font-size: 18px;
  background: linear-gradient(90deg, #42b983 0%, #369870 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s, transform 0.2s;
}
.search-btn:hover {
  background: linear-gradient(90deg, #369870 0%, #42b983 100%);
  transform: scale(1.05);
}

/* 动画 */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式适配 */
@media (max-width: 768px) {
  #music-search {
    flex-direction: column;
  }
  .sidebar {
    position: relative;
    width: 100%;
    height: auto;
    box-shadow: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
  }
}
</style>
