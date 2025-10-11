<template>
  <div id="app-layout">
    <!-- ✅ 全局常驻侧边栏 -->
    <aside class="sidebar">
      <h2 class="sidebar-title">🎵 功能导航</h2>
      <button class="sidebar-btn" @click="$router.push('/')">音乐搜索</button>
      <button class="sidebar-btn" @click="$router.push('/favorite')">我喜欢的音乐歌单</button>
    </aside>

    <!-- ✅ 主体区域（所有页面内容） -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- ✅ 全局播放器 -->
    <GlobalAudioPlayer
      v-if="player"
      :src="player.url"
      :title="player.song"
      :artist="player.singer"
      :cover="player.cover"
      :musicId="player.id"
      :playMode="playMode"
      @togglePlayMode="togglePlayMode"
      @ended="playNext"
      @timeupdate="handleTimeUpdate"
      @prev="playPrev"
      @next="playNext"
    />
  </div>
</template>
<script>
import GlobalAudioPlayer from './components/GlobalAudioPlayer.vue';
import { searchMusicByIdVkeys } from './api/music';

export default {
  name: 'App',
  components: { GlobalAudioPlayer },
  data() {
    return {
      player: {
        url: '',
        song: '',
        singer: '',
        cover: '',
        id: '',
        playIndex: 0,
        playList: [],
        currentTime: 0
      },
      playMode: 'order', // ✅ 新增：播放模式（order/random/single）
      playedSet: new Set() // ✅ 随机模式下记录已播放的歌曲
    };
  },
  methods: {
    handleTimeUpdate(currentTime) {
      if (this.player) this.player.currentTime = currentTime;
    },

    togglePlayMode() {
      const modes = ['order', 'random', 'single'];
      const next = modes[(modes.indexOf(this.playMode) + 1) % modes.length];
      this.playMode = next;
      this.playedSet.clear(); // 切换模式时清空历史
      console.log('播放模式切换为：', next);
    },

    async retryFetchMusicUrl(id, maxRetries = 10, delay = 800) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const res = await searchMusicByIdVkeys(id);
          if (res.data?.code === 200 && res.data.data.url) return res.data.data.url;
        } catch (error) {
          console.error(`尝试获取音乐 URL 失败（第 ${attempt} 次）：`, error);
        }
        await new Promise(r => setTimeout(r, delay));
      }
      return null;
    },

    /** 播放上一首（顺序模式下） */
    async playPrev() {
      if (this.playMode === 'random') return this.playRandom(); // 随机模式：直接随机
      const player = this.player;
      const prevIndex = player.playIndex - 1;
      if (prevIndex >= 0) {
        await this.playByIndex(prevIndex);
      } else {
        console.log('已经是第一首了');
      }
    },

    /* 播放下一首 */
async playNext() {
  console.log('当前模式：', this.playMode);
  if (this.playMode === 'random') {
    return this.playRandom();
  }

  // 顺序播放
  const nextIndex = this.player.playIndex + 1;
  if (nextIndex < this.player.playList.length) {
    await this.playByIndex(nextIndex);
  } else {
    console.log('播放完最后一首');
    this.$root.player = null;
  }
}
,

    /** 随机播放（不会重复） */
    async playRandom() {
      const { playList, playIndex } = this.player;
      if (!playList.length) return;

      // 添加当前曲目到已播放集合
      this.playedSet.add(playList[playIndex]?.id);

      const unplayed = playList.filter(item => !this.playedSet.has(item.id));
      if (unplayed.length === 0) {
        this.playedSet.clear(); // 全部播放完，重置
        this.playedSet.add(playList[playIndex]?.id);
        console.log('🎲 所有歌曲已播放一轮，重新开始随机');
      }

      const pool = playList.filter(item => !this.playedSet.has(item.id));
      const next = pool[Math.floor(Math.random() * pool.length)];
      const index = playList.findIndex(i => i.id === next.id);
      await this.playByIndex(index);
    },

    /** 按索引播放歌曲 */
    async playByIndex(index) {
      const player = this.player;
      const nextItem = player.playList[index];
      const url = await this.retryFetchMusicUrl(nextItem.id);
      if (!url) return console.warn('无法获取 URL');

      this.player = {
        ...player,
        url,
        song: nextItem.song,
        singer: nextItem.singer,
        cover: nextItem.cover,
        id: nextItem.id,
        playIndex: index
      };
    }
  }
};
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
  box-shadow: 2px 0 8px rgba(66,185,131,0.1);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
}

.sidebar-btn {
  width: 100%;
  padding: 12px 0;
  background: #fff;
  color: #42b983;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.2s, transform 0.2s;
  margin-bottom: 12px;
}

.sidebar-btn:hover {
  background: #eafaf3;
  transform: scale(1.05);
}

/* ✅ 主体内容 */
.main-content {
  margin-left: 240px;
  flex: 1;
  padding: 30px 20px;
  text-align: center;
  justify-content: center;
}

/* ✅ 响应式适配 */
@media (max-width: 768px) {
  #app-layout {
    flex-direction: column;
  }

  .sidebar {
    position: relative;
    width: 100%;
    height: auto;
    box-shadow: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
  }


}
</style>
