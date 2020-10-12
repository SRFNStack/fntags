import { a, div, h4, strong } from './fnelements.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'
import { code } from '../src/fnelements.js'

export default div(
    contentSection(
        'Init',
        'This tutorial will walk through all of the necessary steps for creating a basic single page todos app using fntags.',
        'To start, create a new directory and cd into it.',
        prismCode( `mkdir $HOME/myFnApp\ncd $HOME/myFnApp` ),
        'You\'ll want to have a http server that you can serve the project files from as es6 modules cannot be loaded from local disk.',
        'If you don\'t already have a favorite http server, you can run one very easily using the npx tool from nodejs.',
        div( 'To use that, first ensure ', a( { href: 'https://nodejs.org/' }, 'nodejs' ), ' is installed, then run this command from within the project directory.' ),
        prismCode( 'npx http-server' ),
        div( 'After running this, your code will be available at ',
             a( { href: 'https://localhost:8080' }, 'https://localhost:8080' ),
             ', refreshing the page will load any code changes that have been made.' ),
        'Now we need to get fntags',
        div( 'The first option is to download the source files directly from ',
             a( { href: 'https://github.com/narcolepticsnowman/fntags/tree/master/src' }, 'GitHub' ),
             ' and include them with your source.' ),
        'The second is to include it using a package manager like npm or yarn.',
        h4( 'Manually Downloading' ),
        'Go to GitHub and download the files into the directory you created.',
        'When importing make sure you use the correct relative url.',
        prismCode( 'import {fnapp} from \'./fntags.js\'' ),
        h4( 'Installing with npm' ),
        div( 'To use npm, first you will need to ensure ', a( { href: 'https://nodejs.org/' }, 'nodejs' ), ' is installed on your computer.' ),
        div( 'Verify npm is installed by typing ',
             code( 'npm -v' ),
             ' in a terminal or command prompt. You may need to log out and log back in if it doesn\'t work after an install' ),
        'Now run npm init to generate a package.json file and install fntags.',
        prismCode( `npm init\nnpm install fntags --save` ),
        'When importing, use the fntags module name. This method will require some kind of bundling (like webpack) in order to work in a browser.',
        prismCode( `import {fnapp} from 'fntags'` )
    ),
    contentSection(
        'Create Root Files',
        'The following examples assume that fntags was manually downloaded and included with the source.',
        'The index.html is the main entry point of your application and where the app is initially imported.',
        div( 'Create the file ', strong( 'index.html' ), ' in your app folder with the following content, this is the only html you have to write.' ),
        prismCode(
            `<!DOCTYPE html>
<html lang="en">
<head>
    <title>MyFnApp</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<noscript>
    You need to enable JavaScript to run this app.
</noscript>
<script type="module" src="./app.js"></script>
</body>
</html>
`, undefined, '100%' ),
        div( 'Now create an ', strong( 'app.js' ), ' file that will contain the root of the app.' ),
        prismCode( `import { fnapp, route, routeSwitch, setRootPath, fnlink } from './fntags.js'
import { div, ul, li } from './fnelements.js'

//Set the root path to make deep linking work correctly
setRootPath('/')

//create a header component that contains the nav links
const header = div(
    { class: 'header' },
    div('myFnApp'),
    ul(
        li(
            fnlink( { to: '/' }, 'home' )
        ),
        li(
            fnlink( { to: '/todo' }, 'todos' )
        ),
        li(
            fnlink( { to: '/todo/new' }, 'add todo' )
        ),
    )
)

const footer = div( { class: 'footer' }, 'myFnFooter' )

fnapp(
    document.body,
    header,
    div( { class: 'content' },
         //Only display the first route that matches 
         routeSwitch(
             //exactly /
             route( { path: '/', absolute: true }, div( 'home' ) ),
             //everything that starts with /todo
             route( { path: '/todo' }, div( 'todo' ) )
         )
    ),
    footer
)
`, undefined, '100%' ),
        'This basic app.js creates a navigation header, a main content div that contains the routing components, and a footer.'
    ),
    contentSection(
        'Isolated Components',
        'Now that we have the base app set up, let\'s create the components of our app.',
        'A component is any html element, or any function that returns an html element.',
        'The easiest way to share components is to export them from a module.',
        div( 'Create a file called ', strong( 'todo.js' ), ' with the following content' ),
        prismCode( `import { route, routeSwitch } from './fntags.js'
import { form, input, li, ul, div } from './fnelements.js'

//The storage for the list of todos
const todos = []

//The todo component
const Todo = ( todo ) => li( todo )

//Create the input element as a const so we can access it's value onsubmit
const todoInput = input()

//The form to add a new todo
const AddTodo = () => form(
    {
        onsubmit: ( e ) => {
            //This prevents the form from performing a POST
            e.preventDefault()
            //Add the todo and reset the form
            todos.push( todoInput.value )
            todoInput.value = ''
        }
    },
    todoInput,
    input({type:'submit', value:'Add'})
)

export default div(
    routeSwitch(
        route( { path: '/todo', absolute: true }, ul( todos.map( Todo ) ) ),
        route( { path: '/todo/new', absolute: true }, AddTodo )
    )
)
`, undefined, '100%' ),

        div( 'We need to update ', strong( 'app.js' ), ' to use the new todo component.' ),
        'Import the todo component',
        prismCode( 'import todo from \'./todo.js\'' ),
        'Then change the route\'s child element to use the imported todo component.',
        prismCode( 'route( { path: \'/todo\' }, div( \'todo\' ) )\nbecomes\nroute( { path: \'/todo\' }, todo )' )
    ),
    contentSection(
        'Add State',
        'At this point, we have a semi-working app that can store todos in memory, but doesn\'t display them.',
        'To get our ui to automatically update when a todo is added, we will use the fnstate and bindAs functions to turn our todo storage into a bindable state object.',
        div( 'Change the contents of ', strong( 'todo.js' ), ' to the following.' ),
        'The key changes are the fnstate import, the change of todos type and being passed to fnstate, and the way the new todo is added in the onsubmit function.',
        prismCode( `import { route, routeSwitch, fnstate } from './fntags.js'
import { form, input, li, ul, div } from './fnelements.js'

//This is now a state object that can be bound to by other components
//and shared throughout the app 
export const todos = fnstate({list: []})

const Todo = ( todo ) => li( todo )

const todoInput = input()

const AddTodo = () => form(
    {
        onsubmit: ( e ) => {
            e.preventDefault()
            //In order to trigger a change and update the bound components, the list property has to actually be changed
            //It is not enough to add the value to the array, as the proxy does not perform a deep watch
            todos.list = todos.list.concat( todoInput.value )
            todoInput.value = ''
        }
    },
    todoInput,
    input({type:'submit', value:'Add'})
)

export default div(
    routeSwitch(
        //This now references todos.list instead of todos directly
        route( { path: '/todo', absolute: true }, ul( todos.list.map( Todo ) ) ),
        route( { path: '/todo/new', absolute: true }, AddTodo )
    )
)
` )
    ),
    contentSection( 'Deep Linking to Stateful Components' )
)