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

function stripParameterValues (currentRoute) {
  return removeTrailingSlash(currentRoute.substring(1)).split('/').reduce((res, part) => {
    const paramStart = part.indexOf(':')
    let value = part
    if (paramStart > -1) {
      value = part.substring(0, paramStart)
    }
    return `${res}/${value}`
  }, '')
}

const moduleCache = {}

/**
 * The main function of this library. It will load the route at the specified path and render it into the container element.
 * @param {object} options
 * @param {string} options.routePath The path to the root of the routes. This is used to resolve the paths of the routes.
 * @param {object} options.attrs The attributes of the container element
 * @param {(error: Error, newPathState: object)=>void|Node} options.onerror A function that will be called if the route fails to load. The function receives the error and the current pathState object. Should return an error to display if it's not handled.
 * @param {(node: Node, module: object)=>Node} options.frame A function that will be called with the rendered route element and the module that was loaded. The function should return a new element to be rendered.
 * @param {boolean} options.sendRawPath If true, the raw path will be sent to the route. Otherwise, the path will be stripped of parameter values.
 * @param {(path: string)=>string} options.formatPath A function that will be called with the raw path before it is used to load the route. The function should return a new path.
 * @return {HTMLElement} The container element
 */
export function modRouter ({ routePath, attrs, onerror, frame, sendRawPath, formatPath }) {
  const container = h('div', attrs || {})
  if (!routePath) {
    throw new Error('You must provide a root url for modRouter. Routes in the ui will be looked up relative to this url.')
  }
  const loadRoute = (newPathState) => {
    let path = newPathState.currentRoute
    if (!sendRawPath) {
      path = stripParameterValues(newPathState.currentRoute)
    }
    if (typeof formatPath === 'function') {
      path = formatPath(path)
    }
    const filePath = path ? routePath + ensureOnlyLeadingSlash(path) : routePath

    const p = moduleCache[filePath]
      ? Promise.resolve(moduleCache[filePath])
      : import(filePath).then(m => {
        moduleCache[filePath] = m
        return m
      })

    p.then(module => {
      const route = module.default
      if (route) {
        while (container.firstChild) {
          container.removeChild(container.firstChild)
        }
        let node = renderNode(route)
        if (typeof frame === 'function') {
          node = renderNode(frame(node, module))
        }
        if (node) {
          container.append(node)
        }
      }
    })
      .catch(err => {
        while (container.firstChild) {
          container.removeChild(container.firstChild)
        }
        if (typeof onerror === 'function') {
          err = onerror(err, newPathState)
          if (err) {
            container.append(err)
          }
        } else {
          console.error('Failed to load route: ', err)
          container.append('Failed to load route.')
        }
      })
  }
  listenFor(afterRouteChange, loadRoute)
  updatePathParameters()
  loadRoute(pathState())
  return container
}

function updatePathParameters () {
  const path = pathState().currentRoute
  const pathParts = path.split('/')

  const parameters = {
    idx: []
  }
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i]
    const paramStart = part.indexOf(':')
    if (paramStart > -1) {
      const paramName = part.substring(0, paramStart)
      const paramValue = part.substring(paramStart + 1)
      parameters.idx.push(paramValue)
      if (paramName) {
        parameters[paramName] = paramValue
      }
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
  let context = null
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
 * A function to navigate to the specified route
 * @param {string} route The route to navigate to
 * @param {any} context Data related to the route change
 * @param {boolean} replace Whether to replace the state or push it. pushState is used by default.
 * @param {boolean} silent Prevent route change events from being emitted for this route change
 */
export function goTo (route, context, replace = false, silent = false) {
  const newPath = window.location.origin + makePath(route)

  const patch = {
    currentRoute: route.split(/[#?]/)[0],
    context
  }

  const oldPathState = pathState()
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
    pathState.assign({
      currentRoute: route.split(/[#?]/)[0],
      context
    })
    updatePathParameters()
    if (!silent) {
      emit(afterRouteChange, newPathState, oldPathState)
    }
    if (newPath.indexOf('#') > -1) {
      const el = document.getElementById(decodeURIComponent(newPath.split('#')[1]))
      el && el.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
    if (!silent) {
      emit(routeChangeComplete, newPathState, oldPathState)
    }
  })
}

const ensureOnlyLeadingSlash = (part) => removeTrailingSlash(part.startsWith('/') ? part : '/' + part)

const removeTrailingSlash = part => part.endsWith('/') && part.length > 1 ? part.slice(0, -1) : part

/**
 * Key value pairs of path parameter names to their values
 * @typedef {Object} PathParameters
 */

/**
 * The path parameters of the current route
 * @type {import("./fntags.mjs").FnState<PathParameters>}
 */
export const pathParameters = fnstate({})

/**
 * The path information for a route
 * @typedef {{currentRoute: string, rootPath: string, context: any}} PathState
 */

/**
 * The current path state
 * @type {import("./fntags.mjs").FnState<PathState>}
 */
export const pathState = fnstate(
  {
    rootPath: ensureOnlyLeadingSlash(window.location.pathname),
    currentRoute: ensureOnlyLeadingSlash(window.location.pathname),
    context: null
  })

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
 * @param event a string event to listen for
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
    currentRoute: ensureOnlyLeadingSlash(window.location.pathname.replace(new RegExp('^' + rootPath), '')) || '/'
  })
}

window.addEventListener(
  'popstate',
  () => {
    const oldPathState = pathState()
    const patch = {
      currentRoute: ensureOnlyLeadingSlash(window.location.pathname.replace(new RegExp('^' + pathState().rootPath), '')) || '/'
    }
    const newPathState = Object.assign({}, oldPathState, patch)
    try {
      emit(beforeRouteChange, newPathState, oldPathState)
    } catch (e) {
      console.trace('Path change cancelled', e)
      goTo(oldPathState.currentRoute, oldPathState.context, true, true)
      return
    }
    pathState.assign(patch)
    updatePathParameters()
    emit(afterRouteChange, newPathState, oldPathState)
    emit(routeChangeComplete, newPathState, oldPathState)
  }
)

const makePath = path => (pathState().rootPath === '/' ? '' : pathState().rootPath) + ensureOnlyLeadingSlash(path)

const shouldDisplayRoute = (route, isAbsolute) => {
  const path = makePath(route)
  const currPath = window.location.pathname
  if (isAbsolute) {
    return currPath === path || currPath === (path + '/') || currPath.match((path).replace(/\/\$[^/]+(\/?)/g, '/[^/]+$1') + '$')
  } else {
    const pattern = path.replace(/\/\$[^/]+(\/|$)/, '/[^/]+$1').replace(/^(.*)\/([^/]*)$/, '$1/?$2([/?#]|$)')
    return !!currPath.match(pattern)
  }
}
