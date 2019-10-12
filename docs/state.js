import { fnbind, fnstate } from './fntags.js'
import { br, button, div, input } from './fnelements.js'
import prismCode from './prismCode.js'
import contentSection from './contentSection.js'

const appState = fnstate( { userName: 'Jerry' } )

export default div(
    contentSection(
        'Binding State',
        'Create a variable to hold the state object.',
        prismCode( 'const state = fnstate({count: 0})' ),
        'Use fnbind to listen to state changes and update the element.',
        prismCode( 'fnbind(state, (st)=>`Current count: ${st.count}`)',
                   // ()=>{
                   //     const state = fnstate({count:0})
                   //     return div(
                   //         fnbind(state, ()=>state.count),
                   //         button({onclick: ()=> state.count = state.count+1}, '+1')
                   //     )
                   // }
                   ),
        'When a property is set on the state, the function is executed, and the current element is replaced with the returned element.',
        'This allows the element to be updated to reflect any changes.',
        'State is implemented using an es6 Proxy. Thus, nested property changes do not trigger state updates. You must set top level properties to trigger state updates.'
    ),
    contentSection(
        'Updating Instead of Replacing',
        'If you don\'t want to replace the element, to maintain focus for instance, pass the element and a function to update it with.',
        prismCode( 'fnbind(state,\n' +
                   '   input(\n' +
                   '       {\n' +
                   '           value: state.name, \n' +
                   '           oninput: \n' +
                   '               (e)=>state.name = e.target.value \n' +
                   '       }\n' +
                   '    ),\n' +
                   '    ( h, st ) => h.value = st.name\n' +
                   ')',
                   div(
                       () => {
                           const state = fnstate( { name: 'Jerry' } )
                           return div(
                               fnbind( state, () => div( state.name ) ),
                               fnbind( state,
                                       input(
                                           {
                                               value: state.name,
                                               oninput:
                                                   ( e ) => state.name = e.target.value
                                           }
                                       ),
                                       ( el, st ) => el.value = st.name
                               )
                           )
                       }
                   )
        )
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
        fnbind(
            state,
            ()=> \`Current count: \${state.count}\`
        ),
        button(
            {onclick: 
                ()=> state.count = state.count + 1
            },
            "+1"
        )
    )
}
`, ( () => {
                const state = fnstate( { count: 0 } )
                return div(
                    fnbind(
                        state,
                        () => `Current count: ${state.count}`
                    ),
                    button(
                        { onclick: () => state.count = state.count + 1 },
                        '+1'
                    )
                )
            } )() )
    ),
    contentSection(
        'Binding Multiple States',
        'Any element can be bound to any number of states by passing an array of state objects as the first parameter of fnbind.',
        prismCode( `
()=> {
    const a = fnstate({count: 0})
    const b = fnstate({count:0})
    return div(
        fnbind([a, b], 
            ()=> \`a: \${a.count} b: \${b.count}\`
        ),
        button(
            {onclick: ()=> a.count = a.count + 1},
            "a+1"
        ),
        button(
            {onclick: ()=> b.count = b.count + 1},
            "b+1"
        )
    )
}
`, ( () => {
                       const a = fnstate( { count: 0 } )
                       const b = fnstate( { count: 0 } )
                       return div(
                           fnbind( [ a, b ], () => `a: ${a.count} b: ${b.count}` ),
                           button( { onclick: () => a.count = a.count + 1 }, 'a+1' ),
                           button( { onclick: () => b.count = b.count + 1 }, 'b+1' )
                       )
                   } )()
        )
    ),

    contentSection(
        'Binding State at Any Scope',
        'As long as you have a handle on the state object you can bind to it. This means that states can be imported, used as global vars, or set on window.',
        prismCode( `
const appState = fnstate({userName: 'Jerry'}) 
() => {
const greetingState = fnstate( { greeting: 'Hello' } )
let triggered = false
return div(
   fnbind( [ appState, greetingState ],
           () => \`\${greetingState.greeting} \${appState.userName}!\`
   ),
   div(
        fnbind( greetingState,
            input( {
                value: greetingState.greeting,
                oninput: ( e ) => {greetingState.greeting = e.target.value}
            } ),
            ( el, st ) => el.value = st.greeting
        ),
        'This input has a 500ms debounce',
        fnbind(
           appState,
           input( {
                value: appState.userName || '',
                oninput: ( e ) => {
                  if( !triggered ) {
                      triggered = true
                      setTimeout( () => {
                          appState.userName = e.target.value
                          triggered = false
                      }, 500 )
                  }
                }
                }
           ),
           ( el, st ) => {el.value = st.userName}
        )
   )
)
}
`, ( () => {
const greetingState = fnstate( { greeting: 'Hello' } )
let triggered = false
return div(
   fnbind( [ appState, greetingState ],
           () => `${greetingState.greeting} ${appState.userName}!`
   ),
   div(
        fnbind( greetingState,
            input( {
                value: greetingState.greeting,
                oninput: ( e ) => {greetingState.greeting = e.target.value}
            } ),
            ( el, st ) => el.value = st.greeting
        ),
        br(),
        fnbind(
           appState,
           input( {
                value: appState.userName || '',
                oninput: ( e ) => {
                  if( !triggered ) {
                      triggered = true
                      setTimeout( () => {
                          appState.userName = e.target.value
                          triggered = false
                      }, 500 )
                  }
                }
                }
           ),
           ( el, st ) => {el.value = st.userName}
        ),
        'This input has a 500ms debounce'
   )
)
}
                   )(),
                   '100%' ) )
)