# fntags

> Functions instead of markup to enable two way data binding and automatic refreshes on state updates

With fntags, you can build your ui with no complicated setup, and no special build processes.

Templates are written in plain javascript.

```html
<html><body>
<script src="/static/fntags.js"></script>
<script type="text/javascript">
fntags.hoist()
document.body.append(
    p( 
        'fntags ',
        span({style: "color: green"}, 
            "all f'n day"
        )
    )
)

</script>
</body></html>

```

Creating re-usable components is as easy as declaring a function in javascript.

```js
const card = ( { title, content } ) =>
    div( { display: 'inline-block', style: "border: 2px solid black; border-radius: 5px; padding: 10px" },
         h4( { class: 'card-title' }, title ),
         hr(),
         div( { class: 'card-content' }, content )
    )

document.body.append(
    card( { title: 'fntags', content: 'is awesome' } ),
    card( { title: 'fntags', content: 'is simple' } )
)
```

Any element can be bound to any state at any scope, and can be updated asynchronously with ease. 

```js
const appState= fntags.initState( {} )
const greeting = () => {
        //state that's private to this component
        const greetingState = fntags.initState( { greeting: 'Hello' } )
        
        //create a variable to store our created div so that it doesn't get re-created on every update
        let greetingDiv
        const buildGreetingDiv = () => div(
            
            //bind to any number of states by passing an array
            fnbind( [ appState, greetingState ],
                    () => `${greetingState.greeting} ${appState.currentUser.name}!`
            ),
            br(), br(),
            
            //bind to our private state
            fnbind( greetingState,
                    input( {
                               value: greetingState.greeting,

                               //setting this property will update all bound elements
                               oninput: ( e ) => {greetingState.greeting = e.target.value}
                           } ),
                    
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
        
        if( appState.currentUser ) greetingDiv = buildGreetingDiv()

        return fnbind( appState,
                       () => greetingDiv || 'Welcome!',
                       ( el, st ) => {
                           if( st.currentUser ) {
                               if( !greetingDiv ) greetingDiv = buildGreetingDiv()
                               return greetingDiv
                           } else return 'Welcome!'
                       }
        )
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


#### Tags
All html tags are accessible via the `fntags` global property. To make the tags globally available, call `fntags.hoist()`. If there are existing window properties that share names with html tags, the tag will be hoisted to _fn_+tag (i.e. _fn_div) 

#### State
You can subscribe to changes in state by using the `fnbind` function. 

The returned value from `fntags.initState({})` is the proxied state, this return value should be passed to `fnbind` .

##### fnbind(states, element [, update])
 - **states** either a single state or an array of states
 - **element** an html element or a function that returns one
 - **update** A function that will be called whenever the state is updated. This allows you to directly control what happens. The function receives two arguments,
 the element being updated, and the new state `(element, newState) => {element.value = newState.foo}`. You can replace the existing element by returning a new element
 from the update function.

If you pass a function as the element, when the state is updated, the function will be executed and the existing element will be replaced by the returned element.

You will find that if you try to use this method with an input, the input will lose focus. This is because you're actually creating a new element and the element that had focus no longer exists.
To fix this issue, pass an element directly with an update function, then update the element as needed. Passing a function is intended as aa shortcut for strings and simple templates.

State updates are implemented using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) thus `fntags.initState({})` **must** be called only with an object.