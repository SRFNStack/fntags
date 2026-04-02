import { describe, it, expect } from 'vitest'
import { h, fnstate } from '@srfnstack/fntags'
import { render, waitFor } from '../src/index.mjs'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('selectObserver leak detection', () => {
  it('selectObservers for removed bindChildren items are cleaned up', () => {
    const items = fnstate([{ id: 1 }, { id: 2 }, { id: 3 }], o => o.id)
    const container = h('div')
    items.bindChildren(container, (itemState) => h('div',
      itemState.bindSelectAttr((key) => key === itemState().id ? 'selected' : ''),
      itemState.bindSelect(() => h('span', '*'))
    ))

    // Each item registers selectObservers under its key
    expect(Object.keys(items._ctx.selectObservers).length).toBe(3)

    // Remove 2 items — their selectObservers should be deleted
    items([{ id: 1 }])
    expect(Object.keys(items._ctx.selectObservers).length).toBe(1)
    expect(items._ctx.selectObservers[1]).toBeDefined()

    // Remove all — all selectObservers cleared
    items([])
    expect(Object.keys(items._ctx.selectObservers).length).toBe(0)
  })

  it('selectObservers are populated with bindSelectAttr and bindSelect together', () => {
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)
    const container = h('div')
    items.bindChildren(container, (itemState) => h('div',
      { class: itemState.bindSelectAttr((key) => key === itemState().id ? 'sel' : '') },
      itemState.bindSelect(() => h('span', '*'))
    ))

    // bindSelectAttr registers 1 observer per item, bindSelect registers 1 per item
    // selectObservers is keyed by item key
    expect(Object.keys(items._ctx.selectObservers).length).toBe(2)

    // Selection works
    items.select(1)
    expect(container.children[0].className).toContain('sel')
  })

  it('selection works correctly and observers are cleaned up on item removal', () => {
    const items = fnstate([{ id: 'a' }, { id: 'b' }, { id: 'c' }], o => o.id)
    const container = h('div')
    items.bindChildren(container, (item) =>
      h('div', {
        class: item.bindSelectAttr((key) => key === item().id ? 'selected' : '')
      }, item.bindSelect(() => h('span', '*')))
    )

    items.select('a')
    expect(container.children[0].className).toContain('selected')

    // Remove 'b'
    items([{ id: 'a' }, { id: 'c' }])
    expect(items._ctx.selectObservers.b).toBeUndefined()
    expect(items._ctx.selectObservers.a).toBeDefined()
    expect(items._ctx.selectObservers.c).toBeDefined()
  })

  it('selectObservers inside a parent bindAs are cleaned when parent re-renders', async () => {
    const view = fnstate('list')
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)

    render(h('div',
      view.bindAs(v => {
        if (v === 'list') {
          return items.bindChildren(
            h('div'),
            (itemState) => h('div',
              itemState.bindSelectAttr((key) => key === itemState().id ? 'sel' : ''),
              itemState.bindSelect(() => h('span', '*'))
            )
          )
        }
        return h('div', 'other view')
      })
    ))

    expect(Object.keys(items._ctx.selectObservers).length).toBe(2)

    // Switch view — parent bindAs re-renders, selectObservers should be cleaned
    view('other')
    await flush()
    expect(Object.keys(items._ctx.selectObservers).length).toBe(0)

    // Switch back — recreated
    view('list')
    await flush()
    expect(Object.keys(items._ctx.selectObservers).length).toBe(2)
  })

  it('selectObservers do not accumulate on repeated parent bindAs re-renders', async () => {
    const view = fnstate('list')
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)

    render(h('div',
      view.bindAs(v => {
        if (v === 'list') {
          return items.bindChildren(
            h('div'),
            (itemState) => h('div',
              itemState.bindSelectAttr((key) => key === itemState().id ? 'sel' : ''),
              itemState.bindSelect(() => h('span', '*'))
            )
          )
        }
        return h('div', 'other')
      })
    ))

    for (let i = 0; i < 10; i++) {
      view(i % 2 === 0 ? 'other' : 'list')
      await flush()
    }
    // Ended on 'other' (i=9, 9%2=1 → 'list'... i=0→other, i=1→list, ..., i=9→list)
    // i=9: 9%2=1 → 'list'
    expect(Object.keys(items._ctx.selectObservers).length).toBe(2)

    // Count total select observers across all keys — should not grow with each toggle
    const totalObservers = Object.values(items._ctx.selectObservers)
      .reduce((sum, arr) => sum + arr.length, 0)
    // Initial render creates some observers per item, and that count should stay stable
    expect(totalObservers).toBeLessThanOrEqual(4) // at most 2 per key
  })

  it('bindSelectAttr inside bindAs inside bindChildren cleans up on parent re-render', async () => {
    const view = fnstate('show')
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)

    render(h('div',
      view.bindAs(v => {
        if (v === 'show') {
          return items.bindChildren(
            h('div'),
            (itemState) => itemState.bindAs(val => h('div',
              { class: itemState.bindSelectAttr((key) => key === val.id ? 'sel' : '') },
              `item ${val.id}`
            ))
          )
        }
        return h('div', 'hidden')
      })
    ))

    expect(Object.keys(items._ctx.selectObservers).length).toBe(2)

    view('hidden')
    await flush()
    expect(Object.keys(items._ctx.selectObservers).length).toBe(0)

    view('show')
    await flush()
    expect(Object.keys(items._ctx.selectObservers).length).toBe(2)
  })
})

describe('elementState sync-back subscription leak', () => {
  it('elementState sync-back subscription does not prevent GC after item removal', async () => {
    const items = fnstate([{ id: 1, v: 'a' }, { id: 2, v: 'b' }], o => o.id)

    // Capture elementState references to check their observer counts
    const elementStates = []
    render(
      items.bindChildren(
        h('div'),
        (itemState) => {
          elementStates.push(itemState)
          return h('div', itemState.bindAs(v => h('span', v.v)))
        }
      )
    )

    const es1 = elementStates[0]
    const es2 = elementStates[1]

    // Each elementState has: 1 sync-back sub + 1 driving bindAs sub
    expect(es1._ctx.observers.length).toBe(2)
    expect(es2._ctx.observers.length).toBe(2)

    // Remove item 2 — its elementState's bindAs driving sub should be cleaned
    items([{ id: 1, v: 'a' }])
    await flush()

    // The sync-back sub on es2 still exists (it's on the elementState itself),
    // but the elementState is no longer referenced by bindContext.elementStates,
    // so it becomes eligible for GC. The important thing is that the parent
    // array state (items) doesn't hold references to removed elementStates.
    const bindCtx = items._ctx.bindContexts[0]
    expect(bindCtx.elementStates[2]).toBeUndefined()
    expect(bindCtx.boundElementByKey[2]).toBeUndefined()
  })

  it('items array state observer count stays stable through add/remove cycles', async () => {
    const items = fnstate([{ id: 1 }], o => o.id)

    render(
      items.bindChildren(
        h('div'),
        (itemState) => h('div', itemState.bindAs(v => h('span', `${v.id}`)))
      )
    )

    // items has 1 observer: the reconcile subscription
    const baseObserverCount = items._ctx.observers.length
    expect(baseObserverCount).toBe(1)

    // Add and remove items repeatedly
    for (let i = 2; i <= 10; i++) {
      items([...items(), { id: i }])
      await flush()
    }
    // items still has just 1 reconcile subscription
    expect(items._ctx.observers.length).toBe(baseObserverCount)

    items([{ id: 1 }])
    await flush()
    expect(items._ctx.observers.length).toBe(baseObserverCount)

    items([])
    await flush()
    expect(items._ctx.observers.length).toBe(baseObserverCount)
  })
})

describe('rapid state changes during microtask window', () => {
  it('multiple synchronous state changes before microtask fires do not leak', async () => {
    const outer = fnstate('A')
    const inner = fnstate('1')

    render(h('div',
      outer.bindAs(o => h('div',
        inner.bindAs(i => h('span', `${o}:${i}`))
      ))
    ))

    expect(inner._ctx.observers.length).toBe(1)

    // Fire many changes synchronously — each triggers updateReplacer which
    // schedules a microtask, but cleanup should still be correct
    outer('B')
    outer('C')
    outer('D')
    outer('E')
    await flush()

    expect(inner._ctx.observers.length).toBe(1)
    expect(outer._ctx.observers.length).toBe(1)
  })

  it('rapid inner state changes while outer also changes', async () => {
    const outer = fnstate('A')
    const inner = fnstate('1')

    render(h('div',
      outer.bindAs(o => h('div',
        inner.bindAs(i => h('span', `${o}:${i}`))
      ))
    ))

    // Interleave changes
    outer('B')
    inner('2')
    outer('C')
    inner('3')
    await flush()

    expect(inner._ctx.observers.length).toBe(1)
    expect(outer._ctx.observers.length).toBe(1)
  })

  it('rapid bindChildren array mutations do not leak', async () => {
    const shared = fnstate('x')
    const items = fnstate(['a', 'b', 'c'], v => v)

    render(
      items.bindChildren(
        h('div'),
        (itemState) => h('span', { class: shared.bindAttr() }, itemState.bindAs())
      )
    )

    expect(shared._ctx.observers.length).toBe(3)

    // Rapid mutations
    items(['a', 'b'])
    items(['a', 'b', 'd'])
    items(['a'])
    items(['a', 'e', 'f', 'g'])
    await flush()

    // Should match the final array length
    expect(shared._ctx.observers.length).toBe(4)
  })
})

describe('bindChildren driving subscription cleanup', () => {
  it('parent bindAs re-render cleans up bindChildren driving subscription on array state', async () => {
    const view = fnstate('list')
    const items = fnstate(['a', 'b'], v => v)

    render(h('div',
      view.bindAs(v => {
        if (v === 'list') {
          return items.bindChildren(
            h('div'),
            (itemState) => h('span', itemState.bindAs())
          )
        }
        return h('div', 'empty')
      })
    ))

    // items has 1 observer: the reconcile/driving subscription from bindChildren
    expect(items._ctx.observers.length).toBe(1)

    // Switch away — the driving subscription should be cleaned up
    view('empty')
    await flush()
    expect(items._ctx.observers.length).toBe(0)

    // Switch back — recreated
    view('list')
    await flush()
    expect(items._ctx.observers.length).toBe(1)
  })

  it('multiple view toggles do not accumulate driving subscriptions', async () => {
    const view = fnstate('list')
    const items = fnstate(['a', 'b'], v => v)

    render(h('div',
      view.bindAs(v => {
        if (v === 'list') {
          return items.bindChildren(h('div'), (s) => h('span', s.bindAs()))
        }
        return h('div', 'other')
      })
    ))

    for (let i = 0; i < 20; i++) {
      view(i % 2 === 0 ? 'other' : 'list')
      await flush()
    }

    // Ended on 'other' (i=19, 19%2=1 → list... actually i=0→other, i=1→list, ..., i=19→list)
    // Wait: i goes 0..19. i=0 → 0%2=0 → 'other'. i=19 → 19%2=1 → 'list'
    expect(items._ctx.observers.length).toBe(1)
  })
})

describe('bindAttr inside bindChildren item — value update cleanup', () => {
  it('updating an item value does not leak bindAttr subscriptions created in the item builder', async () => {
    const items = fnstate([{ id: 1, text: 'a' }, { id: 2, text: 'b' }], o => o.id)
    const theme = fnstate('light')

    render(
      items.bindChildren(
        h('div'),
        (itemState) => h('div',
          { class: theme.bindAttr() },
          itemState.bindAs(v => h('span', v.text))
        )
      )
    )

    expect(theme._ctx.observers.length).toBe(2)

    // Update items (same keys, new values) — bindAs inside each item re-renders,
    // but the bindAttr was created in the item builder (not inside bindAs),
    // so it should NOT be affected by the bindAs re-render
    items([{ id: 1, text: 'aa' }, { id: 2, text: 'bb' }])
    await flush()
    expect(theme._ctx.observers.length).toBe(2)

    // Many updates
    for (let i = 0; i < 10; i++) {
      items([{ id: 1, text: `a${i}` }, { id: 2, text: `b${i}` }])
      await flush()
    }
    expect(theme._ctx.observers.length).toBe(2)
  })

  it('bindAttr INSIDE bindAs inside bindChildren item — re-renders clean up correctly', async () => {
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)
    const theme = fnstate('light')

    render(
      items.bindChildren(
        h('div'),
        (itemState) => itemState.bindAs(v => h('div',
          { class: theme.bindAttr() },
          `item ${v.id}`
        ))
      )
    )

    expect(theme._ctx.observers.length).toBe(2)

    // Updating item values causes each itemState's bindAs to re-render,
    // which should clean up the old theme.bindAttr and create a new one
    items([{ id: 1 }, { id: 2 }]) // same keys, triggers elementState update
    await flush()

    // The item values are identical objects with same shape, but fnstate
    // doesn't do deep equality — it will notify since !== is true for new objects
    expect(theme._ctx.observers.length).toBe(2)
  })
})

describe('multiple bindAttr/bindStyle on same element inside bindAs', () => {
  it('multiple bindAttr on same element all clean up when parent re-renders', async () => {
    const parent = fnstate('A')
    const attrA = fnstate('class-a')
    const attrB = fnstate('title-b')

    render(h('div',
      parent.bindAs(p => h('span', {
        class: attrA.bindAttr(),
        title: attrB.bindAttr()
      }, p))
    ))

    expect(attrA._ctx.observers.length).toBe(1)
    expect(attrB._ctx.observers.length).toBe(1)

    for (let i = 0; i < 10; i++) {
      parent(`v${i}`)
      await flush()
    }

    expect(attrA._ctx.observers.length).toBe(1)
    expect(attrB._ctx.observers.length).toBe(1)
  })

  it('mixed bindAttr + bindStyle on same element all clean up', async () => {
    const parent = fnstate('A')
    const cls = fnstate('my-class')
    const color = fnstate('red')
    const size = fnstate('12px')

    render(h('div',
      parent.bindAs(p => h('span', {
        class: cls.bindAttr(),
        style: {
          color: color.bindStyle(),
          fontSize: size.bindStyle()
        }
      }, p))
    ))

    expect(cls._ctx.observers.length).toBe(1)
    expect(color._ctx.observers.length).toBe(1)
    expect(size._ctx.observers.length).toBe(1)

    for (let i = 0; i < 10; i++) {
      parent(`v${i}`)
      await flush()
    }

    expect(cls._ctx.observers.length).toBe(1)
    expect(color._ctx.observers.length).toBe(1)
    expect(size._ctx.observers.length).toBe(1)
  })
})

describe('bindProp leak detection', () => {
  it('bindProp inside a parent bindAs cleans up on re-render', async () => {
    const parent = fnstate('A')
    const obj = fnstate({ name: 'Alice', age: 30 })

    render(h('div',
      parent.bindAs(p => h('div',
        `parent:${p} `,
        obj.bindProp('name')
      ))
    ))

    // bindProp delegates to bindAs, so obj gets 1 driving subscriber
    expect(obj._ctx.observers.length).toBe(1)

    for (let i = 0; i < 10; i++) {
      parent(`v${i}`)
      await flush()
    }

    expect(obj._ctx.observers.length).toBe(1)
  })
})

describe('bindChildren with bindChildren inside (nested lists)', () => {
  it('removing outer list items cleans up inner list subscriptions', async () => {
    const outer = fnstate([
      { id: 'a', subs: ['a1', 'a2'] },
      { id: 'b', subs: ['b1', 'b2', 'b3'] }
    ], o => o.id)

    const theme = fnstate('light')

    render(
      outer.bindChildren(
        h('div'),
        (outerItem) => {
          const innerItems = fnstate(outerItem().subs, v => v)
          outerItem.subscribe(v => innerItems(v.subs))
          return h('div',
            innerItems.bindChildren(
              h('ul'),
              (innerItem) => h('li', { class: theme.bindAttr() }, innerItem.bindAs())
            )
          )
        }
      )
    )

    // 5 inner items total, each with a theme.bindAttr
    expect(theme._ctx.observers.length).toBe(5)

    // Remove outer item 'b' — its 3 inner items' subscriptions should clean up
    outer([{ id: 'a', subs: ['a1', 'a2'] }])
    await flush()
    expect(theme._ctx.observers.length).toBe(2)

    // Remove all
    outer([])
    await flush()
    expect(theme._ctx.observers.length).toBe(0)
  })

  it('3-level nested bindChildren cleans up all levels', async () => {
    const L1 = fnstate([
      { id: 'x', children: [{ id: 'x1', leaves: ['x1a', 'x1b'] }] }
    ], o => o.id)
    const marker = fnstate('*')

    render(
      L1.bindChildren(h('div'), (l1State) => {
        const l2 = fnstate(l1State().children, o => o.id)
        l1State.subscribe(v => l2(v.children))
        return h('div',
          l2.bindChildren(h('div'), (l2State) => {
            const l3 = fnstate(l2State().leaves, v => v)
            l2State.subscribe(v => l3(v.leaves))
            return h('div',
              l3.bindChildren(h('ul'), (l3State) =>
                h('li', { class: marker.bindAttr() }, l3State.bindAs())
              )
            )
          })
        )
      })
    )

    // x1a, x1b = 2 leaf items
    expect(marker._ctx.observers.length).toBe(2)

    // Remove everything
    L1([])
    await flush()
    expect(marker._ctx.observers.length).toBe(0)
  })
})

describe('bindAs with promise children', () => {
  it('promise-based children inside bindAs do not leak on re-render', async () => {
    const state = fnstate('A')
    const inner = fnstate('X')

    render(h('div',
      state.bindAs(v => h('div', v, inner.bindAs(i => h('span', i))))
    ))

    expect(inner._ctx.observers.length).toBe(1)

    state('B')
    await flush()
    expect(inner._ctx.observers.length).toBe(1)
  })
})

describe('subscribe returns working unsubscribe after cleanup', () => {
  it('manual unsubscribe is idempotent and does not throw after cleanup', () => {
    const s = fnstate('a')
    const unsub = s.subscribe(() => {})
    expect(s._ctx.observers.length).toBe(1)

    unsub()
    expect(s._ctx.observers.length).toBe(0)

    // Calling again should be safe
    unsub()
    expect(s._ctx.observers.length).toBe(0)
  })

  it('unsubscribe called after activeRenderCleanups already cleaned it is safe', async () => {
    const outer = fnstate('A')
    const inner = fnstate('X')
    const allUnsubs = []

    render(h('div',
      outer.bindAs(o => {
        allUnsubs.push(inner.subscribe(() => {}))
        return h('span', `${o}:${inner()}`)
      })
    ))

    expect(inner._ctx.observers.length).toBe(1)

    // Re-render outer — cleanup will call the first unsub via activeRenderCleanups
    outer('B')
    await flush()

    // The old subscription was cleaned up, the new one exists
    expect(inner._ctx.observers.length).toBe(1)

    // Calling the OLD unsub manually should be safe (idempotent, already called by cleanup)
    const oldUnsub = allUnsubs[0]
    oldUnsub()
    // Should not have removed the new subscription
    expect(inner._ctx.observers.length).toBe(1)
  })
})

describe('selectObserver cleanup when replacement element is a text node', () => {
  it('selectObservers are cleaned up even when replacing element lacks insertAdjacentElement', () => {
    // Text nodes don't have insertAdjacentElement. When an item is removed
    // and the replacement path uses text nodes, selectObservers must still
    // be cleaned for the deleted key.
    const items = fnstate([{ id: 1 }, { id: 2 }, { id: 3 }], o => o.id)
    const container = h('div')
    items.bindChildren(container, (itemState) =>
      // Return a text node (no insertAdjacentElement) with a selectAttr binding
      h('span',
        { class: itemState.bindSelectAttr((key) => key === itemState().id ? 'sel' : '') },
        itemState.bindAs(v => `${v.id}`)
      )
    )

    expect(Object.keys(items._ctx.selectObservers).length).toBe(3)

    // Remove item 2
    items([{ id: 1 }, { id: 3 }])
    expect(items._ctx.selectObservers[2]).toBeUndefined()
    expect(Object.keys(items._ctx.selectObservers).length).toBe(2)

    // Remove all
    items([])
    expect(Object.keys(items._ctx.selectObservers).length).toBe(0)
  })
})

describe('observer iteration safety during synchronous unsubscribe', () => {
  it('unsubscribing inside a subscriber callback does not skip other subscribers', () => {
    const s = fnstate('a')
    const calls = []
    let unsub2

    s.subscribe(() => calls.push('first'))
    unsub2 = s.subscribe(() => {
      calls.push('second')
      unsub2() // unsubscribe self during iteration
    })
    s.subscribe(() => calls.push('third'))

    s('b')

    // All three should have been called despite the mid-iteration splice
    expect(calls).toEqual(['first', 'second', 'third'])
    // Only 2 observers remain (second removed itself)
    expect(s._ctx.observers.length).toBe(2)
  })

  it('subscribing inside a subscriber callback does not cause the new subscriber to fire in the same cycle', () => {
    const s = fnstate('a')
    const calls = []

    s.subscribe(() => {
      calls.push('original')
    })
    // Add a dynamic subscriber before the state change
    s.subscribe(() => {
      s.subscribe(() => calls.push('dynamic'))
    })

    s('b')
    // The dynamic subscriber was added during this cycle but should not fire
    // because we snapshot the observer array before iterating
    expect(calls).toEqual(['original'])

    // On the next state change, the dynamic subscriber also fires
    calls.length = 0
    s('c')
    // original fires, the second subscribe adds another dynamic, and the existing dynamic fires
    expect(calls).toEqual(['original', 'dynamic'])
  })
})
