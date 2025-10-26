// stores/usePlayerStore.js
import { defineStore } from 'pinia'
import { searchMusicByIdVkeys } from '../api/music'

export const usePlayerStore = defineStore('playerStore', {
  state: () => ({
    url: '',
    song: '',
    singer: '',
    cover: '',
    id: null,
    playIndex: 0,
    playList: [],
    playMode: 'order', // order, random, single
    playedSet: new Set(),
    volume: 1,
    isPlaying: false,
    currentTime: 0
  }),
  
  actions: {
    async playByIndex(index) {
      if (!this.playList[index]) return
      const item = this.playList[index]
      
      // 重试获取URL
      const url = await this.retryFetchMusicUrl(item.id)
      if (!url) return
      
      this.url = url
      this.song = item.song || item.name
      this.singer = item.singer || item.ar_name
      this.cover = item.cover || item.pic
      this.id = item.id
      this.playIndex = index
    },
    
    async retryFetchMusicUrl(id, maxRetries = 8) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const res = await searchMusicByIdVkeys(id)
          if (res.data?.code === 200 && res.data.data?.url) {
            return res.data.data.url
          }
        } catch (e) {
          console.warn(`重试 ${i + 1}/${maxRetries} 失败`)
        }
        await new Promise(r => setTimeout(r, 500))
      }
      return null
    },
    
    async playNext() {
      if (this.playMode === 'random') {
        await this.playRandom()
      } else {
        const nextIndex = this.playIndex + 1
        if (nextIndex < this.playList.length) {
          await this.playByIndex(nextIndex)
        }
      }
    },
    
    async playPrev() {
      const prevIndex = this.playIndex - 1
      if (prevIndex >= 0) {
        await this.playByIndex(prevIndex)
      }
    },
    
    async playRandom() {
      if (this.playList.length === 0) return
      
      this.playedSet.add(this.id)
      const unplayed = this.playList.filter(item => !this.playedSet.has(item.id))
      
      let nextSong
      if (unplayed.length > 0) {
        nextSong = unplayed[Math.floor(Math.random() * unplayed.length)]
      } else {
        this.playedSet.clear()
        nextSong = this.playList[Math.floor(Math.random() * this.playList.length)]
      }
      
      const index = this.playList.findIndex(item => item.id === nextSong.id)
      await this.playByIndex(index)
    },
    
    togglePlayMode() {
      const modes = ['order', 'random', 'single']
      const currentIndex = modes.indexOf(this.playMode)
      this.playMode = modes[(currentIndex + 1) % modes.length]
      this.playedSet.clear()
    },
    
    setPlayList(list, startIndex = 0) {
      this.playList = list
      this.playIndex = startIndex
    },
    
    updateCurrentTime(time) {
      this.currentTime = time
    }
  }
})