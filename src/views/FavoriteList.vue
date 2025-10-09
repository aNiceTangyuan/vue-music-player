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

  // 带重试的请求函数
  async function fetchWithRetry(id, maxRetries = 10) {
    let attempt = 0;
    while (attempt < maxRetries) {
      const res = await searchMusicByIdVkeys(id);
      if (res.data && res.data.code === 200) {
        return res.data.data; // 成功返回
      } else if (res.data && res.data.code === 503) {
        attempt++;
        if (attempt < maxRetries) {
          console.warn(`id=${id} 第${attempt}次重试...`);
        }
      } else {
        break; // 其他错误直接退出
      }
    }
    return []; // 超过次数或失败返回空数组
  }

  if (ids.length) {
    const results = await Promise.all(ids.map(id => fetchWithRetry(id)));
    this.favoriteSongs = results.flat(); // 合并数组
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
