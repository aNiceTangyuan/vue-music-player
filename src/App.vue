

<template>
  <router-view />
  <GlobalAudioPlayer
    :src="player.url"
    :title="player.song"
    :artist="player.singer"
    :cover="player.cover"
              @ended="playNext"
  />
</template>


<script>
import GlobalAudioPlayer from './components/GlobalAudioPlayer.vue';
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
        id: ''        // 歌曲ID
      }
    };
  },
methods: {
  playNext() {
    const player = this.$root.player;
    if (!player || !player.playList) return;

    const nextIndex = player.playIndex + 1;
    if (nextIndex < player.playList.length) {
      const nextItem = player.playList[nextIndex];
      this.$root.player = {
        ...player,
        url: nextItem.url,
        song: nextItem.name || nextItem.song,
        singer: nextItem.singer || nextItem.ar_name,
        cover: nextItem.cover || nextItem.pic,
        album: nextItem.album || nextItem.al_name,
        id: nextItem.id,
        playIndex: nextIndex,
        playList: player.playList
      };
    } else {
      // 播完最后一首，清空
      this.$root.player = null;
    }
  }
}

}
</script>



<style>
/* 全局样式可在此添加 */
</style>
