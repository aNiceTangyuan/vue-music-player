<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { searchMusic, searchMusicByIdVkeys } from '../api/music'
import MusicList from '../components/MusicList.vue'

const router = useRouter()
const favorites = useFavoritesStore()

// 响应式数据
const searchType = ref('word')
const searchInput = ref('')
const results = ref([])
const resultById = ref(null)
const loading = ref(false)
const error = ref('')

// 统一搜索处理
const handleSearchUnified = async () => {
  if (!searchInput.value.trim()) {
    error.value = '请输入搜索内容'
    return
  }

  loading.value = true
  error.value = ''
  results.value = []
  resultById.value = null

  try {
    if (searchType.value === 'word') {
      const res = await searchMusic(searchInput.value)
      if (res.data && res.data.code === 200) {
        results.value = res.data.data || []
        // 保存搜索状态
        localStorage.setItem('musicSearchState', JSON.stringify({
          searchType: searchType.value,
          searchInput: searchInput.value,
          results: results.value
        }))
      } else {
        error.value = '搜索失败，请重试'
      }
    } else if (searchType.value === 'id') {
      let id = searchInput.value.trim()
      const urlMatch = id.match(/id=(\d+)/)
      if (urlMatch) id = urlMatch[1]

      const res = await searchMusicByIdVkeys(id)
      if (res.data && res.data.code === 200) {
        resultById.value = res.data.data
        // 保存搜索状态
        localStorage.setItem('musicSearchState', JSON.stringify({
          searchType: searchType.value,
          searchInput: searchInput.value,
          resultById: resultById.value
        }))
      } else {
        error.value = '未找到该歌曲'
      }
    }
  } catch (err) {
    console.error(err)
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}

// 跳转到详情页
const handleGoDetail = (id) => {
  router.push({ path: `/music/${id}` })
}

// 组件挂载时恢复搜索状态
onMounted(() => {
  const saved = localStorage.getItem('musicSearchState')
  if (saved) {
    try {
      const state = JSON.parse(saved)
      searchType.value = state.searchType || 'word'
      searchInput.value = state.searchInput || ''
      results.value = state.results || []
      resultById.value = state.resultById || null
    } catch (e) {
      console.warn('恢复搜索状态失败', e)
    }
  }
})
</script>
 
<template>
  <div id="music-search">
    <div class="sidebar">
      <h2 class="sidebar-title">🎵 音乐世界</h2>
      <router-link to="/" class="sidebar-btn">🔍 搜索音乐</router-link>
      <router-link to="/favorites" class="sidebar-btn">❤️ 喜欢的音乐</router-link>
    </div>

    <div class="main-content">
      <div class="search-bar">
        <select v-model="searchType" class="search-type-select">
          <option value="word">按歌曲名/歌手</option>
          <option value="id">按歌曲ID</option>
        </select>

        <input
          v-model="searchInput"
          type="text"
          class="search-input"
          :placeholder="searchType === 'word' ? '输入歌曲名或歌手...' : '输入歌曲ID或链接...'"
          @keyup.enter="handleSearchUnified"
        />

        <button @click="handleSearchUnified" class="search-btn">
          {{ loading ? '搜索中...' : '搜索' }}
        </button>
      </div>

      <div v-if="error" style="color: red; text-align: center; margin-top: 20px;">
        {{ error }}
      </div>

      <div v-if="results.length > 0">
        <h2 style="margin: 20px 0;">搜索结果：</h2>
        <MusicList :list="results" @go-detail="handleGoDetail" />
      </div>

      <div v-if="resultById">
        <h2 style="margin: 20px 0;">歌曲详情：</h2>
        <div class="music-detail-card">
          <img :src="resultById.pic" class="detail-cover" />
          <div class="detail-info">
            <h3>{{ resultById.name }}</h3>
            <p>歌手：{{ resultById.ar_name }}</p>
            <p>专辑：{{ resultById.al_name }}</p>
            <p>音质：{{ resultById.quality }}</p>
            <button
              class="fav-btn"
              :class="{ liked: favorites.isFavorite(resultById.id) }"
              @click="favorites.toggle(resultById)"
            >
              {{ favorites.isFavorite(resultById.id) ? '❤️ 已收藏' : '🤍 收藏' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#music-search {
  display: flex;
  min-height: 100vh;
}

/* ======================= 左侧侧边栏 ======================= */
.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #42b983 0%, #369870 100%);
  color: #fff;
  padding: 40px 20px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
}

.sidebar-btn {
  display: block;
  width: 100%;
  padding: 12px 20px;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  text-decoration: none;
}

.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(5px);
}

/* ======================= 主体内容区域 ======================= */
.main-content {
  flex: 1;
  padding: 30px;
  background: #f5f5f5;
}

/* 顶部搜索栏居中 */
.search-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  animation: fadeInDown 0.6s ease;
}

.search-type-select {
  padding: 12px 16px;
  border: 2px solid #42b983;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  outline: none;
}

.search-input {
  flex: 1;
  max-width: 500px;
  padding: 12px 20px;
  border: 2px solid #42b983;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #369870;
  box-shadow: 0 0 8px rgba(66, 185, 131, 0.3);
}

.search-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
}

.music-detail-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  gap: 20px;
}

.detail-cover {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  object-fit: cover;
}

.detail-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.detail-info p {
  margin: 5px 0;
  color: #666;
}

.fav-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: transparent;
  border: 2px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.fav-btn:hover {
  border-color: #42b983;
}

.fav-btn.liked {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  #music-search {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  .search-bar {
    flex-direction: column;
  }
  .search-input {
    max-width: 100%;
  }
}
</style>