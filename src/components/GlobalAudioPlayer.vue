<script setup>
import { ref, computed, watch, getCurrentInstance, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePlayerStore } from '@/stores/playerStore'
import { Icon } from '@iconify/vue'

// props
const props = defineProps({
  src: String,
  title: String,
  artist: String,
  cover: String,
  musicId: [String, Number],
  playMode: {
    type: String,
    default: 'order'
  }
})
const emit = defineEmits(['prev', 'next', 'togglePlayMode', 'play', 'pause', 'timeupdate', 'play-random'])

const playerStore = usePlayerStore()

const audio = ref(null)
const visible = ref(true)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const volumePercent = ref(100)
const lastVolume = ref(1)
const isSeeking = ref(false)
const wasPlaying = ref(false)
const hovering = ref(false)
const playedSet = ref(new Set())
const localPlayMode = ref(props.playMode)
const tempTime = ref(0)

const { proxy } = getCurrentInstance()
const router = useRouter()

const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const modeLabel = computed(() => {
  return {
    order: '顺序播放',
    random: '随机播放',
    single: '单曲循环'
  }[localPlayMode.value]
})

const displayLyric = computed(() => {
  return playerStore.currentLyric || props.artist || '暂无歌词'
})

watch(() => props.playMode, (newVal) => {
  localPlayMode.value = newVal
})

// 监听歌曲ID变化，加载歌词
watch(() => props.musicId, async (newId) => {
  if (newId) {
    await playerStore.fetchLyrics(newId)
  }
}, { immediate: true })

watch(() => props.src, (newVal) => {
  visible.value = !!newVal
  if (newVal) {
    nextTick(() => {
      if (audio.value) {
        audio.value.play()
      }
    })
  }
})

function startSeek(event) {
  event.preventDefault()
  if (!duration.value) return
  isSeeking.value = true
  wasPlaying.value = isPlaying.value
  if (isPlaying.value && audio.value) audio.value.pause()
  tempTime.value = currentTime.value
  updateSeekSmooth(event)
  window.addEventListener('mousemove', onGlobalSeekMove)
  window.addEventListener('mouseup', onGlobalSeekEnd)
}

function onGlobalSeekMove(event) {
  if (!isSeeking.value) return
  if (!proxy._rafPending) {
    proxy._rafPending = true
    requestAnimationFrame(() => {
      updateSeekSmooth(event)
      proxy._rafPending = false
    })
  }
}

function onGlobalSeekEnd(event) {
  if (!isSeeking.value) return
  isSeeking.value = false
  updateSeekSmooth(event)
  if (audio.value) audio.value.currentTime = tempTime.value
  if (wasPlaying.value && audio.value) audio.value.play()
  window.removeEventListener('mousemove', onGlobalSeekMove)
  window.removeEventListener('mouseup', onGlobalSeekEnd)
}

function updateSeekSmooth(event) {
  const bar = proxy.$el.querySelector('.top-progress-bar')
  if (!bar || !duration.value) return
  const rect = bar.getBoundingClientRect()
  const offsetX = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
  const percentage = offsetX / rect.width
  const newTime = percentage * duration.value
  tempTime.value = newTime
  const fill = proxy.$el.querySelector('.progress-bar-fill')
  if (fill) fill.style.width = `${percentage * 100}%`
  const handle = proxy.$el.querySelector('.progress-handle')
  if (handle) handle.style.left = `${percentage * 100}%`
}

function togglePlay() {
  if (!audio.value) return
  if (isPlaying.value) audio.value.pause()
  else audio.value.play()
}

function onEnded() {
  const mode = localPlayMode.value
  if (mode === 'single') {
    if (audio.value) {
      audio.value.currentTime = 0
      audio.value.play()
    }
  } else {
    isPlaying.value = false
    if (mode === 'order') {
      emit('next')
    } else if (mode === 'random') {
      const parent = proxy.$parent
      if (!parent?.playlist || !Array.isArray(parent.playlist)) {
        emit('next')
        return
      }
      const playlist = parent.playlist
      if (playlist.length === 0) return
      playedSet.value.add(props.musicId)
      const unplayed = playlist.filter(item => !playedSet.value.has(item.id))
      let nextSong
      if (unplayed.length > 0) {
        nextSong = unplayed[Math.floor(Math.random() * unplayed.length)]
      } else {
        playedSet.value.clear()
        nextSong = playlist[Math.floor(Math.random() * playlist.length)]
      }
      emit('play-random', nextSong)
    }
  }
}

function onPlay() {
  isPlaying.value = true
  emit('play')
}
function onPause() {
  isPlaying.value = false
  emit('pause')
}
function updateTime() {
  if (audio.value && !isSeeking.value) {
    currentTime.value = audio.value.currentTime
    emit('timeupdate', currentTime.value)
  }
}
function updateDuration() {
  if (audio.value) duration.value = audio.value.duration
}
function changeVolume() {
  if (audio.value) {
    volume.value = volumePercent.value / 100
    audio.value.volume = volume.value
  }
}
function toggleMute() {
  if (!audio.value) return
  if (volume.value > 0) {
    lastVolume.value = volume.value
    volume.value = 0
    volumePercent.value = 0
    audio.value.volume = 0
  } else {
    volume.value = lastVolume.value
    volumePercent.value = lastVolume.value * 100
    audio.value.volume = lastVolume.value
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function navigateToDetail() {
  if (props.musicId) router.push(`/music/${props.musicId}`)
}
function closePlayer() {
  visible.value = false
  if (audio.value) audio.value.pause()
}

function handlePrev() {
  ElMessage({
    message: '正在加载上一首',
    type: 'success',
  })
  emit('prev')
}

function handleNext() {
  ElMessage({
    message: '正在加载下一首',
    type: 'success',
  })
  emit('next')
}

onMounted(() => {
  if (audio.value) audio.value.volume = volume.value
})
</script>
 
<template>
  <div class="global-audio-player" v-show="visible">
    <!-- 顶部沉浸式进度条 -->
<div 
    class="top-progress-bar"
    @mousedown="startSeek"
    @mouseenter="hovering = true" 
    @mouseleave="hovering = false">
  <div class="progress-bar">
    <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
    <div class="progress-handle" :style="{ left: progress + '%' }"></div>
  </div>
</div>


    <!-- 主体部分 -->
    <div class="player-content">
      <div class="player-info" @click="navigateToDetail" :class="{ clickable: musicId }">
        <img v-if="cover" :src="cover" class="player-cover" />
        <div class="player-meta">
          <div class="player-title">{{ title || '未选择歌曲' }}</div>
          <transition name="lyric-fade" mode="out-in">
            <div class="player-artist" :key="displayLyric">{{ displayLyric }}</div>
          </transition>
        </div>
      </div>

      <!-- 居中播放控制 -->
      <div class="center-controls">
        <button class="control-btn small-btn" @click="handlePrev" :disabled="!src">
          <Icon icon="mingcute:skip-previous-fill" class="icon" />
        </button>

        <button class="control-btn play-pause-btn" @click="togglePlay" :disabled="!src">
          <Icon v-if="!isPlaying" icon="ion:play" class="icon" />
          <Icon v-else icon="lets-icons:stop-fill" class="icon" />
        </button>

        <button class="control-btn small-btn" @click="handleNext" :disabled="!src">
          <Icon icon="fluent:next-48-filled" class="icon" />
        </button>
      </div>

      <!-- 右侧控制区域 -->
      <div class="right-controls">
        <!-- 时间显示 -->
        <div class="time-display">
          <span class="current-time">{{ formatTime(isSeeking ? tempTime : currentTime) }}</span>
          <span class="time-separator">/</span>
          <span class="total-time">{{ formatTime(duration) }}</span>
        </div>

        <!-- 播放模式按钮 -->
        <button class="control-btn mode-btn" @click="$emit('togglePlayMode')" :title="modeLabel">
          <Icon v-if="localPlayMode === 'order'" icon="iconamoon:playlist-repeat-list-bold" class="icon icon-small" />
          <Icon v-else-if="localPlayMode === 'random'" icon="iconamoon:playlist-shuffle-bold" class="icon icon-small" />
          <Icon v-else icon="iconamoon:playlist-repeat-song-bold" class="icon icon-small" />
        </button>

        <!-- 音量控制 -->
        <div class="volume-control">
        <button class="control-btn volume-btn" @click="toggleMute">
          <svg v-if="volume > 0.5" viewBox="0 0 24 24" class="icon icon-small">
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
              fill="currentColor"
            />
          </svg>
          <svg v-else-if="volume > 0" viewBox="0 0 24 24" class="icon icon-small">
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
              fill="currentColor"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="icon icon-small">
            <path
              d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
              fill="currentColor"
            />
          </svg>
        </button>

          <div class="volume-slider-wrapper">
            <input
              type="range"
              class="volume-slider"
              min="0"
              max="100"
              v-model="volumePercent"
              @input="changeVolume"
            />
          </div>
        </div>

        <button class="player-close" @click="closePlayer">✖</button>
      </div>
    </div>

    <audio
      autoplay
      ref="audio"
      :src="src"
      @ended="onEnded"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="updateTime"
      @loadedmetadata="updateDuration"
    />
  </div>
</template>

<style scoped>
.mode-btn {
  background: linear-gradient(135deg, #6ecf9c 0%, #3da674 100%);
}
.mode-btn:hover {
  transform: scale(1.1);
}

/* 时间显示 */
.time-display {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 500;
  padding: 0 12px;
  white-space: nowrap;
  user-select: none;
}

.current-time {
  color: #42b983;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.time-separator {
  color: #999;
}

.total-time {
  color: #666;
  min-width: 40px;
}

.global-audio-player {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: linear-gradient(90deg, #eafaf3 0%, #fff 100%);
  box-shadow: 0 -2px 12px rgba(66, 185, 131, 0.15);
  display: flex;
  flex-direction: column;
  border-radius: 0; /* 去掉圆角 */
}

/* 顶部沉浸式进度条 */
.top-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(66, 185, 131, 0.2);
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
}

/* 悬浮高亮 */
.top-progress-bar:hover {
  background: rgba(66, 185, 131, 0.35);
  height: 10px; /* 悬浮时稍微加高 */
}

.top-progress-bar .progress-bar {
  height: 100%;
  width: 100%;
  background: transparent;
  position: relative;
}

.top-progress-bar .progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b983 0%, #369870 100%);
  width: 0%;
  transition: width 0.2s linear;
  border-radius: 0px;
}

/* 当前进度小圆点 */
.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #42b983;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(66, 185, 131, 0.6);
  pointer-events: none; /* 避免遮挡点击 */
  opacity: 0;
  transition: left 0.15s linear, opacity 0.2s ease, transform 0.2s ease;
}

/* 悬浮时小圆点显现 */
.top-progress-bar:hover .progress-handle {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

/* 主体内容 */
.player-content {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-areas: 
    "left center right";
  align-items: center;
  padding: 12px 24px;
  gap: 16px;
  position: relative;
}

/* 歌曲信息 */
.player-info {
  grid-area: left;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.player-info.clickable {
  cursor: pointer;
}

/* 右侧控制区域 */
.right-controls {
  grid-area: right;
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
}

.player-cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.player-title {
  font-weight: bold;
  color: #2c3e50;
  font-size: 15px;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-artist {
  font-size: 13px;
  color: #42b983;
}

/* 歌词过渡动画 */
.lyric-fade-enter-active {
  animation: lyricFadeIn 0.5s ease-out;
}

.lyric-fade-leave-active {
  animation: lyricFadeOut 0.3s ease-in;
}

@keyframes lyricFadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes lyricFadeOut {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* 居中播放控制 */
.center-controls {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.control-btn {
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(66, 185, 131, 0.3);
}

.control-btn:hover {
  transform: scale(1.1);
}

.small-btn {
  background: transparent;
  box-shadow: none;
}

.small-btn .icon {
  color: #42b983;
}

.small-btn:hover {
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  box-shadow: 0 4px 10px rgba(66, 185, 131, 0.3);
}

.small-btn:hover .icon {
  color: #fff;
}

.icon {
  width: 22px;
  height: 22px;
  color: #fff;
}

/* 音量控制 */
.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider-wrapper {
  width: 80px;
}

.volume-slider {
  width: 100%;
  height: 6px;
  background: rgba(66, 185, 131, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  background: white;
  border: 3px solid #42b983;
  border-radius: 50%;
  cursor: pointer;
}

.player-close {
  background: none;
  border: none;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
}

.player-close:hover {
  color: #e74c3c;
}

/* 响应式 */
@media (max-width: 768px) {
  .player-content {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "left"
      "right";
    gap: 10px;
  }
  
  .player-info {
    justify-content: center;
    min-width: auto;
  }
  
  .right-controls {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .center-controls {
    position: static;
    transform: none;
    order: -1;
  }
  
  .volume-slider-wrapper {
    width: 60px;
  }
  
  .time-display {
    font-size: 12px;
    padding: 0 8px;
  }
  
  .current-time,
  .total-time {
    min-width: 32px;
  }
}
</style>
