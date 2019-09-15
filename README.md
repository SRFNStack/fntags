#fntags

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
                                   appState.currentUser = {
                                       ...appState.currentUser,
                                       name: e.target.value
                                   }
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

##Basics

####Tags
All html tags are accessible via the `fntags` global property. To make the tags globally available, call `fntags.hoist()`. If there are existing window properties that share names with html tags, the tag will be hoisted to _fn_+tag (i.e. _fn_div) 

State updates are implemented using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) thus `fntags.initState({})` **must** be called only with an object. Primitive values are not supported.

The returned value from `fntags.initState({})` is an array of two elements, the proxied state, and a bind function.

You may pass either a function or an element and an update function to the bind function. 

If you pass a function, when the state is updated, the function will be executed and the existing element will be replaced by whatever is returned by the function.
This causes issues for inputs and things with focus as the element gets dropped and re-created.

If you don't want to re-create elements, like in the case of an input, you may pass the element as the first argument to the bind function, and an update function as the second.
The update function receives two arguments, the element itself, and the newly updated state. Using this data you can modify the element to your needs on any state change.
This is useful in situations where you want to update the state within a bound context, because your component won't be re-created automatically and thus you won't lose focus and things like that.

When passing a function as the first argument, you may also pass an update function if you would like to override the default behavior of replacing the element. 
Note that the function will not be called in this case. The element that you receive in the update function is the element that was created from the initial call of the function.


##
#####Note
When a dom element that is