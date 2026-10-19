/// <reference path="fntags.mjs" name="fntags"/>
/**
 * @module fnroute
 */
import { fnstate, getAttrs, h, isAttrs, renderNode } from './fntags.mjs'

/**
 * An element that is displayed only if the current route starts with elements path attribute.
 *
 * For example,
 *  route({path: "/proc"},
 *      div(
 *          "proc",
 *          div({path: "/cpuinfo"},
 *              "cpuinfo"
 *              )
 *          )
 *      )
 *
 *  You can override this behavior by setting the attribute, absolute to any value
 *
 *  route({path: "/usr"},
 *      div(
 *          "proc",
 *          div({path: "/cpuinfo", absolute: true},
 *              "cpuinfo"
 *              )
 *          )
 *      )
 *
 * @param {(Object|Node)[]} children The attributes and children of this element.
 * @returns {HTMLDivElement} A div element that will only be displayed if the current route starts with the path attribute.
 */
export function route (...children) {
  const attrs = getAttrs(children)
  children = children.filter(c => !isAttrs(c))
  const routeEl = h('div', attrs)
  const display = routeEl.style.display
  const path = routeEl.getAttribute('path')
  if (!path) {
    throw new Error('route must have a string path attribute')
  }
  routeEl.updateRoute = () => {
    while (routeEl.firstChild) {
      routeEl.removeChild(routeEl.firstChild)
    }
    // this forces a re-render on route change
    routeEl.append(...children.map(c => renderNode(typeof c === 'function' ? c() : c)))
    routeEl.style.display = display
  }
  return routeEl
}

/**
 * An element that only renders the first route that matches and updates when the route is changed
 * The primary purpose of this element is to provide catchall routes for not found pages and path variables
 * @param {(Object|Node)[]} children
 * @returns {Node|(()=>Node)}
 */
export function routeSwitch (...children) {
  const sw = h('div', getAttrs(children))

  return pathState.bindAs(
    () => {
      while (sw.firstChild) {
        sw.removeChild(sw.firstChild)
      }
      for (const child of children) {
        const path = child.getAttribute('path')
        if (path) {
          const shouldDisplay = shouldDisplayRoute(path, !!child.absolute || child.getAttribute('absolute') === 'true')
          if (shouldDisplay) {
            routeState.currentRoute = path
            updatePathParameters()
            child.updateRoute(true)
            sw.append(child)
            return sw
          }
        }
      }
    }
  )
}

function updatePathParameters () {
  const path = routeState.currentRoute
  const currentPath = pathState().currentPath
  const pathParts = path.split('/')
  const currentPathParts = currentPath.split('/')

  const parameters = {
    idx: []
  }
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i]
    if (part.startsWith(':')) {
      parameters[part.substring(1)] = currentPathParts[i]
    }
  }
  pathParameters(parameters)
}

/**
 * A link element that is a link to another route in this single page app
 * @param {(Object|Node)[]} children The attributes of the anchor element and any children
 * @returns {HTMLAnchorElement} An anchor element that will navigate to the specified route when clicked
 */
export function fnlink (...children) {
  let context
  if (children[0] && children[0].context) {
    context = children[0].context
  }
  const a = h('a', ...children)

  const to = a.getAttribute('to')
  if (!to) {
    throw new Error('fnlink must have a "to" string attribute').stack
  }
  a.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    goTo(to, context)
  })
  a.setAttribute(
    'href',
    makePath(to)
  )
  return a
}

/**
 * A function to navigate to the specified route.
 *
 * Navigating to the current path with only a different hash or query (for example from /docs to /docs#faq)
 * and no new context is not a route change: the history entry is updated and the hash target is scrolled
 * into view, but the route is not re-rendered and no route events are emitted.
 * @param {string} route The route to navigate to
 * @param {any} [context] Data related to the route change
 * @param {boolean} replace Whether to replace the state or push it. pushState is used by default.
 * @param {boolean} silent Prevent route change events from being emitted for this route change
 */
export function goTo (route, context, replace = false, silent = false) {
  const newPath = window.location.origin + makePath(route)
  const hash = newPath.indexOf('#') > -1 ? newPath.split('#')[1] : null
  const oldPathState = pathState()
  const currentPath = ensureOnlyLeadingSlash(route.split(/[#?]/)[0])

  if (currentPath === oldPathState.currentPath && context === undefined) {
    if (replace) {
      history.replaceState({}, route, newPath)
    } else {
      history.pushState({}, route, newPath)
    }
    scrollToHash(hash)
    return
  }

  const patch = {
    currentPath,
    context: context === undefined ? {} : context
  }
  const newPathState = Object.assign({}, oldPathState, patch)
  if (!silent) {
    try {
      emit(beforeRouteChange, newPathState, oldPathState)
    } catch (e) {
      console.log('Path change cancelled', e)
      return
    }
  }
  if (replace) {
    history.replaceState({}, route, newPath)
  } else {
    history.pushState({}, route, newPath)
  }

  setTimeout(() => {
    pathState.assign(patch)
    if (!silent) {
      emit(afterRouteChange, newPathState, oldPathState)
    }
    scrollToHash(hash)
    if (!silent) {
      emit(routeChangeComplete, newPathState, oldPathState)
    }
  })
}

let cancelPendingScroll = null

/**
 * Scroll the element whose id matches the hash into view. If the element does not exist yet, for example because
 * the route's content is a promise that has not resolved, wait for it to be added to the document and scroll then.
 * With no hash, scroll to the top of the page.
 * @param {string|null|undefined} hash The hash to scroll to, with or without the leading #
 * @param {number} [timeout] How long to wait for the element to appear, in milliseconds
 */
export function scrollToHash (hash, timeout = 5000) {
  if (cancelPendingScroll) {
    cancelPendingScroll()
  }
  const id = hash ? decodeURIComponent(hash.startsWith('#') ? hash.slice(1) : hash) : ''
  if (!id) {
    window.scrollTo(0, 0)
    return
  }
  const scrollIfPresent = () => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView()
    }
    return !!el
  }
  if (scrollIfPresent() || typeof MutationObserver === 'undefined') {
    return
  }
  const observer = new MutationObserver(() => {
    if (scrollIfPresent()) {
      cancelPendingScroll()
    }
  })
  const timer = setTimeout(() => cancelPendingScroll(), timeout)
  cancelPendingScroll = () => {
    observer.disconnect()
    clearTimeout(timer)
    cancelPendingScroll = null
  }
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

const ensureOnlyLeadingSlash = (part) => removeTrailingSlash(part.startsWith('/') ? part : '/' + part)

const removeTrailingSlash = part => part.endsWith('/') && part.length > 1 ? part.slice(0, -1) : part

/**
 * Key value pairs of path parameter names to their values
 * @typedef {Object} PathParameters
 */

/**
 * The path parameters of the current route
 * @type {import('./fntags.mjs').FnState<PathParameters>}
 */
export const pathParameters = fnstate({})

/**
 * The path information for a route
 * @typedef {{currentPath: string, rootPath: string, context: any}} PathState
 */

/**
 * The current path state
 * @type {import('./fntags.mjs').FnState<PathState>}
 */
export const pathState = fnstate(
  {
    rootPath: ensureOnlyLeadingSlash(window.location.pathname),
    currentPath: ensureOnlyLeadingSlash(window.location.pathname),
    context: null
  })

const routeState = {
  currentRoute: null
}

/**
 * @typedef {string} RouteEvent
 */
/**
 * Before the route is changed
 * @type {RouteEvent}
 */
export const beforeRouteChange = 'beforeRouteChange'
/**
 * After the route is changed
 * @type {RouteEvent}
 */
export const afterRouteChange = 'afterRouteChange'
/**
 * After the route is changed and the route element is rendered
 * @type {RouteEvent}
 */
export const routeChangeComplete = 'routeChangeComplete'
const eventListeners = {
  [beforeRouteChange]: [],
  [afterRouteChange]: [],
  [routeChangeComplete]: []
}

const emit = (event, newPathState, oldPathState) => {
  for (const fn of eventListeners[event]) fn(newPathState, oldPathState)
}

/**
 * Listen for routing events
 * @param {string} event a string event to listen for
 * @param handler A function that will be called when the event occurs.
 *                  The function receives the new and old pathState objects, in that order.
 * @return {()=>void} a function to stop listening with the passed handler.
 */
export function listenFor (event, handler) {
  if (!eventListeners[event]) {
    throw new Error(`Invalid event. Must be one of ${Object.keys(eventListeners)}`)
  }
  eventListeners[event].push(handler)
  return () => {
    const i = eventListeners[event].indexOf(handler)
    if (i > -1) {
      return eventListeners[event].splice(i, 1)
    }
  }
}

/**
 * Set the root path of the app. This is necessary to make deep linking work in cases where the same html file is served from all paths.
 * @param {string} rootPath The root path of the app
 */
export function setRootPath (rootPath) {
  return pathState.assign({
    rootPath: ensureOnlyLeadingSlash(rootPath),
    currentPath: ensureOnlyLeadingSlash(window.location.pathname.replace(new RegExp('^' + rootPath), '')) || '/'
  })
}

window.addEventListener(
  'popstate',
  () => {
    const oldPathState = pathState()
    const patch = {
      currentPath: ensureOnlyLeadingSlash(window.location.pathname.replace(new RegExp('^' + pathState().rootPath), '')) || '/'
    }
    // Clicking <a href="#section"> and moving back/forward between hash entries fire popstate without
    // changing the path. That is not a route change, so leave the rendered route alone and let the
    // browser handle scrolling to the fragment.
    if (patch.currentPath === oldPathState.currentPath) {
      return
    }
    const newPathState = Object.assign({}, oldPathState, patch)
    try {
      emit(beforeRouteChange, newPathState, oldPathState)
    } catch (e) {
      console.trace('Path change cancelled', e)
      goTo(oldPathState.currentPath, oldPathState.context, true, true)
      return
    }
    pathState.assign(patch)
    emit(afterRouteChange, newPathState, oldPathState)
    emit(routeChangeComplete, newPathState, oldPathState)
  }
)

// On initial load the browser only scrolls to the hash if the target already exists. When the target is inside
// a route whose content has not rendered yet, wait for it the same way goTo does.
if (window.location.hash && !document.getElementById(decodeURIComponent(window.location.hash.slice(1)))) {
  scrollToHash(window.location.hash)
}

const makePath = path => (pathState().rootPath === '/' ? '' : pathState().rootPath) + ensureOnlyLeadingSlash(path)

const makePathPattern = (path, absolute) => {
  const pathParts = path.replace(/[?#].*/, '').replace(/\/$/, '').split('/')
  return '^' + pathParts.map(part => {
    if (part.startsWith(':')) {
      return '([^/]+)'
    } else {
      return part
    }
  }).join('/') + (absolute ? '/?$' : '(/.*|$)')
}

const shouldDisplayRoute = (route, isAbsolute) => {
  const path = makePath(route)
  const currPath = window.location.pathname
  const pattern = makePathPattern(path, isAbsolute)
  if (isAbsolute) {
    return currPath === path || currPath === (path + '/') || currPath.match(pattern)
  } else {
    return !!currPath.match(pattern)
  }
}
