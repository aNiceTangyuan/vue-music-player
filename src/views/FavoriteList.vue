<template>
  <div class="favorite-list">
    <h2>我喜欢的音乐</h2>
  <FavoriteMusicList :list="favoriteSongs" @refresh="fetchFavorites" />
    <div v-if="!favoriteSongs.length" style="color:#888;margin-top:30px;">暂无喜欢的音乐</div>
  </div>
</template>

<script>
import FavoriteMusicList from '../components/FavoriteMusicList.vue';
import { searchMusicByIdVkeys } from '../api/music';

export default {
  name: 'FavoriteList',
  components: { FavoriteMusicList },
  data() {
    return {
      favoriteSongs: []
    };
  },
  async created() {
    // 从localStorage获取喜欢的id
    const ids = JSON.parse(localStorage.getItem('favoriteMusicIds') || '[]');
    // console.log('喜欢的音乐ID列表:', ids); // 有ids返回
    if (ids.length) {
      // vkeys searchMusic 不支持批量 id，需循环请求
      const results = await Promise.all(ids.map(id => searchMusicByIdVkeys(id)));
      console.log('喜欢的音乐结果:', results);
      // 合并所有结果
      let songs = [];
      results.forEach(res => {
        if (res.data && res.data.code === 200) {
          songs = songs.concat(res.data.data);
        }
      });
      this.favoriteSongs = songs;
    }
    this.fetchFavorites();
  },
  methods: {
    async fetchFavorites() {
      const ids = JSON.parse(localStorage.getItem('favoriteMusicIds') || '[]');
      if (ids.length) {
        const results = await Promise.all(ids.map(id => searchMusicByIdVkeys(id)));
        let songs = [];
        results.forEach(res => {
          if (res.data && res.data.code === 200) {
            songs = songs.concat(res.data.data);
          }
        });
        this.favoriteSongs = songs;
      } else {
        this.favoriteSongs = [];
      }
    }
  }
};
</script>

<style scoped>
.favorite-list {
  max-width: 700px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
  text-align: center;
}
</style>
