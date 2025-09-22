import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://api.vkeys.cn/v2/music/netease',
  timeout: 10000,
});

// 搜索列表接口（不变）
export function searchMusic(word) {
  return instance.get('', { params: { word } });
}

// 新的音乐详情接口（bugpk）
export function fetchMusicDetailById(id, level = 'standard') {
  // type=json 返回json格式
  return axios.get('https://api.bugpk.com/api/163_music', {
    params: {
      ids: id,
      level,
      type: 'json'
    }
  });
}
