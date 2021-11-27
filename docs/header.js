import { fnlink, pathState } from './lib/fnroute.mjs'
import { div, header, nav, span } from './lib/fnelements.mjs'
import { primaryColor, secondaryColor } from './constants.js'
import { routeNavItems } from './routes.js'

export default header({ class: 'container text-center' },
  div({ class: 'flex-center', style: 'padding-bottom: 10px; flex-wrap: wrap;' },
    fnlink({ style: { cursor: 'pointer', color: 'inherit', 'text-decoration': 'none' }, to: '/' },
      pathState.bindAs(() =>
        span({
          class: 'display-font',
          style: {
            'font-size': '24px',
            color:
              pathState().currentRoute === '/' || pathState().currentRoute === pathState().rootPath
                ? secondaryColor
                : ''
          }
        }, 'fntags -')
      )),
    span({ style: 'font-size: 18px; margin-left: 5px' }, 'not your usual f\'n framework')
  ),
  nav({ class: 'flex-center', style: 'border-bottom: solid 1px darkgray; background-color: ' + primaryColor },
    div({ class: 'flex-center noselect' }, ...routeNavItems()))
)
