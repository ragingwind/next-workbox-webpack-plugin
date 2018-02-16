const {join} = require('path')
const {createServer} = require('http')
const next = require('next')

const app = next({dev: process.env.NODE_ENV !== 'production'})
const handle = app.getRequestHandler()
const port = Number.parseInt(process.argv.pop().split('=')[1] || 3000)

app.prepare().then(() => {
  createServer((req, res) => {  
    if (req.url === '/sw.js') {
      app.serveStatic(req, res, join(__dirname, '.next/workbox/sw.js'))
    }
    else if (req.url.startsWith('/workbox/')) {
      app.serveStatic(req, res, join(__dirname, '.next', parsedUrl.pathname))
    } else {
      handle(req, res, parsedUrl)
    }
  }).listen(port, err => {
    if (err) {
      throw err
    }
    console.log(`> Ready on http://localhost:${port}`)
  })
})