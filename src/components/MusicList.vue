<template>
  <ul class="music-list">
    <li v-for="(item, index) in list" :key="item.id" class="music-item">
      <img :src="item.cover" :alt="item.song" class="cover" @click="goDetail(item.id)" style="cursor:pointer;" />
      <div class="info" @click="goDetail(item.id)" style="cursor:pointer;flex:1;">
        <div class="song">{{ item.song }}</div>
        <div class="singer">歌手：{{ item.singer }}</div>
        <div class="album">专辑：{{ item.album }}</div>
        <div class="time">发行时间：{{ item.time || '未知' }}</div>
        <div class="quality">音质：{{ item.quality }}</div>
      </div>
      <button class="fav-btn" :class="{ liked: isFavorite(item.id) }" @click.stop="toggleFavorite(item.id)">
        <span v-if="isFavorite(item.id)">❤️</span>
        <span v-else>🤍</span>
      </button>
      <button class="play-btn" @click="handlePlay(item, index)">▶️</button>
      <audio
       v-if="audioMap[item.id]" 
       :src="audioMap[item.id]" 
       controls
        style="width:120px;margin-left:8px;vertical-align:middle;display: none;"></audio>
    </li>
  </ul>
</template>

<script>
import { searchMusicByIdVkeys } from '../api/music';

export default {
  name: 'MusicList',
  props: {
    list: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      favoriteIds: JSON.parse(localStorage.getItem('favoriteMusicIds') || '[]'),
      audioMap: {} // {id: url}
    };
  },
  methods: {
        playGlobal(item, index, url) {
      // 触发全局播放器播放
      this.$root.player = {
        url: url,
        song: item.name || item.song,
        singer: item.singer || item.ar_name,
        cover: item.cover || item.pic,
        album: item.album || item.al_name,
        quality: item.quality,
        size: item.size,
        interval: item.interval,
        kbps: item.kbps,
        id: item.id,
        playIndex: index,           // 当前下标
        playList: this.list         // 整个播放列表
      };
    },
      async handlePlay(item, index) {
        console.log("触发",index)
    // 先加载音乐 URL
    const res = await searchMusicByIdVkeys(item.id);
    let url = '';
    if (res.data && res.data.code === 200 && res.data.data.url) {
      url = res.data.data.url;
      this.audioMap[item.id] = res.data.data.url;
    } else {
      this.audioMap[item.id] = '';
    }

    // 再触发全局播放
    this.playGlobal(item, index, url);
  },
async playNext(index) {
  console.log("触发了")
  if (index < this.list.length - 1) {
    const nextIndex = index + 1;
    const nextItem = this.list[nextIndex];
    if (nextItem) {
      // ✅ 用 handlePlay 请求 url，再传给 playGlobal
      await this.handlePlay(nextItem, nextIndex);
    }
  } else {
    console.log("播放结束，已到最后一首");
    this.$root.player = ""; // ✅ 停掉全局播放器
  }
},

    goDetail(id) {
        this.$emit('go-detail', id);
    },
    isFavorite(id) {
      return this.favoriteIds.includes(id);
    },
    toggleFavorite(id) {
      const idx = this.favoriteIds.indexOf(id);
      if (idx > -1) {
        this.favoriteIds.splice(idx, 1);
      } else {
        this.favoriteIds.push(id);
      }
      localStorage.setItem('favoriteMusicIds', JSON.stringify(this.favoriteIds));
      this.$emit('favorite-change', this.favoriteIds);
    },
    // async playMusic(id) {
    //   const res = await searchMusicByIdVkeys(id);
    //   console.log(res)
    //   if (res.data && res.data.code === 200 && res.data.data.url) {
    //     this.audioMap[id] = res.data.data.url;
    //     console.log('播放音乐URL:', this.audioMap[id]);
    //   } else {
    //     this.audioMap[id] = '';
    //   }
    // }
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
 .music-list {
   list-style: none;
   padding: 0;
   margin: 0 auto;
   max-width: 700px;
 }
 .music-item {
   display: flex;
   align-items: center;
   background: #fff;
   border-radius: 16px;
   box-shadow: 0 2px 16px rgba(66,185,131,0.08);
   margin-bottom: 18px;
   padding: 18px 24px;
   transition: box-shadow 0.2s, transform 0.2s;
   border: none;
 }
 .music-item:hover {
   box-shadow: 0 6px 32px rgba(66,185,131,0.18);
   transform: translateY(-2px) scale(1.01);
 }
 .cover {
   width: 80px;
   height: 80px;
   object-fit: cover;
   border-radius: 12px;
   margin-right: 24px;
   box-shadow: 0 2px 8px rgba(66,185,131,0.10);
 }
 .info {
   text-align: left;
   flex: 1;
 }
 .song {
   font-size: 22px;
   font-weight: bold;
   color: #2c3e50;
   margin-bottom: 6px;
 }
 .singer {
   font-size: 15px;
   color: #42b983;
   margin-top: 2px;
 }
 .album {
   font-size: 15px;
   color: #369870;
   margin-top: 2px;
 }
 .time, .quality {
   font-size: 14px;
   color: #888;
   margin-top: 2px;
 }
.fav-btn {
  background: none;
  border: none;
  font-size: 26px;
  margin-left: 12px;
  cursor: pointer;
  outline: none;
  transition: transform 0.1s;
}
.fav-btn.liked {
  color: #e74c3c;
  transform: scale(1.15);
}
</style>
