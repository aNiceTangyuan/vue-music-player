// stores/useFavoritesStore.js
import { defineStore } from 'pinia'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    ids: JSON.parse(localStorage.getItem('favoriteMusicIds') || '[]'),
    cache: JSON.parse(localStorage.getItem('favoriteMusicCache') || '[]')
  }),
  
  getters: {
    isFavorite: (state) => (id) => state.ids.includes(id),
    favoriteCount: (state) => state.ids.length
  },
  
  actions: {
    toggle(song) {
      const id = song.id
      const idx = this.ids.indexOf(id)
      
      if (idx > -1) {
        // 移除收藏
        this.ids.splice(idx, 1)
        this.cache = this.cache.filter(s => s.id !== id)
      } else {
        // 添加收藏
        this.ids.unshift(id)
        this.cache.unshift({
          id,
          song: song.song || song.name,
          singer: song.singer || song.ar_name,
          cover: song.cover || song.pic,
          album: song.album || song.al_name,
          quality: song.quality
        })
      }
      
      this.persist()
    },
    
    removeById(id) {
      this.ids = this.ids.filter(i => i !== id)
      this.cache = this.cache.filter(s => s.id !== id)
      this.persist()
    },
    
    persist() {
      localStorage.setItem('favoriteMusicIds', JSON.stringify(this.ids))
      localStorage.setItem('favoriteMusicCache', JSON.stringify(this.cache))
      // 不再需要 window 事件，组件直接响应 store 变化
    },
    
    refreshFromStorage() {
      this.ids = JSON.parse(localStorage.getItem('favoriteMusicIds') || '[]')
      this.cache = JSON.parse(localStorage.getItem('favoriteMusicCache') || '[]')
    }
  }
})