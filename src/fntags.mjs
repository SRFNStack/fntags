/**
 * @module fntags
 */

// Tracks subscriptions created during a bindAs render so they can be cleaned
// up when the bindAs re-renders. null means we are not inside a render.
let activeRenderCleanups = null

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

function runCleanups (elCtx) {
  if (!elCtx.cleanups) return
  for (const unsub of elCtx.cleanups) unsub()
  elCtx.cleanups = null
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
 * An attribute value of null, undefined or '' means no attribute: it is removed if present and never written,
 * so { class: '' } produces an element without a class attribute. The value attribute and boolean attributes
 * (disabled, checked, ...) are exempt and keep their property semantics.
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
  return createElement(tag, children)
}

// Create an element from an array of children (h and styled call into this).
// Only tags with a namespace ('http://www.w3.org/2000/svg:svg') go through
// createElementNS; lastIndexOf is used because the namespace itself has a ':'.
function createElement (tag, children) {
  const nsIndex = tag.lastIndexOf(':')
  const element = nsIndex === -1
    ? document.createElement(tag)
    : document.createElementNS(tag.slice(0, nsIndex), tag.slice(nsIndex + 1))
  const len = children.length
  let i = 0
  if (len > 0) {
    const attrs = children[0]
    if (isAttrs(attrs)) {
      i = 1
      setAttributes(attrs, element)
    }
  }
  if (i === len - 1) {
    // A lone text child is set with textContent, which creates the text node
    // without a JS wrapper. '' is left to the loop so it still produces an
    // empty text node like it always has.
    const only = children[i]
    if (typeof only === 'string') {
      if (only !== '') {
        element.textContent = only
        return element
      }
    } else if (typeof only === 'number') {
      element.textContent = '' + only
      return element
    }
  }
  for (; i < len; i++) {
    appendChild(element, children[i])
  }
  return element
}

function setAttributes (attrs, element) {
  let hasValue = false
  for (const a in attrs) {
    // set value last to ensure value constraints are set before trying to set the value to avoid modification
    // For example, when using a range and specifying a min and max
    //  if the value is set first and is outside the default 1 to 100 range
    //  the value will be adjusted to be within the range, even though the value attribute will be set correctly
    if (a === 'value') {
      hasValue = true
    } else {
      setAttribute(a, attrs[a], element)
    }
  }
  if (hasValue) {
    setAttribute('value', attrs.value, element)
  }
}

// Append one h() child. Nodes go straight to appendChild; strings and other
// primitives are appended as is, which lets the DOM create the text node
// without a JS wrapper (null, undefined, numbers and objects stringify exactly
// like createTextNode(x + '') did). Arrays append their items directly instead
// of building the DocumentFragment renderNode would.
function appendChild (element, child) {
  if (typeof child === 'object') {
    if (child === null) {
      element.append('null')
    } else if (child.nodeType !== undefined) {
      element.appendChild(child)
    } else if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) {
        appendChild(element, child[i])
      }
    } else {
      element.append(renderNode(child))
    }
  } else if (typeof child === 'function') {
    // renderNode returns the function's result as is when it is a non-node
    // object, and append stringifies that where appendChild would throw.
    const rendered = renderNode(child)
    if (rendered.nodeType !== undefined) {
      element.appendChild(rendered)
    } else {
      element.append(rendered)
    }
  } else {
    element.append(child)
  }
}

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
  const ctx = {
    currentValue: initialValue,
    observers: [],
    bindContexts: [],
    selectObservers: {},
    nextId: 0,
    mapKey,
    state (newState) {
      if (arguments.length === 0 || (arguments.length === 1 && arguments[0] === ctx.state)) {
        return ctx.currentValue
      } else {
        const oldState = ctx.currentValue
        ctx.currentValue = newState
        const snapshot = ctx.observers.slice()
        for (const observer of snapshot) {
          observer.fn(newState, oldState)
        }
      }
      return newState
    }
  }
  // make context available to static functions to avoid declaring functions on every new state
  ctx.state._ctx = ctx

  /**
   * Bind this state to the given element
   *
   * @param {((T)=>(Node|any))?} [element] The element to bind to. If not a function, an update function must be passed. If not passed, defaults to the state's value
   * @returns {()=>Node}
   */
  ctx.state.bindAs = doBindAs

  /**
   * Bind the values of this state to the given element.
   * Values are items/elements of an array.
   * If the current value is not an array, this will behave the same as bindAs.
   *
   * @param {(()=>(Node|any)) | Node | any} parent The parent to bind the children to.
   * @param {(childState: FnState)=>(Node|any)} element A function that receives each element wrapped as a fnstate and produces an element
   * @returns {Node}
   */
  ctx.state.bindChildren = doBindChildren

  /**
   * Bind to a property of an object stored in this state instead of the state itself.
   *
   * Shortcut for `mystate.bindAs((current)=> current[prop])`
   *
   * @param {string} prop The object property to bind as
   * @returns {()=>Node}
   */
  ctx.state.bindProp = doBindProp

  /**
   * Bind attribute values to state changes
   * @param {(()=>(string|any))?} [attribute] A function that returns an attribute value. If not passed, defaults to the state's value
   * @returns {()=>(string|any)} A function that calls the passed function, with some extra metadata
   */
  ctx.state.bindAttr = doBindAttr

  /**
   * Bind style values to state changes
   * @param {(()=>string)?} [style] A function that returns a style's value. If not passed, defaults to the state's value
   * @returns {()=>Node} A function that calls the passed function, with some extra metadata
   */
  ctx.state.bindStyle = doBindStyle

  /**
   * Bind select and deselect to an element
   * @param {(()=>(Node|any))?} [element] The element to bind to. If not passed, defaults to the state's value
   * @returns {()=>Node}
   */
  ctx.state.bindSelect = doBindSelect

  /**
   * Bind select and deselect to an attribute
   * @param {(()=>(string|any))?} [attribute] A function that returns an attribute value. If not passed, defaults to the state's value
   * @returns {()=>(string|any)} A function that calls the passed function, with some extra metadata
   */
  ctx.state.bindSelectAttr = doBindSelectAttr

  /**
   * Mark the element with the given key as selected. This causes the bound select functions to be executed.
   */
  ctx.state.select = doSelect

  /**
   * Get the currently selected key
   * @returns {any}
   */
  ctx.state.selected = doSelected

  ctx.state.isFnState = true

  /**
   * Perform an Object.assign() on the current state using the provided update
   * @param {T} [update]
   */
  ctx.state.assign = doAssign

  /**
   * Get a value at the given property path, an error is thrown if the value is not an object
   *
   * This returns a reference to the real current value. If you perform any modifications to the object, be sure to call setPath after you're done or the changes
   * will not be reflected correctly.
   * @param {string} [path] a json path type path that points to a property
   */
  ctx.state.getPath = doGetPath

  /**
   * Set a value at the given property path
   * @param {string} path The JSON path of the value to set
   * @param {any} value The value to set the path to
   * @param {boolean} fillWithObjects Whether to replace non object values with new empty objects.
   */
  ctx.state.setPath = doSetPath

  /**
   * Register a callback that will be executed whenever the state is changed
   * @param {(newValue:T,oldValue:T)=>void} callback
   * @return {()=>void} a function to stop the subscription
   */
  ctx.state.subscribe = doSubscribe

  return ctx.state
}

function doSubscribe (callback) {
  const ctx = this._ctx
  const id = ctx.nextId++
  ctx.observers.push({ id, fn: callback })
  // Idempotent unsub — safe to call multiple times
  let active = true
  const unsub = () => {
    if (!active) return
    active = false
    const idx = ctx.observers.findIndex(l => l.id === id)
    if (idx !== -1) ctx.observers.splice(idx, 1)
  }
  // If we're inside a bindAs render, register this subscription for cleanup
  // on the next re-render. This prevents nested bindAs/bindAttr/bindStyle
  // subscriptions from accumulating when the parent bindAs re-renders.
  if (activeRenderCleanups !== null) {
    activeRenderCleanups.push(unsub)
  }
  return unsub
}

const subscribeSelect = (ctx, callback) => {
  const parentCtx = ctx.state.parentCtx
  const key = keyMapper(parentCtx.mapKey, ctx.currentValue, 0)
  if (parentCtx.selectObservers[key] === undefined) {
    parentCtx.selectObservers[key] = []
  }
  parentCtx.selectObservers[key].push(callback)

  // Return an unsub that removes this callback, and register it in
  // activeRenderCleanups so parent bindAs re-renders clean it up.
  let active = true
  const unsub = () => {
    if (!active) return
    active = false
    const arr = parentCtx.selectObservers[key]
    if (arr) {
      const idx = arr.indexOf(callback)
      if (idx !== -1) arr.splice(idx, 1)
      if (arr.length === 0) delete parentCtx.selectObservers[key]
    }
  }
  if (activeRenderCleanups !== null) {
    activeRenderCleanups.push(unsub)
  }
  return unsub
}

function doBindSelectAttr (attribute) {
  attribute = attribute ?? this
  const ctx = this._ctx
  const attrFn = (attribute && !attribute.isFnState && typeof attribute === 'function')
    ? (...args) => attribute(args.length > 0 ? args[0] : ctx.selected)
    : attribute
  const boundAttr = createBoundAttr(attrFn, this)
  boundAttr.init = (attrName, element) =>
    subscribeSelect(ctx, (selectedKey) => setAttribute(attrName, attribute.isFnState ? attribute() : attribute(selectedKey), element))
  return boundAttr
}

function createBoundAttr (attr, state) {
  if (typeof attr !== 'function') {
    throw new Error('You must pass a function to bindAttr')
  }
  // wrap the function to avoid modifying it
  const boundAttr = () => attr(state())
  boundAttr.isBoundAttribute = true
  return boundAttr
}

function doBindAttr (attribute) {
  attribute = attribute ?? this
  const boundAttr = createBoundAttr(attribute, this)
  boundAttr.init = (attrName, element) => {
    setAttribute(attrName, attribute.isFnState ? attribute() : attribute(this()), element)
    this.subscribe((newState, oldState) => setAttribute(attrName, attribute.isFnState ? attribute() : attribute(newState, oldState), element))
  }
  return boundAttr
}

function doBindStyle (style) {
  style = style ?? this
  if (typeof style !== 'function') {
    throw new Error('You must pass a function to bindStyle')
  }
  const boundStyle = () => style()
  boundStyle.isBoundStyle = true
  boundStyle.init = (styleName, element) => {
    element.style[styleName] = style.isFnState ? style() : style(this())
    this.subscribe((newState, oldState) => { element.style[styleName] = style.isFnState ? style() : style(newState, oldState) })
  }
  return boundStyle
}

function doSelect (key) {
  const ctx = this._ctx
  const currentSelected = ctx.selected
  ctx.selected = key
  if (ctx.selectObservers[currentSelected] !== undefined) {
    for (const obs of ctx.selectObservers[currentSelected].slice()) obs(ctx.selected)
  }
  if (ctx.selectObservers[ctx.selected] !== undefined) {
    for (const obs of ctx.selectObservers[ctx.selected].slice()) obs(ctx.selected)
  }
}

function doSelected () {
  return this._ctx.selected
}

function doAssign (update) {
  return this(Object.assign(this._ctx.currentValue, update))
}

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

  // items: key -> item record (see newItem). order: the item records in array
  // order, rebuilt by every arrangeElements pass and reused across passes to
  // avoid allocating an array per update. gen: pass counter used to detect
  // duplicate keys and strays without a per-pass key set.
  const bindContext = { element, parent, items: new Map(), order: [], gen: 0 }
  ctx.bindContexts.push(bindContext)

  // If inside a parent bindAs render, register a cleanup that tears down all
  // per-item subscriptions when the parent re-renders or is itself torn down.
  // Without this, nested bindAttr/bindStyle/bindAs subscriptions created for
  // each array item would be orphaned when the parent replaces this tree.
  if (activeRenderCleanups !== null) {
    activeRenderCleanups.push(() => {
      for (const item of bindContext.items.values()) runItemCleanups(item)
      bindContext.items.clear()
      bindContext.order.length = 0
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

const doBind = function (ctx, element, handleReplace) {
  if (typeof element !== 'function') {
    throw new Error('You must pass a function to bind with')
  }

  // Track subscriptions created during the initial render so they can be
  // cleaned up if this bindAs itself re-renders (updateReplacer) or when
  // a parent bindAs re-renders and tears us down entirely.
  const prevRenderCleanups = activeRenderCleanups
  const thisRenderCleanups = []
  activeRenderCleanups = thisRenderCleanups
  const evaluated = evaluateElement(element, ctx.currentValue)
  assertSingleNode(evaluated, 'bindAs')
  const childElCtx = (typeof evaluated === 'function' && evaluated.isBindGetter)
    ? evaluated.elCtx
    : null
  const elCtx = { current: renderNode(evaluated), cleanups: thisRenderCleanups }
  // When the evaluated element is itself a bind getter (a nested bindAs/bindSelect),
  // register this elCtx as a back-ref on the child so that later child-driven
  // node swaps keep this elCtx.current in sync with the live DOM node.
  if (childElCtx && childElCtx.current === elCtx.current) {
    addParentRef(childElCtx, elCtx)
  }
  // Suppress tracking during handleReplace — the driving subscription is
  // registered separately below as part of a cascading cleanup.
  activeRenderCleanups = null
  handleReplace(elCtx)
  activeRenderCleanups = prevRenderCleanups

  // If inside a parent bindAs render, register a cascading cleanup that tears
  // down both the driving subscription and all subscriptions created inside
  // this bindAs's render, so they don't outlive the parent's re-render.
  if (prevRenderCleanups !== null && (elCtx.drivingUnsub || elCtx.selectUnsub)) {
    prevRenderCleanups.push(() => {
      if (elCtx.drivingUnsub) elCtx.drivingUnsub()
      if (elCtx.selectUnsub) elCtx.selectUnsub()
      runCleanups(elCtx)
      // Mark dead so any child elCtx that still holds us in its parentRefs
      // can prune us lazily on its next propagateReplace walk.
      elCtx.dead = true
    })
  }

  const getter = () => elCtx.current
  getter.isBindGetter = true
  getter.elCtx = elCtx
  return getter
}

// Register a back-ref from a child bind elCtx to a parent elCtx, avoiding
// duplicate entries when the same parent re-renders against the same child.
function addParentRef (childElCtx, parentElCtx) {
  if (!childElCtx.parentRefs) {
    childElCtx.parentRefs = [parentElCtx]
  } else if (!childElCtx.parentRefs.includes(parentElCtx)) {
    childElCtx.parentRefs.push(parentElCtx)
  }
}

// Walk the back-ref chain and update any ancestor elCtx whose .current still
// points at the old DOM node. Used when a nested bindAs swaps its node so the
// outer bindAs keeps a live reference instead of a detached one. Prunes any
// dead ancestors encountered so parentRefs does not retain torn-down elCtxs.
function propagateReplace (elCtx, oldNode, newNode) {
  const refs = elCtx.parentRefs
  if (!refs) return
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

const updateReplacer = (ctx, element, elCtx) => (_, oldValue) => {
  // Clean up subscriptions from the previous render before re-rendering.
  // This prevents nested bindAs/bindAttr/bindStyle subscriptions from
  // accumulating each time the parent state changes.
  runCleanups(elCtx)

  // Track subscriptions created during this re-render for cleanup next time.
  const prevRenderCleanups = activeRenderCleanups
  const thisRenderCleanups = []
  activeRenderCleanups = thisRenderCleanups
  const evaluated = evaluateElement(element, ctx.currentValue, oldValue)
  assertSingleNode(evaluated, 'bindAs')
  const childElCtx = (typeof evaluated === 'function' && evaluated.isBindGetter)
    ? evaluated.elCtx
    : null
  let rendered = renderNode(evaluated)
  activeRenderCleanups = prevRenderCleanups
  elCtx.cleanups = thisRenderCleanups

  if (rendered !== undefined) {
    // If this bindAs renders the root node of a bindChildren item, point the
    // item at the new node so the next arrange pass sees the live node.
    rebindItemNode(elCtx.current, rendered)
    // Re-establish the parent-ref link when a re-render resolves to another
    // nested bind getter, so future child swaps propagate back to this elCtx.
    if (childElCtx && childElCtx.current === rendered) {
      addParentRef(childElCtx, elCtx)
    }
    // Perform this action on the next event loop to give the parent a chance to render
    new Promise((resolve) => {
      // Guard: skip replaceWith when the same element is returned (e.g. when
      // toggling between two pre-built element references). el.replaceWith(el)
      // is a no-op in the DOM but wastes a microtask.
      if (rendered !== elCtx.current) {
        const oldCurrent = elCtx.current
        if (devMode) warnIfReplacingFocused(oldCurrent)
        elCtx.current.replaceWith(rendered)
        elCtx.current = rendered
        // Keep any ancestor bindAs whose elCtx shared this node in sync with
        // the new node, so their next replaceWith targets a live DOM node.
        propagateReplace(elCtx, oldCurrent, rendered)
      }
      rendered = null
      resolve()
    }).catch(e => {
      console.error('Failed to replace element with new element')
      console.dir(elCtx, rendered)
      const err = new Error('Failed to replace element with new element')
      err.stack += '\nCaused by: ' + e.stack
      throw e
    })
  }
}

function doBindSelect (element) {
  element = element ?? this
  const ctx = this._ctx
  return doBind(ctx, element, (elCtx) => {
    elCtx.selectUnsub = subscribeSelect(ctx, updateReplacer(ctx, element, elCtx))
  })
}

function doBindAs (element) {
  const ctx = this._ctx
  const el = element ?? this
  return doBind(ctx, el, (elCtx) => {
    // Store so doBind can build a cascading cleanup when nested inside another bindAs
    elCtx.drivingUnsub = this.subscribe(updateReplacer(ctx, el, elCtx))
  })
}

/**
 * Reconcile the state of the current array value with the state of the bound elements
 */
function reconcile (ctx, oldState) {
  for (const bindContext of ctx.bindContexts) {
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

// Each bindChildren item is tracked by one record:
//   key      the mapKey result for the item
//   state    the per-item fnstate handed to the builder
//   node     the rendered root node, undefined until the builder has run
//   cleanups subscriptions created by the builder, null when there are none
//   index    the item's index in the array as of the last arrange pass
//   gen      the bindContext.gen of the last arrange pass that saw this key
// The root node carries a back reference to its record in `_fnItem` so the
// arrange loop can identify a sibling it did not expect with a property load
// instead of a lookup, and so a bindAs that swaps an item's root node can
// update the record without knowing which bindContext it belongs to.
function newItem (ctx, key, rawValue, index, gen) {
  const state = fnstate(rawValue)
  // Ensure the parent state is set so child states can listen to selection changes
  state.parentCtx = ctx
  const item = { key, state, node: undefined, cleanups: null, index, gen }
  // If the user replaces the value of this item's state (e.g. itemState(newObj)),
  // write it back into the parent array to keep the two in sync.
  state.subscribe((newValue) => {
    const arr = ctx.currentValue
    // If the parent is no longer an array, abort
    if (!Array.isArray(arr)) return
    let idx = item.index
    // Fast path: arrangeElements just synced this item from the array, or the
    // array already holds the value. Nothing to write.
    if (idx < arr.length && arr[idx] === newValue) return
    // The recorded index is only trusted when the key still matches there.
    // Sorting or filtering the array in place without calling the parent
    // state would leave it stale, so fall back to a scan in that case.
    if (idx >= arr.length || keyMapper(ctx.mapKey, arr[idx], idx) !== key) {
      idx = arr.findIndex((v, i) => keyMapper(ctx.mapKey, v, i) === key)
    }
    if (idx > -1) arr[idx] = newValue
  })
  return item
}

// Called by updateReplacer when a bindAs swaps the node it rendered. If that
// node is the root node of a bindChildren item, the item follows it.
function rebindItemNode (oldNode, newNode) {
  const item = oldNode._fnItem
  if (item !== undefined && item.node === oldNode) {
    item.node = newNode
    newNode._fnItem = item
  }
}

function runItemCleanups (item) {
  const cleanups = item.cleanups
  if (cleanups === null) return
  item.cleanups = null
  for (const unsub of cleanups) unsub()
}

function removeItem (ctx, bindContext, item, detach) {
  runItemCleanups(item)
  bindContext.items.delete(item.key)
  if (ctx.selectObservers[item.key] !== undefined) {
    delete ctx.selectObservers[item.key]
  }
  const node = item.node
  if (node !== undefined) {
    node._fnItem = undefined
    if (detach) node.remove()
  }
}

// Shared scratch list for subscriptions created while an item builder runs.
// Builders nest (a bindChildren inside an item builder arranges synchronously),
// so each build only owns the entries above its own start offset.
const itemCleanupScratch = []

function buildItemNode (bindContext, item) {
  const prevCleanups = activeRenderCleanups
  const start = itemCleanupScratch.length
  activeRenderCleanups = itemCleanupScratch
  try {
    // Pass the item state (the fnstate wrapper) to the user's element builder
    const evaluated = evaluateElement(bindContext.element, item.state)
    assertSingleNode(evaluated, 'bindChildren')
    const node = renderNode(evaluated)
    if (itemCleanupScratch.length > start) {
      item.cleanups = itemCleanupScratch.slice(start)
    }
    item.node = node
    node._fnItem = item
    return node
  } finally {
    itemCleanupScratch.length = start
    activeRenderCleanups = prevCleanups
  }
}

// insertAdjacentElement is faster, but some nodes don't have it (lookin' at you text)
function insertBeforeNode (parent, ref, node) {
  if (ref.insertAdjacentElement !== undefined && node.insertAdjacentElement !== undefined) {
    ref.insertAdjacentElement('beforebegin', node)
  } else {
    parent.insertBefore(node, ref)
  }
}

function arrangeElements (ctx, bindContext, oldState) {
  const values = ctx.currentValue
  const items = bindContext.items
  if (!values?.length) {
    // Clean up subscriptions for all existing elements before clearing
    for (const item of items.values()) {
      runItemCleanups(item)
      if (item.node !== undefined) item.node._fnItem = undefined
    }
    items.clear()
    bindContext.order.length = 0
    bindContext.parent.textContent = ''
    ctx.selectObservers = {}
    return
  }

  const n = values.length
  const gen = ++bindContext.gen
  const order = bindContext.order
  const mapKey = ctx.mapKey
  // Only ever shrink here: the loop below fills order in sequence, so growing
  // it is a plain append and never leaves holes (growing via .length first
  // would have V8 hand out a sparse backing store).
  if (order.length > n) order.length = n

  // 1. Map every array value to its item record, creating records for new
  // keys and pushing changed values into existing item states.
  for (let i = 0; i < n; i++) {
    const rawValue = values[i]
    // Use the raw value to get the key
    const key = keyMapper(mapKey, rawValue, i)
    let item = items.get(key)
    if (item === undefined) {
      item = newItem(ctx, key, rawValue, i, gen)
      items.set(key, item)
    } else {
      if (item.gen === gen) {
        if (oldState) ctx.state(oldState)
        throw new Error('Duplicate keys in a bound array are not allowed, state reset to previous value.')
      }
      item.gen = gen
      item.index = i
      // An item is only pushed into its state (and so re-rendered) when its
      // reference changed. Callers who mutate an item in place must either
      // call the item state the builder received, or replace the object in
      // the array, for bindings on that item to update.
      if (item.state._ctx.currentValue !== rawValue) {
        item.state(rawValue)
      }
    }
    order[i] = item
  }

  const parent = bindContext.parent
  let prev = null

  // 2. Render loop, walking from the end so each node is placed before the
  // one that follows it.
  for (let i = n - 1; i >= 0; i--) {
    const item = order[i]
    let current = item.node
    let isNew = false
    if (current === undefined) {
      isNew = true
      current = buildItemNode(bindContext, item)
    }

    // place the element in the parent
    if (prev === null) {
      if (parent.lastChild !== current) {
        parent.append(current)
      }
    } else {
      const sib = prev.previousSibling
      if (sib === null) {
        insertBeforeNode(parent, prev, current)
      } else if (sib !== current) {
        const sibItem = sib._fnItem
        if (sibItem === undefined || sibItem.gen !== gen) {
          // the previous was deleted all together (or is not ours), so we
          // will delete it and replace the element
          if (sibItem !== undefined) removeItem(ctx, bindContext, sibItem, false)
          sib.replaceWith(current)
        } else if (isNew) {
          insertBeforeNode(parent, prev, current)
        } else {
          // if it's an existing key, replace the current object with the correct object
          sib.replaceWith(current)
        }
      }
    }
    prev = current
  }

  // 3. Catch any strays (Cleanup). Every current key was visited above, so
  // there are strays only when more records than values remain.
  if (items.size > n) {
    for (const item of items.values()) {
      if (item.gen !== gen) removeItem(ctx, bindContext, item, true)
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
  if (typeof node === 'object') {
    if (node === null) {
      return document.createTextNode('null')
    } else if (node.nodeType !== undefined) {
      return node
    } else if (Array.isArray(node)) {
      // Arrays (including nested arrays and arrays resolved from promises) are
      // flattened into a DocumentFragment so each item lands in the DOM as its
      // own node. Without this, append/replaceWith would stringify the array.
      const frag = document.createDocumentFragment()
      for (let i = 0; i < node.length; i++) {
        appendChild(frag, node[i])
      }
      return frag
    } else if (typeof node.then === 'function') {
      let temp = h('div', { style: 'display:none', class: 'fntags-promise-marker' })
      node.then(el => {
        temp.replaceWith(renderNode(el))
        temp = null
      }).catch(e => console.error('Caught failed node promise.', e))
      return temp
    } else {
      return node
    }
  } else if (typeof node === 'string') {
    return document.createTextNode(node)
  } else if (typeof node === 'function') {
    if (node.isTemplatePlaceholder) {
      // Template child placeholders are empty text nodes that fntemplate fills in place per clone.
      const text = document.createTextNode('')
      node(text, 'node')
      return text
    }
    return renderNode(node())
  } else {
    return document.createTextNode(node + '')
  }
}

/**
 * All of these attributes must be set to an actual boolean to function correctly
 */
const booleanAttributes = new Set([
  'allowfullscreen',
  'allowpaymentrequest',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
  'truespeed'
])

// 'onclick' -> 'click', computed once per attribute name instead of a substring per element
const eventNames = new Map()
const eventName = attrName => {
  let name = eventNames.get(attrName)
  if (name === undefined) {
    name = attrName.slice(2)
    eventNames.set(attrName, name)
  }
  return name
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
      element.addEventListener(eventName(attrName), attr)
      return
    } else {
      attr = attr()
    }
  }
  if (attrName === 'value') {
    element.setAttribute('value', attr)
    // html5 nodes like range don't update unless the value property on the object is set
    element.value = attr
  } else if (attrName === 'style' && typeof attr === 'object') {
    for (const style in attr) {
      setStyle(style, attr[style], element)
    }
  } else if (booleanAttributes.has(attrName)) {
    element[attrName] = !!attr
  } else {
    const nsIndex = attrName.lastIndexOf(':')
    if (attr === '' || attr === null || attr === undefined) {
      // An empty value means no attribute: remove it if present. Bound
      // attributes rely on this to go from 'danger' back to nothing.
      if (nsIndex === -1) {
        element.removeAttribute(attrName)
      } else {
        element.removeAttributeNS(attrName.slice(0, nsIndex), attrName.slice(nsIndex + 1))
      }
    } else if (nsIndex === -1) {
      element.setAttribute(attrName, attr)
    } else {
      element.setAttributeNS(attrName.slice(0, nsIndex), attrName.slice(nsIndex + 1), attr)
    }
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
  return typeof val === 'object' && val !== null && val.nodeType === undefined && !Array.isArray(val) && typeof val.then !== 'function'
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
  return createElement(tag, children)
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

// Binding kinds for compiled templates, resolved once per template so instantiation
// only switches on a small integer per binding instead of inspecting names and values.
const TPL_NODE = 0 // child placeholder: an empty text node in the template, filled in place
const TPL_ATTR = 1 // plain attribute: element.setAttribute for primitives, setAttribute() otherwise
const TPL_ATTR_FULL = 2 // value, boolean, style or namespaced attribute: always the full setAttribute rules
const TPL_EVENT = 3 // on* attribute: addEventListener with the event name stripped at compile time
const TPL_STYLE = 4 // style property

// Ops for the per-clone walk that locates bound nodes. The low two bits are the op,
// the rest is a slot in the refs array. Captured slots serve both as binding targets
// and as anchors to return to after a sibling's subtree has been walked.
const OP_FIRST_CHILD = 0 // cur = cur.firstChild
const OP_NEXT_SIBLING = 1 // cur = cur.nextSibling
const OP_CAPTURE = 2 // refs[slot] = cur
const OP_NEXT_FROM = 3 // cur = refs[slot].nextSibling

function compileTemplateBinding (b, ref) {
  const name = b.attr
  if (b.type === 'node') {
    return { kind: TPL_NODE, ref, prop: b.prop, name: null, event: null }
  } else if (b.type === 'style') {
    return { kind: TPL_STYLE, ref, prop: b.prop, name, event: null }
  } else if (name === 'value' || name === 'style' || booleanAttributes.has(name) || name.lastIndexOf(':') > -1) {
    return { kind: TPL_ATTR_FULL, ref, prop: b.prop, name, event: null }
  } else if (name.startsWith('on')) {
    return { kind: TPL_EVENT, ref, prop: b.prop, name, event: name.substring(2) }
  } else {
    return { kind: TPL_ATTR, ref, prop: b.prop, name, event: null }
  }
}

// Fill a child placeholder (an empty text node already in the clone) with a context value.
// Primitives are written into the text node (textContent measured faster than data for Text nodes), so no node is created or inserted. A bindAs
// getter whose live node is a detached text node adopts the placeholder as its live node,
// so later updates replace the placeholder in place. Anything else is rendered and swapped in.
function fillTemplateText (target, val) {
  if (typeof val === 'function') {
    if (val.isBindGetter) {
      const elCtx = val.elCtx
      const current = elCtx.current
      // Adopt only when nobody else holds this text node: it must be detached and the
      // render that produced it must not have created nested bindings (a nested bindAs
      // shares the same node through its own elCtx, which must keep pointing at the
      // node that is actually in the document).
      if (current.nodeType === 3 && current.parentNode === null && (!elCtx.cleanups || elCtx.cleanups.length === 0)) {
        target.textContent = current.data
        elCtx.current = target
        return
      }
      target.replaceWith(renderNode(val))
    } else {
      fillTemplateText(target, val())
    }
  } else if (val === null || typeof val !== 'object') {
    target.textContent = typeof val === 'string' ? val : val + ''
  } else {
    target.replaceWith(renderNode(val))
  }
}

/**
 * Create a compiled template function. The returned function takes a single object that contains the properties
 * defined in the template.
 *
 * The template function receives a context function. Calling `ctx('prop')` returns a placeholder that can be used
 * as a child, as an attribute value, or as a style value. The template is rendered once to a dom tree; each
 * instantiation clones that tree and fills the placeholders from the context object, which avoids re-executing
 * the tag functions and can speed up situations where a similar element is created many times.
 *
 * Child placeholders are empty text nodes in the template. A primitive context value is written into the text node
 * in place. A bindAs/bindSelect getter whose current node is a text node adopts the placeholder as its live node,
 * so state changes keep updating the clone. A function value is evaluated like renderNode does. Nodes, arrays and
 * promises replace the placeholder with their rendered node.
 *
 * The locations of all placeholders are compiled once into a single firstChild/nextSibling walk over the clone,
 * which stops at the last bound node, so instantiation does not depend on the size of the unbound parts of the tree.
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

  const initContext = prop => {
    const placeholder = (node, type, attr) => {
      if (!node._tpl_bind) node._tpl_bind = []
      node._tpl_bind.push({ prop, type, attr })
    }
    placeholder.isTemplatePlaceholder = true
    return placeholder
  }

  const root = renderNode(templateFn(initContext))

  // Count bound nodes per subtree so the walk can skip unbound subtrees and stop after the last binding.
  const counts = new Map()
  const boundNodes = []
  const count = node => {
    let n = 0
    if (node._tpl_bind) {
      n = 1
      boundNodes.push(node)
    }
    for (let child = node.firstChild; child; child = child.nextSibling) {
      n += count(child)
    }
    counts.set(node, n)
    return n
  }
  count(root)

  const ops = []
  const bindings = []
  let nRefs = 0

  // Emit the ops that visit every bound node in node's subtree in document order. On entry the cursor is at
  // node. `after` is the number of bound nodes still to visit once this subtree is done; when it is zero the
  // cursor never needs to come back, so no anchor is captured. Returns node's ref slot, or -1.
  const visit = (node, after) => {
    const bound = node._tpl_bind
    const inside = counts.get(node) - (bound ? 1 : 0)
    let ref = -1
    if (bound || (inside > 0 && after > 0)) {
      ref = nRefs++
      ops.push(OP_CAPTURE | (ref << 2))
      if (bound) {
        for (const b of bound) bindings.push(compileTemplateBinding(b, ref))
      }
    }
    if (inside === 0) return ref
    ops.push(OP_FIRST_CHILD)
    let left = inside
    let child = node.firstChild
    while (true) {
      const cnt = counts.get(child)
      if (cnt > 0) {
        left -= cnt
        const childRef = visit(child, left + after)
        if (left === 0) break
        // visit moved the cursor into child's subtree if child has bound descendants
        if (cnt - (child._tpl_bind ? 1 : 0) > 0) {
          ops.push(OP_NEXT_FROM | (childRef << 2))
        } else {
          ops.push(OP_NEXT_SIBLING)
        }
      } else {
        ops.push(OP_NEXT_SIBLING)
      }
      child = child.nextSibling
    }
    return ref
  }
  visit(root, 0)
  for (const node of boundNodes) delete node._tpl_bind

  const nOps = ops.length
  const nBindings = bindings.length

  return (context) => {
    const clone = root.cloneNode(true)
    if (nBindings === 0) return clone
    const refs = new Array(nRefs)
    let cur = clone
    for (let i = 0; i < nOps; i++) {
      const op = ops[i]
      switch (op & 3) {
        case OP_FIRST_CHILD:
          cur = cur.firstChild
          break
        case OP_NEXT_SIBLING:
          cur = cur.nextSibling
          break
        case OP_CAPTURE:
          refs[op >> 2] = cur
          break
        default:
          cur = refs[op >> 2].nextSibling
      }
    }
    for (let i = 0; i < nBindings; i++) {
      const b = bindings[i]
      const target = refs[b.ref]
      const val = context[b.prop]
      switch (b.kind) {
        case TPL_NODE:
          fillTemplateText(target, val)
          break
        case TPL_ATTR:
          if (typeof val === 'function') {
            setAttribute(b.name, val, target)
          } else {
            target.setAttribute(b.name, val)
          }
          break
        case TPL_EVENT:
          if (typeof val === 'function' && !val.isBoundAttribute) {
            target.addEventListener(b.event, val)
          } else {
            setAttribute(b.name, val, target)
          }
          break
        case TPL_STYLE:
          setStyle(b.name, val, target)
          break
        default:
          setAttribute(b.name, val, target)
      }
    }
    return clone
  }
}
