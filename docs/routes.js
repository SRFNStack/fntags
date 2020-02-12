import build from './build.js'
import home from './home.js'
import state from './state.js'
import fourOhFore from './404.js'
import routing from './routing.js'
import tutorial from './tutorial.js'

import { fnbind, fnlink, pathState, route } from './fntags.js'
import { secondaryColor } from './constants.js'

const routes = [
    { url: '/', component: home, absolute: true },
    { url: '/build', linkText: 'Build', component: build },
    { url: '/tutorial', linkText: 'Tutorial', component: tutorial },
    { url: '/state', linkText: 'State', component: state },
    { url: '/routing', linkText: 'Routing', component: routing },

    // {url: "/reference", linkText: 'Reference', component: reference},
    { url: '.*', component: fourOhFore }
]

export const routeElements = () => routes.map( ( r ) => route( { path: r.url, absolute: !!r.absolute }, r.component ) )
export const routeNavItems = () =>
    routes
        .filter( r => r.linkText )
        .map(
            ( r ) => fnbind( pathState, () =>
                fnlink( {
                            to: r.url,
                            style: {
                                cursor: 'pointer',
                                padding: '12px',
                                'font-weight': 400,
                                'font-size': '18px',
                                'text-decoration': 'none',
                                color: pathState.info.currentRoute.startsWith( r.url ) ? secondaryColor : 'inherit'
                            }
                        },
                        r.linkText
                )
            )
        )