import {fnstate, fnbind, div, br, input, h4, span, p, form} from "./fntags.js"
export default ( appState, { message, fontSize, stateColor, inputStateColor } ) => {
    let inputState = fnstate( { color: inputStateColor } )
    return form( { style: `font-size: ${fontSize}` },
                 'State Data: ',
                 fnbind( appState,
                         input( {
                                    value: appState.currentUser.name,
                                    oninput: ( e ) => {
                                        appState.currentUser = Object.assign( appState.currentUser,
                                                                              { name: e.target.value } )
                                    }
                                } ),
                         ( el, st ) => el.value = st.currentUser.name
                 ),
                 br(), br(),
                 'InputState Color: ',
                 fnbind( inputState,
                         input( {
                                    value: inputState.color,
                                    oninput: ( e ) => {
                                        inputState.color = e.target.value
                                    }
                                } ),
                         ( el, st ) => el.value = st.color
                 ),
                 p(
                     fnbind( appState,
                             () =>
                                 div(
                                     h4( message ),
                                     span( { style: `color: ${stateColor}` },
                                           `appState.currentUser.name: ${appState.currentUser.name}`
                                     ),
                                     br(),
                                     fnbind( inputState,
                                             () =>
                                                 span( { style: `color: ${inputState.color}` },
                                                       `inputState.color: ${inputState.color}`
                                                 )
                                     )
                                 ) ),
                     br(),
                     input( { value: 'unbound input' } )
                 )
    )
}