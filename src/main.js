import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/router'
import { Icon } from 'vant'
import 'vant/lib/index.css'  // 别忘了引入样式

const app = createApp(App)
const pinia = createPinia()


app.use(pinia)
app.use(router)
app.use(Icon)
app.mount('#app')
