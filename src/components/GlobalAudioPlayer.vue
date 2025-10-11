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
          <div class="player-artist">{{ artist }}</div>
        </div>
      </div>

      <!-- 居中播放控制 -->
      <div class="center-controls">
        <button class="control-btn small-btn" @click="$emit('prev')" :disabled="!src">
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M6 12l10-7v14L6 12zm-2 7h2V5H4v14z" fill="currentColor" />
          </svg>
        </button>

        <button class="control-btn play-pause-btn" @click="togglePlay" :disabled="!src">
          <svg v-if="!isPlaying" viewBox="0 0 24 24" class="icon">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="icon">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor" />
          </svg>
        </button>

        <button class="control-btn small-btn" @click="$emit('next')" :disabled="!src">
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M18 12L8 19V5l10 7zm2-7h-2v14h2V5z" fill="currentColor" />
          </svg>
        </button>
      </div>

<!-- 播放模式按钮 -->
<button class="control-btn mode-btn" @click="$emit('togglePlayMode')">
  <svg v-if="playMode === 'order'" viewBox="0 0 24 24" class="icon icon-small">
    <!-- 顺序播放图标 -->
    <path d="M3 9h4l3 3-3 3H3l4-4zm14 0h4v6h-4v3l-4-4 4-4v3z" fill="currentColor"/>
  </svg>

  <svg v-else-if="playMode === 'random'" viewBox="0 0 24 24" class="icon icon-small">
    <!-- 随机播放图标 -->
    <path d="M17 1l4 4-4 4V6h-2.59l-4 4H9l4-4H17V1zM3 9l4 4-4 4V9zm8 6l4-4H17v3l4-4-4-4v3h-2.59l-4 4H11z" fill="currentColor"/>
  </svg>

  <svg v-else viewBox="0 0 24 24" class="icon icon-small">
    <!-- 单曲循环图标 -->
    <path d="M7 7v2h6v2H5V7h2zm10 0h2v10h-2v-2h-6v-2h6V7z" fill="currentColor"/>
  </svg>
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
<script>
export default {
  name: 'GlobalAudioPlayer',
  props: {
    src: String,
    title: String,
    artist: String,
    cover: String,
    musicId: [String, Number],
    playMode: {
      type: String,
      default: 'order' // 顺序播放为默认模式
    }
  },
  data() {
    return {
      visible: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      volumePercent: 100,
      lastVolume: 1,
      isSeeking: false,
      wasPlaying: false,
      hovering: false,
      playedSet: new Set(),
      localPlayMode: this.playMode //  本地副本
    };
  },
  computed: {
    progress() {
      if (!this.duration) return 0;
      return (this.currentTime / this.duration) * 100;
    },
    modeLabel() {
      return {
        order: '顺序播放',
        random: '随机播放',
        single: '单曲循环'
      }[this.localPlayMode];
    }
  },
  watch: {
    playMode(newVal) {
      // ✅ 同步父组件变化
      this.localPlayMode = newVal;
    },
    src(newVal) {
      this.visible = !!newVal;
      if (newVal) {
        this.$nextTick(() => {
          if (this.$refs.audio) {
            this.$refs.audio.play();
          }
        });
      }
    }
  },
  methods: {


    startSeek(event) {
      event.preventDefault();
      if (!this.duration) return;
      this.isSeeking = true;
      this.wasPlaying = this.isPlaying;
      if (this.isPlaying) this.$refs.audio.pause();
      this.tempTime = this.currentTime;
      this.updateSeekSmooth(event);
      window.addEventListener('mousemove', this.onGlobalSeekMove);
      window.addEventListener('mouseup', this.onGlobalSeekEnd);
    },

    onGlobalSeekMove(event) {
      if (!this.isSeeking) return;
      if (!this._rafPending) {
        this._rafPending = true;
        requestAnimationFrame(() => {
          this.updateSeekSmooth(event);
          this._rafPending = false;
        });
      }
    },

    onGlobalSeekEnd(event) {
      if (!this.isSeeking) return;
      this.isSeeking = false;
      this.updateSeekSmooth(event);
      if (this.$refs.audio) this.$refs.audio.currentTime = this.tempTime;
      if (this.wasPlaying) this.$refs.audio.play();
      window.removeEventListener('mousemove', this.onGlobalSeekMove);
      window.removeEventListener('mouseup', this.onGlobalSeekEnd);
    },

    updateSeekSmooth(event) {
      const bar = this.$el.querySelector('.top-progress-bar');
      if (!bar || !this.duration) return;
      const rect = bar.getBoundingClientRect();
      const offsetX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
      const percentage = offsetX / rect.width;
      const newTime = percentage * this.duration;
      this.tempTime = newTime;
      const fill = this.$el.querySelector('.progress-bar-fill');
      if (fill) fill.style.width = `${percentage * 100}%`;
      const handle = this.$el.querySelector('.progress-handle');
      if (handle) handle.style.left = `${percentage * 100}%`;
    },

    togglePlay() {
      const audio = this.$refs.audio;
      if (!audio) return;
      if (this.isPlaying) audio.pause();
      else audio.play();
    },

    onEnded() {
      const mode = this.localPlayMode; // ✅ 使用本地模式
      this.isPlaying = false;

      if (mode === 'single') {
        const audio = this.$refs.audio;
        if (audio) {
          audio.currentTime = 0;
          audio.play();
        }
      } else if (mode === 'order') {
        this.$emit('next');
      } else if (mode === 'random') {
        if (!this.$parent?.playlist || !Array.isArray(this.$parent.playlist)) {
          this.$emit('next');
          return;
        }

        const playlist = this.$parent.playlist;
        if (playlist.length === 0) return;
        this.playedSet.add(this.musicId);

        const unplayed = playlist.filter(item => !this.playedSet.has(item.id));
        let nextSong;
        if (unplayed.length > 0) {
          nextSong = unplayed[Math.floor(Math.random() * unplayed.length)];
        } else {
          this.playedSet.clear();
          nextSong = playlist[Math.floor(Math.random() * playlist.length)];
        }

        this.$emit('play-random', nextSong);
      }
    },

    onPlay() {
      this.isPlaying = true;
      this.$emit('play');
    },
    onPause() {
      this.isPlaying = false;
      this.$emit('pause');
    },
    updateTime() {
      const audio = this.$refs.audio;
      if (audio && !this.isSeeking) {
        this.currentTime = audio.currentTime;
        this.$emit('timeupdate', this.currentTime);
      }
    },
    updateDuration() {
      const audio = this.$refs.audio;
      if (audio) this.duration = audio.duration;
    },
    changeVolume() {
      const audio = this.$refs.audio;
      if (audio) {
        this.volume = this.volumePercent / 100;
        audio.volume = this.volume;
      }
    },
    toggleMute() {
      const audio = this.$refs.audio;
      if (!audio) return;
      if (this.volume > 0) {
        this.lastVolume = this.volume;
        this.volume = 0;
        this.volumePercent = 0;
        audio.volume = 0;
      } else {
        this.volume = this.lastVolume;
        this.volumePercent = this.lastVolume * 100;
        audio.volume = this.lastVolume;
      }
    },
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    navigateToDetail() {
      if (this.musicId) this.$router.push(`/music/${this.musicId}`);
    },
    closePlayer() {
      this.visible = false;
      const audio = this.$refs.audio;
      if (audio) audio.pause();
    }
  },
  mounted() {
    const audio = this.$refs.audio;
    if (audio) audio.volume = this.volume;
  }
};
</script>

<style scoped>
.mode-btn {
  background: linear-gradient(135deg, #6ecf9c 0%, #3da674 100%);
}
.mode-btn:hover {
  transform: scale(1.1);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  gap: 16px;
}

/* 歌曲信息 */
.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.player-info.clickable {
  cursor: pointer;
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

/* 居中播放控制 */
.center-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex: 1;
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
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  .volume-slider-wrapper {
    width: 60px;
  }
}
</style>
