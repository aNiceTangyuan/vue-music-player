import { createRouter, createWebHashHistory } from 'vue-router';
import MusicSearch from '../views/MusicSearch.vue';
import MusicDetail from '../views/MusicDetail.vue';
import ImmersivePlayer from '../views/ImmersivePlayer.vue';
import FavoriteList from '../views/FavoriteList.vue';
import MyMusicList from '../views/MyMusicList.vue';

const routes = [
  { path: '/', component: MusicSearch },
  { path: '/music/:id', component: MusicDetail, props: true },
  { path: '/immersive', component: ImmersivePlayer },
  { path: '/favorites', component: FavoriteList },
  { path: '/playlist/:id', component: MyMusicList, props: true }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
