<template>
  <div id="app-layout">
    <router-view v-slot="{ Component, route }">
      <transition :name="transitionName">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
    
    <GlobalAudioPlayer
      v-if="player.url"
      :src="player.url"
      :title="player.song"
      :artist="player.singer"
      :cover="player.cover"
      :musicId="player.id"
      :playMode="player.playMode"
      :isImmersive="isImmersive"
      @prev="player.playPrev()"
      @next="player.playNext()"
      @togglePlayMode="player.togglePlayMode()"
      @play="player.setPlaying(true)"
      @pause="player.setPlaying(false)"
      @timeupdate="player.updateCurrentTime"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from './stores/playerStore'
import GlobalAudioPlayer from './components/GlobalAudioPlayer.vue'

const player = usePlayerStore()
const route = useRoute()
const transitionName = ref('')
const isImmersive = ref(false)

// 监听路由变化，判断是否需要应用向上覆盖动画
watch(() => route.path, (to, from) => {
  // 进入沉浸式页面：向上覆盖
  if (to === '/immersive') {
    transitionName.value = 'slide-up'
    isImmersive.value = true
  }
  // 离开沉浸式页面：向下退出
  else if (from === '/immersive') {
    transitionName.value = 'slide-down'
    isImmersive.value = false
  }
  // 其他情况：默认淡入淡出
  else {
    transitionName.value = 'fade'
    isImmersive.value = false
  }
}, { immediate: true })
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

/* 路由过渡动画 */
/* 向上覆盖动画（进入沉浸式页面） */
.slide-up-enter-active {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 1000;
}

.slide-up-leave-active {
  transition: opacity 0.2s ease;
  z-index: 1;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-enter-to {
  transform: translateY(0);
}

.slide-up-leave-from {
  opacity: 1;
}

.slide-up-leave-to {
  opacity: 0.5;
}

/* 向下退出动画（离开沉浸式页面） */
.slide-down-enter-active {
  transition: opacity 0.3s ease;
  z-index: 1;
}

.slide-down-leave-active {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 1000;
}

.slide-down-enter-from {
  opacity: 0;
}

.slide-down-enter-to {
  opacity: 1;
}

.slide-down-leave-from {
  transform: translateY(0);
}

.slide-down-leave-to {
  transform: translateY(100%);
}

/* 默认淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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