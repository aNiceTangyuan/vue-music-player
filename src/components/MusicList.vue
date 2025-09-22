<template>
  <ul class="music-list">
    <li v-for="item in list" :key="item.id" class="music-item" @click="goDetail(item.id)" style="cursor:pointer;">
      <img :src="item.cover" :alt="item.song" class="cover" />
      <div class="info">
        <div class="song">{{ item.song }}</div>
        <div class="singer">歌手：{{ item.singer }}</div>
        <div class="album">专辑：{{ item.album }}</div>
        <div class="time">发行时间：{{ item.time || '未知' }}</div>
        <div class="quality">音质：{{ item.quality }}</div>
      </div>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'MusicList',
  props: {
    list: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    goDetail(id) {
      this.$router.push({ path: `/music/${id}` });
    }
  }
};
</script>

<style scoped>
.music-list {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 600px;
}
.music-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 16px 0;
}
.cover {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 20px;
}
.info {
  text-align: left;
}
.song {
  font-size: 20px;
  font-weight: bold;
}
.singer, .album, .time, .quality {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}
</style>
