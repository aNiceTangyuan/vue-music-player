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
    controls 
    @ended="onEnded" 
    @play="onPlay" 
    @pause="onPause" />
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
    };
  },
  watch: {
    src(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.$refs.audio && this.$refs.audio.play();
        });
      }
    }
  },
  methods: {
    onEnded() {
      this.$emit('ended');
    },
    onPlay() {
      this.$emit('play');
    },
    onPause() {
      this.$emit('pause');
    },
    navigateToDetail() {
      if (this.musicId) {
        this.$router.push(`/music/${this.musicId}`);
      }
    }
  }
};
</script>

<style scoped>
/* 播放器控件美化：更现代的布局、渐变、阴影、动画 */
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
