/**
 * Catch-all route handler for SSR.
 *
 * Spliffy's `+` suffix means this handler matches all paths under `/`,
 * so every page request goes through server-side rendering.
 */
import { renderToString, escapeScriptContent } from '@srfnstack/fntags-ssr'
import { App } from '../app/App.mjs'

export default {
  GET: async ({ req }) => {
    const url = req.path || '/'

    const { html, state } = await renderToString({
      url,
      appFn: () => App(),
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
