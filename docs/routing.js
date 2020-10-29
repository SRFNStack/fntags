import { code, div, p } from './lib/fnelements.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection(
        'Route Elements',
        'Routes are created by using the fntags route element. They have a single required attribute, path. path can be a regular expression.',
        'If the currentRoute starts with the path followed by any of: ?, /, #, or the end of the string, the route is displayed.',
        prismCode( 'route( { path: \'/home\' })' ),
        'To require that the currentRoute matches the path exactly, set absolute: true on the attributes object',
        prismCode( 'route( { path: \'/\', absolute: true })' ),
        'Children of route elements can be functions. This is useful for re-loading dynamic content on route change.',
        prismCode( `route(
    { path: \'/\', absolute: true },
    ()=>new Date().toString()
)` ),
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
        prismCode( 'import { pathState } from \'./fntags.js\'' ),
        'pathState is a state function that contains information about the path',
        prismCode(
            'pathState() ~== {\n' +
            '    rootPath: \'\',\n' +
            '    currentRoute: \'/\',\n' +
            '    context: \'secret data\'\n' +
            '}'
        ),
        'rootPath is the path the app is served from. The default is the current window path when fntags.js is loaded.',
        'currentRoute is the route the user is currently at. More precisely, it\'s the remainder of the current path after removing the root path prefix.',
        'context is the data passed as the context to fnlink or goto verbatim'
    ),
    contentSection(
        'Path Parameters',
        'Path parameters can be used for any route that does not allow unlimited slashes in the path (pretty much anything without a .*).',
        'To use, simply replace a section of the path with a variable name prefixed by a $.',
        prismCode( 'route( { path: \'/some/$snak\' } )' ),
        'The pathParameters will be updated on any route change to include an object containing the properties and their values',
        prismCode("goTo(\'/some/taco\')"),
        prismCode(
            'import {pathParameters} from \'fntags\'\n' +
            'alert(pathParameters().snak === \'taco\')'
        )
    ),
    contentSection("Deep Links",
        'Deep linking will not work correctly in cases where the same html file is served from every path.',
        p( 'For instance, when using ', code( 'try_files $uri index.html' ), ' in nginx.' ),
        'To fix this, import and call setRootPath with the appropriate root path.',
        prismCode( 'import { setRootPath ] from \'./fntags.js\'\nsetRootPath(\'/\')' )
    ),
    contentSection(
        'Route Switch Element',
        'To only display the first route of a set that is displayable for the currentRoute, use a routeSwitch element.',
        prismCode(
            'routeSwitch(\n' +
            '    route( { path: \'/\', absolute: true }, \'roooot\' ),\n' +
            '    route( { path: \'/hello\' }, \'world\' ),\n' +
            '    route( { path: \'/.*\' },\n' +
            '        h3( \'404 Page not found\' )\n' +
            '    )\n' +
            ')' )
    )
)