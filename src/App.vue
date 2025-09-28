

<template>
  <router-view />
  <GlobalAudioPlayer
    v-if="player"
    :src="player.url"
    :title="player.song"
    :artist="player.singer"
    :cover="player.cover"
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
  // methods: {
  //   playNext() {
  //     const player = this.$root.player;
  //     if (!player || !player.playList) return;
  //     console.log(player.playList)
  //     const nextIndex = player.playIndex + 1;
  //     console.log(player.playIndex)
  //     if (nextIndex < player.playList.length) {
  //       const nextItem = player.playList[nextIndex];
  //       this.$root.player = {
  //         ...player,
  //         url: nextItem.url,
  //         song: nextItem.name || nextItem.song,
  //         singer: nextItem.singer || nextItem.ar_name,
  //         cover: nextItem.cover || nextItem.pic,
  //         album: nextItem.album || nextItem.al_name,
  //         id: nextItem.id,
  //         playIndex: nextIndex,
  //         playList: player.playList
  //       };
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
  </style>