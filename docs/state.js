import { div, p } from './fntags.js'
import prismCode from './prismCode.js'
import contentSection from './contentSection.js'

export default div(
    contentSection(
        'Binding State',
        p( 'Now that we have content, let\'s bind some data.' ),
        p( 'The first step is to create a variable to hold our state object.' ),
        prismCode( 'const state = fnstate({count: 0})' ),
        p( 'Now we can use fnbind to listen to state changes and update our elements.' ),
        prismCode( 'fnbind(state, ()=>`Current count: ${state.count}`)' ),
        p( 'When the state changes, the function passed to fnbind is executed again, and replaces the current element with the updated element.' ),
        p( 'State is implemented using an es6 Proxy. Thus, nested property changes do not trigger state updates. You must set top level properties to trigger state updates.' ),
        p( 'Let\'s add a button to increment the state' ),
        prismCode(
            `<script type="module">
    import {fnapp, fnstate, fnbind, button} from './fntags.js'
    const state = fnstate({count: 0})
    fnapp(document.body,
        fnbind(state, ()=> \`Current count: \${state.count}\`),
        button({onclick: ()=> state.count = state.count + 1}, "+1")
    ) 
</script>
` )
    ),

    contentSection(
        'Examples of binding state in different scopes',
        prismCode( `
import {fnapp, fnbind, fnstate, div, input} from './fntags.js'
const appState= fnstate( {currentUser: null} )
const greeting = () => {
        //private component state
        const greetingState = fnstate( { greeting: 'Hello' } )
        
        //store the div so it doesn't get re-created on every update
        let greetingDiv = div(
            //bind to multiple states by passing an array
            fnbind( 
                [ appState, greetingState ],
                () => \`\${greetingState.greeting} \${appState.currentUser.name}!\`
            ),
            
            //bind to the private state
            fnbind( greetingState,
                    input( {
                            value: greetingState.greeting,
                            oninput: ( e ) => {greetingState.greeting = e.target.value}
                    }),
                    //This function is executed on each update 
                    ( el, st ) => el.value = st.greeting
            ),
            //bind to the app state
            fnbind( appState,
                    input( {
                               value: appState.currentUser.name,
                               oninput: ( e ) => {
                                   
                                   //updates are only triggered by setting direct properties of the state
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
)