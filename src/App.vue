

<template>
  <router-view />
  <GlobalAudioPlayer
    v-if="player"
    :src="player.url"
    :title="player.song"
    :artist="player.singer"
    :cover="player.cover"
    :musicId="player.id"
    @ended="playNext"
    @timeupdate="handleTimeUpdate"
    @prev="playPrev"
    @next="playNext"
  />
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
        album: '',
        quality: '',
        size: '',
        interval: '',
        kbps: '',
        id: '',
        playIndex: 0,
        playList: [],
        currentTime: 0
      }
    };
  },
  methods: {
    handleTimeUpdate(currentTime) {
      if (this.player) {
        this.player.currentTime = currentTime;
      }
    },

    /** 封装统一的重试函数 */
    async retryFetchMusicUrl(id, maxRetries = 15, delay = 1000) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const res = await searchMusicByIdVkeys(id);
          if (res.data && res.data.code === 200 && res.data.data.url) {
            console.log(`✅ 第 ${attempt} 次获取成功`);
            return res.data.data.url;
          } else {
            console.warn(`⚠️ 第 ${attempt} 次获取失败，继续重试...`);
          }
        } catch (e) {
          console.error(`❌ 第 ${attempt} 次请求出错`, e);
        }
        // 每次重试等待 delay 毫秒（默认 1 秒）
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      console.error(`❌ 已重试 ${maxRetries} 次仍失败，放弃`);
      return null;
    },

    async playPrev() {
      const player = this.$root.player;
      console.log('app 播放上一首');
      const prevIndex = player.playIndex - 1;

      if (prevIndex >= 0) {
        const prevItem = player.playList[prevIndex];
        const url = await this.retryFetchMusicUrl(prevItem.id); // ✅ 使用重试机制
        if (url) {
          this.$root.player = {
            ...player,
            url,
            song: prevItem.song,
            singer: prevItem.singer,
            cover: prevItem.cover,
            album: prevItem.album,
            id: prevItem.id,
            playIndex: prevIndex,
            playList: player.playList
          };
        } else {
          console.log('无法获取上一首 URL，停止播放');
          this.$root.player = null;
        }
      } else {
        console.log('已经是第一首了');
      }
    },

    async playNext() {
      const player = this.$root.player;
      console.log('app 播放下一首');

      const nextIndex = player.playIndex + 1;
      if (nextIndex < player.playList.length) {
        const nextItem = player.playList[nextIndex];
        console.log("准备播放下一首：", nextItem.song);

        const url = await this.retryFetchMusicUrl(nextItem.id); // ✅ 使用重试机制
        if (url) {
          this.$root.player = {
            ...player,
            url,
            song: nextItem.song,
            singer: nextItem.singer,
            cover: nextItem.cover,
            album: nextItem.album,
            id: nextItem.id,
            playIndex: nextIndex,
            playList: player.playList
          };
        } else {
          console.log('无法获取下一首 URL，停止播放');
          this.$root.player = null;
        }
      } else {
        console.log('播放完最后一首，清空播放器');
        this.$root.player = null;
      }
    },

    async $searchMusicByIdVkeys(id) {
      const { searchMusicByIdVkeys } = await import('./api/music');
      return searchMusicByIdVkeys(id);
    }
  }
};
</script>

<style>
:root {
  --primary-color: #42b983;
  --primary-light: #eafaf3;
  --primary-dark: #2c9d6a;
  --text-color: #2c3e50;
  --text-light: #606f7b;
  --background-light: #f8fcfa;
  --shadow-sm: 0 2px 8px rgba(66, 185, 131, 0.08);
  --shadow-md: 0 4px 16px rgba(66, 185, 131, 0.12);
  --shadow-lg: 0 8px 24px rgba(66, 185, 131, 0.16);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --transition-fast: 0.2s;
  --transition-normal: 0.3s;
}

body {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  background-color: #f9fafb;
  margin: 0;
  padding: 0;
}

button {
  cursor: pointer;
  transition: all var(--transition-fast);
}

button:hover {
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
}

/* 全局过渡效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-normal);
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}
.slide-up-enter, .slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
