const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const md5File = require('md5-file/promise').sync
const {generateSWString, copyWorkboxLibraries, getModuleUrl} = require('workbox-build')

const swDefaultConfig = {
  globDirectory: './',
  globPatterns: [],
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [{
    urlPattern: /^http[s|]?.*/,
    handler: 'staleWhileRevalidate'
  }],
  importScripts: [],
  importWorkboxFrom: 'local'
}

const hash = ctx => crypto.createHash('md5').update(ctx, 'utf8').digest('hex')

class NextWorkboxWebpackPlugin {
  constructor(swConfig, options) {
    this.swConfig = {
      ...swDefaultConfig,
      ...swConfig,
      ...{
        swDest: '.next/workbox/sw.js'
      }
    }

    const distDir = path.join(options.dir, options.config.distDir)
    this.cacheQuery = [{
      src: `${distDir}/bundles/pages`,
      route: f => `/_next/${options.buildId}/page/${f}`,
      filter: f => (/.js$/).test(f)
    }, {
      src: `${distDir}/chunks`,
      route: f => `/_next/webpack/chunks/${f}`,
      filter: f => (/.js$/).test(f)
    }, {
      src: `${distDir}`,
      route: f => `/_next/${md5File(`${distDir}/app.js`)}/app.js`,
      filter: f => f === 'app.js'
    }]
  }

  cacheManifest() {
    return Promise.all(this.cacheQuery.map(query => {
      return new Promise(resolve => {
        fs.readdir(query.src, (err, files = []) => {
          resolve(files.filter(query.filter).map(f => query.route(f)))
        })
      })
    })).then(files => files.reduce((c, p) => c.concat(p), []))
  }

  async importWorkboxLibraries(swImportWorkboxFrom, swDestDir) {
    if (swImportWorkboxFrom === 'local') {
      const workboxSwJs = path.basename(require(`./node_modules/workbox-sw/package.json`).main)
      return `/workbox/${await copyWorkboxLibraries(swDestDir)}/${workboxSwJs}`
    } else {
      return getModuleUrl('workbox-sw')
    }
  }

  apply(compiler) {
    compiler.plugin('done', async stats => {
      if (stats.toJson().errors.length > 0) {
        return
      }

      try {
        const {
          swDest,
          importWorkboxFrom,
          ...swConfig
        } = this.swConfig

        const swDestRoot = path.dirname(swDest)
        const swLibs = await this.importWorkboxLibraries(importWorkboxFrom, swDestRoot)
        const precacheManifest = `self.__precacheManifest = ${JSON.stringify(await this.cacheManifest())}`
        const nextPrecaheManifest = `next-precache-manifest-${hash(precacheManifest)}.js`

        // dump out precached manifest for next pages, chunks
        fs.writeFileSync(path.join(swDestRoot, nextPrecaheManifest), precacheManifest)

        // write service worker script
        fs.writeFileSync(swDest, await generateSWString({
          ...swConfig, 
          ...{
            importScripts: swConfig.importScripts.concat([swLibs, `/workbox/${nextPrecaheManifest}`])
          }
        }))
      } catch (e) {
        console.error(e)
      }
    })
  }
}

module.exports = NextWorkboxWebpackPlugin