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

      <div v-if="music" class="detail-content">
        <div class="music-info-section">
          <img :src="music.cover" class="music-cover-large" />
          <div class="music-meta">
            <h1>{{ music.name }}</h1>
            <p class="music-artist">歌手：{{ music.singer }}</p>
            <p class="music-album">专辑：{{ music.album }}</p>
            <p class="music-quality">音质：{{ music.quality }}</p>

            <div class="quality-selector">
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
                        <!-- 新增：播放按钮 -->
            <button class="play-button" @click="handlePlayClick" :disabled="loading">
              <svg v-if="!loading" viewBox="0 0 24 24" class="play-icon">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
              <span v-if="loading" class="loading-spinner">⏳</span>
              <span>{{ loading ? '加载中...' : '播放音乐' }}</span>
            </button>
            <audio
              v-if="audioUrl"
              :src="audioUrl"
              controls
              class="audio-player"
              @timeupdate="handleLyric($event.target.currentTime)"
              style="display: none;"
            />
          </div>
        </div>

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
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-detail {
  display: flex;
  min-height: 100vh;
}

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

.main-content {
  flex: 1;
  padding: 30px;
  background: #f5f5f5;
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

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.music-info-section {
  display: flex;
  gap: 30px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.music-cover-large {
  width: 250px;
  height: 250px;
  border-radius: 12px;
  object-fit: cover;
}

.music-meta {
  flex: 1;
}

.music-meta h1 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.music-artist,
.music-album,
.music-quality {
  margin: 8px 0;
  color: #666;
  font-size: 16px;
}

.quality-selector {
  margin: 20px 0;
}

.quality-selector label {
  margin-right: 10px;
  font-weight: bold;
}

.quality-selector select {
  padding: 8px 12px;
  border: 2px solid #42b983;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.audio-player {
  width: 100%;
  margin-top: 20px;
}

.lyric-container {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 500px;
  overflow-y: auto;
}

.lyric-container h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.no-lyric {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.lyric-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lyric-line {
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  color: #666;
}

.lyric-line.active {
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  color: white;
  font-weight: bold;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .music-detail {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  .music-info-section {
    flex-direction: column;
  }
  .music-cover-large {
    width: 100%;
    height: auto;
  }
}
</style>