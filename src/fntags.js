/**
 * Check if a value is an dom node
 * @param el
 * @returns {boolean}
 */
export const isNode = ( el ) => el instanceof Node

/**
 * Create a state object that can be bound to.
 * @param initialValue The initial state
 * @param mapKey A map function to extract a key from an element in the array. Receives the element and the index in the array.
 *                  The index should only be used for simple static cases where rows don't move around, a real unique key is much preferred.
 * @returns function A function that can be used to get and set the state
 */
export const fnstate = ( initialValue, mapKey ) => {
    let childStates = {}
    let currentValue = proxyArray( initialValue )
    let observers = []
    const bindContexts = []
    let selected

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

    function proxyArray( value ) {
        if( Array.isArray( value ) && !value.__isProxy ) {
            let p = new Proxy( value, {
                get( target, p ) {
                    if( parseInt( p.toString() ) == p ) {
                        let v = target[ p ]
                        //unwrap any state objects, since the user deals with state objects they may have explicitly set an index to a state object instead of a value
                        if( v && v.isFnState ) v = v()
                        let key = keyMapper( v, p )
                        if( childStates[ key ] ) {
                            return childStates[ key ]
                        } else {
                            return childStates[ key ] = fnstate( v )
                        }
                    } else {
                        return Reflect.get( ...arguments )
                    }
                },
                set( target, p, value ) {
                    if( value && value.isFnState ) value = value()
                    if( parseInt( p.toString() ) == p && bindContexts.length > 0 ) {
                        let key = keyMapper( value, p )
                        if( !childStates[ key ] )
                            childStates[ key ] = fnstate( value )
                    }
                    return Reflect.set( ...arguments )
                }
            } )
            Object.defineProperty( p, '__isProxy', {
                value: true,
                enumerable: false,
                writable: false
            } )
            return p
        } else
            return value
    }

    function keyMapper( value, index ) {
        if( typeof value !== 'object' )
            return value
        else if( !mapKey ) {
            return index
        } else
            return mapKey( value, index )
    }

    function arrangeElements( ctx ) {
        let remainingElements = Object.assign( {}, ctx.boundElementByKey )
        let prev = null
        let parent = ctx.parent
        let seenKeys = {}

        if( currentValue.length === 0 ) {
            parent.textContent = ''
            return
        }
        for( let i = currentValue.length - 1; i >= 0; i-- ) {
            let valueState = currentValue[ i ]
            let key = keyMapper( valueState(), i )
            if( seenKeys[ key ] ) throw new Error( 'Duplicate keys in a bound array are not allowed.' )
            seenKeys[ key ] = true
            let current = ctx.boundElementByKey[ key ]
            let isNew = false
            if( !current ) {
                isNew = true
                current = ctx.boundElementByKey[ key ] = renderNode( evaluateElement( ctx.element, valueState ) )
                current.key = key
            }
            //place the element in the parent
            if( !prev ) {
                if( !parent.lastChild || parent.lastChild.key !== current.key ) parent.append( current )
            } else {
                if( !prev.previousSibling ) {
                    parent.insertBefore( current, prev )
                } else if( prev.previousSibling.key !== current.key ) {
                    //if it's a new key, always insert it
                    if( isNew )
                        parent.insertBefore( current, prev )
                    //if it's an existing key, replace the current object with the correct object
                    else
                        prev.previousSibling.replaceWith( current )
                }
            }
            prev = current

            delete remainingElements[ key ]
        }
        //deleted keys
        for( let key of Object.keys( remainingElements ) ) {
            if( selected === key ) selected = null
            delete childStates[ key ]
            remainingElements[ key ].remove()
        }
    }

    /**
     * Reconcile the state of the current array value with the state of the bound elements
     */
    function reconcile() {
        for( let ctx of bindContexts ) {
            if( !ctx.boundElementByKey ) ctx.boundElementByKey = {}
            arrangeElements( ctx )
        }
    }

    const setKey = ( element, i ) => {
        if( !element.key && mapKey ) element.key = keyMapper( currentValue, i )
        return element
    }

    /**
     * Replace the element when the state is updated
     * @param st The updated state
     * @param element The updated element
     * @param i
     * @returns {*}
     */
    const replaceOnUpdate = ( st, element, i ) => {
        let current = setKey( renderNode( element() ), i )
        st.subscribe( function() {
            let newElement = setKey( renderNode( element() ), i )
            if( newElement ) {
                if( !newElement.key || newElement.key !== current.key ) {
                    current.replaceWith( newElement )
                    current = newElement
                }
            }
        } )
        return current
    }

    /**
     * Bind the values of this state to the given element.
     * Values are items/elements of an array.
     * If the current value is not an array, this will behave the same as bindAs.
     *
     * @param parent The parent to bind the children to.
     * @param element The element to bind to. If not a function, an update function must be passed
     * @param update If passed this will be executed directly when the state of any value changes with no other intervention
     */
    state.bindValues = ( parent, element, update ) => {
        parent = renderNode( parent )
        if( !parent ) throw new Error( 'You must provide a parent element to bind the children to. aka Need Bukkit.' )
        if( typeof element !== 'function' && !update )
            throw new Error( 'You must pass an update function when passing a non function element' )
        if( !mapKey ) {
            console.warn('Using value index as key, may not work correctly when moving items...')
            mapKey = ( o, i ) => i
        }

        if( !Array.isArray( currentValue ) ) {
            return state.bindAs( element, update )
        }
        const ctx = { element, update, parent }
        bindContexts.push( ctx )
        state.subscribe( () => {
            if( !Array.isArray( currentValue ) ) {
                console.warn( 'A state used with bindValues was updated to a non array value. This will be converted to an array of 1 and the state will be updated.' )
                setTimeout( () => state( [currentValue] ), 1 )
            } else
                reconcile()
        } )
        reconcile()
        return parent
    }

    /**
     * Bind this state to the given element
     *
     * @param element The element to bind to. If not a function, an update function must be passed
     * @param update If passed this will be executed directly when the state changes with no other intervention
     * @returns {(HTMLDivElement|Text)[]|HTMLDivElement|Text}
     */
    state.bindAs = ( element, update ) => {
        if( typeof element !== 'function' && !update )
            throw new Error( 'You must pass an update function when passing a non function element' )
        if( update ) {
            let boundElement = renderNode( evaluateElement( element, currentValue ) )
            state.subscribe( () => update( boundElement ) )
            return boundElement
        } else {
            return replaceOnUpdate( state, () => element( currentValue ) )
        }
    }

    let deselectEvent = new Event( 'deselect' )
    let selectEvent = new Event( 'select' )

    state.select = ( key ) => {
        for( let ctx of bindContexts ) {
            if( selected && ctx.boundElementByKey[ selected ] ) {
                ctx.boundElementByKey[ selected ].dispatchEvent( deselectEvent )
            }
            selected = key
            if( ctx.boundElementByKey[ key ] ) {
                ctx.boundElementByKey[ key ].dispatchEvent( selectEvent )
            }
        }
    }

    state.isFnState = true

    state.patch = ( update ) => state( Object.assign( currentValue, update ) )

    state.subscribe = ( callback ) => observers.push( callback )

    state.reset = ( reInit ) => {
        observers = []
        if( reInit ) currentValue = initialValue
    }

    return state
}

const evaluateElement = ( element, value ) => typeof element === 'function' ? element( value ) : element

/**
 * Convert non objects (objects are assumed to be nodes) to text nodes and allow promises to resolve to nodes
 */
export const renderNode = ( node ) => {
    if( typeof node === 'object' && node.then === undefined ) {
        return node
    } else if( node && typeof node.then === 'function' ) {
        const node = marker()
        node.then( el => node.replaceWith( renderNode( el ) ) ).catch( e => console.error( 'Caught failed node promise.', e ) )
        return node
    } else {
        return document.createTextNode( node + '' )
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
    if( isAttrs( children[ 0 ] ) ) {
        let attrs = children.shift()
        for( let a in attrs ) {
            let attr = attrs[ a ]
            if( a === 'style' && typeof attr === 'object' ) {
                for( let style in attr ) {
                    let match = attr[ style ].toString().match( /(.*)\W+!important\W*$/ )
                    if( match )
                        element.style.setProperty( style, match[ 1 ], 'important' )
                    else
                        element.style.setProperty( style, attr[ style ] )
                }
            } else if( a === 'value' ) {
                //value is always an attribute because setting it as a property causes problems
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
    }
    for( let child of children ) {
        if( Array.isArray( child ) )
            for( let c of child ) {
                element.append( renderNode( c ) )
            }
        else
            element.append( renderNode( child ) )
    }
    return element
}

export const isAttrs = ( val ) => val && typeof val === 'object' && !Array.isArray( val ) && !isNode( val )
/**
 * Aggregates all attribute objects from a list of children
 * @param children
 * @returns {{}} A single object containing all of the aggregated attribute objects
 */
export const getAttrs = ( children ) => isAttrs( children[ 0 ] ) ? children[ 0 ] : {}

/**
 * A hidden div node to mark your place in the dom
 * @returns {HTMLDivElement}
 */
const marker = ( attrs ) => h( 'div', Object.assign( attrs || {}, { style: 'display:none' } ) )