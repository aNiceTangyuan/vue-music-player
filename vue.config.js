const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        url: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
        assert: false,
        util: false,
        os: false,
      }
    }
  }
})
