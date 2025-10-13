<template>
  <div class="favorite-list">
    <h2>我喜欢的音乐</h2>

    <!-- ✅ 用 TransitionGroup 包裹子组件的内容 -->
    <TransitionGroup name="stagger" tag="div">
      <FavoriteMusicList
        v-if="favoriteSongs.length"
        :key="'fav-list'"
        :list="favoriteSongs"
        @refresh="fetchFavorites"
      />
    </TransitionGroup>

    <div v-if="!favoriteSongs.length" class="empty">暂无喜欢的音乐</div>
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
      favoriteSongs: [],
    };
  },
  async created() {
    await this.fetchFavorites();
  },
    mounted() {
    // 监听收藏变更事件，重新加载
    window.addEventListener('favorites-changed', this.fetchFavorites);
  },

  beforeUnmount() {
    window.removeEventListener('favorites-changed', this.fetchFavorites);
  },
  methods: {
    async fetchFavorites() {
      const ids = JSON.parse(localStorage.getItem('favoriteMusicIds') || '[]');
      if (!ids.length) {
        this.favoriteSongs = [];
        return;
      }

      // 从缓存读取基础数据（不含 URL）
      const cache = JSON.parse(localStorage.getItem('favoriteMusicCache') || '[]');
      const cachedMap = new Map(cache.map(song => [song.id, song]));

      // 取前50首做首屏显示
      const first50Ids = ids.slice(0, 50);
      const first50SongsBase = first50Ids
        .map(id => {
          const song = cachedMap.get(id);
          if (song) {
            const { url, ...rest } = song;
            console.log(url)
            return rest;
          }
          return null;
        })
        .filter(Boolean);

      // ✅ 分步加入 favoriteSongs，让动画逐个触发
      this.favoriteSongs = [];
      let i = 0;
      const addTimer = setInterval(() => {
        if (i < first50SongsBase.length) {
          this.favoriteSongs.push(first50SongsBase[i]);
          i++;
        } else {
          clearInterval(addTimer);
        }
      }, 100); // 每隔 0.1 秒加入一首

      // 异步获取 URL 并补齐
      const urlResults = await Promise.all(
        first50SongsBase.map(song => this.fetchUrlOnly(song.id))
      );
      first50SongsBase.forEach((song, i) => {
        song.url = urlResults[i]?.url || '';
      });

      // 获取剩下的歌曲
      const restIds = ids.slice(50);
      if (restIds.length) {
        const restResults = await Promise.all(restIds.map(id => this.fetchWithRetry(id)));
        this.favoriteSongs = [...this.favoriteSongs, ...restResults.flat()];
      }
    },

    async fetchUrlOnly(id) {
      try {
        const res = await searchMusicByIdVkeys(id);
        if (res.data && res.data.code === 200) {
          const data = res.data.data?.[0] || res.data.data;
          return { url: data.url };
        }
      } catch (e) {
        console.warn('获取url失败:', id, e);
      }
      return {};
    },

    async fetchWithRetry(id, maxRetries = 8) {
      let attempt = 0;
      while (attempt < maxRetries) {
        const res = await searchMusicByIdVkeys(id);
        if (res.data && res.data.code === 200) {
          return res.data.data;
        } else if (res.data && res.data.code === 503) {
          attempt++;
          await new Promise(r => setTimeout(r, 200));
        } else break;
      }
      return [];
    },
  },
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

.empty {
  color: #888;
  margin-top: 30px;
}

/* ✅ 进场动画定义 */
.stagger-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.stagger-enter-active {
  transition: all 0.6s ease;
  transition-delay: calc(var(--i, 0) * 0.1s);
}
.stagger-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
