const {join} = require('path')
const {createServer} = require('http')
const next = require('next')

const app = next({dev: false})
const handle = app.getRequestHandler()
const port = Number.parseInt(process.argv.pop().split('=')[1] || 3000)

app.prepare().then(() => {
  createServer((req, res) => {
    if (req.url.startsWith('/sw')) {
      app.serveStatic(req, res, join(__dirname, `./static/workbox/${req.url}`))
    }
    else if (req.url.startsWith('/workbox/')) {
      app.serveStatic(req, res, join(__dirname, './static', req.url))
    } else {
      handle(req, res, req.url)
    }
  }).listen(port, err => {
    if (err) {
      throw err
    }
    console.log(`> Ready on http://localhost:${port}`)
  })
})