import { button, code, div, fnbind, fnstate, pre } from './fntags.js'

export default ( sourceCode, demo, language = 'js' ) => {
    const state = fnstate( { isDemo: false } )
    const src = pre( { class: 'language-' + language }, code( sourceCode.trim() ) )
    Prism.highlightElement( src )
    let swapped = false
    const obs = new IntersectionObserver(
        ( entries ) => {
            entries
                .filter( el => el.isIntersecting )
                .forEach( () => {
                    if( !swapped ) {
                        src.replaceWith(
                            div( { style: `width: ${src.scrollWidth}; height: ${src.scrollHeight}; position: relative` },
                                 demo && button( {
                                                     style: 'position: absolute; top: 10px; right: 10px;',
                                                     onclick: () => state.isDemo = !state.isDemo
                                                 },
                                                 fnbind(state, (st)=>st.isDemo ? 'Code' : 'Demo')
                                      )
                                 || '',
                                 fnbind( state, ( st ) => st.isDemo ? demo : src.cloneNode(true) )
                            ) )
                        swapped = true
                        state.isDemo = false
                    }
                } )
        } )
    obs.observe( src )
    return src
}