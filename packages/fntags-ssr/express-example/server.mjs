import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderToString, escapeScriptContent } from '@srfnstack/fntags-ssr'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// Serve only the specific fntags source files the browser needs.
// Do NOT serve all of node_modules — that exposes every dependency's source.
app.use('/lib/ext/@srfnstack/fntags', express.static(
  path.join(__dirname, 'node_modules/@srfnstack/fntags')
))
app.use('/lib/ext/@srfnstack/fntags-ssr/src', express.static(
  path.join(__dirname, 'node_modules/@srfnstack/fntags-ssr/src')
))

// Serve static files (client.mjs, app/App.mjs) from www/
app.use(express.static(path.join(__dirname, 'www')))

// Catch-all: server-side render for all page requests
app.get('/{*path}', async (req, res) => {
  const { html, state } = await renderToString({
    url: req.path,
    appFn: async () => {
      const { App } = await import('./www/app/App.mjs')
      return App()
    },
    origin: `${req.protocol}://${req.get('host')}`
  })

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>fntags SSR Example</title>
  <script type="importmap">
  {
    "imports": {
      "@srfnstack/fntags": "/lib/ext/@srfnstack/fntags/index.js",
      "@srfnstack/fntags-ssr/hydrate": "/lib/ext/@srfnstack/fntags-ssr/src/hydrate.mjs"
    }
  }
  </script>
</head>
<body>
  <div id="app">${html}</div>
  <script>window.__FNTAGS_SSR_STATE__=${escapeScriptContent(JSON.stringify(state))}</script>
  <script type="module" src="/client.mjs"></script>
</body>
</html>`)
})

app.listen(3001, () => {
  console.log('Listening on http://localhost:3001')
})
