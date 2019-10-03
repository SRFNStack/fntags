# fntags

> Functions instead of markup to enable two way data binding and automatic refreshes on state updates

### See full documentation here: 

With fntags, you can build your ui with no complicated setup, and no special build processes.

Templates are written in plain javascript.

fntags is an es6 module and must be used as such. Ensure your script element has the attribute `type="module"`

```html
<html><body>
<script type="module">
    import {fnapp, div, p, h1} from './fntags.js'
    fnapp(document.body,
        div(
            h1("Welcome"),
            p("to fntags")
        )
    ) 
</script>
</body></html>
```

Creating re-usable components is as easy as declaring a function in javascript.

```js
import {fnapp, div, h4, hr} from './fntags.js'
const card = ( { title, content } ) =>
    div( { display: 'inline-block', style: "border: 2px solid black; border-radius: 5px; padding: 10px" },
         h4( { class: 'card-title' }, title ),
         hr(),
         div( { class: 'card-content' }, content )
    )

fnapp(document.body,
    card( { title: 'fntags', content: 'is awesome' } ),
    card( { title: 'fntags', content: 'is simple' } )
)
```

Any element can be bound to any state at any scope, and can be updated asynchronously with ease. 

```js
import {fnapp, fnbind, fnstate, div, input} from './fntags.js'
const appState= fnstate( {currentUser: null} )
const greeting = () => {
        //state that's private to this component
        const greetingState = fnstate( { greeting: 'Hello' } )
        
        //create a variable to store our created div so that it doesn't get re-created on every update
        let greetingDiv = div(
            //bind to any number of states by passing an array
            fnbind( [ appState, greetingState ],() => `${greetingState.greeting} ${appState.currentUser.name}!`),
            
            //bind to our private state
            fnbind( greetingState,
                    input( {
                            value: greetingState.greeting,
                            oninput: ( e ) => {greetingState.greeting = e.target.value}
                    }),
                    //the update function that defines what happens when the state gets updated. 
                    ( el, st ) => el.value = st.greeting
            ),
            //bind to our app state
            fnbind( appState,
                    input( {
                               value: appState.currentUser.name,
                               oninput: ( e ) => {
                                   
                                   //updates are only triggered by direct properties of the state
                                   //therefore you need to actually re-assign currentUser to trigger an update
                                   appState.currentUser = Object.assign(appState.currentUser,{
                                       name: e.target.value
                                   })
                               }
                           } ),
                    ( el, st ) => {el.value = st.currentUser.name}
            )
        )

        return fnbind( appState, () => appState.currentUser ? greetingDiv : 'Welcome!' )
    }

fnapp(document.body,
    p( { class: 'header' },
       greeting()
    )
)

setTimeout( () => {
                console.log( 'hello' )
                appState.currentUser = { name: 'fntags' }
            },
            1000 )
```

Routing is provided as a feature of the library. You define routes by first creating a router element, then routes within it.

```js
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
```

#### Tags
All html tags are provided as functions that can be imported from the fntags library.

The children passed to fnapp or an html tag can be a string, a Node, or a function. If a child is a function, it receives it's parent as the only argument.

#### State
You can subscribe to changes in state by using the `fnbind` function. 

The returned value from `fnstate({})` is the proxied state, this return value should be passed to `fnbind` .

##### fnbind(states, element [, update])
 - **states** either a single state or an array of states
 - **element** an html element or a function that returns one. A function receives two arguments, the updated state, and the parent element
 - **update** A function that will be called whenever the state is updated. This allows you to directly control what happens. The function receives two arguments,
 the element being updated, and the new state `(element, newState) => {element.value = newState.foo}`. You can replace the existing element by returning a new element
 from the update function.

If you pass a function as the element, when the state is updated, the function will be executed and the existing element will be replaced by the returned element.

You will find that if you try to use this method with an input, the input will lose focus. This is because you're actually creating a new element and the element that had focus no longer exists.
To fix this issue, pass an element directly with an update function, then update the element as needed. Passing a function is intended as aa shortcut for strings and simple templates.

State updates are implemented using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) thus `fntags.initState({})` **must** be called only with an object.