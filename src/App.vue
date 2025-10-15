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
  display: flex;
  min-height: 100vh;
  background: linear-gradient(120deg, #eafaf3 0%, #fff 100%);
  color: #2c3e50;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

/* ✅ 侧边栏样式（常驻） */
.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #42b983 0%, #369870 100%);
  color: #fff;
  padding: 40px 20px;
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