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
 * @param mapKey A map function to extract a key from an element in the array. Receives the element and the index in the array.
 *                  The index should only be used for simple static cases, a real unique key is much preferred.
 * @returns function A function that can be used to get and set the state
 */
export const fnstate = ( initialValue, mapKey ) => {
    let currentValue = initialValue
    let childStates = {}
    let observers = []
    const bindContexts = []

    const state = function( newState ) {
        if( arguments.length === 0 ) {
            return currentValue
        } else {
            //skip updates if states are identical
            if( !deepEqual( currentValue, newState ) ) {
                currentValue = newState
                for( let observer of observers ) {
                    observer( newState )
                }
            }
        }
        return newState
    }

    function keyMapper( value, index ) {
        if( typeof value !== 'object' )
            return value
        else if( !mapKey ) {
            console.warn( 'Using index as key for value: ' + value + '. You should pass a mapKey function when creating your state with fnstate.' )
            return index
        } else
            return mapKey( value, index )
    }

    let collectBoundElements = function( boundElementByKey, ctx ) {
        let seenKeys = {}
        return currentValue.map( ( v, i ) => {
            let key = keyMapper( v, i )
            if( seenKeys[ key ] ) throw new Error( 'Duplicate keys in a bound array are not allowed. Try prepending the index?' )
            if( boundElementByKey[ key ] )
                return boundElementByKey[ key ]
            else {
                let newState = fnstate( v )
                childStates[ key ] = newState
                let node
                if( ctx.update ) {
                    node = renderNode( evaluateElement( ctx.element, currentValue ) )
                    newState.subscribe( () => ctx.update( node ) )
                } else {
                    node = replaceOnUpdate( newState, () => ctx.element( newState ), i )
                }
                return node
            }
        } )
    }

    function arrangeElements( boundElementByKey, ctx ) {
        let remainingElements = Object.assign( {}, boundElementByKey )
        let prev = null
        let parent = ctx.parent
        for( let i = ctx.boundElements.length - 1; i >= 0; i-- ) {
            let current = ctx.boundElements[ i ]
            let key = keyMapper( currentValue[ i ], i )
            //place the element in the parent
            if( !prev ) {
                prev = current
                if( !parent.lastChild || parent.lastChild.key !== current.key ) parent.append( current )
            } else {
                if( !prev.previousSibling || prev.previousSibling.key !== current.key )
                    parent.insertBefore( prev, current )
            }

            delete remainingElements[ key ]

            if( !deepEqual( currentValue[ i ], childStates[ key ]() ) ) {
                childStates[ key ]( currentValue[ i ] )
            }
        }
        //deleted keys
        if( Object.keys( remainingElements ) ) {
            for( let key in remainingElements ) {
                let el = remainingElements[ key ]
                childStates[ el.key ].reset()
                delete childStates[ el.key ]
                el.remove()
            }
        }
    }

    /**
     * Reconcile the state of the current array value with the state of the bound elements
     */
    function reconcile() {
        if( !childStates )
            childStates = currentValue.reduce( ( statesByKey, v, i ) => {
                statesByKey[ keyMapper( v, i ) ] = fnstate( v )
                return statesByKey
            }, {} )

        for( let ctx of bindContexts ) {
            if( !ctx.boundElements ) ctx.boundElements = []
            let boundElementByKey = ctx.boundElements.reduce( ( elByKey, el, i ) => {
                elByKey[ el.key ] = { el, i }
            }, {} )
            ctx.boundElements = collectBoundElements( boundElementByKey, ctx )

            arrangeElements( boundElementByKey, ctx )
        }
    }

    const setKey = ( element, i ) => {
        if( !element.key && keyMapper ) element.key = keyMapper( currentValue, i )
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
            tag( current )
            let newElement = setKey( renderNode( element() ), i )
            if( newElement ) {
                tag( newElement )
                if( getTagId( current ) !== getTagId( newElement ) ) {
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
        if( !keyMapper )
            throw new Error( 'You must create your fnstate with a keymapper to use bindValues. Each element in the array must have a unique id.' )
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

    state.isFnState = true

    state.patch = ( update ) => state( Object.assign( currentValue, update ) )

    state.subscribe = ( callback ) => observers.push( callback )

    state.reset = ( reInit ) => {
        observers = []
        if( reInit ) currentValue = initialValue
    }

    tag( state )

    return state
}

const evaluateElement = ( element, value ) => typeof element === 'function' ? element( value ) : element

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

const tag = ( el ) => {
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
const getTagId = ( el ) => isTagged( el ) && getTag( el ).id

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

export const isAttrs = ( val ) => val && typeof val === 'object' && !Array.isArray( val ) && !isNode( val )
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

//from https://github.com/epoberezkin/fast-deep-equal, not an es6 module
const deepEqual = function( a, b ) {
    if( a === b ) return true

    if( a && b && typeof a == 'object' && typeof b == 'object' ) {
        if( a.constructor !== b.constructor ) return false

        let length, i, keys
        if( Array.isArray( a ) ) {
            length = a.length
            if( length !== b.length ) return false
            for( i = length; i-- !== 0; ) {
                if( !deepEqual( a[ i ], b[ i ] ) ) return false
            }
            return true
        }

        if( ( a instanceof Map ) && ( b instanceof Map ) ) {
            if( a.size !== b.size ) return false
            for( i of a.entries() ) {
                if( !b.has( i[ 0 ] ) ) return false
            }
            for( i of a.entries() ) {
                if( !deepEqual( i[ 1 ], b.get( i[ 0 ] ) ) ) return false
            }
            return true
        }

        if( ( a instanceof Set ) && ( b instanceof Set ) ) {
            if( a.size !== b.size ) return false
            for( i of a.entries() ) {
                if( !b.has( i[ 0 ] ) ) return false
            }
            return true
        }

        if( ArrayBuffer.isView( a ) && ArrayBuffer.isView( b ) ) {
            length = a.length
            if( length !== b.length ) return false
            for( i = length; i-- !== 0; ) {
                if( a[ i ] !== b[ i ] ) return false
            }
            return true
        }

        if( a.constructor === RegExp ) return a.source === b.source && a.flags === b.flags
        if( a.valueOf !== Object.prototype.valueOf ) return a.valueOf() === b.valueOf()
        if( a.toString !== Object.prototype.toString ) return a.toString() === b.toString()

        keys = Object.keys( a )
        length = keys.length
        if( length !== Object.keys( b ).length ) return false

        for( i = length; i-- !== 0; ) {
            if( !Object.prototype.hasOwnProperty.call( b, keys[ i ] ) ) return false
        }

        for( i = length; i-- !== 0; ) {
            let key = keys[ i ]

            if( !deepEqual( a[ key ], b[ key ] ) ) return false
        }

        return true
    }

    // true if both NaN, false otherwise
    return a !== a && b !== b
}