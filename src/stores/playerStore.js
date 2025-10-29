// stores/usePlayerStore.js
import { defineStore } from 'pinia'
import { searchMusicByIdVkeys, fetchLyricById } from '../api/music'

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
    currentTime: 0,
    lyrics: [], // 存储解析后的歌词
    currentLyric: '' // 当前显示的歌词行
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
      
      // 加载歌词
      await this.fetchLyrics(item.id)
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
      this.updateCurrentLyric(time)
    },
    
    async fetchLyrics(id) {
      try {
        const res = await fetchLyricById(id)
        if (res.data?.code === 200 && res.data.data?.lrc) {
          this.lyrics = this.parseLRC(res.data.data.lrc)
        } else {
          this.lyrics = []
        }
      } catch (err) {
        console.warn('歌词加载失败', err)
        this.lyrics = []
      }
      this.currentLyric = ''
    },
    
    parseLRC(lrc) {
      if (!lrc) return []
      const lines = lrc.split('\n')
      const result = []
      const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g
      
      lines.forEach(line => {
        const matches = [...line.matchAll(timeReg)]
        if (matches.length > 0) {
          const text = line.replace(timeReg, '').trim()
          matches.forEach(match => {
            const minutes = parseInt(match[1])
            const seconds = parseInt(match[2])
            const ms = parseInt(match[3].padEnd(3, '0'))
            const time = minutes * 60 + seconds + ms / 1000
            result.push({ time, text })
          })
        }
      })
      
      return result.sort((a, b) => a.time - b.time)
    },
    
    updateCurrentLyric(time) {
      if (!this.lyrics || this.lyrics.length === 0) {
        this.currentLyric = this.singer || ''
        return
      }
      
      let idx = 0
      for (let i = 0; i < this.lyrics.length; i++) {
        if (time >= this.lyrics[i].time) {
          idx = i
        } else {
          break
        }
      }
      
      this.currentLyric = this.lyrics[idx]?.text || this.singer || ''
    }
  }
})