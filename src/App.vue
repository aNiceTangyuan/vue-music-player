

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
  />
</template>


<script>
import GlobalAudioPlayer from './components/GlobalAudioPlayer.vue';
import { searchMusicByIdVkeys } from './api/music'
export default {
  name: 'App',
  components: { GlobalAudioPlayer },
  data() {
    return {
      player: {
        url: '',      // 音乐播放地址
        song: '',     // 歌曲名
        singer: '',   // 歌手
        cover: '',    // 封面
        album: '',    // 专辑
        quality: '',  // 音质
        size: '',     // 文件大小
        interval: '', // 时长
        kbps: '',     // 码率
        id: '',        // 歌曲ID
            playIndex: 0,   // ✅ 默认下标
      playList: []    // ✅ 默认列表
      }
    };
  },
      methods: {
        async playNext() {
          const player = this.$root.player;
          console.log(player)
          // if (!player || !player.playList || typeof player.playIndex !== 'number') return;
          const nextIndex = player.playIndex + 1;
          console.log("当前歌曲：", player.playList[0])
          if (nextIndex < player.playList.length) {
            const nextItem = player.playList[nextIndex];
            // 异步获取下一首的 url
            try {
              const res = await searchMusicByIdVkeys(nextItem.id);
              if (res.data && res.data.code === 200 && res.data.data.url) {
                this.$root.player = {
                  ...player,
                  url: res.data.data.url,
                  song: nextItem.song,
                  singer: nextItem.singer,
                  cover: nextItem.cover,
                  album: nextItem.album,
                  id: nextItem.id,
                  playIndex: nextIndex,
                  playList: player.playList
                };
              } else {
                // url 获取失败，跳过
                this.$root.player = null;
              }
            } catch (e) {
              console.error('获取下一首url失败', e);
              this.$root.player = null;
            }
          } else {
            // 播完最后一首，清空
            this.$root.player = null;
          }
        },
        // 注入 API
        async $searchMusicByIdVkeys(id) {
          const { searchMusicByIdVkeys } = await import('./api/music');
          return searchMusicByIdVkeys(id);
        }
      }
    }
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