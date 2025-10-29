<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { searchMusic, searchMusicByIdVkeys } from '../api/music'
import MusicList from '../components/MusicList.vue'
import Sidebar from '../components/Sidebar.vue'
import { ElMessage } from 'element-plus'
import { FolderAdd } from '@element-plus/icons-vue'

const router = useRouter()
const favorites = useFavoritesStore()
const playlistStore = usePlaylistStore()

// 响应式数据
const searchType = ref('word')
const searchInput = ref('')
const results = ref([])
const resultById = ref(null)
const loading = ref(false)
const error = ref('')
const retryCount = ref(0) // 当前重试次数
const maxRetries = 20 // 最大重试次数
const playlistDialogVisible = ref(false) // 歌单对话框显示状态
const currentPlaylist = ref(null) // 当前选中的歌单

// 通用重试函数
async function retryRequest(requestFn, maxAttempts = maxRetries, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    retryCount.value = attempt
    try {
      const result = await requestFn()
      retryCount.value = 0 // 成功后重置计数
      return result
    } catch (err) {
      console.warn(`请求失败 (第 ${attempt}/${maxAttempts} 次)`, err)
      
      if (attempt === maxAttempts) {
        retryCount.value = 0
        throw err // 达到最大重试次数，抛出错误
      }
      
      // 等待一段时间后重试（指数退避策略）
      const waitTime = Math.min(delay * attempt, 5000) // 最多等待5秒
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
}

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
      const res = await retryRequest(async () => {
        const response = await searchMusic(searchInput.value)
        // 检查响应是否成功
        if (!response.data || response.data.code !== 200) {
          throw new Error('搜索响应数据异常')
        }
        return response
      })
      
      results.value = res.data.data || []
      // 保存搜索状态
      localStorage.setItem('musicSearchState', JSON.stringify({
        searchType: searchType.value,
        searchInput: searchInput.value,
        results: results.value
      }))
    } else if (searchType.value === 'id') {
      let id = searchInput.value.trim()
      const urlMatch = id.match(/id=(\d+)/)
      if (urlMatch) id = urlMatch[1]

      const res = await retryRequest(async () => {
        const response = await searchMusicByIdVkeys(id)
        // 检查响应是否成功
        if (!response.data || response.data.code !== 200) {
          throw new Error('ID搜索响应数据异常')
        }
        return response
      })
      
      resultById.value = res.data.data
      // 保存搜索状态
      localStorage.setItem('musicSearchState', JSON.stringify({
        searchType: searchType.value,
        searchInput: searchInput.value,
        resultById: resultById.value
      }))
    }
  } catch (err) {
    console.error(`搜索失败（已重试${maxRetries}次）`, err)
    error.value = `搜索失败，已尝试 ${maxRetries} 次，请稍后再试`
  } finally {
    loading.value = false
  }
}

// 跳转到详情页
const handleGoDetail = (id) => {
  router.push({ path: `/music/${id}` })
}

// 添加歌曲到歌单
const addToPlaylist = (song, playlistId) => {
  const success = playlistStore.addSongToPlaylist(playlistId, song)
  const playlist = playlistStore.getPlaylistById(playlistId)
  if (success) {
    ElMessage.success(`已添加到歌单 "${playlist?.name}"`)
  } else {
    ElMessage.warning(`歌曲已在歌单 "${playlist?.name}" 中`)
  }
}

// 关闭歌单对话框
const closePlaylistDialog = () => {
  playlistDialogVisible.value = false
  currentPlaylist.value = null
}

// 从歌单中删除歌曲
const removeSongFromPlaylist = (songId) => {
  if (currentPlaylist.value) {
    playlistStore.removeSongFromPlaylist(currentPlaylist.value.id, songId)
    // 更新当前歌单引用
    currentPlaylist.value = playlistStore.getPlaylistById(currentPlaylist.value.id)
    ElMessage.success('已从歌单中移除')
  }
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
    <Sidebar />

    <div class="main-content">
      <div class="search-bar">
        <el-input
          v-model="searchInput"
          class="search-input"
          :placeholder="searchType === 'word' ? '输入歌曲名或歌手...' : '输入歌曲ID或链接...'"
          clearable
          @keyup.enter="handleSearchUnified"
        />

        <el-dropdown split-button type="primary" @click="handleSearchUnified" class="search-dropdown">
          {{ loading ? (retryCount > 0 ? `搜索中...(第 ${retryCount} 次尝试)` : '搜索中...') : '🔍 搜索' }}
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="searchType = 'word'">
                {{ searchType === 'word' ? '✓ ' : '' }}按歌曲名/歌手
              </el-dropdown-item>
              <el-dropdown-item @click="searchType = 'id'">
                {{ searchType === 'id' ? '✓ ' : '' }}按歌曲ID
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="results.length > 0" class="results-container">
        <h2 style="margin: 20px 0;">搜索结果：</h2>
        <MusicList :list="results" @go-detail="handleGoDetail" />
      </div>

      <div v-if="resultById" class="results-container">
        <h2 style="margin: 20px 0;">歌曲详情：</h2>
        <div class="music-detail-card">
          <img :src="resultById.cover" class="detail-cover" />
          <div class="detail-info">
            <h3>{{ resultById.song }}</h3>
            <p>歌手：{{ resultById.singer }}</p>
            <p>专辑：{{ resultById.album }}</p>
            <p>音质：{{ resultById.quality }}</p>
            <div class="detail-actions">
              <button
                class="fav-btn"
                :class="{ liked: favorites.isFavorite(resultById.id) }"
                @click="favorites.toggle(resultById)"
              >
                {{ favorites.isFavorite(resultById.id) ? '❤️ 已收藏' : '🤍 收藏' }}
              </button>
              
              <!-- 加入歌单下拉菜单 -->
              <el-dropdown trigger="click" @command="(playlistId) => addToPlaylist(resultById, playlistId)">
                <button class="playlist-btn-detail">
                  <el-icon style="margin-right: 4px;"><folder-add /></el-icon>
                  加入歌单
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="playlistStore.playlists.length === 0" disabled>
                      <span style="color: #999;">暂无歌单，请先创建</span>
                    </el-dropdown-item>
                    <el-dropdown-item 
                      v-for="playlist in playlistStore.playlists" 
                      :key="playlist.id"
                      :command="playlist.id"
                    >
                      📝 {{ playlist.name }} ({{ playlist.songs.length }})
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 歌单详情对话框 -->
    <el-dialog 
      v-model="playlistDialogVisible" 
      :title="currentPlaylist?.name || '歌单详情'"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="currentPlaylist" class="playlist-dialog-content">
        <div class="playlist-info">
          <p class="playlist-count">共 {{ currentPlaylist.songs.length }} 首歌曲</p>
        </div>
        
        <div v-if="currentPlaylist.songs.length === 0" class="empty-playlist">
          暂无歌曲，快去添加吧！
        </div>
        
        <div v-else class="playlist-songs">
          <div 
            v-for="(song, index) in currentPlaylist.songs" 
            :key="song.id"
            class="song-item"
          >
            <div class="song-index">{{ index + 1 }}</div>
            <img :src="song.cover || song.pic" class="song-cover" />
            <div class="song-info">
              <div class="song-name">{{ song.song || song.name }}</div>
              <div class="song-artist">{{ song.singer || song.ar_name }}</div>
            </div>
            <div class="song-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="handleGoDetail(song.id)"
              >
                播放
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="removeSongFromPlaylist(song.id)"
              >
                移除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="closePlaylistDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
#music-search {
  display: flex;
  min-height: 100vh;
}

/* 歌单对话框样式 */
.playlist-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

.playlist-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.playlist-count {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.empty-playlist {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.playlist-songs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.song-item:hover {
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.2);
  border-color: #42b983;
}

.song-index {
  width: 30px;
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-right: 12px;
}

.song-cover {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
  margin-right: 15px;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* ======================= 主体内容区域 ======================= */
.main-content {
  padding: 30px;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平居中内容 */
  overflow-y: auto;
  width: calc(100vw - 220px); /* 精准填满侧栏右侧 */
  justify-content: center;
}

/* 顶部搜索栏居中 */
.search-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  width: 100%;
  max-width: 1000px;
  animation: fadeInDown 0.6s ease;
}

.search-input {
  flex: 1;
  max-width: 500px;
}

.search-input :deep(.el-input__wrapper) {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 0 0 2px #42b983 inset;
  transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 2px #369870 inset;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #369870 inset, 0 0 8px rgba(66, 185, 131, 0.3);
}

.search-input :deep(.el-input__clear) {
  font-size: 18px;
}

.search-dropdown {
  font-size: 16px;
  font-weight: bold;
}

.search-dropdown :deep(.el-button) {
  height: 48px;
  padding: 12px 20px;
  font-size: 16px;
}

.search-dropdown :deep(.el-button--primary) {
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  border: none;
  transition: all 0.3s ease;
}

.search-dropdown :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
}

/* 错误提示 */
.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 20px;
  padding: 15px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
  max-width: 1000px;
}

/* 搜索结果容器 */
.results-container {
  width: 100%;
  max-width: 1200px;
  animation: fadeIn 0.5s ease;
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

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.fav-btn {
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

.playlist-btn-detail {
  padding: 10px 20px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.playlist-btn-detail:hover {
  border-color: #42b983;
  color: #42b983;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  #music-search {
    flex-direction: column;
    justify-content: center;
  }
  .search-bar {
    flex-direction: column;
  }
  .search-input {
    max-width: 100%;
  }
}
</style>