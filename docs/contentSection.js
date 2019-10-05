import { h3, hr, section } from './fntags.js'

export default ( title, ...content ) => section(
    h3( {id: title},  title ),
    ...content,
    hr()
)