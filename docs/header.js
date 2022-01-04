import { fnlink, pathState } from './lib/fnroute.mjs'
import { div, header, nav, span } from './lib/fnelements.mjs'
import { primaryColor, secondaryColor } from './constants.js'
import { routeNavItems } from './routes.js'
import { fnstate } from './lib/fntags.mjs'

const headings = [
  'an awesome f\'n framework',
  'build f\'n web apps',
  'no more f\'n build tools',
  'write less f\'n code',
  'super f\'n fast',
  'very f\'n small'
]

const currentHeading = fnstate(0)

setInterval(() => {
  let next = currentHeading() + 1
  if (next >= headings.length) {
    next = 0
  }
  currentHeading(next)
}, 3000)

export default header({ class: 'container text-center' },
  div({ class: 'flex-center', style: 'padding-bottom: 10px; flex-wrap: wrap; flex-direction: column' },
    div(fnlink({ style: { cursor: 'pointer', color: 'inherit', 'text-decoration': 'none' }, to: '/' },
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
        }, 'fntags')
      ))),
    div({ style: 'font-size: 18px; margin-left: 5px' }, currentHeading.bindAs(() => headings[currentHeading()]))
  ),
  nav({ class: 'flex-center', style: 'border-bottom: solid 1px darkgray; background-color: ' + primaryColor },
    div({ class: 'flex-center noselect' }, ...routeNavItems()))
)
