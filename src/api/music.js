import axios from 'axios';
// 落月api  https://doc.vkeys.cn/api-doc/v2/%E9%9F%B3%E4%B9%90%E6%A8%A1%E5%9D%97/%E7%BD%91%E6%98%93%E4%BA%91%E9%9F%B3%E4%B9%90/1-netease.html
const instance = axios.create({
  baseURL: 'https://api.vkeys.cn/v2/music/netease',
  timeout: 5000,
});


// vkeys接口：通过id查找音乐详情，支持 quality 参数（数字1-9）
export function searchMusicByIdVkeys(id, quality = 4) {
  return instance.get('', { params: { id, quality } });
}

// 搜索列表接口（不变）

export function searchMusic(word) {
  return instance.get('', { params: { word } });
}

// 新的音乐详情接口（bugpk）
// export function fetchMusicDetailById(id, level = 'exhigh') {
//   // type=json 返回json格式
//   return axios.get('https://api.bugpk.com/api/163_music', {
//     params: {
//       ids: id,
//       level,
//       type: 'json'
//     }
//   });
// }
