const NextWorkboxWebpackPlugin = require('../../index')

module.exports = {
  webpack: (config, {isServer, buildId, config: {distDir}}) => {
    if (!isServer) {
      config.plugins.push(new NextWorkboxWebpackPlugin({
        distDir,
        buildId
      }))
    }

    return config
  },
  exportPathMap: () => {
    return {
      '/': { page: '/' }
    }
  }
}