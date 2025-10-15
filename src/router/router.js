import { createRouter, createWebHashHistory } from 'vue-router';
import MusicSearch from '../views/MusicSearch.vue';
import MusicDetail from '../views/MusicDetail.vue';

import FavoriteList from '../views/FavoriteList.vue';

const routes = [
  { path: '/', component: MusicSearch },
  { path: '/music/:id', component: MusicDetail, props: true },
  { path: '/favorites', component: FavoriteList }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
