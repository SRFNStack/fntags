import { fnstate } from './lib/fntags.mjs'
import { button, code, div, pre } from './lib/fnelements.mjs'

export default (sourceCode, demo, width = '450px') => {
  const isDemo = fnstate(false)

  const src = pre({
    class: 'language-js',
    style: {
      fontSize: '14px',
      width: '100%',
      display: isDemo.bindStyle(() => isDemo() ? 'none' : 'block'),
      boxSizing: 'border-box',
      boxShadow: '0px 0px 3px 0px rgba(0,0,0,0.75)'
    }
  },
  code(sourceCode.trim()))
  const demoDiv = div({
    style: {
      borderRadius: '3px',
      width: '100%',
      display: isDemo.bindStyle(() => isDemo() ? 'block' : 'none'),
      boxSizing: 'border-box',
      boxShadow: '0px 0px 3px 0px rgba(0,0,0,0.75)'
    }
  }, demo || '')

  Prism.highlightElement(src)

  return div({ style: `margin: auto; display: flex; flex-direction: column; align-items: flex-end; padding-bottom: 15px;width: ${width}; max-width: 94vw;` },
    (demo &&
      button({
        onclick: () => {
          const style = window.getComputedStyle(src)
          demoDiv.style.height = style.getPropertyValue('height')
          demoDiv.style.margin = style.getPropertyValue('margin')
          demoDiv.style.padding = style.getPropertyValue('padding')
          isDemo(!isDemo())
        },
        style: 'width: 65px; padding: 3px 0;'
      },
      isDemo.bindAs(() => isDemo() ? 'Code' : 'Demo')
      )
    ) || '',
    demoDiv,
    src
  )
}
