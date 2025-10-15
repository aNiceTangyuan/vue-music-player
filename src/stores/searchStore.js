// stores/useSearchStore.js
import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', {
  state: () => ({
    searchType: 'word',
    searchInput: '',
    results: [],
    resultById: null,
    loading: false,
    error: ''
  }),
  
  actions: {
    setSearchType(type) {
      this.searchType = type
    },
    
    setSearchInput(input) {
      this.searchInput = input
    },
    
    setResults(results) {
      this.results = results
    },
    
    setResultById(result) {
      this.resultById = result
    },
    
    clearResults() {
      this.results = []
      this.resultById = null
      this.error = ''
    }
  },
  
  persist: true // 使用 pinia-plugin-persistedstate 插件自动持久化
})