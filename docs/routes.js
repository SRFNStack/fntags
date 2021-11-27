import components from './components.js'
import home from './home.js'
import state from './state.js'
import routing from './routing.js'
// import tutorial from './tutorial.js'

import { fnlink, pathState, route } from './lib/fnroute.mjs'
import { secondaryColor } from './constants.js'

const routes = [
  { url: '/', component: home, absolute: true },
  { url: '/components', linkText: 'Components', component: components },
  // { url: '/tutorial', linkText: 'Tutorial', component: tutorial },
  { url: '/state', linkText: 'State', component: state },
  { url: '/routing', linkText: 'Routing', component: routing },

  // {url: "/reference", linkText: 'Reference', component: reference},
  { url: '.*', component: home }
]

export const routeElements = () => routes.map((r) => route({ path: r.url, absolute: !!r.absolute }, r.component))
export const routeNavItems = () =>
  routes
    .filter(r => r.linkText)
    .map(
      (r) => pathState.bindAs(() =>
        fnlink({
          id: r.linkText + '-link',
          to: r.url,
          style: {
            cursor: 'pointer',
            padding: '12px',
            'font-weight': 400,
            'font-size': '18px',
            'text-decoration': 'none',
            color: pathState().currentRoute.startsWith(r.url) ? secondaryColor : 'inherit'
          }
        },
        r.linkText
        )
      )
    )
