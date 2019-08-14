const NextWorkboxWebpackPlugin = require('../../index')

module.exports = {
  webpack: (config, {isServer, dev, buildId, config: {distDir}}) => {
    if (!isServer && !dev) {
      config.plugins.push(
        new NextWorkboxWebpackPlugin({
          importWorkboxFrom: 'cdn',
          distDir,
          buildId,
          swDestRoot: './static/workbox',
          swURLRoot: '/static/workbox'
        })
      );
    }

    return config
  },
  exportPathMap: () => {
    return {
      '/': { page: '/' }
    }
  }
}
