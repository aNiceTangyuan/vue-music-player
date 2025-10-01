<template>
  <div class="global-audio-player">
    <div class="player-info" @click="navigateToDetail" v-if="musicId">
      <img v-if="cover" :src="cover" class="player-cover" />
      <div class="player-meta">
        <div class="player-title">{{ title || '未选择歌曲' }}</div>
        <div class="player-artist">{{ artist }}</div>
      </div>
    </div>
    <div class="player-info" v-else>
      <img v-if="cover" :src="cover" class="player-cover" />
      <div class="player-meta">
        <div class="player-title">{{ title || '未选择歌曲' }}</div>
        <div class="player-artist">{{ artist }}</div>
      </div>
    </div>
    <audio ref="audio"
      :src="src"
      style="display:none;"
      @ended="onEnded"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="onTimeUpdate"
    />
    <div class="player-controls">
      <button @click="togglePlay" class="player-btn" :disabled="!src">
        <van-icon  v-if="isPlaying"  name="pause-circle-o" />
        <van-icon  v-else  name="play-circle-o" />
      </button>
      <div class="player-progress">
        <input type="range" min="0" :max="duration" step="0.1" v-model="currentTime" @input="seek" class="progress-bar" />
        <span class="progress-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
      <div class="player-volume">
        <van-icon name="volume-o" />
        <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="setVolume" class="volume-bar" />
        <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
      </div>
    </div>
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
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1
    };
  },
  watch: {
    src(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          const audio = this.$refs.audio;
          if (audio) {
            audio.currentTime = 0;
            audio.volume = this.volume;
            audio.play();
          }
        });
      }
    },
    volume(val) {
      const audio = this.$refs.audio;
      if (audio) audio.volume = val;
    }
  },
  methods: {
    togglePlay() {
      const audio = this.$refs.audio;
      if (!audio) return;
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
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
    onTimeUpdate(e) {
      const audio = e.target;
      this.currentTime = audio.currentTime;
      this.duration = audio.duration || 0;
    },
    seek() {
      const audio = this.$refs.audio;
      if (audio) audio.currentTime = Number(this.currentTime);
    },
    setVolume() {
      const audio = this.$refs.audio;
      if (audio) audio.volume = Number(this.volume);
    },
    formatTime(sec) {
      sec = Math.floor(sec || 0);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    },
    navigateToDetail() {
      console.log("1111")
      if (this.musicId) {
        this.$router.push(`/music/${this.musicId}`);
      }
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
  box-shadow: 0 -8px 32px rgba(66,185,131,0.18);
  display: flex;
  align-items: center;
  padding: 18px 36px;
  min-height: 80px;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  transition: all 0.3s;
  animation: slideUp 0.6s;
}
.player-info {
  display: flex;
  align-items: center;
  gap: 22px;
  flex: 1;
  cursor: pointer;
  transition: transform 0.2s;
  width: 200px;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 2;
  justify-content: flex-start;
}
  .player-btn {
    background: #5d9a80;
    border: none;
    color: #fff;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(66,185,131,0.12);
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
    opacity: 1;
  }
  .player-btn:disabled {
    background: #eafaf3;
    color: #bbb;
    cursor: not-allowed;
    opacity: 0.6;
  }
  .player-btn:not(:disabled):hover {
    background: linear-gradient(90deg, #369870 0%, #42b983 100%);
    transform: scale(1.08);
  }
.icon-play::before {
  content: '▶️';
  font-size: 28px;
}
.icon-pause::before {
  content: '⏸';
  font-size: 28px;
}
.player-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.progress-bar {
  width: 180px;
  height: 6px;
  border-radius: 4px;
  background: #eafaf3;
  accent-color: #42b983;
  outline: none;
  margin-right: 8px;
}
.progress-time {
  font-size: 13px;
  color: #369870;
  min-width: 80px;
}
.player-volume {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-volume::before {
  content: '\1F50A';
  font-size: 20px;
  color: #42b983;
}
.volume-bar {
  width: 80px;
  accent-color: #42b983;
  background: #eafaf3;
  border-radius: 4px;
  outline: none;
}
.volume-value {
  font-size: 13px;
  color: #369870;
  min-width: 36px;
}

.player-cover {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 4px 16px rgba(66,185,131,0.13);
  transition: transform 0.2s;
}
.player-info:hover .player-cover {
  transform: scale(1.08);
}
.player-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.player-title {
  font-weight: 700;
  font-size: 18px;
  color: #2c3e50;
  margin: 0;
  letter-spacing: 1px;
}
.player-artist {
  font-size: 15px;
  color: #369870;
  margin: 0;
}
audio {
  margin-left: 24px;
  flex: 1;
  min-width: 200px;
  max-width: 600px;
}

.player-close {
  background: transparent;
  border: none;
  color: #606f7b;
  font-size: 22px;
  padding: 10px;
  margin-left: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.player-close:hover {
  background: rgba(66, 185, 131, 0.13);
  color: #2c9d6a;
}
@media (max-width: 700px) {
  .global-audio-player {
    padding: 10px 8px;
    min-height: 60px;
    border-top-left-radius: 14px;
    border-top-right-radius: 14px;
  }
  .player-cover {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }
  audio {
    height: 38px;
    border-radius: 6px;
    padding: 2px 0;
  }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
