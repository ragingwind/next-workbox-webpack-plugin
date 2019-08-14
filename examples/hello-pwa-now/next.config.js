const NextWorkboxWebpackPlugin = require('next-workbox-webpack-plugin');

module.exports = {
	webpack: (config, { isServer, dev, buildId, config: { distDir } }) => {
		if (!isServer && !dev) {
			config.plugins.push(
        new NextWorkboxWebpackPlugin({
          importWorkboxFrom: 'cdn',
          distDir,
          buildId,
          swDestRoot: '.next/static/my-build-id/pages',
          swURLRoot: '_next/static/my-build-id/pages'
        })
      );
    }
		return config;
  },
  generateBuildId: async () => {
    return 'my-build-id'
  },
	exportPathMap: () => {
		return {
			'/': { page: '/' }
		};
	}
};
