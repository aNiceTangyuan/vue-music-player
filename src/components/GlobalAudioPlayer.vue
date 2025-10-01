<template>
  <div class="global-audio-player" v-show="visible">
    <div class="player-info" @click="navigateToDetail" :class="{ clickable: musicId }">
      <img v-if="cover" :src="cover" class="player-cover" />
      <div class="player-meta">
        <div class="player-title">{{ title || '未选择歌曲' }}</div>
        <div class="player-artist">{{ artist }}</div>
      </div>
    </div>
    
    <div class="player-controls">
      <!-- 播放/暂停按钮 -->
      <button class="control-btn play-pause-btn" @click="togglePlay">
        <svg v-if="!isPlaying" viewBox="0 0 24 24" class="icon">
          <path d="M8 5v14l11-7z" fill="currentColor"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" class="icon">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/>
        </svg>
      </button>
      
      <!-- 进度条区域 -->
      <div class="progress-container">
        <div class="time-display">{{ formatTime(currentTime) }}</div>
        <div class="progress-bar-wrapper" @click="seek">
          <div class="progress-bar">
            <div class="progress-bar-fill" :style="{ width: progress + '%' }">
              <div class="progress-handle"></div>
            </div>
          </div>
        </div>
        <div class="time-display">{{ formatTime(duration) }}</div>
      </div>
      
      <!-- 音量控制 -->
      <div class="volume-control">
        <button class="control-btn volume-btn" @click="toggleMute">
          <svg v-if="volume > 0.5" viewBox="0 0 24 24" class="icon icon-small">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
          </svg>
          <svg v-else-if="volume > 0" viewBox="0 0 24 24" class="icon icon-small">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" class="icon icon-small">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>
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
    </div>
    
    <audio 
      ref="audio" 
      :src="src" 
      @ended="onEnded" 
      @play="onPlay" 
      @pause="onPause"
      @timeupdate="updateTime"
      @loadedmetadata="updateDuration"
    />
    
    <button class="player-close" @click="closePlayer">✖</button>
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
    musicId: [String, Number]
  },
  data() {
    return {
      visible: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      volumePercent: 100,
      lastVolume: 1
    };
  },
  computed: {
    progress() {
      if (!this.duration) return 0;
      return (this.currentTime / this.duration) * 100;
    }
  },
  watch: {
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
    togglePlay() {
      const audio = this.$refs.audio;
      if (!audio) return;
      
      if (this.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    },
    onEnded() {
      this.isPlaying = false;
      this.$emit('ended');
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
      if (audio) {
        this.currentTime = audio.currentTime;
        // 发出时间更新事件，用于歌词滚动
        this.$emit('timeupdate', this.currentTime);
      }
    },
    updateDuration() {
      const audio = this.$refs.audio;
      if (audio) {
        this.duration = audio.duration;
      }
    },
    seek(event) {
      const audio = this.$refs.audio;
      if (!audio || !this.duration) return;
      
      const rect = event.currentTarget.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const percentage = offsetX / rect.width;
      audio.currentTime = percentage * this.duration;
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
      if (this.musicId) {
        this.$router.push(`/music/${this.musicId}`);
      }
    },
    closePlayer() {
      this.visible = false;
      const audio = this.$refs.audio;
      if (audio) {
        audio.pause();
      }
    }
  },
  mounted() {
    const audio = this.$refs.audio;
    if (audio) {
      audio.volume = this.volume;
    }
  }
};
</script>

<style scoped>
.global-audio-player {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: linear-gradient(90deg, #eafaf3 0%, #fff 100%);
  box-shadow: 0 -2px 16px rgba(66,185,131,0.13);
  display: flex;
  align-items: center;
  padding: 16px 24px;
  min-height: 80px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  transition: box-shadow 0.2s;
  gap: 20px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 240px;
}

.player-info.clickable {
  cursor: pointer;
  transition: transform 0.2s;
}

.player-info.clickable:hover {
  transform: translateY(-2px);
}

.player-cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(66,185,131,0.10);
}

.player-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.player-title {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.player-artist {
  font-size: 13px;
  color: #369870;
}

/* 播放控制区域 */
.player-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  max-width: 800px;
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
  box-shadow: 0 4px 12px rgba(66,185,131,0.3);
}

.control-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(66,185,131,0.4);
}

.control-btn:active {
  transform: scale(0.95);
}

.icon {
  width: 24px;
  height: 24px;
  color: white;
}

.icon-small {
  width: 20px;
  height: 20px;
}

/* 进度条区域 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.time-display {
  font-size: 13px;
  color: #369870;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.progress-bar-wrapper {
  flex: 1;
  cursor: pointer;
  padding: 8px 0;
}

.progress-bar {
  height: 6px;
  background: rgba(66,185,131,0.2);
  border-radius: 3px;
  position: relative;
  overflow: visible;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b983 0%, #369870 100%);
  border-radius: 3px;
  position: relative;
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  background: white;
  border: 3px solid #42b983;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(66,185,131,0.3);
  transition: transform 0.2s;
}

.progress-bar-wrapper:hover .progress-handle {
  transform: translateY(-50%) scale(1.2);
}

/* 音量控制 */
.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-btn {
  width: 36px;
  height: 36px;
  background: rgba(66,185,131,0.1);
  box-shadow: none;
}

.volume-btn:hover {
  background: rgba(66,185,131,0.2);
  transform: scale(1.05);
}

.volume-slider-wrapper {
  width: 80px;
}

.volume-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(66,185,131,0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: white;
  border: 3px solid #42b983;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(66,185,131,0.3);
  transition: transform 0.2s;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: white;
  border: 3px solid #42b983;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(66,185,131,0.3);
  transition: transform 0.2s;
}

.volume-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

audio {
  display: none;
}

.player-close {
  background: none;
  border: none;
  font-size: 22px;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
  padding: 8px;
  margin-left: auto;
}

.player-close:hover {
  color: #e74c3c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .global-audio-player {
    flex-wrap: wrap;
    padding: 12px 16px;
  }
  
  .player-info {
    min-width: auto;
  }
  
  .player-title {
    max-width: 120px;
  }
  
  .player-controls {
    width: 100%;
    max-width: 100%;
  }
  
  .volume-slider-wrapper {
    width: 60px;
  }
}
</style>
