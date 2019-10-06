import { div, p } from './fntags.js'

import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection( 'Route Elements',
                    'Routes are created by using the fntags route element. They have a single required attribute, path.',
                    'By default, fntags will route from the html file that first loads it, typically index.html.',
                    'To make deep linking work, call setRootPath from fntags.js with the path you want to serve the app from, typically \'/\''
    ),
    prismCode( `
import { fnapp, fnlink, div, router, route, h3, img, routeSwitch } from './fntags.js'

const nav = div(
    fnlink( { to: '/' }, 'root' ),
    fnlink( { to: '/hello' }, 'hello' )
)

fnapp( document.body,
           routeSwitch(
               route( { path: '/', absolute: true }, 'rooooot' ),
               route( { path: '/hello' }, 'world' ),
               route( { path: '/.*' },
                      h3( '404 Page not found' ),
                      div( img( { src: 'http://placekitten.com/500/500' } ) )
               )
           )
       )
)
` ) )