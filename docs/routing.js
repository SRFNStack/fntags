import { code, div, p } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
  contentSection(
    'Routing',
    p('fntags provides a lightweight, history-API based router. It supports static routes, parameterized routes, and deep linking.'),
    p('The router is element-based, meaning you define routes as part of your component tree.')
  ),

  contentSection(
    'Defining Routes',
    p('Use the ', code('route'), ' element to define a section of the page that only renders when the URL matches a path.'),
    prismCode(
`import { route } from './lib/fnroute.mjs'

div(
    route(
        { path: '/home' },
        h1('Home Page')
    ),
    route(
        { path: '/about' },
        h1('About Page')
    )
)`
    ),
    p('By default, `path` matches if the current URL starts with the path. To enforce an exact match, use ', code('absolute: true'), '.'),
    prismCode(
`route(
    {
        path: '/',
        absolute: true
    },
    'Home'
)`
    )
  ),

  contentSection(
    'Route Switch',
    p('Use ', code('routeSwitch'), ' to display exactly one route from a list (like a switch statement). It renders the first route that matches.'),
    prismCode(
`import {
    routeSwitch,
    route
} from './lib/fnroute.mjs'

routeSwitch(
    route(
        { path: '/', absolute: true },
        'Home'
    ),
    route(
        { path: '/user' },
        'User Profile'
    ),
    // Catch-all 404
    route(
        { path: '.*' },
        'Page Not Found'
    )
)`
    )
  ),

  contentSection(
    'Navigation',
    p('Use ', code('fnlink'), ' to create standard anchor tags that navigate without reloading the page.'),
    prismCode(
`import { fnlink } from './lib/fnroute.mjs'

fnlink(
    { to: '/about' },
    'Go to About'
)`
    ),
    p('Programmatic navigation is done via ', code('goTo'), '.'),
    prismCode(
`import { goTo } from './lib/fnroute.mjs'

goTo('/profile')`
    )
  ),

  contentSection(
    'Path Parameters',
    p('You can define dynamic path segments using the standard ', code(':param'), ' syntax.'),
    prismCode(
`route(
    { path: '/user/:id' },
    UserComponent
)`
    ),
    p('Access the parameters using the ', code('pathParameters'), ' state.'),
    prismCode(
`import { pathParameters } from './lib/fnroute.mjs'

const UserComponent = () =>
    div(
        'User ID: ',
        pathParameters.bindProp('id')
    )`
    )
  ),

  contentSection(
    'Path State',
    p('The `pathState` object contains information about the current location.'),
    prismCode(
`import { pathState } from './lib/fnroute.mjs'

// pathState() structure:
// {
//    // The app root
//    rootPath: '',
//
//    // The active route path
//    currentPath: '/',
//
//    // Optional data passed via goTo
//    context: null
// }`
    )
  ),

  contentSection(
    'Routing Events',
    p('You can listen for navigation events using ', code('listenFor'), '.'),
    prismCode(
`import {
    listenFor,
    beforeRouteChange,
    afterRouteChange
} from './lib/fnroute.mjs'

listenFor(
    beforeRouteChange,
    (newPath, oldPath) => {
        console.log(
            'Navigating to:',
            newPath.currentPath
        )
    }
)`
    )
  ),

  contentSection(
    'Deep Links & SPAs',
    p('If your app is hosted in a subdirectory or if your server returns the same index.html for all paths (SPA mode), you may need to configure the root path.'),
    prismCode(
`import { setRootPath } from './lib/fnroute.mjs'

setRootPath('/my-app/')`
    )
  )
)
