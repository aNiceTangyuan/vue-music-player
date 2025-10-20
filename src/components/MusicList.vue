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
      <img :src="item.cover || item.pic" class="music-cover" @click="goDetail(item.id)" />
      <div class="music-info">
        <div class="music-song" @click="goDetail(item.id)">
          {{ item.song || item.name }}
        </div>
        <div class="music-singer">{{ item.singer || item.ar_name }}</div>
        <div class="music-album">{{ item.album || item.al_name }}</div>
        <div class="music-quality">{{ item.quality }}</div>
      </div>
      <button class="play-btn" @click="handlePlay(item, index)">
        ▶️ 播放
      </button>
      <button
        class="fav-btn"
        :class="{ liked: favorites.isFavorite(item.id) }"
        @click="toggleFavorite(item)"
      >
        {{ favorites.isFavorite(item.id) ? '❤️ 已收藏' : '🤍 收藏' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.music-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fadeIn 0.5s ease;
}

.music-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(66, 185, 131, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.music-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(180deg, #42b983 0%, #369870 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.music-item:hover {
  transform: translateX(4px) translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 185, 131, 0.15);
  border-color: rgba(66, 185, 131, 0.3);
}

.music-item:hover::before {
  opacity: 1;
}

.music-cover {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.music-cover:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.music-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.music-song {
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
  line-height: 1.4;
}

.music-song:hover {
  color: #42b983;
  text-decoration: underline;
}

.music-singer {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.music-singer::before {
  content: '🎤';
  font-size: 12px;
}

.music-album {
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
}

.music-album::before {
  content: '💿';
  font-size: 11px;
}

.music-quality {
  display: inline-block;
  font-size: 11px;
  color: #42b983;
  background: rgba(66, 185, 131, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  align-self: flex-start;
}

.play-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  border: none;
  border-radius: 24px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  margin-right: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.25);
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 185, 131, 0.35);
}

.play-btn:active {
  transform: translateY(0);
}

.fav-btn {
  padding: 10px 16px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.fav-btn:hover {
  border-color: #42b983;
  color: #42b983;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
}

.fav-btn.liked {
  border-color: #e74c3c;
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.05) 100%);
  color: #e74c3c;
}

.fav-btn.liked:hover {
  background: #e74c3c;
  color: white;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>