import { fnstate } from '@srfnstack/fntags'
import { div, button, span, h2 } from '@srfnstack/fntags/fnelements'

const count = fnstate(0)

export const Counter = () =>
  div(
    h2('Counter'),
    div(
      { style: 'display: flex; align-items: center;' },
      button({ onclick: () => count(count() - 1) }, '-'),
      span({ class: 'count' }, count.bindAs(n => `${n}`)),
      button({ onclick: () => count(count() + 1) }, '+')
    ),
    div({ class: 'message' }, 'Edit this file and save — the count stays the same.')
  )
