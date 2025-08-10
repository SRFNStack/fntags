import { goTo, pathState } from './lib/fnroute.mjs'
import { h3, hr, p, section, span } from './lib/fnelements.mjs'

export default (title, ...content) => section(
  h3({ id: title }, title,
    span({
      style: 'cursor: pointer',
      title,
      onclick: (e) => {
        goTo(`${pathState().currentPath}#${encodeURIComponent(title)}`)
      }
    },
    ' \uD83D\uDD17'
    )),
  ...content.map(c => typeof c === 'string' ? p(c) : c),
  hr()
)
