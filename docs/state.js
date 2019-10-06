import { button, div, fnbind, fnstate } from './fntags.js'
import prismCode from './prismCode.js'
import contentSection from './contentSection.js'

export default div(
    contentSection(
        'Binding State',
        'First create a variable to hold the state object.',
        prismCode( 'const state = fnstate({count: 0})' ),
        'Then use fnbind to listen to state changes and update the element.',
        prismCode( 'fnbind(state, (st)=>`Current count: ${st.count}`)' ),
        'When the state changes, the function passed to fnbind is executed again, and the current element is replaced with the returned element.',
        'This allows the element to be updated to reflect any changes .',
        'State is implemented using an es6 Proxy. Thus, nested property changes do not trigger state updates. You must set top level properties to trigger state updates.'
    ),
    contentSection(
        'Modifying State',
        'To modify the state, set one first level properties on the state object.',
        ' The set will be intercepted by the Proxy, and will trigger elements to be updated.',
        prismCode(
            `
const myElement = = ()=> {
    const state = fnstate({count: 0})
    return div(
        fnbind(state, ()=> \`Current count: \${state.count}\`),
        button({onclick: ()=> state.count = state.count + 1}, "+1")
    )
}
`,(()=> {
                const state = fnstate({count: 0})
                return div(
                    fnbind(state, ()=> `Current count: ${state.count}`),
                    button({onclick: ()=> state.count = state.count + 1}, "+1")
                )
            })() )
    ),
    contentSection(
        'Binding Multiple States',
        'Any element can be bound to any number of states by passing an array of state objects as the first parameter of fnbind.',
        prismCode(`
const myElement =
 ()=> {
     const a = fnstate({count: 0})
     const b = fnstate({count:0})
     return div(
         fnbind([a, b], ()=> \`a: \${a.count} b: \${b.count}\`),
         button({onclick: ()=> a.count = a.count + 1}, "a+1"),
         button({onclick: ()=> b.count = b.count + 1}, "b+1")
     )
 }
`, (()=> {
            const a = fnstate({count: 0})
            const b = fnstate({count:0})
            return div(
                 fnbind([a, b], ()=> `a: ${a.count} b: ${b.count}`),
                 button({onclick: ()=> a.count = a.count + 1}, "a+1"),
                 button({onclick: ()=> b.count = b.count + 1}, "b+1")
            )
                  })()
        ),

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