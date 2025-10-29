<template>
  <div id="app-layout">
    <router-view />
    
    <GlobalAudioPlayer
      v-if="player.url"
      :src="player.url"
      :title="player.song"
      :artist="player.singer"
      :cover="player.cover"
      :musicId="player.id"
      :playMode="player.playMode"
      @prev="player.playPrev()"
      @next="player.playNext()"
      @togglePlayMode="player.togglePlayMode()"
      @timeupdate="player.updateCurrentTime"
    />
  </div>
</template>

<script setup>
import { usePlayerStore } from './stores/playerStore'
import GlobalAudioPlayer from './components/GlobalAudioPlayer.vue'

const player = usePlayerStore()
</script>

<style>
/* =================== 全局布局 =================== */
#app-layout {
  display: block;
  background: linear-gradient(120deg, #eafaf3 0%, #fff 100%);
  color: #2c3e50;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  min-height: 100vh;
}



/* ✅ 主体内容 */
.main-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* ✅ 响应式适配 */
@media (max-width: 768px) {
  #app-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    padding: 20px;
  }
  .main-content {
    padding: 20px;
  }
}
</style>