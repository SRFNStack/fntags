/**
 * @module hydrate
 *
 * Client-side hydration for fntags SSR.
 * Restores server-rendered state and re-attaches event listeners
 * by re-executing the component tree against the existing DOM.
 */

import { renderNode, registeredState } from '@srfnstack/fntags'

/**
 * Hydrate a server-rendered container with a live fntags application.
 *
 * Reads the state snapshot injected by the server (from window.__FNTAGS_SSR_STATE__),
 * pre-populates the state registry, then re-renders the app to attach event listeners
 * and reactive bindings.
 *
 * @param {HTMLElement} container The DOM element containing server-rendered HTML
 * @param {(() => Node) | Node} appFn Function that returns the app root, or the root element itself
 */
export function hydrate (container, appFn) {
  // Restore state from server snapshot
  const snapshot = window.__FNTAGS_SSR_STATE__
  if (snapshot) {
    const parsed = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot
    for (const [id, value] of Object.entries(parsed)) {
      // registeredState returns existing state if already created,
      // or creates a new one with the server value as the initial value.
      // If the app's module-level code already called registeredState(id, defaultValue),
      // we need to update it with the server value.
      const state = registeredState(id, value)
      // If the state was already created with a default, overwrite with server value
      if (state() !== value) {
        state(value)
      }
    }
  }

  // Re-render the app to create live DOM with event listeners and subscriptions
  const result = typeof appFn === 'function' ? appFn() : appFn

  // Replace the server HTML with the live tree
  container.innerHTML = ''
  container.appendChild(renderNode(result))
}
