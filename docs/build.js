import { b, div, h1, p, renderElement, shiftAttrs, span, strong } from './fntags.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection(
        'Getting Started',
        'Acquire fntags/src/index.js (this file will be referred to as fntags.js from now on) from npm or github and include it with your content.',
        'Import fnapp and some of the tag functions from fntags.js and initialize the app by calling fnapp with the root of the app and the contents of the app.',
        'Dom elements are created using functions. These functions take an optional attributes object, and the children of the element. ',
        'You can defer creating a child until the parent is created by passing in a function that takes the parent as it\'s only argument.',
        prismCode( `<script type="module">
    import {fnapp, div, p, h1} from './fntags.js'
    fnapp(document.body,
        div(
            h1("Welcome"),
            p("to fntags")
        )
    ) 
</script>
`,
                   div(
                       h1( 'Welcome' ),
                       p( 'to fntags' )
                   )
        ),
        'All html tags are available to import from fntags.'
    ),
    contentSection(
        'Creating Elements',
        'Every element in fntags is a function. The function takes a var args of children. A child can be a string, a dom node, or a function that returns either of those.',
        'Passing a function is useful when element creation needs to be deferred or delegated.',
        'A basic element is composed of fntags html element function calls.',
        prismCode(
            'const myElement =\n' +
            '    div({style:\'font-size: 20px;\'},\n' +
            '        \'hello!\', span( { style: \'color: green\' }, \' world!\' ) \n)',
            div( { style: 'font-size: 20px;' }, 'hello!', span( { style: 'color: green' }, ' world!' ) )
        ),
        'To set attributes and event handlers on your element, pass an object as the first parameter to an html element function.',
        'Properties of the object become the attributes of the element. If a property is not a string or function, it will get assigned to the element as a non-enumerable property.',
        'If a property is a function, addEventListener is called on the element using the property name less the \'on\' prefix, and the function.',
        prismCode(
            `const myElement = div({style: "color: limegreen"}, "hello!", div("world!"))`,
            div( { style: 'color: limegreen' }, 'hello!', div( 'world!' ) )
        ),

        'To parameterize your element, add parameters to the function',

        prismCode(
            'const myElement = (name)=> div("hello!", div(\`\${name}!\`))\n',
            ( ( name ) => div( 'hello!', div( `${name}!` ) ) )( 'Jerry' ) ),

        'To add children to your element, a rest parameter is recommended.',

        prismCode( 'const myElement = (name, ...children)=> div(\`Hello \${name}!\`, ...children)',
                   ( ( name, ...children ) => div( `Hello ${name}!`, ...children ) )( 'Jerry', span( ' of' ), b( ' the' ), strong( ' day' ) )
        ),

        'fntags provides a utility for shifting an attributes object from a rest parameter or array called shiftAttrs.',
        'This does modify the passed arguments. You can avoid this by using getAttrs instead.',

        prismCode( 'const myElement = (...children)=> {\n' +
                   '    const attrs = shiftAttrs(children)\n' +
                   '    div(\`Hello \${attrs.name}!\`, ...children)\n' +
                   '}',
                   ( ( ...children ) => {
                       const attrs = shiftAttrs( children )
                       return div( `Hello ${attrs.name}!`, ...children )
                   } )( { name: 'Jerry' }, span( 'of' ), p( 'the' ), strong( 'day' ) )
        ),


        'To render the children yourself, use the renderElement function to convert string and functions to dom elements.',
        prismCode( 'const myElement = ( ...children ) => {\n' +
                   '                           const attrs = shiftAttrs( children )\n' +
                   '                           const myChildren =\n' +
                   '                               children\n' +
                   '                               .map( renderElement )\n' +
                   '                               .map( el => el.style = \'color: purple\' && el )\n' +
                   '                           return div( `Hello ${attrs.name}!`, ...myChildren )\n' +
                   '                       }',
                   ( ( ...children ) => {
                           const attrs = shiftAttrs( children )
                           const myChildren =
                               children
                                   .map( renderElement )
                                   .map( el => el.style = 'color: purple' && el )
                           return div( `Hello ${attrs.name}!`, ...myChildren )
                       }
                   )( { name: 'Jerry' }, span( ' of' ), p( 'the' ), strong( 'day' ) )
        )
    )
)
