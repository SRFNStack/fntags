// Allocation / timing micro experiments, driven from profile.mjs via page.evaluate.
// Each experiment builds N things, parks them on window.__hold so the driver can
// force a GC and read usedJSHeapSize while they are alive, then the driver calls
// release(). Timing is the synchronous build time in ms.
import { fnstate, fntemplate, h } from '/src/fntags.mjs'

const A = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean']
const label = i => `${A[i % A.length]} red table`

// Same shape as the benchmark row template (Main.js), bindings as placeholders.
const row = fntemplate(ctx =>
  h('tr', { id: ctx('id'), class: ctx('rowClass'), onclick: ctx('rowClick') },
    h('td', { class: 'col-md-1' }, ctx('id')),
    h('td', { class: 'col-md-4' }, h('a', { class: 'lbl' }, ctx('label'))),
    h('td', { class: 'col-md-1' },
      h('a', h('span', { onclick: ctx('removeRow'), class: 'glyphicon glyphicon-remove', 'aria-hidden': 'true' }))
    ),
    h('td', { class: 'col-md-6' })
  )
)

// A static tr with no placeholders at all: pure cloneNode cost.
const staticRow = fntemplate(() =>
  h('tr', { id: '1', class: '' },
    h('td', { class: 'col-md-1' }, '1'),
    h('td', { class: 'col-md-4' }, h('a', { class: 'lbl' }, 'static label')),
    h('td', { class: 'col-md-1' }, h('a', h('span', { class: 'glyphicon glyphicon-remove', 'aria-hidden': 'true' }))),
    h('td', { class: 'col-md-6' })
  )
)

const noop = () => {}

// Local re-implementation of fntemplate's populate step that resolves binding targets with
// firstChild/nextSibling instead of childNodes[i] (which materialises a NodeList wrapper per
// visited parent). Same template shape as `row` above. Used only for the A/B below.
function templateNoNodeList (templateFn) {
  const bindingsByPath = []
  const initContext = prop => {
    const placeholder = (element, type, attr) => {
      if (!element._tpl_bind) element._tpl_bind = []
      element._tpl_bind.push({ prop, type, attr })
    }
    placeholder.isTemplatePlaceholder = true
    return placeholder
  }
  const root = templateFn(initContext)
  const traverse = (node, path) => {
    if (node._tpl_bind) { bindingsByPath.push({ path: [...path], binds: node._tpl_bind }); delete node._tpl_bind }
    let child = node.firstChild; let i = 0
    while (child) { traverse(child, [...path, i]); child = child.nextSibling; i++ }
  }
  traverse(root, [])
  return (context) => {
    const clone = root.cloneNode(true)
    for (let i = 0; i < bindingsByPath.length; i++) {
      const entry = bindingsByPath[i]
      let target = clone
      const path = entry.path
      for (let j = 0; j < path.length; j++) {
        target = target.firstChild
        for (let k = path[j]; k > 0; k--) target = target.nextSibling
      }
      const binds = entry.binds
      for (let j = 0; j < binds.length; j++) {
        const b = binds[j]
        const val = context[b.prop]
        if (b.type === 'node') {
          if (typeof val !== 'object' && typeof val !== 'function') target.replaceWith(document.createTextNode(val + ''))
          else target.replaceWith(typeof val === 'function' ? val() : val)
        } else if (b.type === 'attr') {
          if (typeof val === 'function') target.addEventListener(b.attr.substring(2), val)
          else target.setAttribute(b.attr, val)
        }
      }
    }
    return clone
  }
}
const rowNoNodeList = templateNoNodeList(ctx =>
  h('tr', { id: ctx('id'), class: ctx('rowClass'), onclick: ctx('rowClick') },
    h('td', { class: 'col-md-1' }, ctx('id')),
    h('td', { class: 'col-md-4' }, h('a', { class: 'lbl' }, ctx('label'))),
    h('td', { class: 'col-md-1' },
      h('a', h('span', { onclick: ctx('removeRow'), class: 'glyphicon glyphicon-remove', 'aria-hidden': 'true' }))
    ),
    h('td', { class: 'col-md-6' })
  )
)

// Insertion A/B needs a tbody that is attached to the document like the benchmark's.
function liveTbody () {
  const table = document.querySelector('table') || document.body.appendChild(document.createElement('table'))
  const tbody = document.createElement('tbody')
  table.append(tbody)
  return tbody
}

const experiments = {
  // 0. insertion strategy A/B (static clones, attached tbody): the arrange loop inserts back to
  //    front with insertAdjacentElement('beforebegin') one row at a time.
  'insert: insertAdjacentElement beforebegin, back to front (live tbody)': n => {
    const tbody = liveTbody()
    let prev = null
    for (let i = 0; i < n; i++) {
      const tr = staticRow()
      if (prev === null) tbody.append(tr); else prev.insertAdjacentElement('beforebegin', tr)
      prev = tr
    }
    tbody.remove()
    return tbody
  },
  'insert: append forward one by one (live tbody)': n => {
    const tbody = liveTbody()
    for (let i = 0; i < n; i++) tbody.append(staticRow())
    tbody.remove()
    return tbody
  },
  'insert: build DocumentFragment, one append (live tbody)': n => {
    const tbody = liveTbody()
    const frag = document.createDocumentFragment()
    for (let i = 0; i < n; i++) frag.append(staticRow())
    tbody.append(frag)
    tbody.remove()
    return tbody
  },
  'template plain values, firstChild walk (no NodeList)': n => {
    const tbody = document.createElement('tbody')
    for (let i = 0; i < n; i++) {
      tbody.append(rowNoNodeList({ id: i, label: label(i), rowClass: '', rowClick: noop, removeRow: noop }))
    }
    return tbody
  },
  // 1. fnstate() alone: the per-item state object created in arrangeElements
  fnstate: n => {
    const out = new Array(n)
    for (let i = 0; i < n; i++) out[i] = fnstate({ id: i, label: label(i) })
    return out
  },
  // 1b. fnstate + the subscribe arrangeElements adds for every item
  'fnstate+subscribe': n => {
    const out = new Array(n)
    for (let i = 0; i < n; i++) {
      const s = fnstate({ id: i, label: label(i) })
      s.parentCtx = null
      s.subscribe(noop)
      out[i] = s
    }
    return out
  },
  // 2. cloneNode of the static template only, appended to a detached tbody
  'clone static': n => {
    const tbody = document.createElement('tbody')
    for (let i = 0; i < n; i++) tbody.append(staticRow())
    return tbody
  },
  // 3. template populated with plain values (no fnstate, no bindings)
  'template plain values': n => {
    const tbody = document.createElement('tbody')
    for (let i = 0; i < n; i++) {
      tbody.append(row({ id: i, label: label(i), rowClass: '', rowClick: noop, removeRow: noop }))
    }
    return tbody
  },
  // 3b. same, plus the `.key` expando arrangeElements sets on every row
  'template plain values + key expando': n => {
    const tbody = document.createElement('tbody')
    for (let i = 0; i < n; i++) {
      const tr = row({ id: i, label: label(i), rowClass: '', rowClick: noop, removeRow: noop })
      tr.key = i
      tbody.append(tr)
    }
    return tbody
  },
  // 3c. static clone + key expando only (isolates the expando from template population)
  'clone static + key expando': n => {
    const tbody = document.createElement('tbody')
    for (let i = 0; i < n; i++) {
      const tr = staticRow()
      tr.key = i
      tbody.append(tr)
    }
    return tbody
  },
  // 3d. static clone, no expando, but read .key on previousSibling like the arrange loop does
  'clone static + read .key on siblings': n => {
    const tbody = document.createElement('tbody')
    let prev = null
    let acc = 0
    for (let i = 0; i < n; i++) {
      const tr = staticRow()
      if (prev && prev.previousSibling && prev.previousSibling.key !== undefined) acc++
      tbody.append(tr)
      prev = tr
    }
    tbody.__acc = acc
    return tbody
  },
  // 4. template with the benchmark bindings but a plain fnstate per row (no bindChildren)
  'template + fnstate + bindAs + bindSelectAttr': n => {
    const tbody = document.createElement('tbody')
    const parent = fnstate([], d => d.id)
    const parentCtx = parent._ctx
    for (let i = 0; i < n; i++) {
      const item = fnstate({ id: i, label: label(i) })
      item.parentCtx = parentCtx
      tbody.append(row({
        id: item().id,
        label: item.bindAs(() => item().label),
        rowClass: item.bindSelectAttr(() => parent.selected() === item().id ? 'danger' : ''),
        rowClick: () => parent.select(item().id),
        removeRow: e => { e.stopPropagation() }
      }))
    }
    tbody.__parent = parent
    return tbody
  },
  // 5. the real thing: bindChildren on a detached tbody, exactly the Main.js builder
  'bindChildren full (detached tbody)': n => {
    const data = fnstate([], d => d.id)
    const items = new Array(n)
    for (let i = 0; i < n; i++) items[i] = { id: i + 1, label: label(i) }
    const tbody = data.bindChildren(h('tbody'), item =>
      row({
        id: item().id,
        label: item.bindAs(() => item().label),
        rowClass: item.bindSelectAttr(() => data.selected() === item().id ? 'danger' : ''),
        rowClick: () => data.select(item().id),
        removeRow: e => { e.stopPropagation(); data(data().filter(d => d().id !== item().id)) }
      })
    )
    data(items)
    tbody.__data = data
    return tbody
  }
}

window.__exp = {
  names: Object.keys(experiments),
  run (name, n) {
    const fn = experiments[name]
    const t0 = performance.now()
    const result = fn(n)
    const t1 = performance.now()
    window.__hold = result
    return t1 - t0
  },
  release () {
    window.__hold = null
  }
}
