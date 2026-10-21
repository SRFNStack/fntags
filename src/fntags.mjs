/**
 * @module fntags
 */

// Tracks subscriptions created during a bindAs render so they can be cleaned
// up when the bindAs re-renders. null means we are not inside a render.
// NO_CLEANUPS means we are inside a render that has not registered a cleanup
// yet: its push materializes a real array on the first registration, so a
// render that registers nothing (the common case) allocates nothing. Foreign
// `activeRenderCleanups.push(fn)` call sites keep working against it.
const NO_CLEANUPS = {
  push (fn) {
    activeRenderCleanups = [fn]
  }
}
let activeRenderCleanups = null

function registerCleanup (fn) {
  if (activeRenderCleanups !== null) activeRenderCleanups.push(fn)
}

// The cleanups registered during the render that just finished, or null when
// none were registered.
function takeRenderCleanups () {
  return activeRenderCleanups === NO_CLEANUPS ? null : activeRenderCleanups
}

// When on, the framework emits console warnings for misuse that is easy to
// hit and hard to diagnose (e.g. bindAs replacing a focused input, omitting
// a key mapper from bindChildren). The checks are cheap but non-zero, so
// production can opt out via setDevMode(false).
let devMode = true

/**
 * Toggle dev-mode warnings. Defaults to true. Call `setDevMode(false)` in
 * production to skip diagnostic checks such as the focus-loss warning fired
 * when bindAs replaces a subtree containing the focused element.
 * @param {boolean} on
 */
export function setDevMode (on) {
  devMode = !!on
}

function runCleanups (bindCtx) {
  const cleanups = bindCtx.cleanups
  if (cleanups === null) return
  bindCtx.cleanups = null
  for (let i = 0; i < cleanups.length; i++) cleanups[i]()
}

/**
 * A function to create dom elements with the given attributes and children.
 *
 * The first element of the children array can be an object containing element attributes.
 * The attribute names are the standard attribute names used in html, and should all be lower case as usual.
 *
 * Any attribute starting with 'on' that is a function is added as an event listener with the 'on' removed.
 * i.e. { onclick: fn } gets added to the element as element.addEventListener('click', fn)
 *
 * The style attribute can be an object and the properties of the object will be added as style properties to the element.
 * i.e. { style: { color: blue } } becomes element.style.color = blue
 *
 * The rest of the arguments will be considered children of this element and appended to it in the same order as passed.
 *
 * @template {HTMLElement|SVGElement} T
 * @param {string} tag html tag to use when created the element
 * @param {...(Node|Object)} children optional attributes object and children for the element
 * @return {T} an html element
 *
 */
export function h (tag, ...children) {
  let firstChildIdx = 0
  let element
  const nsIndex = hasNs(tag)
  if (nsIndex > -1) {
    const { ns, val } = splitNs(tag, nsIndex)
    element = document.createElementNS(ns, val)
  } else {
    element = document.createElement(tag)
  }

  if (isAttrs(children[firstChildIdx])) {
    const attrs = children[firstChildIdx]
    firstChildIdx += 1
    let hasValue = false
    for (const a in attrs) {
      // set value last to ensure value constraints are set before trying to set the value to avoid modification
      // For example, when using a range and specifying a min and max
      //  if the value is set first and is outside the default 1 to 100 range
      //  the value will be adjusted to be within the range, even though the value attribute will be set correctly
      if (a === 'value') {
        hasValue = true
        continue
      }
      setAttribute(a, attrs[a], element)
    }
    if (hasValue) {
      setAttribute('value', attrs.value, element)
    }
  }
  for (let i = firstChildIdx; i < children.length; i++) {
    const child = children[i]
    if (Array.isArray(child)) {
      // Append array items directly to skip the DocumentFragment renderNode would build.
      // Nested arrays inside still go through renderNode, which flattens them.
      for (const c of child) {
        element.append(renderNode(c))
      }
    } else {
      element.append(renderNode(child))
    }
  }
  return element
}

function splitNs (val, i) {
  return { ns: val.slice(0, i), val: val.slice(i + 1) }
}

function hasNs (val) {
  return val.lastIndexOf(':')
}

// Shared, frozen "nothing registered yet" values. A state only pays for an
// observer list or a select observer map once something subscribes to it.
// They are frozen so a stray write fails loudly instead of leaking between
// states; reads, iteration and `delete` of absent keys behave like an empty
// array or object.
const EMPTY_OBSERVERS = Object.freeze([])
const EMPTY_SELECT_OBSERVERS = Object.freeze({})

// Every fnstate function shares this prototype, so creating a state does not
// copy the method table onto the function. The methods read the state's
// context through `this._ctx`, the only own property a state function has.
const fnStateProto = Object.create(Function.prototype)

/**
 * @template T The type of data stored in the state container
 * @typedef FnStateObj A container for a state value that can be bound to.
 * @property {(element?: (newValue: T, oldValue: T)=>(Node|any))=>Node} bindAs Bind this state to the given element function. This causes the element to be replaced when the state changes.
 * If called with no parameters, the state's value will be rendered as an element.
 * Do not wrap form inputs (input, textarea, select) in bindAs — it replaces the element on every update and the focused input will lose focus mid-keystroke. Bind the `value` attribute with bindAttr instead.
 * @property {(parent: (()=>(Node|any))|any|Node, element: (childState: FnState)=>(Node|any))=>Node} bindChildren Bind the values of this state to the given element.
 * Values are items/elements of an array.
 * If the current value is not an array, this will behave the same as bindAs.
 * @property {(prop: string)=>Node} bindProp Bind to a property of an object stored in this state instead of the state itself.
 * Shortcut for `mystate.bindAs((current)=> current[prop])`
 * @property {(attribute?: (newValue: T, oldValue: T)=>(string|any))=>any} bindAttr Bind attribute values to state changes.
 * Prefer this over bindAs for form inputs: binding the `value` attribute updates the element in place without replacing it, so focus and caret position are preserved.
 * @property {(style?: (newValue: T, oldValue: T)=>string) => string} bindStyle Bind style values to state changes
 * @property {(element?: (selectedKey: any)=>(Node|any))=>Node} bindSelect Bind selected state to an element
 * @property {(attribute?: (selectedKey: any)=>(string|any))=>any} bindSelectAttr Bind selected state to an attribute
 * @property {(key: any)=>void} select Mark the element with the given key as selected
 * where the key is identified using the mapKey function passed on creation of the fnstate.
 * This causes the bound select functions to be executed.
 * @property {()=> any} selected Get the currently selected key
 * @property {(update: T)=>void} assign Perform an Object.assign() on the current state using the provided update, triggers
 * a state change and is a shortcut for `mystate(Object.assign(mystate(), update))`
 * @property {(path: string)=>any} getPath Get a value at the given property path, an error is thrown if the value is not an object
 * This returns a reference to the real current value. If you perform any modifications to the object, be sure to call setPath after you're done or the changes
 * will not be reflected correctly.
 * @property {(path: string, value: any, fillWithObjects: boolean)=>void} setPath Set a value at the given property path
 * @property {(subscriber: (newState: T, oldState: T)=>void) => void} subscribe Register a callback that will be executed whenever the state is changed
 * @property {boolean} isFnState A flag to indicate that this is a fnstate object
 */

/**
 * @template T The type of data stored in the state container
 * @typedef {FnStateObj<T> & ((newState?: T)=>T)} FnState A container for a state value that can be bound to.
 */

/**
 * Create a state object that can be bound to.
 * @template T
 * @param {T} initialValue The initial state
 * @param {(T)=>any} [mapKey] A map function to extract a key from an element in the array. Receives the array value to extract the key from.
 * A key can be any unique value.
 * @return {FnState<T>} A function that can be used to get and set the state.
 * When getting the state, you get the actual reference to the underlying value.
 * If you perform modifications to the value, be sure to call the state function with the updated value when you're done
 * or the changes won't be reflected correctly and binding updates won't be triggered even though the state appears to be correct.
 */
export function fnstate (initialValue, mapKey) {
  // Every field is declared here so all contexts share one hidden class.
  const ctx = {
    currentValue: initialValue,
    // Callbacks, or binding objects with an update(newValue, oldValue) method.
    observers: EMPTY_OBSERVERS,
    // Depth of notify() calls in progress. While non-zero, observer list
    // changes copy the list instead of mutating the one being iterated.
    notifying: 0,
    bindContexts: [],
    selectObservers: EMPTY_SELECT_OBSERVERS,
    selected: undefined,
    mapKey,
    // The context of the bindChildren state this state is an item of.
    parentCtx: null,
    state: null
  }
  const state = function (newState) {
    // `arguments` is only consulted when the argument is undefined, to tell
    // state() (a read) from state(undefined) (a write of undefined).
    if (newState === undefined ? arguments.length === 0 : newState === state) {
      return ctx.currentValue
    }
    const oldState = ctx.currentValue
    ctx.currentValue = newState
    notify(ctx, newState, oldState)
    return newState
  }
  Object.setPrototypeOf(state, fnStateProto)
  // make context available to the shared methods to avoid declaring functions on every new state
  state._ctx = ctx
  ctx.state = state
  return state
}

function notify (ctx, newState, oldState) {
  const observers = ctx.observers
  if (observers.length === 0) return
  ctx.notifying++
  try {
    // Observers added or removed during this loop never touch this array
    // (see addObserver/removeObserver), so no snapshot copy is needed.
    for (let i = 0; i < observers.length; i++) {
      const observer = observers[i]
      if (typeof observer === 'function') {
        observer(newState, oldState)
      } else {
        observer.update(newState, oldState)
      }
    }
  } finally {
    ctx.notifying--
  }
}

function addObserver (ctx, observer) {
  const observers = ctx.observers
  if (observers === EMPTY_OBSERVERS) {
    ctx.observers = [observer]
  } else if (ctx.notifying !== 0) {
    const copy = observers.slice()
    copy.push(observer)
    ctx.observers = copy
  } else if (observers.length === 1) {
    // A literal is sized exactly; push would grow the backing store to 17 slots.
    ctx.observers = [observers[0], observer]
  } else {
    observers.push(observer)
  }
}

function removeObserver (ctx, observer) {
  const observers = ctx.observers
  const idx = observers.indexOf(observer)
  if (idx === -1) return
  if (ctx.notifying !== 0) {
    const copy = observers.slice()
    copy.splice(idx, 1)
    ctx.observers = copy
  } else {
    observers.splice(idx, 1)
  }
}

/**
 * Register a callback that will be executed whenever the state is changed
 * @param {(newValue:T,oldValue:T)=>void} callback
 * @return {()=>void} a function to stop the subscription
 */
function doSubscribe (callback) {
  const ctx = this._ctx
  addObserver(ctx, callback)
  // Idempotent unsub, safe to call multiple times even if the same callback
  // was subscribed more than once.
  let active = true
  const unsub = () => {
    if (!active) return
    active = false
    removeObserver(ctx, callback)
  }
  // If we're inside a bindAs render, register this subscription for cleanup
  // on the next re-render. This prevents nested bindAs/bindAttr/bindStyle
  // subscriptions from accumulating when the parent bindAs re-renders.
  registerCleanup(unsub)
  return unsub
}

// Register an observer of the parent list state's selection for the item
// held by ctx, keyed by the item's key. Returns the key so the caller can
// remove the observer later.
function addSelectObserver (ctx, observer) {
  const parentCtx = ctx.parentCtx
  const key = keyMapper(parentCtx.mapKey, ctx.currentValue, 0)
  let selectObservers = parentCtx.selectObservers
  if (selectObservers === EMPTY_SELECT_OBSERVERS) {
    selectObservers = parentCtx.selectObservers = {}
  }
  const list = selectObservers[key]
  if (list === undefined) {
    selectObservers[key] = [observer]
  } else {
    list.push(observer)
  }
  return key
}

function removeSelectObserver (parentCtx, key, observer) {
  const list = parentCtx.selectObservers[key]
  if (list === undefined) return
  const idx = list.indexOf(observer)
  if (idx !== -1) list.splice(idx, 1)
  if (list.length === 0) delete parentCtx.selectObservers[key]
}

const ATTR = 0
const STYLE = 1

// An observer that writes a bound attribute or style to its element. Stored
// directly in the observer lists instead of a closure per subscription.
function AttrBinding (kind, name, element, fn) {
  this.kind = kind
  this.name = name
  this.element = element
  this.fn = fn
}

AttrBinding.prototype.update = function (newValue, oldValue) {
  const fn = this.fn
  const value = fn.isFnState ? fn() : fn(newValue, oldValue)
  if (this.kind === STYLE) {
    this.element.style[this.name] = value
  } else {
    setAttribute(this.name, value, this.element)
  }
}

// Build the function h() recognises as a bound attribute. setAttribute calls
// init(attrName, element) to register the binding, then calls the function
// itself for the initial value. Both closures share one context.
function createBoundAttr (fn, state, select) {
  if (typeof fn !== 'function') {
    throw new Error('You must pass a function to bindAttr')
  }
  const boundAttr = () => fn.isFnState ? fn() : fn(state())
  boundAttr.isBoundAttribute = true
  boundAttr.init = select
    ? (attrName, element) => {
        const binding = new AttrBinding(ATTR, attrName, element, fn)
        const key = addSelectObserver(state._ctx, binding)
        if (activeRenderCleanups !== null) {
          registerCleanup(() => removeSelectObserver(state._ctx.parentCtx, key, binding))
        }
      }
    : (attrName, element) => {
        const binding = new AttrBinding(ATTR, attrName, element, fn)
        addObserver(state._ctx, binding)
        if (activeRenderCleanups !== null) {
          registerCleanup(() => removeObserver(state._ctx, binding))
        }
      }
  return boundAttr
}

/**
 * Bind select and deselect to an attribute
 * @param {(()=>(string|any))?} [attribute] A function that returns an attribute value. If not passed, defaults to the state's value
 * @returns {()=>(string|any)} A function that calls the passed function, with some extra metadata
 */
function doBindSelectAttr (attribute) {
  return createBoundAttr(attribute ?? this, this, true)
}

/**
 * Bind attribute values to state changes
 * @param {(()=>(string|any))?} [attribute] A function that returns an attribute value. If not passed, defaults to the state's value
 * @returns {()=>(string|any)} A function that calls the passed function, with some extra metadata
 */
function doBindAttr (attribute) {
  return createBoundAttr(attribute ?? this, this, false)
}

/**
 * Bind style values to state changes
 * @param {(()=>string)?} [style] A function that returns a style's value. If not passed, defaults to the state's value
 * @returns {()=>Node} A function that calls the passed function, with some extra metadata
 */
function doBindStyle (style) {
  const fn = style ?? this
  if (typeof fn !== 'function') {
    throw new Error('You must pass a function to bindStyle')
  }
  const ctx = this._ctx
  const state = this
  const boundStyle = () => fn.isFnState ? fn() : fn(state())
  boundStyle.isBoundStyle = true
  boundStyle.init = (styleName, element) => {
    const binding = new AttrBinding(STYLE, styleName, element, fn)
    addObserver(ctx, binding)
    if (activeRenderCleanups !== null) {
      registerCleanup(() => removeObserver(ctx, binding))
    }
  }
  return boundStyle
}

function notifySelect (observers, key) {
  if (observers === undefined) return
  const snapshot = observers.slice()
  for (let i = 0; i < snapshot.length; i++) {
    const observer = snapshot[i]
    if (typeof observer === 'function') {
      observer(key)
    } else {
      observer.update(key)
    }
  }
}

/**
 * Mark the element with the given key as selected. This causes the bound select functions to be executed.
 */
function doSelect (key) {
  const ctx = this._ctx
  const previous = ctx.selected
  ctx.selected = key
  notifySelect(ctx.selectObservers[previous], key)
  notifySelect(ctx.selectObservers[key], key)
}

/**
 * Get the currently selected key
 * @returns {any}
 */
function doSelected () {
  return this._ctx.selected
}

/**
 * Perform an Object.assign() on the current state using the provided update
 * @param {T} [update]
 */
function doAssign (update) {
  return this(Object.assign(this._ctx.currentValue, update))
}

/**
 * Get a value at the given property path, an error is thrown if the value is not an object
 *
 * This returns a reference to the real current value. If you perform any modifications to the object, be sure to call setPath after you're done or the changes
 * will not be reflected correctly.
 * @param {string} [path] a json path type path that points to a property
 */
function doGetPath (path) {
  const ctx = this._ctx
  if (typeof path !== 'string') {
    throw new Error('Invalid path')
  }
  if (typeof ctx.currentValue !== 'object') {
    throw new Error('Value is not an object')
  }
  return path
    .split('.')
    .reduce(
      (curr, part) => {
        if (part in curr) {
          return curr[part]
        } else {
          return undefined
        }
      },
      ctx.currentValue
    )
}

/**
 * Set a value at the given property path
 * @param {string} path The JSON path of the value to set
 * @param {any} value The value to set the path to
 * @param {boolean} fillWithObjects Whether to replace non object values with new empty objects.
 */
function doSetPath (path, value, fillWithObjects = false) {
  const ctx = this._ctx
  const s = path.split('.')
  const parent = s
    .slice(0, -1)
    .reduce(
      (current, part) => {
        if (fillWithObjects && typeof current[part] !== 'object') {
          current[part] = {}
        }
        return current[part]
      },
      ctx.currentValue
    )

  if (parent && typeof parent === 'object') {
    parent[s.slice(-1)] = value
    this(ctx.currentValue)
  } else {
    throw new Error(`No object at path ${path}`)
  }
}

/**
 * Bind to a property of an object stored in this state instead of the state itself.
 *
 * Shortcut for `mystate.bindAs((current)=> current[prop])`
 *
 * @param {string} prop The object property to bind as
 * @returns {()=>Node}
 */
function doBindProp (prop) {
  return this.bindAs((st) => st[prop])
}

function doBindChildren (parent, element) {
  const ctx = this._ctx
  parent = renderNode(parent)
  if (parent === undefined || parent.nodeType === undefined) {
    throw new Error('You must provide a parent element to bind the children to. aka Need Bukkit.')
  }
  if (typeof element !== 'function') {
    throw new Error('You must pass a function to produce child elements.')
  }
  if (typeof ctx.mapKey !== 'function') {
    if (devMode) {
      console.warn('bindChildren: no mapKey provided — falling back to array index as key, which can misbehave when items are moved, inserted, or removed. Pass a mapKey function as the second argument to fnstate(array, item => item.id).')
    }
    ctx.mapKey = (_, i) => i
  }

  if (!Array.isArray(ctx.currentValue)) {
    throw new Error('You can only use bindChildren with a state that contains an array. try myState([mystate]) before calling this function.')
  }

  const bindContext = { element, parent }
  ctx.bindContexts.push(bindContext)

  // If inside a parent bindAs render, register a cleanup that tears down all
  // per-item subscriptions when the parent re-renders or is itself torn down.
  // Without this, nested bindAttr/bindStyle/bindAs subscriptions created for
  // each array item would be orphaned when the parent replaces this tree.
  if (activeRenderCleanups !== null) {
    activeRenderCleanups.push(() => {
      if (bindContext.elementCleanups) {
        for (const key in bindContext.elementCleanups) {
          for (const unsub of bindContext.elementCleanups[key]) unsub()
        }
        bindContext.elementCleanups = {}
      }
      // Remove this bindContext so reconcile doesn't operate on stale state
      const idx = ctx.bindContexts.indexOf(bindContext)
      if (idx !== -1) ctx.bindContexts.splice(idx, 1)
    })
  }

  this.subscribe((_, oldState) => {
    if (!Array.isArray(ctx.currentValue)) {
      if (devMode) {
        console.warn('bindChildren: state was updated to a non-array value. Wrapping it in a single-element array — if you meant to replace the whole binding, use bindAs instead.')
      }
      new Promise((resolve) => {
        this([ctx.currentValue])
        resolve()
      }).catch(e => {
        console.error('Failed to update element: ')
        console.dir(element)
        const err = new Error('Failed to update element')
        err.stack += '\nCaused by: ' + e.stack
        throw e
      })
    } else {
      reconcile(ctx, oldState)
    }
  })
  reconcile(ctx)
  return parent
}

// A bound function must produce exactly one node. A DocumentFragment empties
// itself when inserted, so there would be nothing left to replaceWith on the
// next state change and the binding would silently stop updating.
function assertSingleNode (evaluated, name) {
  if (Array.isArray(evaluated)) {
    throw new Error(name + ' functions must return a single node, not an array. Wrap the array in an element, e.g. div(...items).')
  }
}

// The context of one bindAs/bindSelect binding. It is registered directly as
// the observer of its state (or of the parent's selection), so a binding costs
// one object instead of a subscription closure, an unsubscribe closure and an
// update closure. Every field is declared so all instances share one shape.
function BindCtx (ctx, element, current, cleanups, select) {
  this.ctx = ctx
  this.element = element
  this.current = current
  // Cleanups registered during the latest render of this binding, or null.
  this.cleanups = cleanups
  this.select = select
  this.selectKey = undefined
  // Ancestor BindCtxs whose .current was this binding's node, see addParentRef.
  this.parentRefs = null
  this.dead = false
}

// Called by notify() on a state change, or by doSelect with the selected key.
BindCtx.prototype.update = function (newValue, oldValue) {
  const ctx = this.ctx
  // Clean up subscriptions from the previous render before re-rendering.
  // This prevents nested bindAs/bindAttr/bindStyle subscriptions from
  // accumulating each time the parent state changes.
  runCleanups(this)

  // Track subscriptions created during this re-render for cleanup next time.
  const prevRenderCleanups = activeRenderCleanups
  activeRenderCleanups = NO_CLEANUPS
  const evaluated = evaluateElement(this.element, ctx.currentValue, oldValue)
  assertSingleNode(evaluated, 'bindAs')
  const childBindCtx = (typeof evaluated === 'function' && evaluated.isBindGetter)
    ? evaluated.elCtx
    : null
  const rendered = renderNode(evaluated)
  this.cleanups = takeRenderCleanups()
  activeRenderCleanups = prevRenderCleanups

  if (rendered !== undefined) {
    if (this.current.key !== undefined) {
      rendered.key = this.current.key
    }
    // Re-establish the parent-ref link when a re-render resolves to another
    // nested bind getter, so future child swaps propagate back to this BindCtx.
    if (childBindCtx !== null && childBindCtx.current === rendered) {
      addParentRef(childBindCtx, this)
    }
    // Perform the DOM replacement on the next microtask to give the parent a
    // chance to render first. All replacements queued by one synchronous run
    // share a single microtask and are applied in the order they were queued,
    // which is the order their individual microtasks would have run in.
    pendingReplacements.push(this, rendered)
    if (!replacementScheduled) {
      replacementScheduled = true
      queueMicrotask(flushReplacements)
    }
  }
}

// Pairs of (BindCtx, rendered node) waiting to be swapped into the DOM.
let pendingReplacements = []
let replacementScheduled = false

function flushReplacements () {
  const queue = pendingReplacements
  pendingReplacements = []
  replacementScheduled = false
  let failure = null
  for (let i = 0; i < queue.length; i += 2) {
    const bindCtx = queue[i]
    const rendered = queue[i + 1]
    try {
      // Guard: skip replaceWith when the same element is returned (e.g. when
      // toggling between two pre-built element references). el.replaceWith(el)
      // is a no-op in the DOM but wastes the work.
      if (rendered !== bindCtx.current) {
        const oldCurrent = bindCtx.current
        if (devMode) warnIfReplacingFocused(oldCurrent)
        oldCurrent.replaceWith(rendered)
        bindCtx.current = rendered
        // Keep any ancestor bindAs whose BindCtx shared this node in sync with
        // the new node, so their next replaceWith targets a live DOM node.
        propagateReplace(bindCtx, oldCurrent, rendered)
      }
    } catch (e) {
      console.error('Failed to replace element with new element')
      console.dir(bindCtx, rendered)
      if (failure === null) failure = e
    }
  }
  // Surface the first failure after the remaining replacements were applied.
  if (failure !== null) throw failure
}

// Remove the binding's driving observer and everything its render registered.
function teardownBind (bindCtx) {
  if (bindCtx.select) {
    removeSelectObserver(bindCtx.ctx.parentCtx, bindCtx.selectKey, bindCtx)
  } else {
    removeObserver(bindCtx.ctx, bindCtx)
  }
  runCleanups(bindCtx)
  // Mark dead so any child BindCtx that still holds us in its parentRefs
  // can prune us lazily on its next propagateReplace walk.
  bindCtx.dead = true
}

const doBind = function (ctx, element, select) {
  if (typeof element !== 'function') {
    throw new Error('You must pass a function to bind with')
  }

  // Track subscriptions created during the initial render so they can be
  // cleaned up if this bindAs itself re-renders (BindCtx.update) or when
  // a parent bindAs re-renders and tears us down entirely.
  const prevRenderCleanups = activeRenderCleanups
  activeRenderCleanups = NO_CLEANUPS
  const evaluated = evaluateElement(element, ctx.currentValue)
  assertSingleNode(evaluated, 'bindAs')
  const childBindCtx = (typeof evaluated === 'function' && evaluated.isBindGetter)
    ? evaluated.elCtx
    : null
  const current = renderNode(evaluated)
  const bindCtx = new BindCtx(ctx, element, current, takeRenderCleanups(), select)
  activeRenderCleanups = prevRenderCleanups
  // When the evaluated element is itself a bind getter (a nested bindAs/bindSelect),
  // register this BindCtx as a back-ref on the child so that later child-driven
  // node swaps keep this BindCtx.current in sync with the live DOM node.
  if (childBindCtx !== null && childBindCtx.current === current) {
    addParentRef(childBindCtx, bindCtx)
  }
  // The driving observer is not registered with the enclosing render; the
  // cascading cleanup below tears it down together with everything else.
  if (select) {
    bindCtx.selectKey = addSelectObserver(ctx, bindCtx)
  } else {
    addObserver(ctx, bindCtx)
  }

  // If inside a parent bindAs render, register a cascading cleanup that tears
  // down both the driving observer and all subscriptions created inside
  // this bindAs's render, so they don't outlive the parent's re-render.
  if (prevRenderCleanups !== null) {
    registerCleanup(() => teardownBind(bindCtx))
  }

  const getter = () => bindCtx.current
  getter.isBindGetter = true
  getter.elCtx = bindCtx
  return getter
}

// Register a back-ref from a child BindCtx to a parent BindCtx, avoiding
// duplicate entries when the same parent re-renders against the same child.
function addParentRef (childBindCtx, parentBindCtx) {
  if (childBindCtx.parentRefs === null) {
    childBindCtx.parentRefs = [parentBindCtx]
  } else if (!childBindCtx.parentRefs.includes(parentBindCtx)) {
    childBindCtx.parentRefs.push(parentBindCtx)
  }
}

// Walk the back-ref chain and update any ancestor BindCtx whose .current still
// points at the old DOM node. Used when a nested bindAs swaps its node so the
// outer bindAs keeps a live reference instead of a detached one. Prunes any
// dead ancestors encountered so parentRefs does not retain torn-down BindCtxs.
function propagateReplace (bindCtx, oldNode, newNode) {
  const refs = bindCtx.parentRefs
  if (refs === null) return
  for (let i = refs.length - 1; i >= 0; i--) {
    const parent = refs[i]
    if (parent.dead) {
      refs.splice(i, 1)
      continue
    }
    if (parent.current === oldNode) {
      parent.current = newNode
      propagateReplace(parent, oldNode, newNode)
    }
  }
}

// Emit a dev-mode warning when a bindAs replacement would destroy a subtree
// containing the focused element. This is the most common fntags footgun:
// wrapping an <input> in bindAs replaces the element on every keystroke, so
// the user loses focus and caret position mid-edit. The fix is almost always
// to bind the `value` attribute with bindAttr instead. We only check once per
// replacement and only touch the DOM when an element is actually focused.
function warnIfReplacingFocused (oldNode) {
  if (typeof document === 'undefined') return
  const active = document.activeElement
  if (!active || active === document.body) return
  if (oldNode && oldNode.nodeType === 1 && (oldNode === active || oldNode.contains(active))) {
    console.warn(
      'bindAs is about to replace a subtree containing the focused element <' +
      active.tagName.toLowerCase() + '>. The replacement will steal focus and ' +
      'reset caret/selection. For form inputs, bind the `value` attribute with ' +
      'bindAttr instead of wrapping the input in bindAs. ' +
      'Call setDevMode(false) to silence this warning.',
      active
    )
  }
}

/**
 * Bind select and deselect to an element
 * @param {(()=>(Node|any))?} [element] The element to bind to. If not passed, defaults to the state's value
 * @returns {()=>Node}
 */
function doBindSelect (element) {
  return doBind(this._ctx, element ?? this, true)
}

/**
 * Bind this state to the given element
 *
 * @param {((T)=>(Node|any))?} [element] The element to bind to. If not a function, an update function must be passed. If not passed, defaults to the state's value
 * @returns {()=>Node}
 */
function doBindAs (element) {
  return doBind(this._ctx, element ?? this, false)
}

// The shared method table of every fnstate function. The property docs live on
// the FnStateObj typedef above.
fnStateProto.bindAs = doBindAs
fnStateProto.bindChildren = doBindChildren
fnStateProto.bindProp = doBindProp
fnStateProto.bindAttr = doBindAttr
fnStateProto.bindStyle = doBindStyle
fnStateProto.bindSelect = doBindSelect
fnStateProto.bindSelectAttr = doBindSelectAttr
fnStateProto.select = doSelect
fnStateProto.selected = doSelected
fnStateProto.isFnState = true
fnStateProto.assign = doAssign
fnStateProto.getPath = doGetPath
fnStateProto.setPath = doSetPath
fnStateProto.subscribe = doSubscribe
// bindChildren marks its item states with `itemState.parentCtx = ctx`. Keep
// that on the context so the state function itself keeps a single own
// property (_ctx) and one hidden class.
Object.defineProperty(fnStateProto, 'parentCtx', {
  get () { return this._ctx.parentCtx },
  set (parentCtx) { this._ctx.parentCtx = parentCtx }
})

/**
 * Reconcile the state of the current array value with the state of the bound elements
 */
function reconcile (ctx, oldState) {
  for (const bindContext of ctx.bindContexts) {
    if (bindContext.boundElementByKey === undefined) {
      bindContext.boundElementByKey = {}
    }
    arrangeElements(ctx, bindContext, oldState)
  }
}

function keyMapper (mapKey, value, i) {
  if (typeof value !== 'object') {
    return value
  } else if (typeof mapKey !== 'function') {
    return 0
  } else {
    return mapKey(value, i)
  }
}

function cleanElementSubscriptions (bindContext, key) {
  const cleanups = bindContext.elementCleanups?.[key]
  if (!cleanups) return
  for (const unsub of cleanups) unsub()
  delete bindContext.elementCleanups[key]
}

function arrangeElements (ctx, bindContext, oldState) {
  if (!ctx?.currentValue?.length) {
    // Clean up subscriptions for all existing elements before clearing
    if (bindContext.elementCleanups) {
      for (const key in bindContext.elementCleanups) {
        for (const unsub of bindContext.elementCleanups[key]) unsub()
      }
      bindContext.elementCleanups = {}
    }
    bindContext.parent.textContent = ''
    bindContext.boundElementByKey = {}
    bindContext.elementStates = {}
    ctx.selectObservers = {}
    return
  }

  // Initialize the element state map if it doesn't exist
  if (!bindContext.elementStates) {
    bindContext.elementStates = {}
  }

  const keys = {}
  const keysArr = []

  for (let i = 0; i < ctx.currentValue.length; i++) {
    const rawValue = ctx.currentValue[i]
    // Use the raw value to get the key
    const key = keyMapper(ctx.mapKey, rawValue, i)

    if (keys[key]) {
      if (oldState) ctx.state(oldState)
      throw new Error('Duplicate keys in a bound array are not allowed, state reset to previous value.')
    }

    keys[key] = i
    keysArr[i] = key

    // We look up the persistent fnstate for this key, or create it if new
    let elementState = bindContext.elementStates[key]
    if (!elementState) {
      elementState = fnstate(rawValue)
      // Ensure the parent state is set so child states can listen to selection changes
      elementState.parentCtx = ctx
      bindContext.elementStates[key] = elementState
      // If the user replaces the value of this elementState (e.g. elementState(newObj)),
      // we must update the original array to keep it in sync.
      elementState.subscribe((newItem) => {
        const currentArr = ctx.state()
        // If the parent is no longer an array, abort
        if (!Array.isArray(currentArr)) return

        // find the element dynamically because sorting/filtering might have shifted the index
        const idx = currentArr.findIndex((item, i) => keyMapper(ctx.mapKey, item, i) === key)

        if (idx > -1 && currentArr[idx] !== newItem) {
          currentArr[idx] = newItem
        }
      })
    } else {
      // Update existing state with new raw value.
      // fnstate handles the equality check (newValue !== oldValue) internally.
      elementState(rawValue)
    }
  }

  let prev = null
  const parent = bindContext.parent

  // 2. Render Loop
  for (let i = ctx.currentValue.length - 1; i >= 0; i--) {
    const key = keysArr[i]
    // Retrieve the element state to pass to the builder
    const valueState = bindContext.elementStates[key]

    let current = bindContext.boundElementByKey[key]
    let isNew = false

    if (current === undefined) {
      isNew = true
      // Track subscriptions created during the builder call so they can be
      // cleaned up when this item is removed from the array.
      if (!bindContext.elementCleanups) bindContext.elementCleanups = {}
      const prevCleanups = activeRenderCleanups
      const thisElementCleanups = []
      activeRenderCleanups = thisElementCleanups
      // Pass the valueState (the fnstate wrapper) to the user's element builder
      const evaluated = evaluateElement(bindContext.element, valueState)
      assertSingleNode(evaluated, 'bindChildren')
      current = bindContext.boundElementByKey[key] = renderNode(evaluated)
      activeRenderCleanups = prevCleanups
      bindContext.elementCleanups[key] = thisElementCleanups
      current.key = key
    }

    // place the element in the parent
    if (prev == null) {
      if (!parent.lastChild || parent.lastChild.key !== current.key) {
        parent.append(current)
      }
    } else {
      if (prev.previousSibling === null) {
        // insertAdjacentElement is faster, but some nodes don't have it (lookin' at you text)
        if (prev.insertAdjacentElement !== undefined && current.insertAdjacentElement !== undefined) {
          prev.insertAdjacentElement('beforebegin', current)
        } else {
          parent.insertBefore(current, prev)
        }
      } else if (prev.previousSibling.key !== current.key) {
        // the previous was deleted all together, so we will delete it and replace the element
        if (keys[prev.previousSibling.key] === undefined) {
          const keyToDelete = prev.previousSibling.key
          cleanElementSubscriptions(bindContext, keyToDelete)
          delete bindContext.boundElementByKey[keyToDelete]
          delete bindContext.elementStates[keyToDelete] // Cleanup element state

          delete ctx.selectObservers[keyToDelete]
          prev.previousSibling.replaceWith(current)
        } else if (isNew) {
          // insertAdjacentElement is faster, but some nodes don't have it (lookin' at you text)
          if (prev.insertAdjacentElement !== undefined) {
            prev.insertAdjacentElement('beforebegin', current)
          } else {
            parent.insertBefore(current, prev)
          }
        } else {
          // if it's an existing key, replace the current object with the correct object
          prev.previousSibling.replaceWith(current)
        }
      }
    }
    prev = current
  }

  // 3. Catch any strays (Cleanup)
  for (const key in bindContext.boundElementByKey) {
    if (keys[key] === undefined) {
      cleanElementSubscriptions(bindContext, key)
      bindContext.boundElementByKey[key].remove()
      delete bindContext.boundElementByKey[key]
      delete bindContext.elementStates[key] // Cleanup element state

      if (ctx.selectObservers[key] !== undefined) {
        delete ctx.selectObservers[key]
      }
    }
  }
}

const evaluateElement = (element, value, oldValue) => {
  if (element.isFnState) {
    return element()
  } else {
    return typeof element === 'function' ? element(value, oldValue) : element
  }
}

/**
 * Convert non objects (objects are assumed to be nodes) to text nodes and allow promises to resolve to nodes.
 * Arrays are flattened at any depth into a DocumentFragment.
 * @param {any} node The node to render
 * @returns {Node} The rendered node
 */
export function renderNode (node) {
  if (node && node.isTemplatePlaceholder) {
    const element = h('div')
    node(element, 'node')
    return element
  } else if (Array.isArray(node)) {
    // Arrays (including nested arrays and arrays resolved from promises) are
    // flattened into a DocumentFragment so each item lands in the DOM as its
    // own node. Without this, append/replaceWith would stringify the array.
    const frag = document.createDocumentFragment()
    for (const child of node) {
      frag.append(renderNode(child))
    }
    return frag
  } else if (node && typeof node === 'object') {
    if (typeof node.then === 'function') {
      let temp = h('div', { style: 'display:none', class: 'fntags-promise-marker' })
      node.then(el => {
        temp.replaceWith(renderNode(el))
        temp = null
      }).catch(e => console.error('Caught failed node promise.', e))
      return temp
    } else {
      return node
    }
  } else if (typeof node === 'function') {
    return renderNode(node())
  } else {
    return document.createTextNode(node + '')
  }
}

/**
 * All of these attributes must be set to an actual boolean to function correctly
 */
const booleanAttributes = {
  allowfullscreen: true,
  allowpaymentrequest: true,
  async: true,
  autofocus: true,
  autoplay: true,
  checked: true,
  controls: true,
  default: true,
  disabled: true,
  formnovalidate: true,
  hidden: true,
  ismap: true,
  itemscope: true,
  loop: true,
  multiple: true,
  muted: true,
  nomodule: true,
  novalidate: true,
  open: true,
  playsinline: true,
  readonly: true,
  required: true,
  reversed: true,
  selected: true,
  truespeed: true
}

const setAttribute = function (attrName, attr, element) {
  if (typeof attr === 'function') {
    if (attr.isBoundAttribute) {
      attr.init(attrName, element)
      attr = attr()
    } else if (attr.isTemplatePlaceholder) {
      attr(element, 'attr', attrName)
      return
    } else if (attrName.startsWith('on')) {
      element.addEventListener(attrName.substring(2), attr)
      return
    } else {
      attr = attr()
    }
  }
  if (attrName === 'style' && typeof attr === 'object') {
    for (const style in attr) {
      setStyle(style, attr[style], element)
    }
  } else if (attrName === 'value') {
    element.setAttribute('value', attr)
    // html5 nodes like range don't update unless the value property on the object is set
    element.value = attr
  } else if (booleanAttributes[attrName]) {
    element[attrName] = !!attr
  } else {
    let ns = null
    const nsIndex = hasNs(attrName)
    if (nsIndex > -1) {
      const split = splitNs(attrName, nsIndex)
      ns = split.ns
      attrName = split.val
    }
    element.setAttributeNS(ns, attrName, attr)
  }
}

const setStyle = (style, styleValue, element) => {
  if (typeof styleValue === 'function') {
    if (styleValue.isBoundStyle) {
      styleValue.init(style, element)
      styleValue = styleValue()
    } else if (styleValue.isTemplatePlaceholder) {
      styleValue(element, 'style', style)
      return
    } else {
      styleValue = styleValue()
    }
  }
  element.style[style] = styleValue && styleValue.toString()
}

/**
 * Check if the given value is an object that can be used as attributes
 * @param {any} val The value to check
 * @returns {boolean} true if the value is an object that can be used as attributes
 */
export function isAttrs (val) {
  return val && typeof val === 'object' && val.nodeType === undefined && !Array.isArray(val) && typeof val.then !== 'function'
}

/**
 * helper to get the attr object
 * @param {any} children
 * @return {object} the attr object or an empty object
 */
export function getAttrs (children) {
  return Array.isArray(children) && isAttrs(children[0]) ? children[0] : {}
}

/**
 * A function to create an element with a pre-defined style.
 * For example, the flex* elements in fnelements.
 *
 * @template {HTMLElement|SVGElement} T
 *
 * @param {object|string} style The style to apply to the element
 * @param {string} tag The tag to use when creating the element
 * @param {object[]|Node[]} children The children to append to the element
 * @return {T} The styled element
 */
export function styled (style, tag, children) {
  const firstChild = children[0]
  if (isAttrs(firstChild)) {
    if (typeof firstChild.style === 'string') {
      firstChild.style = [stringifyStyle(style), stringifyStyle(firstChild.style)].join(';')
    } else {
      firstChild.style = Object.assign(style, firstChild.style)
    }
  } else {
    children.unshift({ style })
  }
  return h(tag, ...children)
}

const stringifyStyle = style =>
  typeof style === 'string'
    ? style
    : Object.keys(style).map(prop => `${prop}:${style[prop]}`).join(';')

/**
 * Register a component function for HMR. Returns a stable proxy that always delegates
 * to the latest registered implementation. When a module re-executes after HMR, the
 * proxy's target is updated so callers holding stale import bindings get the new code.
 *
 * @param {string} id A stable identifier for this component (typically 'filepath:exportName')
 * @param {Function} fn The component function
 * @returns {Function} A stable proxy function
 */
export function registeredComponent (id, fn) {
  if (!globalThis.__fntags_components) {
    globalThis.__fntags_components = new Map()
  }
  const reg = globalThis.__fntags_components
  reg.set(id, fn)
  if (!reg.has(id + '$proxy')) {
    const proxy = function (...args) {
      return reg.get(id).apply(this, args)
    }
    reg.set(id + '$proxy', proxy)
  }
  return reg.get(id + '$proxy')
}

/**
 * Get or create a state instance from the global HMR registry.
 * During development with HMR, the Vite plugin rewrites fnstate() calls to use this function,
 * ensuring state instances survive module reloads.
 *
 * @param {string} id A stable identifier for this state instance (typically 'filepath:varName')
 * @param {any} initialValue The initial value, used only when creating a new state
 * @param {((v: any) => string)?} [mapKey] Optional key function, used only when creating a new state
 * @returns {FnState} The state instance from the registry
 */
export function registeredState (id, initialValue, mapKey) {
  if (!globalThis.__fntags_registry) {
    globalThis.__fntags_registry = new Map()
  }
  const registry = globalThis.__fntags_registry
  if (registry.has(id)) {
    return registry.get(id)
  }
  const state = fnstate(initialValue, mapKey)
  registry.set(id, state)
  return state
}

/**
 * Create an HMR-aware root mount point. Renders the app into the container and
 * registers a global rerender callback so the vite plugin can trigger re-renders
 * automatically when modules are hot-updated.
 *
 * @param {HTMLElement} container The DOM element to mount into
 * @param {(()=>Node)|Node} appFn A function that returns the app's root element, or the element itself
 * @returns {HTMLElement} The container element
 */
export function hmrRoot (container, appFn) {
  const render = () => {
    container.innerHTML = ''
    const result = typeof appFn === 'function' ? appFn() : appFn
    container.appendChild(renderNode(result))
  }
  render()
  globalThis.__fntags_hmr_rerender = render
  return container
}

/**
 * Create a compiled template function. The returned function takes a single object that contains the properties
 * defined in the template.
 *
 * This allows fast rendering by pre-creating a dom element with the entire template structure then cloning and populating
 * the clone with data from the provided context. This avoids the work of having to re-execute the tag functions
 * one by one and can speed up situations where a similar element is created many times.
 *
 * You cannot bind state to the initial template. If you attempt to, the state will be read, but the elements will
 * not be updated when the state changes because they will not be bound to the cloned element.
 * All state bindings must be passed in the context to the compiled template to work correctly.
 *
 * @param {(any)=>Node} templateFn A function that returns a html node.
 * @return {(any)=>Node} A function that takes a context object and returns a rendered node.
 *
 */
export function fntemplate (templateFn) {
  if (typeof templateFn !== 'function') {
    throw new Error('You must pass a function to fntemplate.')
  }

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
    if (node._tpl_bind) {
      bindingsByPath.push({ path: [...path], binds: node._tpl_bind })
      delete node._tpl_bind
    }

    let child = node.firstChild
    let i = 0
    while (child) {
      traverse(child, [...path, i])
      child = child.nextSibling
      i++
    }
  }

  traverse(root, [])

  return (context) => {
    const clone = root.cloneNode(true)
    for (let i = 0; i < bindingsByPath.length; i++) {
      const entry = bindingsByPath[i]
      let target = clone
      const path = entry.path
      for (let j = 0; j < path.length; j++) {
        target = target.childNodes[path[j]]
      }

      const binds = entry.binds
      for (let j = 0; j < binds.length; j++) {
        const b = binds[j]
        const val = context[b.prop]
        if (b.type === 'node') {
          target.replaceWith(renderNode(val))
        } else if (b.type === 'attr') {
          setAttribute(b.attr, val, target)
        } else if (b.type === 'style') {
          setStyle(b.attr, val, target)
        }
      }
    }
    return clone
  }
}
