const path = require('path')
const fs = require('fs-extra')
const crypto = require('crypto')
const md5File = require('md5-file/promise').sync
const findUp = require('find-up')
const {generateSWString, copyWorkboxLibraries, getModuleUrl} = require('workbox-build')

const hash = ctx => crypto.createHash('md5').update(ctx, 'utf8').digest('hex')

const defaultConfig = {
  globDirectory: './',
  globPatterns: [],
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [{
    urlPattern: /^http[s|]?.*/,
    handler: 'staleWhileRevalidate'
  }],
  importScripts: [],
  distDir: '.next',
  importWorkboxFrom: 'local',
  precacheManifest: true,
  removeDir: true,
  buildId: null,
  uniqueId: false
}

class NextWorkboxWebpackPlugin {
  constructor(config) {
    const {
      distDir,
      importWorkboxFrom,
      precacheManifest,
      removeDir,
      buildId,
      uniqueId,
      ...swConfig
    } = {
      ...defaultConfig,
      ...config,
      swDest: config.swDest ? path.basename(config.swDest) : 'sw.js'
    }

    this.swConfig = swConfig
    this.options = {
      distDir,
      importWorkboxFrom,
      precacheManifest,
      removeDir,
      buildId,
      // dedicated path and url, must be under static in next.js to export and refer to it
      swDestRoot: './static/workbox',
      swURLRoot: '/static/workbox'
    }
    
    // build id come from next.js is exist
    if (!this.options.buildId) {
      throw 'Build id from next.js must be exist'
    }

    // clean up previous builts
    if (this.options.removeDir) {
      this.removeWorkboxDir(this.options)
    }
  }

  async importWorkboxLibraries({importWorkboxFrom, swURLRoot, swDestRoot}) {
    if (this.options.importWorkboxFrom === 'local') {
      try {
        const workboxPkg = findUp.sync('node_modules/workbox-sw/package.json', __dirname)
        const workboxName = path.basename(require(workboxPkg).main)
        return `${swURLRoot}/${await copyWorkboxLibraries(swDestRoot)}/${workboxName}`
      } catch (e) {
        throw e
      }
    } else {
      return getModuleUrl('workbox-sw')
    }
  }
  
  globPrecacheManifest({distDir, buildId}) {
    const precacheQuery = [{
      src: `${distDir}/bundles/pages`,
      route: f => `/_next/${buildId}/page/${f}`,
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

    return Promise.all(precacheQuery.map(query => {
      return new Promise(resolve => {
        fs.readdir(query.src, (err, files = []) => {
          resolve(files.filter(query.filter).map(f => query.route(f)))
        })
      })
    })).then(files => files.reduce((c, p) => c.concat(p), []))
  }

  async importPrecacheManifest({swDestRoot, swURLRoot}) {
    const manifest = await this.globPrecacheManifest(this.options)
    const context = `self.__precacheManifest = ${JSON.stringify(manifest)}`
    const output = `next-precache-manifest-${hash(context)}.js`

    // dump out precached manifest for next pages, chunks
    fs.writeFileSync(path.join(swDestRoot, output), context)
    
    return `${swURLRoot}/${output}`
  }

  async generateSW(swDest, swConfig) {
    fs.writeFileSync(swDest, await generateSWString(swConfig))
  }

  removeWorkboxDir({swDestRoot}) {
    fs.removeSync(path.resolve(process.cwd(), swDestRoot))
  }

  apply(compiler) {
    compiler.plugin('done', async stats => {
      if (stats.toJson().errors.length > 0) {
        return
      }

      try {
        const {swDest, ...swConfig} = this.swConfig
        
        // unshift workbox libs to the top of scripts
        swConfig.importScripts.unshift(await this.importWorkboxLibraries(this.options))

        // push precached manifest to end of scripts
        if (this.options.precacheManifest) {
          swConfig.importScripts.push(await this.importPrecacheManifest(this.options))
        }

        await this.generateSW(path.join(this.options.swDestRoot, swDest), swConfig)
      } catch (e) {
        console.error(e)
      }
    })
  }
}

module.exports = NextWorkboxWebpackPlugin