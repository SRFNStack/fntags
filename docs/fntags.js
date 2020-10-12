/**
 * A helper function that will append the given children to the given root element
 * @param root Either an element id string or an element itself
 * @param children The children to append to the root element
 */
export const fnapp = ( root, ...children ) => {
    if( typeof root === 'string' ) {
        root = document.getElementById( root )
        if( !root ) throw new Error( `No such element with id ${root}` ).stack
    }
    if( !isNode( root ) ) throw new Error( 'Invalid root element' ).stack
    root.append( ...children.map( c => renderNode( c ) ) )
}

/**
 * Check if a value is an dom node
 * @param el
 * @returns {boolean}
 */
export const isNode = ( el ) => el instanceof Node

/**
 * Create a state object that can be bound to.
 * @param initialValue The initial state
 * @returns function A function that can be used to get and set the state
 */
export const fnstate = ( initialValue ) => {
    let childStates = []
    let observers = []
    const boundContexts = []
    const proxyArray = ( value ) => {
        if( Array.isArray( value ) ) {
            childStates = value.map( fnstate )
            return new Proxy( value, {
                set( target, p, value ) {
                    if( childStates[ p ] ) childStates[ p ]( value )
                    else {
                        let newState = fnstate( value )
                        childStates[ p ] = newState
                        boundContexts.forEach( ctx => {
                            if( ctx.update ) {
                                newState.subscribe( () => ctx.update( ctx.boundElement ) )
                            } else {
                                let boundElement = replaceOnUpdate( newState, () => ctx.element( value ) )

                                ctx.boundElement[ p ] = boundElement
                                let closerToZero = Math.abs( 0 - p ) < Math.abs( ctx.boundElement.length - p )
                                for( let i = p; closerToZero && i < ctx.boundElement.length || i >= 0; closerToZero ? i++ : i-- ) {
                                    if( ctx.boundElement[ i ].parent ) {
                                        if( closerToZero )
                                            ctx.boundElement[ i ].insertBefore( boundElement )
                                        else
                                            ctx.boundElement[ i ].insertAfter( boundElement )
                                    }
                                }
                            }
                        } )
                    }
                    return Reflect.set( ...arguments )
                },
                deleteProperty( target, p ) {
                    if( childStates[ p ] ) {
                        boundContexts.forEach( ctx => {
                            ctx.boundElement[ p ].replaceWith( '' )
                            delete ctx.boundElement[ p ]
                        } )
                        delete childStates[ p ]
                    }
                    return Reflect.deleteProperty( ...arguments )
                }
            } )
        } else
            return value
    }

    let currentValue = proxyArray( initialValue )

    const state = function( newState ) {
        if( arguments.length === 0 ) {
            return currentValue
        } else {
            currentValue = proxyArray( newState )
            for( let observer of observers ) {
                observer( newState )
            }
        }
        return newState
    }

    const replaceOnUpdate = ( st, element ) => {
        let current = renderNode( element() )
        tagNode( current )

        st.subscribe( () => {
            let newElement = renderNode( element() )
            if( newElement ) {
                tagNode( newElement )
                if( getElId( current ) !== getElId( newElement ) ) {
                    current.replaceWith( newElement )
                    current = newElement
                }
            }
        } )
        return current
    }

    /**
     * Bind this state to the given element
     *
     * @param element The element to bind to, if not a function, an update function must be passed
     * @param update If passed this will be executed directly when the state changes with no other intervention
     * @returns {(HTMLDivElement|Text)[]|HTMLDivElement|Text}
     */
    state.bindAs = ( element, update ) => {
        if( typeof element !== 'function' && !update )
            throw new Error( 'You must pass an update function when passing a non function element' )
        let boundElement
        if( update ) {
            boundElement = renderNode( typeof element === 'function' ? element( currentValue ) : element );
            [...childStates, state].forEach( st => st.subscribe( () => update( boundElement ) ) )
        } else {
            if( Array.isArray( currentValue ) ) {
                boundElement = childStates.map(
                    childState =>
                        replaceOnUpdate( childState, () => element( childState() ) )
                )
            } else {
                boundElement = replaceOnUpdate( state, () => element( currentValue ) )
            }
        }
        boundContexts.push( { element, update, boundElement } )
        return boundElement
    }

    state.patch = ( update ) => state( Object.assign( currentValue, update ) )

    state.subscribe = ( callback ) => observers.push( callback )

    state.reset = ( reInit ) => {
        observers = []
        if( reInit ) currentValue = initialValue
    }

    return state
}

/**
 * Convert non dom nodes to text nodes and allow promises to resolve to nodes
 */
export const renderNode = ( node ) => {
    if( isNode( node ) ) {
        return node
    } else if( Promise.resolve( node ) === node ) {
        const node = marker()
        node.then( el => node.replaceWith( renderNode( el ) ) ).catch( e => console.error( 'Caught failed node promise.', e ) )
        return node
    } else {
        return document.createTextNode( node + '' )
    }
}

let lastId = 0
const fntag = '_fninfo'

const tagNode = ( el ) => {
    if( !el.hasOwnProperty( fntag ) ) {
        Object.defineProperty( el, fntag, {
            value: { id: lastId++ },
            enumerable: false,
            writable: false
        } )
    }
}

const getTag = ( el ) => el[ fntag ]
const isTagged = ( el ) => el && el.hasOwnProperty( fntag )
const getElId = ( el ) => isTagged( el ) && getTag( el ).id

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

/**
 * A function to create dom elements with the given attributes and children.
 * If an argument is a non-node object it is considered an attributes object, attributes are combined with Object.assign in the order received.
 * All standard html attributes can be passed, as well as any other property.
 * Strings are added as attributes via setAttribute, functions are added as event listeners, other types are set as properties.
 *
 * The rest of the arguments will be considered children of this element and appended to it in the same order as passed.
 *
 * @param tag html tag to use when created the element
 * @param children optional attrs and children for the element
 * @returns HTMLElement an html element
 *

 */
export const h = ( tag, ...children ) => {
    let element = document.createElement( tag )
    if( children ) {
        for( let child of children ) {
            if( isAttrs( child ) ) {
                for( let a in child ) {
                    let attr = child[ a ]
                    if( a === 'style' && typeof attr === 'object' ) {
                        for( let style in attr ) {
                            let match = attr[ style ].toString().match( /(.*)\W+!important\W*$/ )
                            if( match )
                                element.style.setProperty( style, match[ 1 ], 'important' )
                            else
                                element.style.setProperty( style, attr[ style ] )
                        }
                    } else if( a === 'value' ) {
                        //value is always a an attribute because setting it as a property causes problems
                        element.setAttribute( a, attr )
                    } else if( typeof attr === 'string' ) {
                        element.setAttribute( a, attr )
                    } else if( a.startsWith( 'on' ) && typeof attr === 'function' ) {
                        element.addEventListener( a.substring( 2 ), attr )
                    } else {
                        Object.defineProperty( element, a, {
                            value: attr,
                            enumerable: false
                        } )
                    }
                }
            } else {
                if( Array.isArray( child ) )
                    for( let c of child ) {
                        element.append( renderNode( c ) )
                    }
                else
                    element.append( renderNode( child ) )
            }
        }
    }
    return element
}

const isAttrs = ( val ) => val && typeof val === 'object' && !Array.isArray( val ) && !isNode( val )
/**
 * Aggregates all attribute objects from a list of children
 * @param children
 * @returns {{}} A single object containing all of the aggregated attribute objects
 */
export const getAttrs = ( children ) => children.reduce( ( attrs, child ) => {
    if( isAttrs( child ) )
        Object.assign( attrs, child )
    return attrs
}, {} )

/**
 * A hidden div node to mark your place in the dom
 * @returns {HTMLDivElement}
 */
const marker = ( attrs ) => h( 'div', Object.assign( attrs || {}, { style: 'display:none' } ) )