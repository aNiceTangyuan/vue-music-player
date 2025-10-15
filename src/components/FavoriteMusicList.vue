<script setup>
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { useFavoritesStore } from '@/stores/favoritesStore'

// 定义 props
const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

// 使用 stores
const router = useRouter()
const player = usePlayerStore()
const favorites = useFavoritesStore()

// 播放全局音乐
const playGlobal = (item, index) => {
  // 设置播放列表并播放
  player.setPlayList(props.list, index)
  player.playByIndex(index)
}

// 移除收藏
const removeFavorite = (id) => {
  favorites.removeById(id)
}

// 跳转到详情页
const handleGoDetail = (id) => {
  player.setPlayList(props.list)
  router.push({ path: `/music/${id}` })
}
</script>
 
<template>
  <div class="fav-music-list">
    <div
      v-for="(item, index) in list"
      :key="item.id"
      class="fav-music-item"
    >
      <img :src="item.cover" class="fav-cover" @click="handleGoDetail(item.id)" />
      <div class="fav-info">
        <div class="fav-song" @click="handleGoDetail(item.id)">
          {{ item.song }}
        </div>
        <div class="fav-singer">{{ item.singer }}</div>
        <div class="fav-album">{{ item.album }}</div>
        <div class="fav-quality">{{ item.quality }}</div>
      </div>
      <button class="play-btn" @click="playGlobal(item, index)">
        ▶️ 播放
      </button>
      <button class="unfav-btn" @click="removeFavorite(item.id)">
        💔 取消收藏
      </button>
    </div>
  </div>
</template>

<style scoped>
.play-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.fav-music-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fav-music-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.fav-music-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
}

.fav-cover {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  margin-right: 15px;
  cursor: pointer;
}

.fav-info {
  flex: 1;
  min-width: 0;
}

.fav-song {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-song:hover {
  color: #42b983;
}

.fav-singer {
  font-size: 14px;
  color: #666;
  margin-bottom: 2px;
}

.fav-album {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
}

.fav-quality {
  font-size: 12px;
  color: #42b983;
}

.unfav-btn {
  padding: 8px 16px;
  background: transparent;
  border: 2px solid #e74c3c;
  border-radius: 20px;
  color: #e74c3c;
  cursor: pointer;
  transition: all 0.3s ease;
}

.unfav-btn:hover {
  background: #e74c3c;
  color: white;
}
</style>