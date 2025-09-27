

<template>
  <router-view />
  <GlobalAudioPlayer
    :src="player.url"
    :title="player.song"
    :artist="player.singer"
    :cover="player.cover"
    @ended="onPlayerEnded"
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
    // 可根据需要扩展全局播放器事件
    onPlayerEnded() {
      // 这里可实现自动播放下一首等逻辑
    },
    
    
  }
}
</script>



<style>
/* 全局样式可在此添加 */
</style>
