/**
 * Toggle dev-mode warnings. Defaults to true. Call `setDevMode(false)` in
 * production to skip diagnostic checks such as the focus-loss warning fired
 * when bindAs replaces a subtree containing the focused element.
 * @param {boolean} on
 */
export function setDevMode(on: boolean): void;
/**
 * A function to create dom elements with the given attributes and children.
 *
 * The first element of the children array can be an object containing element attributes.
 * The attribute names are the standard attribute names used in html, and should all be lower case as usual.
 *
 * Any attribute starting with 'on' that is a function is added as an event listener with the 'on' removed.
 * i.e. { onclick: fn } gets added to the element as element.addEventListener('click', fn)
 * An event attribute can also be an array [fn, arg], which calls fn.call(element, arg, event).
 * For event types passed to delegateEvents, the handler is stored on the element and run by a single
 * listener on document instead (see delegateEvents for how ordering differs).
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
export function h<T extends HTMLElement | SVGElement>(tag: string, ...children: (Node | any)[]): T;
/**
 * @template T The type of data stored in the state container
 * @typedef FnStateObj A container for a state value that can be bound to.
 * @property {(element?: (newValue: T, oldValue: T)=>(Node|any))=>Node} bindAs Bind this state to the given element function. This causes the element to be replaced when the state changes.
 * If called with no parameters, the state's value will be rendered as an element.
 * Do not wrap form inputs (input, textarea, select) in bindAs: it replaces the element on every update and the focused input will lose focus mid-keystroke. Bind the `value` attribute with bindAttr instead.
 * @property {(parent: (()=>(Node|any))|any|Node, element: (childState: FnState)=>(Node|any))=>Node} bindChildren Bind the values of this state to the given element.
 * Values are items/elements of an array.
 * If the current value is not an array, this will behave the same as bindAs.
 * @property {(parent: (()=>(Node|any))|Node, template: (context: any)=>Node, options?: BindRowsOptions)=>Node} bindRows Bind the values of this state
 * to rows stamped from an fntemplate whose template has a single root element. `values(item, selected)` maps an item to the template's slots and
 * runs at mount, then only when the item's reference changes or the row gains or loses selection; only changed slots are written. Slots named in
 * `handlers` are event slots, called as handler(event, item) with the row's current item through one shared function per name.
 * Rows keep no per-row state or subscriptions, so use this for rows that are a pure function of item and selection, and bindChildren for rows
 * with their own state or nested reactivity. Items are compared by reference: update them immutably.
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
 * @typedef BindRowsOptions Options for bindRows.
 * @property {(item: any, selected: any)=>Object<string, any>} [values] Map an item and the currently selected key to the template's slot values.
 * Defaults to the item itself. Return a fresh object: it is kept and compared slot by slot against the next result.
 * A slot value may also be a bind getter (bindAs, bindAttr, bindStyle) or a node; bindings created here are cleaned up when values re-runs or the row is removed.
 * @property {Object<string, (event: Event, item: any)=>any>} [handlers] Event handlers by slot name. The named slots must be on* attributes.
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
export function fnstate<T>(initialValue: T, mapKey?: (T: any) => any): FnState<T>;
/**
 * Convert non objects (objects are assumed to be nodes) to text nodes and allow promises to resolve to nodes.
 * Arrays are flattened at any depth into a DocumentFragment.
 * @param {any} node The node to render
 * @returns {Node} The rendered node
 */
export function renderNode(node: any): Node;
/**
 * Opt in to event delegation for the given event types. After this call, an `on<type>` handler on an element
 * created by h(), or by an fntemplate compiled after this call, is stored on the element as a property
 * (`element.__fnon_<type>`) instead of being added with addEventListener, and one listener per type is added to
 * `document`. This saves a listener, and usually a closure, per element, which adds up in long lists.
 *
 * Semantics and caveats:
 * - Only elements created after the call are delegated. Elements that already exist keep their listeners, and
 *   templates compiled before the call keep using addEventListener for every instance.
 * - Delegated handlers run when the event bubbles up to `document`, after every native listener on the target
 *   and its ancestors has run. Calling stopPropagation() in a native listener therefore prevents delegated
 *   handlers from running, and a delegated handler cannot stop a native listener on an ancestor.
 * - Among delegated handlers the order is innermost first, like native bubbling: the walk follows the event's
 *   composed path from the target up to `document`. stopPropagation() (or stopImmediatePropagation()) in a
 *   delegated handler stops the walk. Removing an element during dispatch does not shorten the walk, because
 *   the path is fixed when the event is dispatched, as it is for native listeners.
 * - Inside a delegated handler `this` and `e.currentTarget` are the element the handler belongs to.
 * - Elements must be connected to the document (directly or through open shadow roots) for handlers to run.
 * - Events that do not bubble (focus, blur, mouseenter, mouseleave, load, scroll, ...) are never delegated:
 *   they are skipped with a dev-mode warning and keep using addEventListener.
 * - Delegation cannot be turned off again for a type.
 *
 * Any `on<type>` attribute, delegated or not, also accepts `[fn, arg]`, which calls `fn.call(element, arg, event)`,
 * so every row of a list can share one handler function instead of allocating a closure per row.
 *
 * @param {string|string[]} types the event types to delegate, e.g. ['click', 'input']
 */
export function delegateEvents(types: string | string[]): void;
/**
 * Check if the given value is an object that can be used as attributes
 * @param {any} val The value to check
 * @returns {boolean} true if the value is an object that can be used as attributes
 */
export function isAttrs(val: any): boolean;
/**
 * helper to get the attr object
 * @param {any} children
 * @return {object} the attr object or an empty object
 */
export function getAttrs(children: any): object;
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
export function styled<T extends HTMLElement | SVGElement>(style: object | string, tag: string, children: object[] | Node[]): T;
/**
 * Register a component function for HMR. Returns a stable proxy that always delegates
 * to the latest registered implementation. When a module re-executes after HMR, the
 * proxy's target is updated so callers holding stale import bindings get the new code.
 *
 * @param {string} id A stable identifier for this component (typically 'filepath:exportName')
 * @param {Function} fn The component function
 * @returns {Function} A stable proxy function
 */
export function registeredComponent(id: string, fn: Function): Function;
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
export function registeredState(id: string, initialValue: any, mapKey?: (v: any) => string): any;
/**
 * Create an HMR-aware root mount point. Renders the app into the container and
 * registers a global rerender callback so the vite plugin can trigger re-renders
 * automatically when modules are hot-updated.
 *
 * @param {HTMLElement} container The DOM element to mount into
 * @param {(()=>Node)|Node} appFn A function that returns the app's root element, or the element itself
 * @returns {HTMLElement} The container element
 */
export function hmrRoot(container: HTMLElement, appFn: (() => Node) | Node): HTMLElement;
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
 * promises replace the placeholder with their rendered node. As with h(), an attribute value of '', null or undefined
 * (including the initial value of a bound attribute) means no attribute.
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
export function fntemplate(templateFn: (any: any) => Node): (any: any) => Node;
/**
 * A container for a state value that can be bound to.
 */
export type FnStateObj<T> = {
    /**
     * Bind this state to the given element function. This causes the element to be replaced when the state changes.
     * If called with no parameters, the state's value will be rendered as an element.
     * Do not wrap form inputs (input, textarea, select) in bindAs: it replaces the element on every update and the focused input will lose focus mid-keystroke. Bind the `value` attribute with bindAttr instead.
     */
    bindAs: (element?: (newValue: T, oldValue: T) => (Node | any)) => Node;
    /**
     * Bind the values of this state to the given element.
     * Values are items/elements of an array.
     * If the current value is not an array, this will behave the same as bindAs.
     */
    bindChildren: (parent: (() => (Node | any)) | any | Node, element: (childState: any) => (Node | any)) => Node;
    /**
     * Bind the values of this state
     * to rows stamped from an fntemplate whose template has a single root element. `values(item, selected)` maps an item to the template's slots and
     * runs at mount, then only when the item's reference changes or the row gains or loses selection; only changed slots are written. Slots named in
     * `handlers` are event slots, called as handler(event, item) with the row's current item through one shared function per name.
     * Rows keep no per-row state or subscriptions, so use this for rows that are a pure function of item and selection, and bindChildren for rows
     * with their own state or nested reactivity. Items are compared by reference: update them immutably.
     */
    bindRows: (parent: (() => (Node | any)) | Node, template: (context: any) => Node, options?: BindRowsOptions) => Node;
    /**
     * Bind to a property of an object stored in this state instead of the state itself.
     * Shortcut for `mystate.bindAs((current)=> current[prop])`
     */
    bindProp: (prop: string) => Node;
    /**
     * Bind attribute values to state changes.
     * Prefer this over bindAs for form inputs: binding the `value` attribute updates the element in place without replacing it, so focus and caret position are preserved.
     */
    bindAttr: (attribute?: (newValue: T, oldValue: T) => (string | any)) => any;
    /**
     * Bind style values to state changes
     */
    bindStyle: (style?: (newValue: T, oldValue: T) => string) => string;
    /**
     * Bind selected state to an element
     */
    bindSelect: (element?: (selectedKey: any) => (Node | any)) => Node;
    /**
     * Bind selected state to an attribute
     */
    bindSelectAttr: (attribute?: (selectedKey: any) => (string | any)) => any;
    /**
     * Mark the element with the given key as selected
     * where the key is identified using the mapKey function passed on creation of the fnstate.
     * This causes the bound select functions to be executed.
     */
    select: (key: any) => void;
    /**
     * Get the currently selected key
     */
    selected: () => any;
    /**
     * Perform an Object.assign() on the current state using the provided update, triggers
     * a state change and is a shortcut for `mystate(Object.assign(mystate(), update))`
     */
    assign: (update: T) => void;
    /**
     * Get a value at the given property path, an error is thrown if the value is not an object
     * This returns a reference to the real current value. If you perform any modifications to the object, be sure to call setPath after you're done or the changes
     * will not be reflected correctly.
     */
    getPath: (path: string) => any;
    /**
     * Set a value at the given property path
     */
    setPath: (path: string, value: any, fillWithObjects: boolean) => void;
    /**
     * Register a callback that will be executed whenever the state is changed
     */
    subscribe: (subscriber: (newState: T, oldState: T) => void) => void;
    /**
     * A flag to indicate that this is a fnstate object
     */
    isFnState: boolean;
};
/**
 * Options for bindRows.
 */
export type BindRowsOptions = {
    /**
     * Map an item and the currently selected key to the template's slot values.
     * Defaults to the item itself. Return a fresh object: it is kept and compared slot by slot against the next result.
     * A slot value may also be a bind getter (bindAs, bindAttr, bindStyle) or a node; bindings created here are cleaned up when values re-runs or the row is removed.
     */
    values?: (item: any, selected: any) => {
        [x: string]: any;
    };
    /**
     * Event handlers by slot name. The named slots must be on* attributes.
     */
    handlers?: {
        [x: string]: (event: Event, item: any) => any;
    };
};
/**
 * A container for a state value that can be bound to.
 */
export type FnState<T> = FnStateObj<T> & ((newState?: T) => T);
//# sourceMappingURL=fntags.d.mts.map