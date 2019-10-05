import { div, p } from './fntags.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection(
        'Getting Started',
        p( 'Acquire fntags/src/index.js (this file will be referred to as fntags.js from now on) from npm or github and include it with your content.' ),
        p( 'Import fnapp and some of the tag functions from fntags.js and initialize the app by calling fnapp with the root of the app and the contents of the app.' ),
        p( 'Dom elements are created using functions. These functions take an optional attributes object, and the children of the element. ' +
           'You can defer creating a child until the parent is created by passing in a function that takes the parent as it\'s only argument.' ),
        prismCode(`<script type="module">
    import {fnapp, div, p, h1} from './fntags.js'
    fnapp(document.body,
        div(
            h1("Welcome"),
            p("to fntags")
        )
    ) 
</script>
`
        ),
        p( 'All html tags are available to import from fntags.' )
    ) )