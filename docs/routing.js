import { code, div, p } from './fnelements.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection(
        'Route Elements',
        'Routes are created by using the fntags route element. They have a single required attribute, path. path can be a regular expression.',
        'If the currentRoute starts with the path followed by any of: ?, /, #, or the end of the string, the route is displayed.',
        prismCode( 'route( { path: \'/home\' })' ),
        'To require that the currentRoute matches the path exactly, set absolute: true on the attributes object',
        prismCode( 'route( { path: \'/\', absolute: true })' )
    ),
    contentSection(
        'Navigating',
        'To navigate within the app, either create an fnlink element or import and call the goTo function.',
        'fnlink has a single required attribute, \'to\' that is the route to navigate to.',
        prismCode( 'fnlink({to: \'/home\'}, \'Home\')' ),
        'goTo takes the route to navigate to as the only parameter.',
        prismCode( 'goTo(\'/home\')' )
    ),
    contentSection(
        'Path State',
        'pathState can be imported and bound to in order to listen to path changes.',
        prismCode( 'import { pathState } from \'./fntags.js\'' ),
        'pathState has a single property, info.',
        prismCode(
            'pathState.info = {\n' +
            '    rootPath: \'\'\n' +
            '    currentRoute: \'/\'\n' +
            '}'
        ),
        'rootPath is the path the app is served from. The default is the current window path when fntags.js is loaded.',
        'currentRoute is the route the user is currently at. More precisely, it\'s the remainder of the current path after removing the root path prefix.',
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
            ')' ),
        "Children of routeSwitch can be functions. This allows you to nicely abstract pages to single imports and re-initialize them on route change.",
        prismCode(
            'routeSwitch(\n    route( { path: \'/hello\' }, ()=>{         const state = fnstate({a:"b"})         div(state.a)}))' ),
    )
)