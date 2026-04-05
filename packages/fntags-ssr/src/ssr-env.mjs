/**
 * @module ssr-env
 *
 * Manages a happy-dom Window environment on globalThis for server-side rendering.
 * Provides a mutex to ensure only one render runs at a time (since globals are shared).
 */

import { Window } from 'happy-dom'

let mutexQueue = Promise.resolve()

/**
 * Acquire an exclusive lock for rendering. Returns a release function.
 * @returns {Promise<() => void>}
 */
function acquireMutex () {
  let release
  const prev = mutexQueue
  mutexQueue = new Promise(resolve => { release = resolve })
  return prev.then(() => release)
}

const GLOBAL_KEYS = [
  'window', 'document', 'history', 'location',
  'HTMLElement', 'HTMLDivElement', 'HTMLSpanElement', 'HTMLAnchorElement',
  'HTMLInputElement', 'HTMLButtonElement', 'HTMLFormElement',
  'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLImageElement',
  'Node', 'Element', 'Text', 'Event', 'CustomEvent', 'MouseEvent',
  'KeyboardEvent', 'MutationObserver', 'SVGElement',
  'DocumentFragment', 'NodeList', 'HTMLCollection'
]

/**
 * Set up a happy-dom environment on globalThis for the given URL.
 *
 * @param {string} url Full URL to set (e.g. 'http://localhost/about')
 * @returns {{ cleanup: () => void, window: Window }} cleanup function and the Window instance
 */
export function setupEnv (url) {
  const saved = {}
  for (const key of GLOBAL_KEYS) {
    const desc = Object.getOwnPropertyDescriptor(globalThis, key)
    if (desc) {
      saved[key] = { desc }
    }
  }

  const win = new Window({
    url,
    settings: {
      // Disable all resource loading to prevent SSRF.
      // SSR only needs DOM serialization — it should never fetch external JS, CSS, or iframe content.
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      disableIframePageLoading: true,
      // Treat disabled file loading as success so <link>/<script> elements
      // don't cause errors in the app's component tree.
      handleDisabledFileLoadingAsSuccess: true,
      // Disable navigation to prevent happy-dom from following links or redirects.
      navigation: {
        disableMainFrameNavigation: true,
        disableChildFrameNavigation: true,
        disableChildPageNavigation: true
      }
    }
  })

  function trySet (key, value) {
    try {
      const desc = Object.getOwnPropertyDescriptor(globalThis, key)
      if (desc && !desc.writable && !desc.set) {
        Object.defineProperty(globalThis, key, {
          value,
          writable: true,
          configurable: true
        })
      } else {
        globalThis[key] = value
      }
    } catch (e) {
      // Skip properties that can't be overwritten (e.g. navigator in some environments)
    }
  }

  // Install happy-dom globals
  trySet('window', win)
  trySet('document', win.document)
  trySet('history', win.history)
  trySet('location', win.location)

  // Install DOM constructors that fntags or user code might reference
  const skipKeys = { window: 1, document: 1, history: 1, location: 1 }
  for (const key of GLOBAL_KEYS) {
    if (!(key in skipKeys) && win[key] !== undefined) {
      trySet(key, win[key])
    }
  }

  const cleanup = () => {
    for (const key of GLOBAL_KEYS) {
      try {
        if (key in saved) {
          Object.defineProperty(globalThis, key, saved[key].desc)
        } else {
          delete globalThis[key]
        }
      } catch (e) {
        // Skip non-configurable properties
      }
    }
    try { win.close() } catch (e) {}
  }

  return { cleanup, window: win }
}

export { acquireMutex }
