<template>
  <div class="favorite-list">
    <div class="sidebar">
      <h2 class="sidebar-title">🎵 音乐世界</h2>
      <router-link to="/" class="sidebar-btn">🔍 搜索音乐</router-link>
      <router-link to="/favorites" class="sidebar-btn">❤️ 喜欢的音乐</router-link>
    </div>

    <div class="main-content">
      <h1>❤️ 我喜欢的音乐 ({{ favorites.favoriteCount }})</h1>
      
      <div v-if="favorites.cache.length === 0" class="empty">
        暂无收藏，快去搜索页面添加喜欢的音乐吧！
      </div>
      
      <FavoriteMusicList :list="favorites.cache" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useFavoritesStore } from '@/stores/favoritesStore'
import FavoriteMusicList from '../components/FavoriteMusicList.vue'

const favorites = useFavoritesStore()

// 生命周期钩子
onMounted(() => {
  // 从 localStorage 刷新数据（以防外部修改）
  favorites.refreshFromStorage()
})
</script>

<style scoped>
.favorite-list {
  display: flex;
  min-height: 100vh;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 18px;
}
</style>