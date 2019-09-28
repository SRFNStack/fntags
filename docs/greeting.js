import {fnstate, fnbind, div, br, input} from "./fntags.js"
export default (appState) => {
    //create a state that's private to this component
    const greetingState = fnstate( { greeting: 'Hello' } )

    //create a variable to store our created div so that it doesn't get re-created on every update, though that wouldn't totally ruin the day if it did happen
    const greetingDiv = div(
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
                               appState.currentUser = Object.assign( appState.currentUser, {
                                   name: e.target.value
                               } )
                           }
                       } ),
                ( el, st ) => {el.value = st.currentUser.name}
        )
    )

    return fnbind( appState,() => appState.loaded ? greetingDiv : 'Welcome!')
}