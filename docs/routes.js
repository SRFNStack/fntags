import start from './start.js'
import home from './home.js'
import components from './components.js'
import state from './state.js'
import fourOhFore from './404.js'
import routing from './routing.js'

import { fnlink, li, route } from './fntags.js'

const routes = [
    {url: "/", component: home, absolute: true},
    {url: "/start", linkText: 'Get Started', component: start},
    {url: "/components", linkText: 'Components', component: components},
    {url: "/state", linkText: 'State', component: state},
    {url: "/routing", linkText: 'Routing', component: routing},
    {url: ".*", component: fourOhFore}
]

export const asRoutes = ()=>routes.map((r)=> route( { fnpath: r.url, absolute: !!r.absolute }, r.component))
export const asNavItem = ()=>routes.filter(r=>r.linkText).map((r)=> li( { class: 'nav-item' },fnlink( { class: 'nav-link', to: r.url }, r.linkText )))