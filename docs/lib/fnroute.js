import { fnstate, getAttrs, h, isAttrs, renderNode } from './fntags.js'

/**
 * An element that is displayed only if the the current route starts with elements path attribute.
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
 * @param children The attributes and children of this element.
 * @returns HTMLDivElement
 */
export const route = ( ...children ) => {
    const attrs = getAttrs( children )
    children = children.filter( c => !isAttrs( c ) )
    const routeEl = h( 'div', attrs )
    const display = routeEl.style.display
    let path = routeEl.getAttribute( 'path' )
    let absolute = !!routeEl.absolute || routeEl.getAttribute( 'absolute' ) === 'true'
    if( !path ) {
        throw new Error( 'route must have a string path attribute' ).stack
    }
    const update = () => {
        if( shouldDisplayRoute( path, absolute ) ) {
            pathParameters( extractPathParameters( path ) )
            while( routeEl.firstChild ) {
                routeEl.removeChild( routeEl.firstChild )
            }
            //this forces a re-render on route change
            routeEl.append( ...children.map( c => renderNode( typeof c === 'function' ? c() : c ) ) )
            routeEl.style.display = display
        } else {
            routeEl.style.display = 'none'
        }
    }
    update()
    return pathState.bindAs( routeEl, update )
}

function extractPathParameters( path ) {
    let pathParts = path.split( '/' )
    let currentParts = pathState().currentRoute.split( '/' )
    let parameters = {}
    for( let i = 0; i < pathParts.length; i++ ) {
        if( pathParts[ i ].startsWith( '$' ) ) {
            parameters[ pathParts[ i ].substr( 1 ) ] = currentParts[ i ]
        }
    }
    return parameters
}

/**
 * A link component that is a link to another route in this single page app
 * @param children The attributes of the anchor element and any children
 */
export const fnlink = ( ...children ) => {
    let context = null
    if( children[ 0 ] && children[ 0 ].context ) {
        context = children[ 0 ].context
    }
    let a = h( 'a', ...children )

    let to = a.getAttribute( 'to' )
    if( !to ) {
        throw new Error( 'fnlink must have a "to" string attribute' ).stack
    }
    a.addEventListener( 'click', ( e ) => {
        e.preventDefault()
        goTo( to, context )
    } )
    a.setAttribute(
        'href',
        pathState().rootPath + ensureOnlyLeadingSlash( to )
    )
    return a
}

/**
 * A function to navigate to the specified route
 * @param route The route to navigate to
 * @param context Data related to the route change
 */
export const goTo = ( route, context ) => {
    let newPath = window.location.origin + pathState().rootPath + ensureOnlyLeadingSlash( route )
    history.pushState( {}, route, newPath )
    pathState.patch( {
                         currentRoute: route.split( /[#?]/ )[ 0 ],
                         context
                     } )

    if( newPath.indexOf( '#' ) > -1 ) {
        const el = document.getElementById( decodeURIComponent( newPath.split( '#' )[ 1 ] ) )
        el && el.scrollIntoView()
    } else {
        window.scrollTo( 0, 0 )
    }
}

/**
 * An element that only renders the first route that matches and updates when the route is changed
 * The primary purpose of this element is to provide catchall routes for not found pages and path variables
 * @param children
 */
export const routeSwitch = ( ...children ) => {
    const sw = h( 'div', getAttrs( children ) )

    return pathState.bindAs(
        () => {
            while( sw.firstChild ) {
                sw.removeChild( sw.firstChild )
            }
            for( let child of children ) {
                const rendered = renderNode( child )
                if( rendered.getAttribute( 'path' ) ) {
                    if( shouldDisplayRoute( rendered.getAttribute( 'path' ), !!rendered.absolute || rendered.getAttribute( 'absolute' ) === 'true' ) ) {
                        sw.append( rendered )
                        return sw
                    }
                }
            }
        }
    )
}

const ensureOnlyLeadingSlash = ( part ) => {
    part = part.startsWith( '/' ) ? part : '/' + part
    return part.endsWith( '/' ) ? part.slice( 0, -1 ) : part
}

export const pathParameters = fnstate( {} )

export const pathState = fnstate(
    {
        rootPath: ensureOnlyLeadingSlash( window.location.pathname ),
        currentRoute: ensureOnlyLeadingSlash( window.location.pathname ),
        context: null
    } )

/**
 * Set the root path of the app. This is necessary to make deep linking work in cases where the same html file is served from all paths.
 */
export const setRootPath = ( rootPath ) => pathState.patch(
    {
        rootPath: ensureOnlyLeadingSlash( rootPath ),
        currentRoute: ensureOnlyLeadingSlash( window.location.pathname.replace( rootPath, '' ) ) || '/'
    }
)

window.addEventListener( 'popstate', () =>
    pathState.patch( {
                         currentRoute: ensureOnlyLeadingSlash( window.location.pathname.replace( pathState().rootPath, '' ) ) || '/'
                     }
    )
)

const shouldDisplayRoute = ( route, isAbsolute ) => {
    let path = pathState().rootPath + ensureOnlyLeadingSlash( route )
    const currPath = window.location.pathname
    if( isAbsolute ) {
        return currPath === path || currPath === ( path + '/' )
    } else {
        const pattern = path.replace( /\/\$[^/]+(\/|$)/, '/[^/]+$1' ).replace( /^(.*)\/([^\/]*)$/, '$1/?$2([/?#]|$)' )
        return !!currPath.match( pattern )
    }

}