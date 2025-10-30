<template>
  <div class="favorite-list">
    <Sidebar />

    <div class="main-content">
      <div class="header-section">
        <div v-if="favorites.cache.length > 0" class="album-cover-container">
          <img 
            :src="favorites.cache[0].cover || favorites.cache[0].pic" 
            alt="专辑封面" 
            class="header-album-cover"
          />
        </div>
        <div class="header-text">
          <h1>❤️ 我喜欢的音乐 ({{ favorites.favoriteCount }})</h1>
          <button class="play-all-btn" @click="playAllMusic">
            <Icon icon="zondicons:play-outline" style="margin-right: 4px; font-size: 16px;" />
            播放全部
          </button>
        </div>
      </div>
      
      <div v-if="favorites.cache.length === 0" class="empty">
        暂无收藏，快去搜索页面添加喜欢的音乐吧！
      </div>
      
      <FavoriteMusicList :list="favorites.cache" />
    </div>

    <!-- 歌单详情对话框 -->
    <el-dialog 
      v-model="playlistDialogVisible" 
      :title="currentPlaylist?.name || '歌单详情'"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="currentPlaylist" class="playlist-dialog-content">
        <div class="playlist-info">
          <p class="playlist-count">共 {{ currentPlaylist.songs.length }} 首歌曲</p>
        </div>
        
        <div v-if="currentPlaylist.songs.length === 0" class="empty-playlist">
          暂无歌曲，快去添加吧！
        </div>
        
        <div v-else class="playlist-songs">
          <div 
            v-for="(song, index) in currentPlaylist.songs" 
            :key="song.id"
            class="song-item"
          >
            <div class="song-index">{{ index + 1 }}</div>
            <img :src="song.cover || song.pic" class="song-cover" />
            <div class="song-info">
              <div class="song-name">{{ song.song || song.name }}</div>
              <div class="song-artist">{{ song.singer || song.ar_name }}</div>
            </div>
            <div class="song-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="handleGoDetail(song.id)"
              >
                播放
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="removeSongFromPlaylist(song.id)"
              >
                移除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="closePlaylistDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { usePlayerStore } from '@/stores/playerStore'
import FavoriteMusicList from '../components/FavoriteMusicList.vue'
import Sidebar from '../components/Sidebar.vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

const router = useRouter()
const favorites = useFavoritesStore()
const playlistStore = usePlaylistStore()
const player = usePlayerStore()
const playlistDialogVisible = ref(false) // 歌单对话框显示状态
const currentPlaylist = ref(null) // 当前选中的歌单

// 播放全部音乐
const playAllMusic = () => {
  if (favorites.cache.length > 0) {
    player.setPlayList(favorites.cache, 0)
    player.playByIndex(0)
    ElMessage.success('开始播放全部音乐')
  }
}

// 关闭歌单对话框
const closePlaylistDialog = () => {
  playlistDialogVisible.value = false
  currentPlaylist.value = null
}

// 跳转到歌曲详情
const handleGoDetail = (id) => {
  router.push({ path: `/music/${id}` })
}

// 从歌单中删除歌曲
const removeSongFromPlaylist = (songId) => {
  if (currentPlaylist.value) {
    playlistStore.removeSongFromPlaylist(currentPlaylist.value.id, songId)
    // 更新当前歌单引用
    currentPlaylist.value = playlistStore.getPlaylistById(currentPlaylist.value.id)
    ElMessage.success('已从歌单中移除')
  }
}

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

.header-section {
  display: flex;
  align-items: start;
  gap: 30px;
  margin-bottom: 30px;
}

.album-cover-container {
  flex-shrink: 0;
}

.header-album-cover {
  width: 250px;
  height: 250px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.header-album-cover:hover {
  transform: scale(1.02);
}

.header-text {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 250px;
}

.header-text h1 {
  margin: 0;
}

.play-all-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #42b983 0%, #369870 100%);
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  width: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-all-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 18px;
}

/* 歌单对话框样式 */
.playlist-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

.playlist-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.playlist-count {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.empty-playlist {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.playlist-songs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.song-item:hover {
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.2);
  border-color: #42b983;
}

.song-index {
  width: 30px;
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-right: 12px;
}

.song-cover {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
  margin-right: 15px;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>