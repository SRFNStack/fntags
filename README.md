#fntags

> Functions instead of markup to enable two way data binding and automatic refreshes on state updates

With fntags, you can build your ui with no complicated setup, and no special build processes.

Templates are written in plain javascript.

```html
<html><body>
<script src="/static/fntags.js"></script>
<script type="text/javascript">

document.body.append(
    p( 
        'fntags ',
        span({style: "color: green"}, 
            "it's just javascript"
        )
    )
)

</script>
</body></html>

```

Creating re-usable components is as easy as declaring a function in javascript.

```js
const card = ( { title, content } ) =>
    div( { class: 'card' },
         h4( { class: 'card-title' }, title ),
         div( { class: 'card-content' }, content )
    )

document.body.append(
    card( { title: 'fntags', content: 'is awesome' } ),
    card( { title: 'fntags', content: 'is simple' } )
)
```

Any element can be bound to any state at any scope, and can be updated asynchronously with ease. 

```js
const [ appState, bindAppState ] = initState( {} )

const greeting = () => {
    const [ greetingState, bindGreetingState ] = initState( { greeting: 'Hello' } )

    return bindAppState( () => {
        if( appState.currentUser ) {
            return div(
                bindGreetingState( () => `${greetingState.greeting} ${appState.currentUser.name}` ),
                br(), br(),
                bindGreetingState(
                    input( {
                               value: greetingState.greeting,
                               oninput: ( e ) => {greetingState.greeting = e.target.value}
                           } ),
                    ( el, st ) => el.value = st.greeting
                )
            )
        } else return 'Welcome!'
    } )
}

document.body.append(
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

State updates are implemented using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) thus initState **must** be called only with an object. Primitive values are not supported.

The returned value from initState is an array of two elements, the proxied state, and a bind function.

You may pass either a function or an element and an update function to the bind function. 

If you pass a function, when the state is updated, the function will be executed and the existing element will be replaced by whatever is returned by the function.
This causes issues for inputs and things with focus as the element gets dropped and re-created.

If you don't want to re-create elements, like in the case of an input, you may pass the element as the first argument to the bind function, and an update function as the second.
The update function receives two arguments, the element itself, and the newly updated state. Using this data you can modify the element to your needs on any state change.

When passing a function as the first argument, you may also pass an update function if you would like to override the default behavior of replacing the element. 
Note that the function will not be called in this case. The element that you receive in the update function is the element that was created from the initial call of the function.
 