module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/vue-music-player/' : '/',
  transpileDependencies: [],
  devServer: {
    port: 8081, // 自定义端口号，您可以改成任何可用端口
    open: true, // 启动时自动打开浏览器
    host: 'localhost' // 可以改成 '0.0.0.0' 允许外部访问
  },
  configureWebpack: {
    resolve: {
    }
  }
}
