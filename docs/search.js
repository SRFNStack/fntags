import { div, input, ul, li } from './lib/fnelements.mjs'
import { fnstate } from './lib/fntags.mjs'
import { svg, path } from './lib/svgelements.mjs'
import { routes } from './routes.js'
import { goTo } from './lib/fnroute.mjs'
import { secondaryColor } from './constants.js'

const searchIndex = []
let indexed = false

const indexContent = () => {
  if (indexed) return
  indexed = true

  // Defer indexing to avoid blocking main thread on load
  setTimeout(() => {
    routes.forEach(route => {
      if (route.url === '.*') return // Skip 404

      let element = route.component
      if (typeof element === 'function') {
        try {
          element = element()
        } catch (e) {
          console.warn('Could not index route', route.url, e)
          return
        }
      }

      const pageTitle = route.linkText || (route.url === '/' ? 'Home' : route.url)
      let mainContent = ''

      // Index individual sections if they exist
      Array.from(element.children).forEach(child => {
        let isSection = false
        if (child.tagName === 'SECTION') {
          const h3 = child.querySelector('h3')
          if (h3 && h3.id) {
            isSection = true
            const title = h3.id
            const text = child.textContent || ''
            searchIndex.push({
              url: `${route.url}#${encodeURIComponent(title)}`,
              title: `${pageTitle} > ${title}`,
              content: text.toLowerCase()
            })
          }
        }

        if (!isSection) {
          mainContent += (child.textContent || '') + ' '
        }
      })

      // Index the rest of the page content
      if (mainContent.trim()) {
        searchIndex.push({
          url: route.url,
          title: pageTitle,
          content: mainContent.toLowerCase()
        })
      }
    })
  }, 500)
}

export const searchBar = () => {
  indexContent()

  const query = fnstate('')
  const results = fnstate([], res => res.url)
  const focused = fnstate(false)
  const expanded = fnstate(false)
  const showResults = fnstate(false)

  const updateShow = () => showResults(results().length > 0 && (focused() || expanded()))
  results.subscribe(updateShow)
  focused.subscribe(updateShow)

  query.subscribe(q => {
    if (!q || q.length < 2) {
      results([])
      return
    }
    const lowerQ = q.toLowerCase()
    const res = searchIndex.filter(item => item.content.includes(lowerQ))
    results(res.slice(0, 5)) // Limit to 5 results
  })

  const handleSelect = (url) => {
    goTo(url)
    query('')
    results([])
    focused(false)
    expanded(false)
  }

  const collapse = () => {
    setTimeout(() => {
      if (!focused()) {
        expanded(false)
        query('')
        results([])
      }
    }, 200)
  }

  const searchInput = input({
    type: 'text',
    placeholder: 'Search docs...',
    value: query.bindAttr(),
    oninput: (e) => query(e.target.value),
    onfocus: () => focused(true),
    onblur: () => {
      focused(false)
      collapse()
    },
    style: {
      padding: '6px 8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      width: '180px',
      fontSize: '14px',
      display: expanded.bindStyle(() => expanded() ? 'block' : 'none')
    }
  })

  return div(
    { style: 'position: relative; display: flex; align-items: center;' },
    div({
      style: {
        cursor: 'pointer',
        fontSize: '18px',
        padding: '4px 8px',
        display: expanded.bindStyle(() => expanded() ? 'none' : 'block')
      },
      onclick: () => {
        expanded(true)
        setTimeout(() => searchInput.focus(), 0)
      },
      title: 'Search docs'
    }, svg({
      fill: 'none',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5',
      stroke: 'currentColor',
      width: '20',
      height: '20'
    }, path({
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
    }))),
    searchInput,
    div(
      {
        style: {
          display: showResults.bindStyle(() => showResults() ? 'block' : 'none'),
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '300px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '0 0 4px 4px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: '1000',
          maxHeight: '400px',
          overflowY: 'auto'
        }
      },
      results.bindChildren(
        ul({ style: 'list-style: none; margin: 0; padding: 0;' }),
        (resState) => li(
          {
            style: 'padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;',
            onmouseenter: (e) => { e.target.style.backgroundColor = '#f5f5f5' },
            onmouseleave: (e) => { e.target.style.backgroundColor = 'white' },
            onclick: () => handleSelect(resState().url)
          },
          div({ style: `font-weight: bold; color: ${secondaryColor}` }, resState.bindProp('title')),
          div({ style: 'font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' },
            resState.bindAs(r => {
              const idx = r.content.indexOf(query().toLowerCase())
              const start = Math.max(0, idx - 20)
              const end = Math.min(r.content.length, idx + 40)
              return (start > 0 ? '...' : '') + r.content.substring(start, end) + (end < r.content.length ? '...' : '')
            })
          )
        )
      )
    )
  )
}
