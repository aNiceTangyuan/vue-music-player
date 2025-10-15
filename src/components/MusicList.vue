<script setup>
import { usePlayerStore } from '@/stores/playerStore'
import { useFavoritesStore } from '@/stores/favoritesStore'

// 定义 props
const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

// 定义 emits
const emit = defineEmits(['go-detail'])

// 使用 stores
const player = usePlayerStore()
const favorites = useFavoritesStore()

// 处理播放
const handlePlay = async (item, index) => {
  console.log("播放了", index)
  // 设置播放列表并播放指定索引的歌曲
  player.setPlayList(props.list, index)
  await player.playByIndex(index)
}

// 跳转到详情页
const goDetail = (id) => {
  // 设置当前播放列表（以便详情页可以使用上一首/下一首）
  player.setPlayList(props.list)
  emit('go-detail', id)
}

// 切换收藏状态
const toggleFavorite = (item) => {
  favorites.toggle(item)
}
</script>
 
<template>
  <div class="music-list">
    <div
      v-for="(item, index) in list"
      :key="item.id"
      class="music-item"
    >
      <img :src="item.cover || item.pic" class="music-cover" />
      <div class="music-info">
        <div class="music-song" @click="goDetail(item.id)">
          {{ item.song || item.name }}
        </div>
        <div class="music-singer">{{ item.singer || item.ar_name }}</div>
        <div class="music-album">{{ item.album || item.al_name }}</div>
      </div>
      <button class="play-btn" @click="handlePlay(item, index)">
        ▶️ 播放
      </button>
      <button
        class="fav-btn"
        :class="{ liked: favorites.isFavorite(item.id) }"
        @click="toggleFavorite(item)"
      >
        {{ favorites.isFavorite(item.id) ? '❤️' : '🤍' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.music-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.music-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.music-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
}

.music-cover {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  margin-right: 15px;
}

.music-info {
  flex: 1;
  min-width: 0;
}

.music-song {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-song:hover {
  color: #42b983;
}

.music-singer {
  font-size: 14px;
  color: #666;
  margin-bottom: 2px;
}

.music-album {
  font-size: 12px;
  color: #999;
}

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

.fav-btn {
  padding: 8px 12px;
  background: transparent;
  border: 2px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.fav-btn:hover {
  border-color: #42b983;
}

.fav-btn.liked {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}
</style>