import { describe, it, expect } from 'vitest'
import { h, fnstate } from '@srfnstack/fntags'
import { render, waitFor } from '../src/index.mjs'

// Helper: flush microtasks so bindAs replaceWith() calls complete
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('deeply nested bindAs (3+ levels) — subscription cleanup', () => {
  it('3-level bindAs: re-rendering outer cleans up middle and inner subscriptions', async () => {
    const outer = fnstate('A')
    const middle = fnstate('X')
    const inner = fnstate('1')

    render(h('div',
      outer.bindAs(o => h('div',
        `outer:${o} `,
        middle.bindAs(m => h('div',
          `middle:${m} `,
          inner.bindAs(i => h('span', `inner:${i}`))
        ))
      ))
    ))

    // Each bindAs creates 1 driving subscription on its state
    expect(outer._ctx.observers.length).toBe(1)
    expect(middle._ctx.observers.length).toBe(1)
    expect(inner._ctx.observers.length).toBe(1)

    // Re-render outer — should tear down middle's and inner's subscriptions, then recreate
    outer('B')
    await flush()

    expect(outer._ctx.observers.length).toBe(1)
    expect(middle._ctx.observers.length).toBe(1)
    expect(inner._ctx.observers.length).toBe(1)

    // Do it many times to prove no accumulation
    for (let i = 0; i < 10; i++) {
      outer(`v${i}`)
      await flush()
    }
    expect(outer._ctx.observers.length).toBe(1)
    expect(middle._ctx.observers.length).toBe(1)
    expect(inner._ctx.observers.length).toBe(1)
  })

  it('3-level bindAs: re-rendering middle cleans up inner but not outer', async () => {
    const outer = fnstate('A')
    const middle = fnstate('X')
    const inner = fnstate('1')

    render(h('div',
      outer.bindAs(o => h('div',
        `outer:${o} `,
        middle.bindAs(m => h('div',
          `middle:${m} `,
          inner.bindAs(i => h('span', `inner:${i}`))
        ))
      ))
    ))

    // Re-render middle only
    for (let i = 0; i < 5; i++) {
      middle(`m${i}`)
      await flush()
    }

    expect(outer._ctx.observers.length).toBe(1)
    expect(middle._ctx.observers.length).toBe(1)
    expect(inner._ctx.observers.length).toBe(1)
  })

  it('3-level bindAs: re-rendering inner only does not leak', async () => {
    const outer = fnstate('A')
    const middle = fnstate('X')
    const inner = fnstate('1')

    render(h('div',
      outer.bindAs(o => h('div',
        `outer:${o} `,
        middle.bindAs(m => h('div',
          `middle:${m} `,
          inner.bindAs(i => h('span', `inner:${i}`))
        ))
      ))
    ))

    for (let i = 0; i < 10; i++) {
      inner(`i${i}`)
      await flush()
    }

    expect(outer._ctx.observers.length).toBe(1)
    expect(middle._ctx.observers.length).toBe(1)
    expect(inner._ctx.observers.length).toBe(1)
  })

  it('4-level bindAs: all subscriptions stay at 1 through repeated re-renders at every level', async () => {
    const L1 = fnstate('a')
    const L2 = fnstate('b')
    const L3 = fnstate('c')
    const L4 = fnstate('d')

    render(h('div',
      L1.bindAs(v1 => h('div', `L1:${v1}`,
        L2.bindAs(v2 => h('div', `L2:${v2}`,
          L3.bindAs(v3 => h('div', `L3:${v3}`,
            L4.bindAs(v4 => h('span', `L4:${v4}`))
          ))
        ))
      ))
    ))

    const states = [L1, L2, L3, L4]
    for (const s of states) {
      expect(s._ctx.observers.length).toBe(1)
    }

    // Re-render from the outermost
    for (let i = 0; i < 5; i++) {
      L1(`a${i}`)
      await flush()
    }
    for (const s of states) {
      expect(s._ctx.observers.length).toBe(1)
    }

    // Re-render from L3 (middle-ish)
    for (let i = 0; i < 5; i++) {
      L3(`c${i}`)
      await flush()
    }
    for (const s of states) {
      expect(s._ctx.observers.length).toBe(1)
    }

    // Re-render from the innermost
    for (let i = 0; i < 5; i++) {
      L4(`d${i}`)
      await flush()
    }
    for (const s of states) {
      expect(s._ctx.observers.length).toBe(1)
    }
  })

  it('3-level bindAs with bindAttr at the leaf: no subscription leak', async () => {
    const outer = fnstate('A')
    const middle = fnstate('X')
    const leafAttr = fnstate('red')

    render(h('div',
      outer.bindAs(o => h('div',
        middle.bindAs(m => h('span', { class: leafAttr.bindAttr() }, `${o}:${m}`))
      ))
    ))

    expect(leafAttr._ctx.observers.length).toBe(1)

    outer('B')
    await flush()
    expect(leafAttr._ctx.observers.length).toBe(1)

    middle('Y')
    await flush()
    expect(leafAttr._ctx.observers.length).toBe(1)

    // 10 rapid outer updates
    for (let i = 0; i < 10; i++) outer(`o${i}`)
    await flush()
    expect(leafAttr._ctx.observers.length).toBe(1)
  })

  it('3-level bindAs with bindStyle at the leaf: no subscription leak', async () => {
    const outer = fnstate('A')
    const middle = fnstate('X')
    const leafStyle = fnstate('blue')

    render(h('div',
      outer.bindAs(o => h('div',
        middle.bindAs(m => h('span', { style: { color: leafStyle.bindStyle() } }, `${o}:${m}`))
      ))
    ))

    expect(leafStyle._ctx.observers.length).toBe(1)

    for (let i = 0; i < 10; i++) {
      outer(`o${i}`)
      await flush()
    }
    expect(leafStyle._ctx.observers.length).toBe(1)
  })

  it('sibling bindAs branches inside a parent bindAs all clean up correctly', async () => {
    const parent = fnstate('P')
    const childA = fnstate('A')
    const childB = fnstate('B')

    render(h('div',
      parent.bindAs(p => h('div',
        childA.bindAs(a => h('span', `${p}:${a}`)),
        childB.bindAs(b => h('span', `${p}:${b}`))
      ))
    ))

    expect(childA._ctx.observers.length).toBe(1)
    expect(childB._ctx.observers.length).toBe(1)

    // Re-render parent — both child subscriptions should be cleaned up and recreated
    for (let i = 0; i < 10; i++) {
      parent(`P${i}`)
      await flush()
    }
    expect(childA._ctx.observers.length).toBe(1)
    expect(childB._ctx.observers.length).toBe(1)
  })
})

describe('deeply nested bindChildren — subscription cleanup', () => {
  it('bindChildren with bindAs per item: removing items cleans up subscriptions', async () => {
    const items = fnstate([{ id: 1 }, { id: 2 }, { id: 3 }], o => o.id)
    const shared = fnstate('red')

    render(
      items.bindChildren(
        h('ul'),
        (itemState) => h('li', { class: shared.bindAttr() }, itemState.bindAs(v => h('span', `item ${v.id}`)))
      )
    )

    // 1 bindAttr subscription per item
    expect(shared._ctx.observers.length).toBe(3)

    items([{ id: 1 }, { id: 3 }])
    await waitFor(() => expect(shared._ctx.observers.length).toBe(2))

    items([{ id: 1 }])
    await waitFor(() => expect(shared._ctx.observers.length).toBe(1))

    items([])
    await waitFor(() => expect(shared._ctx.observers.length).toBe(0))
  })

  it('bindChildren with nested bindAs inside each item: removing items cleans up deeply', async () => {
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)
    const deep = fnstate('X')

    render(
      items.bindChildren(
        h('div'),
        (itemState) => h('div',
          itemState.bindAs(v => h('div',
            `item:${v.id} `,
            deep.bindAs(d => h('span', `deep:${d}`))
          ))
        )
      )
    )

    // Each item creates: 1 driving sub on itemState + 1 driving sub on deep
    expect(deep._ctx.observers.length).toBe(2)

    items([{ id: 1 }])
    await waitFor(() => expect(deep._ctx.observers.length).toBe(1))

    items([])
    await waitFor(() => expect(deep._ctx.observers.length).toBe(0))
  })

  it('nested bindChildren inside bindChildren: 2 levels of list rendering', async () => {
    const groups = fnstate([
      { id: 'g1', items: ['a', 'b'] },
      { id: 'g2', items: ['c', 'd', 'e'] }
    ], g => g.id)

    const { container } = render(
      groups.bindChildren(
        h('div'),
        (groupState) => {
          const itemsState = fnstate(groupState().items, v => v)
          // Sync: when group updates, update inner items list
          groupState.subscribe(g => itemsState(g.items))
          return h('div', { class: 'group' },
            itemsState.bindChildren(
              h('ul'),
              (itemState) => h('li', itemState.bindAs())
            )
          )
        }
      )
    )

    await waitFor(() => {
      const lis = container.querySelectorAll('li')
      expect(lis.length).toBe(5) // a, b, c, d, e
    })

    // Remove a group
    groups([{ id: 'g1', items: ['a', 'b'] }])
    await waitFor(() => {
      const lis = container.querySelectorAll('li')
      expect(lis.length).toBe(2) // a, b
    })
  })

  it('3-level: bindChildren → bindAs → bindChildren with shared state cleanup', async () => {
    const categories = fnstate([
      { id: 'cat1', name: 'Fruit', items: ['apple', 'banana'] },
      { id: 'cat2', name: 'Veg', items: ['carrot'] }
    ], c => c.id)
    const theme = fnstate('light')

    render(
      categories.bindChildren(
        h('div'),
        (catState) => {
          const catItems = fnstate(catState().items, v => v)
          catState.subscribe(c => catItems(c.items))
          return catState.bindAs(cat => h('div',
            h('h2', cat.name),
            catItems.bindChildren(
              h('ul'),
              (itemState) => h('li', { class: theme.bindAttr() }, itemState.bindAs())
            )
          ))
        }
      )
    )

    // theme has 1 observer per leaf item: apple, banana, carrot = 3
    expect(theme._ctx.observers.length).toBe(3)

    // Remove a category
    categories([{ id: 'cat1', name: 'Fruit', items: ['apple', 'banana'] }])
    await waitFor(() => expect(theme._ctx.observers.length).toBe(2))
  })

  it('adding items back after removal maintains correct subscription count', async () => {
    const items = fnstate(['a', 'b', 'c'], v => v)
    const color = fnstate('red')

    render(
      items.bindChildren(
        h('div'),
        (itemState) => h('span', { class: color.bindAttr() }, itemState.bindAs())
      )
    )

    expect(color._ctx.observers.length).toBe(3)

    items(['a'])
    await waitFor(() => expect(color._ctx.observers.length).toBe(1))

    items(['a', 'd', 'e'])
    await waitFor(() => expect(color._ctx.observers.length).toBe(3))

    items([])
    await waitFor(() => expect(color._ctx.observers.length).toBe(0))
  })
})

describe('mixed deep nesting — bindAs + bindAttr + bindStyle + bindChildren', () => {
  it('complex component: no leaks after many state transitions', async () => {
    const view = fnstate('list')
    const items = fnstate([{ id: 1, text: 'a' }, { id: 2, text: 'b' }], o => o.id)
    const highlight = fnstate('yellow')
    const fontSize = fnstate('12px')

    render(h('div',
      view.bindAs(v => {
        if (v === 'list') {
          return items.bindChildren(
            h('ul'),
            (itemState) => h('li',
              {
                class: highlight.bindAttr(c => `hl-${c}`),
                style: { fontSize: fontSize.bindStyle() }
              },
              itemState.bindAs(item => h('span', item.text))
            )
          )
        } else {
          return h('div', 'detail view')
        }
      })
    ))

    // In list view: 2 items × (1 highlight bindAttr + 1 fontSize bindStyle) = 2 each
    expect(highlight._ctx.observers.length).toBe(2)
    expect(fontSize._ctx.observers.length).toBe(2)

    // Switch to detail view — all item subscriptions should be cleaned up
    view('detail')
    await flush()
    expect(highlight._ctx.observers.length).toBe(0)
    expect(fontSize._ctx.observers.length).toBe(0)

    // Switch back to list view — subscriptions recreated
    view('list')
    await flush()
    expect(highlight._ctx.observers.length).toBe(2)
    expect(fontSize._ctx.observers.length).toBe(2)

    // Cycle many times
    for (let i = 0; i < 10; i++) {
      view(i % 2 === 0 ? 'detail' : 'list')
      await flush()
    }
    // Ended on 'detail' (i=9, 9%2=1 → 'list'... wait, 0-indexed: i=9, 9%2=1 → list)
    // Actually: i=0→detail, i=1→list, ..., i=9→list
    expect(highlight._ctx.observers.length).toBe(2)
    expect(fontSize._ctx.observers.length).toBe(2)
  })
})

describe('nested bindAs — stale node reference regression', () => {
  it('outer bindAs can still swap after inner bindAs swaps its node', async () => {
    const outer = fnstate(true)
    const inner = fnstate('step-1')

    const { container } = render(h('div',
      outer.bindAs(show => show
        ? inner.bindAs(step => h('div', `Current: ${step}`))
        : h('div', 'closed'))
    ))

    expect(container.textContent).toBe('Current: step-1')

    inner('step-2')
    await flush()
    expect(container.textContent).toBe('Current: step-2')

    // Without the fix, the outer's elCtx.current points at the original step-1
    // (now detached) node, so replaceWith is a no-op and the DOM never updates.
    outer(false)
    await flush()
    expect(container.textContent).toBe('closed')
  })

  it('3 levels of directly-returned bindAs stay in sync through every level', async () => {
    const outer = fnstate(true)
    const middle = fnstate(true)
    const inner = fnstate('a')

    const { container } = render(h('div',
      outer.bindAs(o => o
        ? middle.bindAs(m => m
          ? inner.bindAs(i => h('div', `leaf:${i}`))
          : h('div', 'middle-off'))
        : h('div', 'outer-off'))
    ))

    expect(container.textContent).toBe('leaf:a')

    inner('b')
    await flush()
    expect(container.textContent).toBe('leaf:b')

    // Updating the outermost must still succeed after the leaf has swapped.
    outer(false)
    await flush()
    expect(container.textContent).toBe('outer-off')
  })

  it('3 levels: swapping the middle after leaf swaps still replaces correctly', async () => {
    const outer = fnstate(true)
    const middle = fnstate(true)
    const inner = fnstate('a')

    const { container } = render(h('div',
      outer.bindAs(o => o
        ? middle.bindAs(m => m
          ? inner.bindAs(i => h('div', `leaf:${i}`))
          : h('div', 'middle-off'))
        : h('div', 'outer-off'))
    ))

    inner('b')
    await flush()
    expect(container.textContent).toBe('leaf:b')

    middle(false)
    await flush()
    expect(container.textContent).toBe('middle-off')

    // And the outer can still take over from here.
    outer(false)
    await flush()
    expect(container.textContent).toBe('outer-off')
  })

  it('interleaved inner→outer→inner cycles do not leave parentRefs in a bad state', async () => {
    const outer = fnstate(true)
    const inner = fnstate('a')

    const { container } = render(h('div',
      outer.bindAs(show => show
        ? inner.bindAs(i => h('div', `val:${i}`))
        : h('div', 'closed'))
    ))

    inner('b')
    await flush()
    expect(container.textContent).toBe('val:b')

    outer(false)
    await flush()
    expect(container.textContent).toBe('closed')

    outer(true)
    await flush()
    expect(container.textContent).toBe('val:b')

    // After coming back, inner swaps must still reach the DOM, and so must outer.
    inner('c')
    await flush()
    expect(container.textContent).toBe('val:c')

    outer(false)
    await flush()
    expect(container.textContent).toBe('closed')
  })

  it('component that returns a naked bindAs works inside another bindAs', async () => {
    const step = fnstate('upload')
    const show = fnstate(true)

    function Extractor () {
      return step.bindAs(s => h('div', `step:${s}`))
    }

    const { container } = render(h('div',
      show.bindAs(s => s ? Extractor() : h('div', 'done'))
    ))

    step('extracting')
    await flush()
    step('review')
    await flush()
    expect(container.textContent).toBe('step:review')

    show(false)
    await flush()
    expect(container.textContent).toBe('done')
  })

  it('shared child bindAs: repeated parent re-renders do not duplicate parent back-refs', async () => {
    // Use a module-scope-like savedInner held outside any render context.
    const inner = fnstate('a')
    const outer = fnstate(true)
    const savedInner = inner.bindAs(v => h('span', v))

    const { container } = render(h('div',
      outer.bindAs(show => show ? savedInner : h('span', 'off'))
    ))

    // Toggle outer many times — each show=true path re-evaluates savedInner
    // against the same child elCtx. Without the dedup guard, parentRefs would
    // grow by one entry each cycle.
    for (let i = 0; i < 10; i++) {
      outer(false)
      await flush()
      outer(true)
      await flush()
    }

    const childElCtx = savedInner.elCtx
    expect(childElCtx.parentRefs.length).toBeLessThanOrEqual(1)
    // And the system still renders correctly
    expect(container.textContent).toBe('a')
    inner('b')
    await flush()
    expect(container.textContent).toBe('b')
  })

  it('dead parent elCtxs are pruned from a surviving child on its next update', async () => {
    // Model the savedInner-outlives-parent case by wrapping the parent in yet
    // another bindAs whose re-render triggers the cascading cleanup on parent.
    const grand = fnstate(true)
    const outer = fnstate(true)
    const inner = fnstate('a')
    const savedInner = inner.bindAs(v => h('span', v))

    render(h('div',
      grand.bindAs(g => g
        ? outer.bindAs(show => show ? savedInner : h('span', 'off'))
        : h('span', 'gone'))
    ))

    // savedInner was created outside any render, so it survives when the outer
    // parent is torn down by grand.
    const childElCtx = savedInner.elCtx
    expect(childElCtx.parentRefs.length).toBe(1)

    // Tear down the outer (and its outer-bindAs-elCtx) via grand.
    grand(false)
    await flush()

    // Drive an inner update so propagateReplace walks parentRefs and prunes
    // the dead outer's entry.
    inner('b')
    await flush()
    expect(childElCtx.parentRefs.length).toBe(0)
  })

  it('no subscription leaks when outer re-renders after inner swaps', async () => {
    const outer = fnstate(true)
    const inner = fnstate('a')

    render(h('div',
      outer.bindAs(show => show
        ? inner.bindAs(i => h('div', `val:${i}`))
        : h('div', 'closed'))
    ))

    expect(outer._ctx.observers.length).toBe(1)
    expect(inner._ctx.observers.length).toBe(1)

    for (let i = 0; i < 5; i++) {
      inner(`i${i}`)
      await flush()
    }
    expect(inner._ctx.observers.length).toBe(1)

    outer(false)
    await flush()
    // inner subscription torn down by cascading cleanup
    expect(inner._ctx.observers.length).toBe(0)
    expect(outer._ctx.observers.length).toBe(1)

    outer(true)
    await flush()
    expect(inner._ctx.observers.length).toBe(1)
    expect(outer._ctx.observers.length).toBe(1)
  })
})
