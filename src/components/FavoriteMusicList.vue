<template>
  <ul class="fav-music-list">
    <li v-for="item in list" :key="item.url || item.id" class="fav-music-item">
      <img :src="item.pic || item.cover" :alt="item.name || item.song" class="fav-cover" />
      <div class="fav-info">
        <div class="fav-song">{{ item.name || item.song }}</div>
        <div class="fav-singer">歌手：{{ item.ar_name || item.singer }}</div>
        <div class="fav-album">专辑：{{ item.al_name || item.album }}</div>
        <div class="fav-quality">音质：{{ item.quality }}</div>
<div class="fav-audio-row">
  <audio v-if="item.url" :src="item.url" controls class="fav-audio-player" />
  <button class="unfav-btn" @click="removeFavorite(item.id)">❤️</button>
</div>
      </div>
    </li>
  </ul>

</template>

<script>
import { searchMusicByIdVkeys } from '../api/music';

export default {
  name: 'FavoriteMusicList',
  props: {
    list: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      levelOptions: [
        { value: 'standard', label: '标准' },
        { value: 'exhigh', label: '极高' },
        { value: 'lossless', label: '无损' },
        { value: 'hires', label: 'Hi-Res' },
        { value: 'jyeffect', label: '高清环绕' },
        { value: 'sky', label: '沉浸环绕' },
        { value: 'jymaster', label: '超清母带' }
      ],
      audioLevels: {}, // {id: level}
      audioUrls: {}    // {id: url}
    };
  },
  mounted() {
    // 默认全部用exhigh音质，但不自动请求播放 url
    this.list.forEach(item => {
      this.audioLevels[item.id] = 'exhigh';
      this.audioUrls[item.id] = '';
    });
  },
  methods: {
    async fetchAudio(id) {
      // 只有切换音质或播放时才用 bugpk 获取 url
      const res = await searchMusicByIdVkeys(id);
      console.log(res)
      if (res.data && res.data.status === 200 && res.data.url) {
        this.audioUrls[id] = res.data.url;
      } else {
        this.audioUrls[id] = '';
      }
    },
        removeFavorite(id) {
          let ids = JSON.parse(localStorage.getItem('favoriteMusicIds') || '[]');
          ids = ids.filter(favId => favId !== id);
          localStorage.setItem('favoriteMusicIds', JSON.stringify(ids));
          this.$emit('refresh');
        }
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
   box-shadow: 0 2px 16px rgba(66,185,131,0.10);
   margin-bottom: 18px;
   padding: 18px 24px;
   transition: box-shadow 0.2s, transform 0.2s;
   border: none;
 }
 .fav-music-item:hover {
   box-shadow: 0 6px 32px rgba(66,185,131,0.18);
   transform: translateY(-2px) scale(1.01);
 }
 .fav-cover {
   width: 80px;
   height: 80px;
   object-fit: cover;
   border-radius: 12px;
   margin-right: 24px;
   box-shadow: 0 2px 8px rgba(66,185,131,0.10);
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
 .unfav-btn {
  background: none;
  border: none;
  font-size: 26px;
  margin-left: 12px;
  cursor: pointer;
  outline: none;
  transition: transform 0.1s;
  text-align: end;
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
  box-shadow: 0 2px 8px rgba(66,185,131,0.08);
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
