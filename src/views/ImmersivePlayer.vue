<template>
  <div 
    ref="immersivePlayerRef"
    class="immersive-player" 
    :style="{ backgroundImage: cover ? `url(${cover})` : 'none' }"
    @mousemove="handleMouseMove"
  >
    <!-- 模糊背景层 -->
    <div class="blur-background" :style="{ backgroundImage: cover ? `url(${cover})` : 'none' }"></div>
    
    <!-- 右上角关闭按钮 -->
    <transition name="fade">
      <button 
        v-show="showCloseButton" 
        class="close-button"
        @click="handleClose"
      >
        <Icon icon="mingcute:down-fill" class="close-icon" />
      </button>
    </transition>

    <!-- 内容区域 -->
    <div class="content-container">
      <!-- 左侧封面 -->
      <div class="cover-section">
        <div v-if="cover" class="cover-wrapper">
          <img :src="cover" class="cover-image" alt="Cover" />
        </div>
        <div v-else class="cover-placeholder">
          <Icon icon="material-symbols:music-note" class="placeholder-icon" />
          <p>暂无封面</p>
        </div>
        <!-- 歌名显示在封面下方 -->
        <div class="song-title-below-cover">
          <h2 class="immersive-song-title">{{ playerStore.song || '未选择歌曲' }}</h2>
          <p class="immersive-song-artist">{{ playerStore.singer || '' }}</p>
        </div>
      </div>

      <!-- 右侧歌词 -->
      <div class="lyrics-section">
        <div class="lyrics-container" ref="lyricsContainerRef">
          <div 
            v-if="lyrics.length === 0" 
            class="no-lyrics"
          >
            <p>{{ playerStore.singer || '暂无歌词' }}</p>
          </div>
          <div 
            v-else
            class="lyrics-list"
          >
            <div
              v-for="(lyric, index) in lyrics"
              :key="index"
              class="lyric-line"
              :class="{ 
                active: isCurrentLine(index),
                past: isPastLine(index)
              }"
            >
              {{ lyric.text || '' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部播放控制 -->
    <transition name="fade">
      <div 
        class="bottom-controls" 
        v-show="showBottomControls" 
        @mouseenter="handleBottomControlsMouseEnter" 
        @mouseleave="handleBottomControlsMouseLeave"
      >
        <!-- 控制按钮 -->
        <div class="immersive-control-buttons">
          <button class="immersive-control-btn immersive-nav-btn" @click="handlePrev" :disabled="!playerStore.url">
            <Icon icon="mingcute:skip-previous-fill" class="icon" />
          </button>

          <button class="immersive-control-btn immersive-play-btn" @click="handleTogglePlay" :disabled="!playerStore.url">
            <Icon v-if="!playerStore.isPlaying" icon="ion:play" class="icon" />
            <Icon v-else icon="ion:pause" class="icon" />
          </button>

          <button class="immersive-control-btn immersive-nav-btn" @click="handleNext" :disabled="!playerStore.url">
            <Icon icon="fluent:next-48-filled" class="icon" />
          </button>
        </div>

        <!-- 进度条和时间显示 -->
        <div class="immersive-progress-section">
          <span class="immersive-time">{{ formatTime(playerStore.currentTime) }}</span>
          <div class="immersive-progress-bar">
            <div class="immersive-progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <span class="immersive-time">{{ formatTime(duration) }}</span>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { Icon } from '@iconify/vue'

const router = useRouter()
const playerStore = usePlayerStore()

const showCloseButton = ref(false)
const lyricsContainerRef = ref(null)
const mouseMoveTimer = ref(null)
const immersivePlayerRef = ref(null)
const duration = ref(0)
const showBottomControls = ref(false)
const bottomControlsTimer = ref(null)

// 计算属性
const cover = computed(() => playerStore.cover)
const lyrics = computed(() => playerStore.lyrics || [])

// 计算进度百分比
const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (playerStore.currentTime / duration.value) * 100
})

// 格式化时间
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 获取全局播放器的音频元素
function getGlobalAudioElement() {
  return document.querySelector('.global-audio-player audio')
}

// 切换播放/暂停
function handleTogglePlay() {
  const audio = getGlobalAudioElement()
  if (!audio) return
  if (playerStore.isPlaying) {
    audio.pause()
  } else {
    audio.play()
  }
}

// 上一首
function handlePrev() {
  playerStore.playPrev()
}

// 下一首
function handleNext() {
  playerStore.playNext()
}

// 全屏相关函数
function requestFullscreen() {
  const element = immersivePlayerRef.value || document.documentElement
  if (element.requestFullscreen) {
    element.requestFullscreen().catch(err => {
      console.warn('全屏请求失败:', err)
    })
  } else if (element.webkitRequestFullscreen) {
    // Safari
    element.webkitRequestFullscreen()
  } else if (element.mozRequestFullScreen) {
    // Firefox
    element.mozRequestFullScreen()
  } else if (element.msRequestFullscreen) {
    // IE/Edge
    element.msRequestFullscreen()
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(err => {
      console.warn('退出全屏失败:', err)
    })
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
}

function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  )
}

// 处理全屏状态变化
function handleFullscreenChange() {
  const fullscreen = isFullscreen()
  // 如果退出全屏且还在沉浸式页面，则返回上一页
  if (!fullscreen) {
    router.back()
  }
}

// 鼠标移动处理
function handleMouseMove() {
  showCloseButton.value = true
  showBottomControls.value = true
  
  // 清除之前的定时器
  if (mouseMoveTimer.value) {
    clearTimeout(mouseMoveTimer.value)
  }
  
  if (bottomControlsTimer.value) {
    clearTimeout(bottomControlsTimer.value)
  }
  
  // 3秒后隐藏按钮和底部控制
  mouseMoveTimer.value = setTimeout(() => {
    showCloseButton.value = false
  }, 3000)
  
  bottomControlsTimer.value = setTimeout(() => {
    showBottomControls.value = false
  }, 3000)
}

// 鼠标进入底部控制区域
function handleBottomControlsMouseEnter() {
  showBottomControls.value = true
  
  if (bottomControlsTimer.value) {
    clearTimeout(bottomControlsTimer.value)
  }
}

// 鼠标离开底部控制区域
function handleBottomControlsMouseLeave() {
  if (bottomControlsTimer.value) {
    clearTimeout(bottomControlsTimer.value)
  }
  
  bottomControlsTimer.value = setTimeout(() => {
    showBottomControls.value = false
  }, 3000)
}

// 关闭页面，返回上一页或首页
function handleClose() {
  exitFullscreen()
  router.back()
}

// 判断是否为当前播放行
function isCurrentLine(index) {
  if (!playerStore.lyrics || playerStore.lyrics.length === 0) return false
  if (!playerStore.currentTime) return false
  
  const currentTime = playerStore.currentTime
  const currentIndex = getCurrentLyricIndex(currentTime)
  return index === currentIndex
}

// 判断是否为已播放的行
function isPastLine(index) {
  if (!playerStore.lyrics || playerStore.lyrics.length === 0) return false
  if (!playerStore.currentTime) return false
  
  const currentTime = playerStore.currentTime
  const currentIndex = getCurrentLyricIndex(currentTime)
  return index < currentIndex
}

// 获取当前歌词索引
function getCurrentLyricIndex(time) {
  if (!playerStore.lyrics || playerStore.lyrics.length === 0) return -1
  
  let index = 0
  for (let i = 0; i < playerStore.lyrics.length; i++) {
    if (time >= playerStore.lyrics[i].time) {
      index = i
    } else {
      break
    }
  }
  return index
}

// 滚动到当前歌词行
function scrollToCurrentLyric() {
  if (!lyricsContainerRef.value || !playerStore.lyrics || playerStore.lyrics.length === 0) return
  
  const currentIndex = getCurrentLyricIndex(playerStore.currentTime)
  if (currentIndex < 0) return
  
  nextTick(() => {
    const activeLine = lyricsContainerRef.value?.querySelector('.lyric-line.active')
    if (activeLine && lyricsContainerRef.value) {
      const containerHeight = lyricsContainerRef.value.clientHeight
      const lineHeight = activeLine.offsetHeight
      const lineTop = activeLine.offsetTop
      const scrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2)
      
      lyricsContainerRef.value.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  })
}

// 监听播放时间变化，自动滚动歌词
watch(() => playerStore.currentTime, () => {
  scrollToCurrentLyric()
})

// 监听歌词变化，确保歌词加载后滚动
watch(() => playerStore.lyrics, () => {
  if (playerStore.lyrics && playerStore.lyrics.length > 0) {
    nextTick(() => {
      scrollToCurrentLyric()
    })
  }
}, { deep: true })

onMounted(() => {
  // 确保有歌词时滚动到当前位置
  if (playerStore.lyrics && playerStore.lyrics.length > 0) {
    scrollToCurrentLyric()
  }
  
  // 确保当前歌曲的歌词已加载
  if (playerStore.id && !playerStore.lyrics?.length) {
    playerStore.fetchLyrics(playerStore.id)
  }

  // 获取音频时长
  const audio = getGlobalAudioElement()
  if (audio) {
    duration.value = audio.duration || 0
    audio.addEventListener('loadedmetadata', () => {
      duration.value = audio.duration || 0
    })
  }

  // 延迟请求全屏，确保DOM已渲染
  nextTick(() => {
    requestFullscreen()
  })

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
})

onUnmounted(() => {
  // 移除全屏事件监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
  
  // 清理定时器
  if (mouseMoveTimer.value) {
    clearTimeout(mouseMoveTimer.value)
  }
  
  if (bottomControlsTimer.value) {
    clearTimeout(bottomControlsTimer.value)
  }

  // 如果还在全屏状态，退出全屏
  if (isFullscreen()) {
    exitFullscreen()
  }
})
</script>

<style scoped>
.immersive-player {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.blur-background {
  position: absolute;
  top: -20%;
  left: -20%;
  width: 140%;
  height: 140%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(40px) brightness(0.6);
  transform: scale(1.1);
  z-index: 1;
}

.content-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1;
  width: 100%;
  padding: 60px 80px 240px; /* 底部留出全局播放器和控制区域空间 */
  box-sizing: border-box;
  gap: 60px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 左侧封面区域 */
.cover-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.cover-wrapper {
  width: 400px;
  height: 400px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: coverFloat 3s ease-in-out infinite;
}

/* 封面下方的歌名 */
.song-title-below-cover {
  text-align: center;
  color: #fff;
  max-width: 400px;
}

.immersive-song-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
  word-break: break-word;
}

.immersive-song-artist {
  margin: 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  width: 400px;
  height: 400px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.placeholder-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.cover-placeholder p {
  font-size: 18px;
  margin: 0;
}

/* 右侧歌词区域 */
.lyrics-section {
  flex: 1;
  height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 600px;
  z-index: 2;
}

.lyrics-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 40px 20px;
  box-sizing: border-box;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏滚动条 */
.lyrics-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.lyrics-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}

.lyric-line {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  line-height: 1.8;
  transition: all 0.3s ease;
  padding: 8px 20px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.lyric-line.past {
  color: rgba(255, 255, 255, 0.4);
  font-size: 20px;
}

.lyric-line.active {
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.no-lyrics {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
}

/* 右上角关闭按钮 */
.close-button {
  position: fixed;
  top: 30px;
  right: 30px;
  z-index: 1000;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-button:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.close-icon {
  width: 28px;
  height: 28px;
  color: #fff;
}

/* 底部播放控制 */
.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0);
  padding: 40px 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.immersive-control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.immersive-control-btn {
  border: 2px solid rgba(255, 255, 255, 0);
  background: rgba(255, 255, 255, 0);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #fff;
}

.immersive-control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.immersive-control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.immersive-play-btn {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.immersive-play-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

.immersive-nav-btn {
  background: transparent !important;
  backdrop-filter: none;
}

.immersive-control-btn .icon {
  width: 24px;
  height: 24px;
  color: #fff;
}

.immersive-play-btn .icon {
  width: 28px;
  height: 28px;
}

.immersive-progress-section {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 600px;
}

.immersive-time {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
  font-family: 'Courier New', monospace;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.immersive-progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.immersive-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  border-radius: 3px;
  transition: width 0.1s linear;
}

/* 动画 */
@keyframes coverFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
    padding: 40px 20px 240px;
    gap: 40px;
    overflow-y: auto;
  }

  .cover-wrapper,
  .cover-placeholder {
    width: 300px;
    height: 300px;
  }

  .lyrics-section {
    width: 100%;
    height: auto;
    max-height: 50vh;
  }

  .lyric-line {
    font-size: 20px;
  }

  .lyric-line.active {
    font-size: 26px;
  }

  .bottom-controls {
    padding: 30px 40px 50px;
  }

  .immersive-progress-section {
    max-width: 100%;
    padding: 0 10px;
  }
}

@media (max-width: 768px) {
  .content-container {
    padding: 20px 20px 240px;
  }

  .cover-wrapper,
  .cover-placeholder {
    width: 250px;
    height: 250px;
  }

  .lyric-line {
    font-size: 18px;
  }

  .lyric-line.active {
    font-size: 24px;
  }

  .bottom-controls {
    padding: 20px 20px 40px;
  }

  .immersive-control-buttons {
    gap: 16px;
  }

  .immersive-control-btn {
    width: 40px;
    height: 40px;
  }

  .immersive-play-btn {
    width: 56px;
    height: 56px;
  }

  .immersive-control-btn .icon {
    width: 20px;
    height: 20px;
  }

  .immersive-play-btn .icon {
    width: 24px;
    height: 24px;
  }

  .immersive-time {
    font-size: 12px;
    min-width: 40px;
  }

  .immersive-progress-section {
    gap: 12px;
  }
}
</style>
