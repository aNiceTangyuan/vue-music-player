<script setup>
import { ref, watch, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { searchMusicByIdVkeys, fetchLyricById } from '../api/music'

const route = useRoute()
// const router = useRouter()
const { proxy } = getCurrentInstance()
const player = usePlayerStore()
const music = ref(null)
const loading = ref(false)
const error = ref('')
const selectedQuality = ref(4) 
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

async function fetchMusicData(id) {
  loading.value = true
  error.value = ''
  music.value = null
  audioUrl.value = ''

  try {
    const res = await searchMusicByIdVkeys(id)
    console.log(res)
    if (res.data && res.data.code === 200) {
      music.value = res.data.data
      console.log(music.value)
      audioUrl.value = res.data.data.url || ''
      
      // 同时更新全局播放器
      // if (audioUrl.value) {
      //   player.url = audioUrl.value
      //   player.song = music.value.song
      //   player.singer = music.value.singer
      //   player.cover = music.value.cover
      //   player.id = music.value.id
      // }
    } else {
      error.value = '未找到该歌曲'
    }
  } catch (err) {
    console.error(err)
    error.value = '加载失败'
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

async function fetchLyricByIdFn(id) {
  try {
    const res = await fetchLyricById(id)
    if (res.data && res.data.code === 200) {
      lyric.value = res.data.data.lrc
      parsedLyric.value = parseLRC(lyric.value)
    }
  } catch (err) {
    console.warn('歌词加载失败', err)
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
    await fetchMusicData(id)
    await fetchLyricByIdFn(id)
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
  nextTick(() => {
    const container = proxy.$el.querySelector('.lyric-container')
    const activeLine = proxy.$el.querySelector('.lyric-line.active')
    if (container && activeLine && !isHoverLyric.value) {
      const containerHeight = container.clientHeight
      const lineTop = activeLine.offsetTop
      const lineHeight = activeLine.clientHeight
      const scrollTop = lineTop - containerHeight / 2 + lineHeight / 2
      container.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
  })
}

watch(() => route.params.id, (newId) => {
  if (newId) fetchAndPlay()
})

onMounted(() => {
      fetchAndPlay()
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
    <div class="sidebar">
      <h2 class="sidebar-title">🎵 音乐世界</h2>
      <router-link to="/" class="sidebar-btn">🔍 搜索音乐</router-link>
      <router-link to="/favorites" class="sidebar-btn">❤️ 喜欢的音乐</router-link>
    </div>

    <div class="main-content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="error" class="error">{{ error }}</div>

      <div v-if="music" class="detail-content two-columns">
        <!-- 左侧：上图下信息 -->
        <div class="left-panel">
          <img :src="music.pic || music.cover" class="cover-large" />
          <div class="info-box">
            <h1 class="title">{{ music.name }}</h1>
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

            <!-- 隐藏的 audio，仅用于 timeupdate 驱动歌词（如不需要可移除） -->
            <audio
              v-if="audioUrl"
              :src="audioUrl"
              controls
              class="audio-player hidden-audio"
              @timeupdate="handleLyric($event.target.currentTime)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-detail {
  display: flex;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #42b983 0%, #369870 100%);
  color: #fff;
  padding: 40px 20px;
  position: sticky;
  top: 0;
  height: 90vh;
  box-sizing: border-box; /* 确保 padding 包含在宽度内 */
  overflow-x: hidden; /* 防止水平溢出 */
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
  padding: 12px 16px; /* 减小左右 padding，防止超出 */
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
  box-sizing: border-box; /* 确保 padding 和 border 包含在宽度内 */
}

.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(3px); /* 减小移动距离 */
}

.main-content {
  flex: 1;
  padding: 30px;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 纵向居中主要内容 */
  overflow-y: auto; /* 允许内容滚动 */
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
  grid-template-columns: 240px 1fr; /* 左侧缩窄 */
  gap: 32px;
  align-items: start; /* 改为顶部对齐，避免过度拉伸 */
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 28px;
  max-width: 1100px; /* 缩小整体宽度 */
  max-height: 85vh; /* 限制最大高度不超过视口 */
  margin: 0 auto;
  overflow: hidden; /* 防止内容溢出 */
}

/* 左侧信息栏 */
.left-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.cover-large {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 10px;
  object-fit: cover;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.info-box .title {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 600;
}
.info-box .sub {
  margin: 4px 0;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

/* 右侧大区域 */
.right-panel { 
  display: flex; 
  flex-direction: column; 
  align-items: center; /* 让内容居中 */
  gap: 14px;
  max-height: calc(85vh - 80px); /* 适配父容器高度限制 */
  overflow: visible;
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
  width: 85%; /* 缩小宽度 */
  padding: 18px;
  min-height: 240px;
  max-height: calc(85vh - 220px); /* 动态计算，确保不超屏 */
  overflow-y: auto;
  background: #fafbfc;
  border: 1.5px solid rgba(66, 185, 131, 0.2);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.lyric-container h2 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  padding-bottom: 12px;
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
  padding: 6px 10px;
  border-radius: 5px;
  transition: all 0.3s ease;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.lyric-line.active {
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  color: white;
  font-weight: bold;
  transform: scale(1.03);
}

/* 右侧底部控制栏 */
.controls-bar {
  width: 85%; /* 与歌词卡片同宽 */
  padding: 16px 20px;
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
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
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