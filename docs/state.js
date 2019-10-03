import { div, p, pre, code } from './fntags.js'
import prismCode from './prismCode.js'

export default div(
    p( 'Any element can be bound to any state at any scope, and can be updated asynchronously with ease.' ),
    prismCode(`
import {fnapp, fnbind, fnstate, div, input} from './fntags.js'
const appState= fnstate( {currentUser: null} )
const greeting = () => {
        //state that's private to this component
        const greetingState = fnstate( { greeting: 'Hello' } )
        
        //create a variable to store our created div so that it doesn't get re-created on every update
        let greetingDiv = div(
            //bind to any number of states by passing an array
            fnbind( [ appState, greetingState ],() => \`\${greetingState.greeting} \${appState.currentUser.name}!\`),
            
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
` ) )