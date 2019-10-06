import { h3, hr, p, section } from './fntags.js'

export default ( title, ...content ) => section(
    h3( {id: title},  title ),
    ...content.map(c=>typeof c === 'string' ? p(c) : c),
    hr()
)