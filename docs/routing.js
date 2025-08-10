import { code, div, p } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
  contentSection(
    'Static Pattern Routing: Route Elements',
    'Static routes are created by using the fntags route element. They have a single required attribute, path. path can be a regular expression.',
    'If the currentRoute starts with the path followed by any of: ?, /, #, or the end of the string, the route is displayed.',
    prismCode('route( { path: \'/home\' })'),
    'To require that the currentRoute matches the path exactly, set absolute: true on the attributes object',
    prismCode('route( { path: \'/\', absolute: true })'),
    'Children of route elements can be functions. This is useful for re-loading dynamic content on route change.',
    prismCode(`route(
    { path: '/', absolute: true },
    ()=>new Date().toString()
)`)
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
            ')')
  ),
  contentSection(
    'Navigating',
    'To navigate within the app, either create an fnlink element or import and call the goTo function.',
    'fnlink has a single required attribute, \'to\' that is the route to navigate to. You can additionally provide a context property that can be accessed from the pathState.',
    prismCode(`fnlink( {
        to: '/home',
        context: { key:'this is handy' }
    },
    'Home'
)`),
    'goTo takes the route to navigate to and optionally a context as the second.',
    prismCode('goTo(\'/home\', {\'some\':\'datazzz\')')
  ),
  contentSection(
    'Path State',
    'pathState can be imported and bound to in order to listen to path changes.',
    prismCode('import { pathState } from \'./fntags.mjs\''),
    'pathState is a state function that contains information about the path',
    prismCode(
      'pathState() ~== {\n' +
            '    rootPath: \'\',\n' +
            '    currentPath: \'/\',\n' +
            '    context: \'secret data\'\n' +
            '}'
    ),
    'rootPath is the path the app is served from. The default is the current window path when fntags.mjs is loaded.',
    'currentPath is the route the user is currently at. More precisely, it\'s the remainder of the current path after removing the root path prefix.',
    'context is the data passed as the context to fnlink or goto verbatim'
  ),
  contentSection(
    'Path Parameters',
    'Path parameters can be used for any route that does not allow unlimited slashes in the path (pretty much anything without a .*).',
    'Path parameters are represented in the path directly using a colon as a key value separator. This scheme was chosen in accordance with https://tools.ietf.org/html/rfc1738#page-3',
    'The same key value separated by a colon is used for auth, setting the precedent to use it here.',
    prismCode('route( { path: \'/some/:snak\' } )'),
    'When used like the example above, the parameter will be accessible in an array called ',
    code('pathParameters().idx'),
    ' and are accessible based position. I.e.',
    'In the example above, ',
    code('pathParameters().idx[0] === "snak"'),
    'To name the parameters, add the name before the colon',
    prismCode('route( { path: \'/some/foo:bar\' } )'),
    'this results in the "foo" property of pathParameters to be set this way: ',
    code('pathParameters().foo === "bar"'),
    prismCode('goTo(\'/some/taco\')'),
    prismCode(
      'import {pathParameters} from \'fntags\'\n' +
            'alert(pathParameters().snak === \'taco\')'
    )
  ),
  contentSection(
    'Deep Links',
    'Deep linking will not work correctly in cases where the same html file is served from every path.',
    p('For instance, when using ', code('try_files $uri index.html'), ' in nginx.'),
    'To fix this, import and call setRootPath with the appropriate root path.',
    prismCode('import { setRootPath ] from \'./fntags.mjs\'\nsetRootPath(\'/\')')
  )
)
