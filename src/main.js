import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Icon } from 'vant'
import 'vant/lib/index.css'  // 别忘了引入样式

const app = createApp(App)
app.use(router)
app.use(Icon)
app.mount('#app')
