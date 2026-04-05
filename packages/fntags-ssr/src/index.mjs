/**
 * @module fntags-ssr
 *
 * Server-side rendering for fntags applications.
 */

import { setupEnv, acquireMutex } from './ssr-env.mjs'

/**
 * Escape a string for safe embedding inside a <script> tag.
 * Replaces `<` with `\u003c` to prevent `</script>` injection (case-insensitive).
 *
 * IMPORTANT: Apply this AFTER JSON.stringify, not before. The \u003c must appear
 * directly in the JS source so the browser's JS parser interprets it as a Unicode
 * escape (→ the `<` character). If applied before JSON.stringify, the backslash gets
 * double-escaped to \\u003c, which the JS parser reads as a literal backslash + text.
 *
 * @example
 * // Correct — \u003c in JS source is a Unicode escape for <
 * escapeScriptContent(JSON.stringify(state))
 *
 * // WRONG — JSON.stringify escapes \ to \\, breaking the Unicode escape
 * JSON.stringify(escapeScriptContent(value))
 */
export function escapeScriptContent (str) {
  return str.replace(/</g, '\\u003c')
}

/**
 * Build the full URL from origin, rootPath, and url, avoiding double slashes.
 */
function buildFullUrl (origin, rootPath, url) {
  const base = rootPath === '/' ? origin : origin + rootPath.replace(/\/+$/, '')
  return base + (url.startsWith('/') ? url : '/' + url)
}

/**
 * Drain microtasks and wait for all fntags promise placeholders to resolve.
 *
 * @param {Element} container The container to check for unresolved promise markers
 * @param {number} timeout Max milliseconds to wait
 */
async function awaitPromises (container, timeout) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    // Drain microtasks and setTimeout callbacks so promise .then() handlers
    // and renderNode's setTimeout-based replacements can execute
    await new Promise(resolve => setTimeout(resolve, 10))
    const markers = container.querySelectorAll('.fntags-promise-marker')
    if (markers.length === 0) break
  }
}

/**
 * Serialize all registered states from the global fntags registry.
 *
 * @returns {Record<string, any>} Map of state ID to current value
 */
function serializeRegistry () {
  const registry = globalThis.__fntags_registry
  if (!registry) return {}
  const snapshot = {}
  for (const [id, state] of registry) {
    try {
      snapshot[id] = state()
    } catch (e) {
      // Skip states that can't be read
    }
  }
  return snapshot
}

/**
 * Render a fntags application to an HTML string.
 *
 * @param {object} options
 * @param {string} options.url The URL path to render (e.g. '/about')
 * @param {() => Node} options.appFn Function that returns the root element of the app
 * @param {string} [options.rootPath='/'] Root path prefix for routing
 * @param {number} [options.timeout=5000] Max ms to wait for async children
 * @param {string} [options.origin='http://localhost'] Origin for the URL
 * @returns {Promise<{ html: string, state: Record<string, any> }>}
 */
export async function renderToString (options) {
  const {
    url,
    appFn,
    rootPath = '/',
    timeout = 5000,
    origin = 'http://localhost'
  } = options

  const release = await acquireMutex()
  let cleanup
  let savedPathObservers, savedParamObservers

  try {
    // Clear any prior registry so states from a previous render don't leak
    const prevRegistry = globalThis.__fntags_registry
    globalThis.__fntags_registry = undefined

    const fullUrl = buildFullUrl(origin, rootPath, url)
    const env = setupEnv(fullUrl)
    cleanup = env.cleanup

    try {
      const { renderNode } = await import('@srfnstack/fntags')

      // If routing is used, reset pathState for this URL and save/restore observers
      try {
        const { pathState, pathParameters } = await import('@srfnstack/fntags/fnroute')
        if (pathState._ctx) savedPathObservers = pathState._ctx.observers.slice()
        if (pathParameters._ctx) savedParamObservers = pathParameters._ctx.observers.slice()
        pathState({
          rootPath: rootPath,
          currentPath: url,
          context: null
        })
      } catch (e) {
        // fnroute not available or not used - that's fine
      }

      // Render the app (await in case appFn is async)
      const container = globalThis.document.createElement('div')
      const result = typeof appFn === 'function' ? await appFn() : appFn
      container.appendChild(renderNode(result))

      // Wait for async children to resolve
      await awaitPromises(container, timeout)

      // Also drain any bindAs microtasks
      await new Promise(resolve => setTimeout(resolve, 0))

      // Serialize state
      const state = serializeRegistry()

      // Extract HTML
      const html = container.innerHTML

      return { html, state }
    } finally {
      // Restore route observers to prevent accumulation across renders
      try {
        const { pathState, pathParameters } = await import('@srfnstack/fntags/fnroute')
        if (savedPathObservers && pathState._ctx) pathState._ctx.observers = savedPathObservers
        if (savedParamObservers && pathParameters._ctx) pathParameters._ctx.observers = savedParamObservers
      } catch (e) {}
      cleanup()
      globalThis.__fntags_registry = prevRegistry
    }
  } finally {
    release()
  }
}

/**
 * Render a fntags application as a ReadableStream for streaming SSR.
 *
 * Synchronous content is flushed immediately. Promise-based children are
 * sent as inline <script> tags that replace their placeholders on the client.
 *
 * @param {object} options
 * @param {string} options.url The URL path to render
 * @param {() => Node} options.appFn Function that returns the root element
 * @param {string} [options.rootPath='/'] Root path prefix for routing
 * @param {number} [options.timeout=5000] Max ms to wait for async children
 * @param {string} [options.origin='http://localhost'] Origin for the URL
 * @returns {ReadableStream<string>}
 */
export function renderToStream (options) {
  const {
    url,
    appFn,
    rootPath = '/',
    timeout = 5000,
    origin = 'http://localhost'
  } = options

  let release
  let cleanup
  let prevRegistry
  let savedPathObservers, savedParamObservers

  return new ReadableStream({
    async start (controller) {
      release = await acquireMutex()

      try {
        prevRegistry = globalThis.__fntags_registry
        globalThis.__fntags_registry = undefined

        const fullUrl = buildFullUrl(origin, rootPath, url)
        const env = setupEnv(fullUrl)
        cleanup = env.cleanup

        try {
          const { renderNode } = await import('@srfnstack/fntags')

          try {
            const { pathState, pathParameters } = await import('@srfnstack/fntags/fnroute')
            if (pathState._ctx) savedPathObservers = pathState._ctx.observers.slice()
            if (pathParameters._ctx) savedParamObservers = pathParameters._ctx.observers.slice()
            pathState({
              rootPath: rootPath,
              currentPath: url,
              context: null
            })
          } catch (e) {
            // fnroute not used
          }

          const container = globalThis.document.createElement('div')
          const result = typeof appFn === 'function' ? await appFn() : appFn
          container.appendChild(renderNode(result))

          // Drain initial microtasks
          await new Promise(resolve => setTimeout(resolve, 0))

          // Check for promise placeholders
          const hasPlaceholders = container.querySelectorAll('.fntags-promise-marker').length > 0

          if (!hasPlaceholders) {
            controller.enqueue(container.innerHTML)
          } else {
            controller.enqueue(`<div id="fntags-ssr-shell">${container.innerHTML}</div>`)

            const deadline = Date.now() + timeout
            while (Date.now() < deadline) {
              await new Promise(resolve => setTimeout(resolve, 10))
              if (container.querySelectorAll('.fntags-promise-marker').length === 0) break
            }

            // JSON.stringify first (creates a JS string literal), then escapeScriptContent
            // (replaces < with \u003c in the source). The browser's JS parser interprets
            // \u003c as a Unicode escape → <, so innerHTML gets correct HTML.
            // Applying escapeScriptContent BEFORE JSON.stringify would double-escape:
            // the \ becomes \\ in JSON, and the browser sees literal \u003c text.
            controller.enqueue(
              `<script>document.getElementById("fntags-ssr-shell").innerHTML=${escapeScriptContent(JSON.stringify(container.innerHTML))}</script>`
            )
          }

          // Send state as a final chunk.
          // escapeScriptContent after JSON.stringify ensures \u003c is a JS Unicode escape.
          const state = serializeRegistry()
          if (Object.keys(state).length > 0) {
            controller.enqueue(
              `<script>window.__FNTAGS_SSR_STATE__=${escapeScriptContent(JSON.stringify(state))}</script>`
            )
          }

          controller.close()
        } catch (e) {
          controller.error(e)
        } finally {
          // Restore route observers
          try {
            const { pathState, pathParameters } = await import('@srfnstack/fntags/fnroute')
            if (savedPathObservers && pathState._ctx) pathState._ctx.observers = savedPathObservers
            if (savedParamObservers && pathParameters._ctx) pathParameters._ctx.observers = savedParamObservers
          } catch (e) {}
          if (cleanup) cleanup()
          globalThis.__fntags_registry = prevRegistry
        }
      } finally {
        release()
      }
    }
  })
}
