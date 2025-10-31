<script setup>
import { ref, watch, onMounted, onUnmounted, getCurrentInstance, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { searchMusicByIdVkeys, fetchLyricById } from '../api/music'
import Sidebar from '../components/Sidebar.vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()
const player = usePlayerStore()
const playlistStore = usePlaylistStore()
const music = ref(null)
const loading = ref(false)
const error = ref('')
const selectedQuality = ref(4)
const playlistDialogVisible = ref(false) // 歌单对话框显示状态
const currentPlaylist = ref(null) // 当前选中的歌单 
const qualityOptions = [
  { value: 1, label: '标准' },
  { value: 2, label: '较高' },
  { value: 3, label: '极高' },
  { value: 4, label: '无损' }
]
const audioUrl = ref('')
const lyric = ref('')
const parsedLyric = ref([])
const currentLine = ref(0)
const isHoverLyric = ref(false)
const retryCount = ref(0) // 当前重试次数
const maxRetries = 20 // 最大重试次数

// 详情页缓存 key
const CACHE_KEY = 'musicDetailCache'

// 保存详情页数据到缓存
function saveToCache(id, musicData, audioUrlData, lyricData, parsedLyricData) {
  try {
    const cacheData = {
      id,
      music: musicData,
      audioUrl: audioUrlData,
      lyric: lyricData,
      parsedLyric: parsedLyricData,
      timestamp: Date.now()
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (err) {
    console.warn('保存缓存失败', err)
  }
}

// 从缓存中读取详情页数据
function loadFromCache(id) {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const cacheData = JSON.parse(cached)
    // 只有当缓存的ID与当前ID匹配时才使用缓存
    if (cacheData.id === id) {
      return cacheData
    }
    return null
  } catch (err) {
    console.warn('读取缓存失败', err)
    return null
  }
}

// 清除缓存
function clearCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch (err) {
    console.warn('清除缓存失败', err)
  }
}

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
      
      // 等待一段时间后重试（可以使用指数退避策略）
      const waitTime = Math.min(delay * attempt, 5000) // 最多等待5秒
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
}

async function fetchMusicData(id, useCache = true) {
  // 优先从缓存加载
  if (useCache) {
    const cached = loadFromCache(id)
    if (cached && cached.music && cached.audioUrl) {
      music.value = cached.music
      audioUrl.value = cached.audioUrl
      loading.value = false
      return // 使用缓存数据，不发起请求
    }
  }

  loading.value = true
  error.value = ''
  music.value = null
  audioUrl.value = ''

  try {
    const res = await retryRequest(async () => {
      const response = await searchMusicByIdVkeys(id)
      // 检查响应是否成功
      if (!response.data || response.data.code !== 200) {
        throw new Error('响应数据异常')
      }
      return response
    })
    
    console.log(res)
    music.value = res.data.data
    console.log(music.value)
    audioUrl.value = res.data.data.url || ''
    
    // 保存到缓存
    saveToCache(id, music.value, audioUrl.value, lyric.value, parsedLyric.value)
    
    // 同时更新全局播放器
    // if (audioUrl.value) {
    //   player.url = audioUrl.value
    //   player.song = music.value.song
    //   player.singer = music.value.singer
    //   player.cover = music.value.cover
    //   player.id = music.value.id
    // }
  } catch (err) {
    console.error('音乐数据加载失败（已重试20次）', err)
    error.value = `加载失败，已尝试 ${maxRetries} 次`
  } finally {
    loading.value = false
  }
}

// 新增：手动播放（更新全局播放器）
function handlePlayClick() {
  if (!music.value || !audioUrl.value) {
    error.value = '音乐数据未加载完成'
    return
  }
  
  // 更新全局播放器
  player.url = audioUrl.value
  player.song = music.value.song
  player.singer = music.value.singer
  player.cover = music.value.cover
  player.id = music.value.id
}

async function fetchLyricByIdFn(id, useCache = true) {
  // 优先从缓存加载
  if (useCache) {
    const cached = loadFromCache(id)
    if (cached && cached.parsedLyric && cached.parsedLyric.length > 0) {
      lyric.value = cached.lyric || ''
      parsedLyric.value = cached.parsedLyric
      return // 使用缓存数据，不发起请求
    }
  }

  try {
    const res = await retryRequest(async () => {
      const response = await fetchLyricById(id)
      // 检查响应是否成功
      if (!response.data || response.data.code !== 200) {
        throw new Error('歌词响应数据异常')
      }
      return response
    })
    
    lyric.value = res.data.data.lrc
    parsedLyric.value = parseLRC(lyric.value)
    
    // 保存到缓存（更新已有的缓存）
    const cached = loadFromCache(id)
    if (cached) {
      saveToCache(
        id, 
        cached.music || music.value, 
        cached.audioUrl || audioUrl.value,
        lyric.value,
        parsedLyric.value
      )
    } else {
      saveToCache(id, music.value, audioUrl.value, lyric.value, parsedLyric.value)
    }
  } catch (err) {
    console.warn(`歌词加载失败（已重试${maxRetries}次）`, err)
    // 歌词加载失败不影响主要功能，所以不显示错误
  }
}

function handleLyric(current) {
  if (!parsedLyric.value.length) return
  let idx = 0
  for (let i = 0; i < parsedLyric.value.length; i++) {
    if (current >= parsedLyric.value[i].time) {
      idx = i
    } else {
      break
    }
  }
  currentLine.value = idx
  scrollLyric()
}

async function fetchAndPlay() {
  const id = route.params.id
  if (id) {
    await fetchMusicData(id, true)
    await fetchLyricByIdFn(id, true)
  }
}

// async function fetchLyric() {
//   const id = route.params.id
//   if (id) {
//     await fetchLyricByIdFn(id)
//   }
// }

function parseLRC(lrc) {
  if (!lrc) return []
  const lines = lrc.split('\n')
  const result = []
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g
  
  lines.forEach(line => {
    const matches = [...line.matchAll(timeReg)]
    if (matches.length > 0) {
      const text = line.replace(timeReg, '').trim()
      matches.forEach(match => {
        const minutes = parseInt(match[1])
        const seconds = parseInt(match[2])
        const ms = parseInt(match[3].padEnd(3, '0'))
        const time = minutes * 60 + seconds + ms / 1000
        result.push({ time, text })
      })
    }
  })
  
  return result.sort((a, b) => a.time - b.time)
}

function scrollLyric() {
  if (!isHoverLyric.value) {
    nextTick(() => {
      const container = proxy.$el.querySelector('.lyric-container')
      const activeLine = proxy.$el.querySelector('.lyric-line.active')
      if (container && activeLine) {
        const offset = activeLine.offsetTop - (container.clientHeight / 2 - activeLine.clientHeight / 2)
        container.scrollTo({ top: offset, behavior: 'smooth' })
      }
    })
  }
}


watch(() => route.params.id, (newId) => {
  if (newId) fetchAndPlay()
})

// 监听全局播放器的时间更新来同步歌词
watch(() => player.currentTime, (newTime) => {
  if (player.id === music.value?.id) {
    handleLyric(newTime)
  }
})

// 监听播放器的歌曲ID变化，自动跳转详情页
watch(() => player.id, (newPlayerId) => {
  // 当播放器切换歌曲时，如果新歌曲ID与当前详情页ID不同，则跳转
  if (newPlayerId && music.value && newPlayerId !== music.value.id) {
    router.push({ path: `/music/${newPlayerId}` })
  }
})

// 关闭歌单对话框
const closePlaylistDialog = () => {
  playlistDialogVisible.value = false
  currentPlaylist.value = null
}

// 跳转到歌曲详情
const handleGoDetail = (id) => {
  router.push({ path: `/music/${id}` })
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

// 窗口关闭时清除缓存
function handleBeforeUnload() {
  clearCache()
}

onMounted(() => {
  fetchAndPlay()
  // 监听窗口关闭事件
  window.addEventListener('beforeunload', handleBeforeUnload)
  // 监听页面隐藏事件（移动端或切换标签页）
  window.addEventListener('pagehide', handleBeforeUnload)
})

onUnmounted(() => {
  // 组件卸载时移除事件监听（但保留缓存，以便用户返回时还能看到）
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('pagehide', handleBeforeUnload)
})

onBeforeRouteUpdate((to, from, next) => {
  next()
  if (to.params.id !== from.params.id) {
    fetchAndPlay()
  }
})
</script>

<template>
  <div class="music-detail">
    <Sidebar />

    <div class="main-content">
      <div v-if="loading" class="loading">
        {{ retryCount > 0 ? `加载中...（第 ${retryCount} 次尝试）` : '加载中...' }}
      </div>
      <div v-if="error" class="error">{{ error }}</div>

      <div v-if="music" class="detail-content two-columns">
        <!-- 左侧：上图下信息 -->
        <div class="left-panel">
          <div class="cover-section">
            <img :src="music.pic || music.cover" class="cover-large" />
            
          </div>
          
          <div class="info-box">
            <h1 class="song-title">{{ music.song }}</h1>
            <p class="sub">歌手：{{ music.ar_name || music.singer }}</p>
            <p class="sub">专辑：{{ music.al_name || music.album }}</p>
            <p class="sub">音质：{{ music.quality }}</p>
          </div>
        </div>

        <!-- 右侧：上歌词，下音质选择 + 播放按钮 -->
        <div class="right-panel">
          <div
            class="lyric-container"
            @mouseenter="isHoverLyric = true"
            @mouseleave="isHoverLyric = false"
          >
            <h2>🎤 歌词</h2>
            <div v-if="parsedLyric.length === 0" class="no-lyric">
              暂无歌词
            </div>
            <div v-else class="lyric-list">
              <div
                v-for="(line, idx) in parsedLyric"
                :key="idx"
                :class="['lyric-line', { active: idx === currentLine }]"
              >
                {{ line.text }}
              </div>
            </div>
          </div>

          <div class="controls-bar">
            <div class="quality-selector inline">
              <label>选择音质：</label>
              <select v-model="selectedQuality">
                <option
                  v-for="opt in qualityOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <button class="play-button" @click="handlePlayClick" :disabled="loading || !audioUrl">
              <svg v-if="!loading" viewBox="0 0 24 24" class="play-icon">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
              <span v-if="loading" class="loading-spinner">⏳</span>
              <span>{{ loading ? '加载中...' : '播放音乐' }}</span>
            </button>

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
.music-detail {
  display: flex;
  height: 100vh; /* 填满屏幕高度 */
  overflow: hidden; /* 防止整体滚动 */
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

.main-content {
  flex: 1;
  padding: 20px 30px 120px 30px; /* 增加底部padding，预留播放器空间 */
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 纵向居中主要内容 */
  align-items: center; /* 水平居中主要内容 */
  overflow-y: auto; /* 允许内容滚动 */
  height: 100vh; /* 填满屏幕高度 */
  box-sizing: border-box;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #e74c3c;
}

.detail-content.two-columns {
  display: grid;
  grid-template-columns: 300px 1fr; /* 增加左侧宽度 */
  gap: 40px;
  align-items: center; /* 让两列在y轴居中 */
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 40px;
  max-width: 90%; /* 增加卡片宽度，占据90%的容器宽度 */
  width: 100%;
  max-height: calc(100vh - 220px); /* 进一步减少高度，确保不被遮挡 */
  margin: 0 auto;
  overflow: hidden; /* 防止内容溢出 */
  min-height: 500px; /* 设置固定最小高度 */
}

/* 左侧信息栏 */
.left-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center; /* y轴居中 */
  height: 100%;
}

.cover-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.cover-large {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 10px;
  object-fit: cover;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.song-title {
  margin: 0;
  color: #2c3e50;
  font-size: 24px; /* 增加字体大小 */
  line-height: 1.3;
  font-weight: bold;
  text-align: center;
  word-break: break-word;
}

.info-box .title {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 20px; /* 增加字体大小 */
  line-height: 1.3;
  font-weight: 600;
}
.info-box .sub {
  margin: 6px 0; /* 增加间距 */
  color: #666;
  font-size: 15px; /* 增加字体大小 */
  line-height: 1.6;
}

/* 右侧大区域 */
.right-panel { 
  display: flex; 
  flex-direction: column; 
  align-items: center; /* 让内容居中 */ 
  justify-content: center; /* y轴居中 */
  gap: 20px;
  max-height: calc(100vh - 300px); /* 适配父容器高度限制，预留播放栏空间 */
  overflow: visible;
  height: 100%;
}

/* 质量选择公用样式 */
.quality-selector.inline { display: flex; align-items: center; gap: 10px; }
.quality-selector select {
  padding: 8px 12px;
  border: 2px solid #42b983;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.audio-player { width: 100%; margin-top: 10px; }
.hidden-audio { display: none; }

.lyric-container {
  width: 95%; /* 增加宽度 */
  padding: 24px;
  min-height: 300px;
  max-height: calc(100vh - 420px); /* 动态计算，确保不超屏且不被播放栏遮挡 */
  overflow-y: auto;
  background: #fafbfc;
  border: 1.5px solid rgba(66, 185, 131, 0.2);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.lyric-container h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 20px; /* 增加标题字体大小 */
  font-weight: 600;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(66, 185, 131, 0.15);
}

/* 自定义滚动条 */
.lyric-container::-webkit-scrollbar {
  width: 6px;
}
.lyric-container::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.05);
  border-radius: 3px;
}
.lyric-container::-webkit-scrollbar-thumb {
  background: rgba(66, 185, 131, 0.3);
  border-radius: 3px;
}
.lyric-container::-webkit-scrollbar-thumb:hover {
  background: rgba(66, 185, 131, 0.5);
}

.no-lyric {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.lyric-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lyric-line {
  padding: 8px 12px; /* 增加内边距 */
  border-radius: 6px;
  transition: all 0.3s ease;
  color: #666;
  font-size: 16px; /* 增加字体大小 */
  line-height: 1.8;
}

.lyric-line.active {
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  color: white;
  font-weight: bold;
  transform: scale(1.03);
}

/* 右侧底部控制栏 */
.controls-bar {
  width: 95%; /* 与歌词卡片同宽 */
  padding: 18px 24px;
  background: #fafbfc;
  border: 1.5px solid rgba(66, 185, 131, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.play-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.play-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 185, 131, 0.4);
}

.play-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .music-detail { flex-direction: column; }
  .main-content { 
    min-height: auto; 
    justify-content: flex-start;
    padding: 20px;
  }
  .detail-content.two-columns {
    grid-template-columns: 1fr;
    padding: 24px;
    gap: 20px;
  }
}
</style>