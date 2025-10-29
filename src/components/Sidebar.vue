<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="sidebar">
    <h2 class="sidebar-title">🎵 音乐世界</h2>
    <router-link to="/" class="sidebar-btn">🔍 搜索音乐</router-link>
    <router-link to="/favorites" class="sidebar-btn">❤️ 喜欢的音乐</router-link>
    
    <!-- 我的歌单下拉菜单 -->
    <el-dropdown trigger="click" class="playlist-dropdown" @command="handleGoToPlaylist">
      <div class="sidebar-btn playlist-btn">
        📝 我的歌单
        <el-icon class="el-icon--right">
          <arrow-down />
        </el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click.stop="handleCreatePlaylist" class="create-playlist-item">
            <span style="color: #42b983; font-weight: bold;">+ 新建歌单</span>
          </el-dropdown-item>
          <el-dropdown-item divided v-if="playlistStore.playlists.length === 0" disabled>
            <span style="color: #999;">暂无歌单</span>
          </el-dropdown-item>
          <el-dropdown-item 
            v-for="playlist in playlistStore.playlists" 
            :key="playlist.id"
            :command="playlist.id"
            divided
            class="playlist-item-with-delete"
          >
            <span class="playlist-item-text">{{ playlist.name }} ({{ playlist.songs.length }})</span>
            <el-button 
              type="danger" 
              size="small" 
              :icon="Delete" 
              circle
              @click="handleDeletePlaylist($event, playlist.id, playlist.name)"
              class="delete-btn"
            />
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlistStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const playlistStore = usePlaylistStore()

// 新建歌单
const handleCreatePlaylist = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入歌单名称', '新建歌单', {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '歌单名称不能为空'
    })
    
    if (value) {
      const newPlaylist = playlistStore.createPlaylist(value.trim())
      ElMessage.success(`歌单 "${value.trim()}" 创建成功！`)
      // 创建后跳转到新歌单
      router.push({ path: `/playlist/${newPlaylist.id}` })
    }
  } catch (err) {
    // 用户取消操作
  }
}

// 跳转到歌单详情页
const handleGoToPlaylist = (playlistId) => {
  router.push({ path: `/playlist/${playlistId}` })
}

// 删除歌单
const handleDeletePlaylist = async (event, playlistId, playlistName) => {
  event.stopPropagation() // 阻止事件冒泡，避免触发跳转
  try {
    await ElMessageBox.confirm(
      `确定要删除歌单 "${playlistName}" 吗？此操作不可恢复。`,
      '删除歌单',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    playlistStore.deletePlaylist(playlistId)
    ElMessage.success('歌单删除成功！')
  } catch (err) {
    // 用户取消删除
  }
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #42b983 0%, #369870 100%);
  color: #fff;
  padding: 40px 20px;
  box-sizing: border-box;
  overflow-x: hidden;
  position: sticky;
  top: 0;
  height: 100vh;
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
  padding: 12px 16px;
  margin-bottom: 15px;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  text-decoration: none;
  box-sizing: border-box;
}

.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(3px);
}

/* 激活状态样式 */
.sidebar-btn.router-link-active,
.sidebar-btn.router-link-exact-active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: bold;
  border-left: 4px solid #fff;
  padding-left: 12px;
}

/* 歌单下拉菜单样式 */
.playlist-dropdown {
  width: 100%;
}

.playlist-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.create-playlist-item {
  text-align: center;
}

.playlist-item-with-delete {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px !important;
}

.playlist-item-text {
  flex: 1;
}

.delete-btn {
  margin-left: 8px;
  flex-shrink: 0;
}
</style>

