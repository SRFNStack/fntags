import { div, p } from './fntags.js'

import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection( 'Usage'
    ),
    p( `Routing is provided as a feature of the library. You define routes by first creating a router element, then routes within it.` ),
    prismCode( `
import { fnapp, fnlink, div, router, route, h3, img, routeSwitch } from './fntags.js'

const nav = div(
    fnlink( { to: '/' }, 'root' ),
    fnlink( { to: '/hello' }, 'hello' )
)

fnapp( document.body,
       nav,
       router(
           routeSwitch(
               route( { fnpath: '/', absolute: true }, 'rooooot' ),
               route( { fnpath: '/hello' }, 'world' ),
               route( { fnpath: '/.*' },
                      h3( '404 Page not found' ),
                      div( img( { src: 'http://placekitten.com/500/500' } ) )
               )
           )
       )
)
` ) )