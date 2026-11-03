// Tiny static server: serves the fntags repo root at / (so /src/fntags.mjs and
// /scripts/profile/page/* resolve) and the js-framework-benchmark css dir at /css/.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const FNTAGS_ROOT = path.resolve(here, '../..')
export const BENCH_CSS = process.env.BENCH_CSS || path.resolve(FNTAGS_ROOT, '../js-framework-benchmark/css')

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.eot': 'application/vnd.ms-fontobject'
}

export function startServer (port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    let file
    if (url.pathname.startsWith('/css/')) {
      file = path.join(BENCH_CSS, url.pathname.slice(5))
    } else {
      file = path.join(FNTAGS_ROOT, url.pathname)
    }
    if (!file.startsWith(FNTAGS_ROOT) && !file.startsWith(BENCH_CSS)) {
      res.writeHead(403); res.end(); return
    }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found: ' + url.pathname); return }
      res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
      res.end(data)
    })
  })
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port })))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { port } = await startServer(Number(process.env.PORT) || 8787)
  console.log(`serving ${FNTAGS_ROOT} on http://127.0.0.1:${port}/scripts/profile/page/index.html`)
}
