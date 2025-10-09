<template>
  <ul class="fav-music-list">
    <li
      v-for="(item, index) in list"
      :key="item.url || item.id"
      class="fav-music-item"
      @click="handleGoDetail(item.id)"
    >
      <img
        :src="item.pic || item.cover"
        :alt="item.name || item.song"
        class="fav-cover"
      />
      <div class="fav-info">
        <div class="fav-song">{{ item.name || item.song }}</div>
        <div class="fav-singer">歌手：{{ item.ar_name || item.singer }}</div>
        <div class="fav-album">专辑：{{ item.al_name || item.album }}</div>
        <div class="fav-quality">音质：{{ item.quality }}</div>

        <div class="fav-audio-row">
          <button class="play-btn" @click.stop="playGlobal(item, index)">
            <van-icon name="play-circle-o" /> 播放
          </button>
          <button class="unfav-btn" @click.stop="removeFavorite(item.id)">❤️</button>
        </div>
      </div>
    </li>
  </ul>
</template>

<script>
export default {
  name: "FavoriteMusicList",
  props: {
    list: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    playGlobal(item, index) {
      // 告诉全局播放器播放这个音乐
      this.$root.player = {
        url: item.url,
        song: item.name || item.song,
        singer: item.singer || item.ar_name,
        cover: item.cover || item.pic,
        album: item.album || item.al_name,
        id: item.id,
        playIndex: index,
        playList: this.list,
      };
    },

    removeFavorite(id) {
      let ids = JSON.parse(localStorage.getItem("favoriteMusicIds") || "[]");
      ids = ids.filter(favId => favId !== id);
      localStorage.setItem("favoriteMusicIds", JSON.stringify(ids));

      // 同步更新缓存
      const cache = JSON.parse(localStorage.getItem("favoriteMusicCache") || "[]");
      const newCache = cache.filter(song => song.id !== id);
      localStorage.setItem("favoriteMusicCache", JSON.stringify(newCache));

      // 通知父组件刷新
      this.$emit("refresh");
    },

    handleGoDetail(id) {
      this.$router.push({ path: `/music/${id}` });
    },
  },
};
</script>

<style scoped>
.play-btn {
  background: #fff;
  color: #42b983;
  border: 1.5px solid #42b983;
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 18px;
  margin-left: 8px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.play-btn:hover {
  background: #42b983;
  color: #fff;
}
.fav-music-list {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 700px;
}
.fav-music-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(66, 185, 131, 0.1);
  margin-bottom: 18px;
  padding: 18px 24px;
  transition: box-shadow 0.2s, transform 0.2s;
  border: none;
}
.fav-music-item:hover {
  box-shadow: 0 6px 32px rgba(66, 185, 131, 0.18);
  transform: translateY(-2px) scale(1.01);
}
.fav-cover {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  margin-right: 24px;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.1);
}
.fav-info {
  text-align: left;
  flex: 1;
}
.fav-song {
  font-size: 22px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 6px;
}
.fav-singer {
  font-size: 15px;
  color: #42b983;
  margin-bottom: 2px;
}
.fav-album {
  font-size: 15px;
  color: #369870;
  margin-bottom: 2px;
}
.fav-quality {
  font-size: 14px;
  color: #888;
  margin-bottom: 2px;
}
.fav-audio {
  margin-top: 8px;
}
.fav-audio-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.fav-audio-player {
  width: 100%;
  min-width: 220px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.08);
  background: #f8f8f8;
}
.unfav-btn {
  background: none;
  border: none;
  font-size: 26px;
  margin-left: 12px;
  cursor: pointer;
  outline: none;
  transition: transform 0.1s;
  text-align: center;
  display: flex;
  align-items: center;
  height: 40px;
}
</style>
