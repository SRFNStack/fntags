import { code, pre } from './fntags.js'

export default ( sourceCode, language = 'js' ) => {
    const el = pre({ class: 'language-' + language }, code(sourceCode ) )
    Prism.highlightElement( el )
    return el
}