import { createRouter, createWebHashHistory } from 'vue-router';
import MusicSearch from './views/MusicSearch.vue';
import MusicDetail from './views/MusicDetail.vue';

const routes = [
  { path: '/', component: MusicSearch },
  { path: '/music/:id', component: MusicDetail, props: true }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
