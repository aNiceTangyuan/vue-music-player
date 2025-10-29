// stores/playlistStore.js
import { defineStore } from 'pinia'

export const usePlaylistStore = defineStore('playlistStore', {
  state: () => ({
    playlists: JSON.parse(localStorage.getItem('userPlaylists')) || []
  }),
  
  actions: {
    createPlaylist(name) {
      const newPlaylist = {
        id: Date.now(),
        name: name,
        songs: [],
        createdAt: new Date().toISOString()
      }
      this.playlists.push(newPlaylist)
      this.savePlaylists()
      return newPlaylist
    },
    
    deletePlaylist(id) {
      this.playlists = this.playlists.filter(p => p.id !== id)
      this.savePlaylists()
    },
    
    addSongToPlaylist(playlistId, song) {
      const playlist = this.playlists.find(p => p.id === playlistId)
      if (playlist) {
        // 检查歌曲是否已存在
        const exists = playlist.songs.some(s => s.id === song.id)
        if (!exists) {
          playlist.songs.push(song)
          this.savePlaylists()
          return true
        }
      }
      return false
    },
    
    removeSongFromPlaylist(playlistId, songId) {
      const playlist = this.playlists.find(p => p.id === playlistId)
      if (playlist) {
        playlist.songs = playlist.songs.filter(s => s.id !== songId)
        this.savePlaylists()
      }
    },
    
    savePlaylists() {
      localStorage.setItem('userPlaylists', JSON.stringify(this.playlists))
    }
  },
  
  getters: {
    getPlaylistById: (state) => (id) => {
      return state.playlists.find(p => p.id === id)
    }
  }
})


