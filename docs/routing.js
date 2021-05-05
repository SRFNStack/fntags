import { a, code, div, hr, p } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection(
        'Dynamic Path Based Routing: modRouter',
        'The modRouter enables directory based routing in the ui by lazy loading routes using dynamic module imports.' +
        ' This means it\'s un-necessary to define routes, as they are resolved to paths on the server instead.',
        'To use modRouter, first, set the root path of your app to the appropriate root. This will ensure that paths resolve correctly, though is not strictly necessary.',
        prismCode( `
import { modRouter, setRootPath } from './lib/fnroute.mjs'

setRootPath('/')
` ),
        'Then, create a mod router and place it wherever you would normally place an html element.',
        prismCode( `document.body.append( modRouter( { routePath: '/ui' } ) )` ),
        'The routePath is used to resolve modules for the route. When the location changes, the current route is appended to the routePath and dynamically imported. ' +
        'For example, if the application\'s rootPath is set to "/" and modRouter\'s routePath is set to "/ui", ' +
        'when the user navigates to /foo/bar, the module located at /ui/foo/bar will be imported and loaded.',
        hr(),
        'The route module\'s default export must be an html element, or a function that returns one in order for the route to load.',
        'For example serving the following file at /ui/hello:',
        prismCode( `
import {div} from '../lib/fnelements.mjs'
export default div('hello world')
` ),
        'would cause the default hello world div to be loaded when a user navigates to /hello.',
        hr(),
        'Usually you want the route be rebuilt each time time it\'s navigated to, to do this make the default export a function.',
        prismCode( `
import {div} from '../lib/fnelements.mjs'
export default ()=>div('hello world')
` ),
        hr(),
        'When using ',a({href:'#Path%20Parameters'},'path parameters'), 'only the name of the parameter is used in the path by default. For example:',
        prismCode( '/app/user/id:1234' ),
        'gets imported from the backed using the following path',
        prismCode( '/app/user/id' ),
        'To disable this, set sendRawPath true on modRouter.',
        prismCode( `modRouter({routePath: '/ui', sendRawPath: true})` ),
        hr(),
        'To wrap the route with common elements like navigation, set the frame option to a function.',
        'The frame function receives the rendered element as the first argument, and the module object as the second. This function must return an element, or function that returns an element.',
        prismCode( `modRouter({routePath: '/ui', frame: (route, module)=> div('menu', route, module.extraElements)})` ),
        'For authentication, it\'s recommended that the route modules export a const like requiresAuth and an array for roles or other identifying information. This allows you to ' +
        'redirect or display an error if needed during the frame execution. An example implementation might look this:',
        prismCode( `
modRouter({
    routePath: '/ui',
    frame: (route, module) => {
        if(!authenticated() && pathState().currentRoute !== '/login' && module.requiresAuth) {
            redirectToLogin()
            return
        }
        if(module.roles && !hasAnyRole(userRoles(), module.roles)) {
            return forbidden()
        }
        return div('menu', route, module.extraElements)
    }
})
` ),
        'To handle errors during import, or errors rendering the route, pass an onerror function. It receives the error, the container div, and can return an ',
        prismCode( `modRouter({routePath: '/ui', onerror: (route, module)=> div('menu', route, module.extraElements)})` )
    ),
    contentSection(
        'Static Pattern Routing: Route Elements',
        'Static routes are created by using the fntags route element. They have a single required attribute, path. path can be a regular expression.',
        'If the currentRoute starts with the path followed by any of: ?, /, #, or the end of the string, the route is displayed.',
        prismCode( 'route( { path: \'/home\' })' ),
        'To require that the currentRoute matches the path exactly, set absolute: true on the attributes object',
        prismCode( 'route( { path: \'/\', absolute: true })' ),
        'Children of route elements can be functions. This is useful for re-loading dynamic content on route change.',
        prismCode( `route(
    { path: \'/\', absolute: true },
    ()=>new Date().toString()
)` )
    ),
    contentSection(
        'Static Pattern Routing: Route Switch Element',
        'To only display the first route of a set that is displayable for the currentRoute, use a routeSwitch element.',
        prismCode(
            'routeSwitch(\n' +
            '    route( { path: \'/\', absolute: true }, \'roooot\' ),\n' +
            '    route( { path: \'/hello\' }, \'world\' ),\n' +
            '    route( { path: \'/.*\' },\n' +
            '        h3( \'404 Page not found\' )\n' +
            '    )\n' +
            ')' )
    ),
    contentSection(
        'Navigating',
        'To navigate within the app, either create an fnlink element or import and call the goTo function.',
        'fnlink has a single required attribute, \'to\' that is the route to navigate to. You can additionally provide a context property that can be accessed from the pathState.',
        prismCode( `fnlink( {
        to: \'/home\',
        context: { key:\'this is handy\' }
    },
    \'Home\'
)` ),
        'goTo takes the route to navigate to and optionally a context as the second.',
        prismCode( 'goTo(\'/home\', {\'some\':\'datazzz\')' )
    ),
    contentSection(
        'Path State',
        'pathState can be imported and bound to in order to listen to path changes.',
        prismCode( 'import { pathState } from \'./fntags.mjs\'' ),
        'pathState is a state function that contains information about the path',
        prismCode(
            'pathState() ~== {\n' +
            '    rootPath: \'\',\n' +
            '    currentRoute: \'/\',\n' +
            '    context: \'secret data\'\n' +
            '}'
        ),
        'rootPath is the path the app is served from. The default is the current window path when fntags.mjs is loaded.',
        'currentRoute is the route the user is currently at. More precisely, it\'s the remainder of the current path after removing the root path prefix.',
        'context is the data passed as the context to fnlink or goto verbatim'
    ),
    contentSection(
        'Path Parameters',
        'Path parameters can be used for any route that does not allow unlimited slashes in the path (pretty much anything without a .*).',
        'Path parameters are represented in the path directly using a colon as a key value separator. This scheme was chosen in accordance with https://tools.ietf.org/html/rfc1738#page-3',
        'The same key value separated by a colon is used for auth, setting the precedent to use it here.',
        prismCode( 'route( { path: \'/some/:snak\' } )' ),
        'When used like the example above, the parameter will be accessible in an array called ',
        code( 'pathParameters().idx' ),
        ' and are accessible based position. I.e.',
        'In the example above, ',
        code( 'pathParameters().idx[0] === "snak"' ),
        'To name the parameters, add the name before the colon',
        prismCode( 'route( { path: \'/some/foo:bar\' } )' ),
        'this results in the "foo" property of pathParameters to be set this way: ',
        code( 'pathParameters().foo === "bar"' ),
        prismCode( 'goTo(\'/some/taco\')' ),
        prismCode(
            'import {pathParameters} from \'fntags\'\n' +
            'alert(pathParameters().snak === \'taco\')'
        )
    ),
    contentSection(
        'Deep Links',
        'Deep linking will not work correctly in cases where the same html file is served from every path.',
        p( 'For instance, when using ', code( 'try_files $uri index.html' ), ' in nginx.' ),
        'To fix this, import and call setRootPath with the appropriate root path.',
        prismCode( 'import { setRootPath ] from \'./fntags.mjs\'\nsetRootPath(\'/\')' )
    ),
)
