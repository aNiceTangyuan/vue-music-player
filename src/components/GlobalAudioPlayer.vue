<template>
  <div class="global-audio-player" v-show="visible">
    <div class="player-info">
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
    <button class="player-close" @click="visible = false">✖</button>
  </div>
</template>

<script>
export default {
  name: 'GlobalAudioPlayer',
  props: {
    src: String,
    title: String,
    artist: String,
    cover: String
  },
  data() {
    return {
      visible: true
    };
  },
  watch: {
    src(newVal) {
      this.visible = !!newVal;
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
  padding: 10px 24px;
  min-height: 64px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  transition: box-shadow 0.2s;
}
.player-info {
  display: flex;
  align-items: center;
  gap: 16px;
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
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
}
.player-artist {
  font-size: 14px;
  color: #369870;
}
audio {
  margin-left: 24px;
  flex: 1;
  min-width: 200px;
  max-width: 600px;
}
.player-close {
  background: none;
  border: none;
  font-size: 22px;
  color: #888;
  margin-left: 18px;
  cursor: pointer;
  transition: color 0.2s;
}
.player-close:hover {
  color: #e74c3c;
}
</style>
