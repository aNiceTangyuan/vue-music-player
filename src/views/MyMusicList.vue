<template>
  <div class="playlist-detail">
    <Sidebar />

    <div class="main-content">
      <div v-if="!currentPlaylist" class="empty">
        歌单不存在或已被删除
      </div>
      
      <div v-else>
        <h1>📝 {{ currentPlaylist.name }} ({{ currentPlaylist.songs.length }})</h1>
        
        <div v-if="currentPlaylist.songs.length === 0" class="empty">
          暂无歌曲，快去搜索页面添加音乐吧！
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
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlistStore'
import Sidebar from '../components/Sidebar.vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const playlistStore = usePlaylistStore()

// 当前歌单
const currentPlaylist = computed(() => {
  const id = parseInt(route.params.id)
  return playlistStore.getPlaylistById(id)
})

// 跳转到歌曲详情
const handleGoDetail = (id) => {
  router.push({ path: `/music/${id}` })
}

// 从歌单中删除歌曲
const removeSongFromPlaylist = (songId) => {
  if (currentPlaylist.value) {
    playlistStore.removeSongFromPlaylist(currentPlaylist.value.id, songId)
    ElMessage.success('已从歌单中移除')
  }
}

// 监听路由参数变化，如果歌单不存在则跳转首页
watch(() => currentPlaylist.value, (newPlaylist) => {
  if (route.params.id && !newPlaylist) {
    ElMessage.warning('歌单不存在')
    router.push('/')
  }
}, { immediate: true })
</script>

<style scoped>
.playlist-detail {
  display: flex;
  min-height: 100vh;
}

/* ======================= 主体内容区域 ======================= */
.main-content {
  flex: 1;
  padding: 40px;
  background: #f5f5f5;
  overflow-y: auto;
}

.main-content h1 {
  margin-bottom: 30px;
  color: #2c3e50;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 18px;
}

.playlist-songs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 1200px;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.song-item:hover {
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
  border-color: #42b983;
  transform: translateY(-2px);
}

.song-index {
  width: 40px;
  text-align: center;
  color: #999;
  font-size: 16px;
  font-weight: 500;
  margin-right: 15px;
}

.song-cover {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 20px;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .playlist-detail {
    flex-direction: column;
  }
  
  .main-content {
    padding: 20px;
  }
  
  .song-item {
    flex-wrap: wrap;
  }
  
  .song-actions {
    width: 100%;
    margin-top: 10px;
    justify-content: flex-end;
  }
}
</style>

