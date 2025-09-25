module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/vue-music-player/' : '/',
  transpileDependencies: [],
  configureWebpack: {
    resolve: {
    }
  }
}
