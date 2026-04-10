/**
 * Catch-all route handler for SSR.
 *
 * Spliffy's `+` suffix means this handler matches all paths under `/`,
 * so every page request goes through server-side rendering.
 */
import { renderToString, escapeScriptContent } from '@srfnstack/fntags-ssr'

export default {
  GET: async ({ req }) => {
    const url = req.path || '/'

    const { html, state } = await renderToString({
      url,
      appFn: async () => {
        const { App } = await import('./app/App.mjs')
        return App()
      },
      origin: 'http://localhost'
    })

    return {
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: `<!DOCTYPE html>
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
</html>`
    }
  }
}
