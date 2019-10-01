import { code, div, p, pre } from './fntags.js'

export default () => div(
    p( 'Acquire fntags/src/index.js (this file will be referred to as fntags.js from now on) from npm or github and include it with your content.' ),
    p('Import fnapp and some of the tag functions from fntags.js and initialize the app by calling fnapp with the root of the app and the contents of the app.'),
    pre(code({class:"lang-js"},
`<script type="module">
    import {fnapp, div, p, h1} from './fntags.js'
    fnapp(document.body,
        div(
            h1("Welcome"),
            p("to fntags")
        )
    ) 
</script>
`
    ))
)