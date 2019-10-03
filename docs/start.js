import { code, div, p, pre } from './fntags.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection(
        'Using the framework',
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
    ),
    contentSection(
        'Binding State',
        p( 'Now that we have content, let\'s bind some data.' ),
        p( 'The first step is to create a variable to hold our state object.' ),
        prismCode('const state = fnstate({count: 0})' ),
        p( 'Now we can use fnbind to listen to state changes and update our elements.' ),
        prismCode( 'fnbind(state, ()=>`Current count: ${state.count}`)' ),
        p( 'When the state changes, the function passed to fnbind is executed again, and replaces the current element with the updated element.' ),
        p( 'Let\'s add a button to increment the state' ),
    prismCode(
                   `<script type="module">
    import {fnapp, fnstate, fnbind, button} from './fntags.js'
    const state = fnstate({count: 0})
    fnapp(document.body,
        fnbind(state, ()=> \`Current count: \${state.count}\`),
        button({onclick: ()=> state.count = state.count + 1}, "+1")
    ) 
</script>
` )
        ) )