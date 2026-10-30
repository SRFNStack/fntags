import { describe, it, expect, afterEach } from 'vitest'
import { h, fnstate, fntemplate } from '@srfnstack/fntags'

const tpl = fntemplate(ctx => h('li', { class: ctx('cls') }, ctx('label')))

afterEach(() => {
  document.body.textContent = ''
})

const item = id => ({ id, label: 'item ' + id })
const items = ids => ids.map(item)

// Count the DOM calls that insert or move a row of parent. Nested calls (a
// method implemented through another one) count once, and calls inside a row
// (filling a new row's slots) do not count.
const insertMethods = ['insertBefore', 'appendChild', 'insertAdjacentElement', 'append', 'prepend', 'before', 'after', 'replaceWith']
function countInserts (parent, fn) {
  const probe = document.createElement('li')
  const restore = []
  let count = 0
  let depth = 0
  for (const name of insertMethods) {
    let proto = probe
    while (proto !== null && !Object.prototype.hasOwnProperty.call(proto, name)) proto = Object.getPrototypeOf(proto)
    if (proto === null) continue
    const orig = proto[name]
    proto[name] = function (...args) {
      if (depth === 0 && (this === parent || this.parentNode === parent)) count++
      depth++
      try {
        return orig.apply(this, args)
      } finally {
        depth--
      }
    }
    restore.push(() => { proto[name] = orig })
  }
  try {
    fn()
  } finally {
    for (const r of restore) r()
  }
  return count
}

function makeList (ids) {
  const data = fnstate(items(ids), d => d.id)
  const runs = []
  const ul = data.bindRows(h('ul'), tpl, {
    values: (it, selected) => {
      runs.push(it.id)
      return { label: it.label, cls: selected === it.id ? 'on' : '' }
    }
  })
  document.body.append(ul)
  return { data, ul, runs }
}

const nodesById = ul => new Map([...ul.children].map(n => [n.textContent, n]))

// Minimal number of inserts and moves to get from oldIds to newIds: every new
// id is inserted once, and every survivor outside a longest increasing
// subsequence of old positions is moved once.
function minimalInserts (oldIds, newIds) {
  const oldPos = new Map(oldIds.map((id, i) => [id, i]))
  const seq = newIds.filter(id => oldPos.has(id)).map(id => oldPos.get(id))
  const tails = []
  for (const v of seq) {
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (tails[mid] < v) lo = mid + 1
      else hi = mid
    }
    tails[lo] = v
  }
  return (newIds.length - seq.length) + (seq.length - tails.length)
}

// Apply newIds to the list and check order, identity and the insert count.
function check (list, newIds, expectedInserts) {
  const { data, ul } = list
  const oldIds = data().map(d => d.id)
  const before = nodesById(ul)
  const prevItems = new Map(data().map(d => [d.id, d]))
  const count = countInserts(ul, () => data(newIds.map(id => prevItems.get(id) || item(id))))
  expect([...ul.children].map(n => n.textContent)).toEqual(newIds.map(id => 'item ' + id))
  for (const [text, node] of nodesById(ul)) {
    if (before.has(text)) expect(node).toBe(before.get(text))
  }
  for (const [text, node] of before) {
    if (!newIds.includes(+text.slice(5))) expect(node.parentNode).toBe(null)
  }
  const expected = expectedInserts === undefined ? minimalInserts(oldIds, newIds) : expectedInserts
  expect(count).toBe(expected)
  return count
}

const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i)

function mulberry32 (seed) {
  return function () {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function shuffle (rand, ids) {
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const t = ids[i]
    ids[i] = ids[j]
    ids[j] = t
  }
  return ids
}

describe('bindRows reconcile', () => {
  it('makes no DOM calls when the order is unchanged', () => {
    const list = makeList(range(0, 10))
    check(list, range(0, 10), 0)
  })

  it('swaps two distant rows with two moves', () => {
    const list = makeList(range(0, 1000))
    const ids = range(0, 1000)
    ids[1] = 998
    ids[998] = 1
    list.runs.length = 0
    check(list, ids, 2)
    expect(list.runs).toEqual([])
    check(list, range(0, 1000), 2)
  })

  it('swaps two adjacent rows with one move', () => {
    const list = makeList(range(0, 10))
    check(list, [0, 1, 2, 4, 3, 5, 6, 7, 8, 9], 1)
  })

  it('moves a single row with one move', () => {
    const list = makeList(range(0, 10))
    check(list, [...range(1, 10), 0], 1)
    check(list, range(0, 10), 1)
    check(list, [0, 1, 7, 2, 3, 4, 5, 6, 8, 9], 1)
  })

  it('reverses', () => {
    const list = makeList(range(0, 10))
    check(list, range(0, 10).reverse(), 9)
  })

  it('shuffles', () => {
    const list = makeList(range(0, 50))
    check(list, shuffle(mulberry32(7), range(0, 50)))
  })

  it('removes the first, last and a middle row without moves', () => {
    const list = makeList(range(0, 10))
    check(list, range(1, 10), 0)
    check(list, range(1, 9), 0)
    check(list, [1, 2, 3, 5, 6, 7, 8], 0)
    check(list, [1, 8], 0)
  })

  it('inserts at the front, middle and end', () => {
    const list = makeList(range(0, 5))
    check(list, [100, ...range(0, 5)], 1)
    check(list, [100, 0, 1, 101, 102, 2, 3, 4], 2)
    check(list, [100, 0, 1, 101, 102, 2, 3, 4, 103], 1)
  })

  it('keeps foreign nodes after the rows in place', () => {
    const list = makeList(range(0, 3))
    const foot = h('li', 'foot')
    list.ul.append(foot)
    list.data(items([2, 0, 1, 3]))
    expect([...list.ul.children].map(n => n.textContent)).toEqual(['item 2', 'item 0', 'item 1', 'item 3', 'foot'])
  })

  it('re-runs values only for rows whose item reference changed', () => {
    const list = makeList(range(0, 6))
    list.runs.length = 0
    const next = list.data().slice().reverse()
    next[2] = { ...next[2], label: 'changed' }
    list.data(next)
    expect(list.runs).toEqual([next[2].id])
    expect(list.ul.children[2].textContent).toBe('changed')
  })

  it('throws on a repeated item reference and recovers', () => {
    const list = makeList(range(0, 4))
    const prev = list.data()
    const before = [...list.ul.children]
    expect(() => list.data([item(50), prev[0], prev[2], prev[0]])).toThrow(/Duplicate keys/)
    expect(list.data()).toBe(prev)
    expect([...list.ul.children]).toEqual(before)
    check(list, [3, 51, 2, 1, 0])
  })

  it('keeps selection while reordering', () => {
    const list = makeList(range(0, 5))
    list.data.select(3)
    list.data(list.data().slice().reverse())
    expect(list.ul.children[1].className).toBe('on')
  })

  it('matches the data order for random permutations, insertions and removals', () => {
    const rand = mulberry32(12345)
    let nextId = 1000
    for (let round = 0; round < 40; round++) {
      const list = makeList(range(0, Math.floor(rand() * 30)))
      for (let step = 0; step < 25; step++) {
        let ids = list.data().map(d => d.id)
        const op = rand()
        if (op < 0.2 && ids.length > 1) {
          // swap two rows
          const a = Math.floor(rand() * ids.length)
          let b = Math.floor(rand() * ids.length)
          if (a === b) b = (a + 1) % ids.length
          const t = ids[a]
          ids[a] = ids[b]
          ids[b] = t
          expect(check(list, ids)).toBe(Math.abs(a - b) === 1 ? 1 : 2)
          continue
        }
        if (op < 0.35) {
          // move one row
          if (ids.length > 1) {
            const [moved] = ids.splice(Math.floor(rand() * ids.length), 1)
            ids.splice(Math.floor(rand() * (ids.length + 1)), 0, moved)
          }
        } else if (op < 0.55) {
          ids = ids.filter(() => rand() > 0.3)
        } else if (op < 0.75) {
          const add = Math.floor(rand() * 5) + 1
          for (let i = 0; i < add; i++) ids.splice(Math.floor(rand() * (ids.length + 1)), 0, nextId++)
        } else if (op < 0.95) {
          // shuffle a random window, with some removals and an insertion
          const from = Math.floor(rand() * (ids.length + 1))
          const to = from + Math.floor(rand() * (ids.length - from + 1))
          const win = shuffle(rand, ids.slice(from, to).filter(() => rand() > 0.15))
          if (rand() < 0.5) win.splice(Math.floor(rand() * (win.length + 1)), 0, nextId++)
          ids.splice(from, to - from, ...win)
        }
        check(list, ids)
      }
      document.body.textContent = ''
    }
  })
})
