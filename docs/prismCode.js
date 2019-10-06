import { button, code, div, fnbind, fnstate, pre } from './fntags.js'

export default ( sourceCode, demo, language = 'js' ) => {
    const state = fnstate( { isDemo: false } )
    const src = pre( { class: 'language-' + language }, code( sourceCode.trim() ) )
    let swapped = false
    const obs = new IntersectionObserver(
        ( entries ) => {
            entries
                .filter( el => el.isIntersecting )
                .forEach( () => {
                    if( !swapped ) {
                        const clone = src.cloneNode(true)
                        Prism.highlightElement(clone)
                        src.replaceWith(
                            div( { style: `width: ${src.scrollWidth}; height: ${src.scrollHeight}; position: relative` },
                                 demo && button( {
                                                     style: 'position: absolute; top: 10px; right: 10px;',
                                                     onclick: () => state.isDemo = !state.isDemo
                                                 },
                                                 fnbind(state, (st)=>st.isDemo ? 'Code' : 'Demo')
                                      )
                                 || '',
                                 fnbind( state, ( st ) => {
                                     return st.isDemo ? demo : clone
                                 } )
                            ) )
                        swapped = true
                        state.isDemo = false
                    }
                } )
        } )
    obs.observe( src )
    return src
}