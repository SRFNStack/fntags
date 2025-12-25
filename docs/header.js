import { fnlink, pathState } from './lib/fnroute.mjs'
import { div, header, nav, span, style } from './lib/fnelements.mjs'
import { primaryColor, secondaryColor } from './constants.js'
import { routeNavItems } from './routes.js'
import { fnstate } from './lib/fntags.mjs'
import { searchBar } from './search.js'

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
            fontSize: '24px',
            color:
              pathState().currentPath === '/' || pathState().currentPath === pathState().rootPath
                ? secondaryColor
                : ''
          }
        }, 'fntags')
      ))),
    div({ style: 'font-size: 18px; margin-left: 5px' }, currentHeading.bindAs(() => headings[currentHeading()]))
  ),
  nav({
    class: 'flex-center',
    style: `border-bottom: solid 1px darkgray; background-color: ${primaryColor}; position: relative; padding: 0 10px;`
  },
  div({ class: 'flex-center noselect', style: 'flex-grow: 1; flex-wrap: wrap;' }, ...routeNavItems()),
  div({ style: 'position: absolute; right: 10px;' }, searchBar())
  ), // Add mobile layout adjustment
  style(`
    @media (max-width: 600px) {
        nav { flex-direction: column !important; padding-bottom: 10px !important; }
        nav > div:last-child { position: static !important; margin-top: 10px; }
    }
  `)
)
