/**
 * @module fntags
 */
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
 * @param {string} tag html tag to use when created the element
 * @param {object[]|Node[]} children optional attributes object and children for the element
 * @return {HTMLElement} an html element
 *
 */
export function h(tag: string, ...children: object[] | Node[]): HTMLElement;
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
 * @param {(any)=>Node} templateFn A function that returns an html node.
 * @return {(any)=>Node} A function that takes a context object and returns a rendered node.
 *
 */
export function fntemplate(templateFn: (any: any) => Node): (any: any) => Node;
/**
 * @template T The type of data stored in the state container
 * @typedef FnStateObj A container for a state value that can be bound to.
 * @property {(element: Node|any|()=>Node|any, update?: (Node)=>void) => Node|() => Node} bindAs Bind this state to the given element. This causes the element to update when state changes.
 * If called with no parameters, the state's value will be rendered as an element. If the first parameters is not a function,
 * the second parameter (the update function) must be provided and must be a function. This function receives the node the state is bound to.
 * @property {(parent: Node|any|()=>Node|any,element: Node|any|()=>Node|any, update?: (Node)=>void)=> Node|()=> Node} bindChildren Bind the values of this state to the given element.
 * Values are items/elements of an array.
 * If the current value is not an array, this will behave the same as bindAs.
 * @property {(prop: string)=>Node|()=>Node} bindProp Bind to a property of an object stored in this state instead of the state itself.
 * Shortcut for `mystate.bindAs((current)=> current[prop])`
 * @property {(attribute: string)=>any} bindAttr Bind attribute values to state changes
 * @property {(style: string)=> string} bindStyle Bind style values to state changes
 * @property {(element: Node|any|()=>Node|any, update?: (Node)=>void)=>Node|()=>Node} bindSelect Bind selected state to an element
 * @property {(attribute: string)=>any} bindSelectAttr Bind selected state to an attribute
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
 * @property {((newState: T, oldState: T)=>void)=>void} subscribe Register a callback that will be executed whenever the state is changed
 * @property {(reinit: boolean)=>{}} reset Remove all of the observers and optionally reset the value to it's initial value
 * @property {} isFnState A flag to indicate that this is an fnstate object
 */
/**
 * @template T The type of data stored in the state container
 * @typedef {FnStateObj<T> & (newState?: T)=>T} FnState A container for a state value that can be bound to.
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
 * Convert non objects (objects are assumed to be nodes) to text nodes and allow promises to resolve to nodes
 * @param {any} node The node to render
 * @returns {Node} The rendered node
 */
export function renderNode(node: any): Node;
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
 * @param {object|string} style The style to apply to the element
 * @param {string} tag The tag to use when creating the element
 * @param {object[]|Node[]} children The children to append to the element
 * @return {HTMLElement} The styled element
 */
export function styled(style: object | string, tag: string, children: object[] | Node[]): HTMLElement;
/**
 * A container for a state value that can be bound to.
 */
export type FnStateObj<T> = {
    /**
     * Bind this state to the given element. This causes the element to update when state changes.
     * If called with no parameters, the state's value will be rendered as an element. If the first parameters is not a function,
     * the second parameter (the update function) must be provided and must be a function. This function receives the node the state is bound to.
     */
    bindAs: (element: Node | any | (() => Node | any), update?: (Node: any) => void) => Node | (() => Node);
    /**
     * Bind the values of this state to the given element.
     * Values are items/elements of an array.
     * If the current value is not an array, this will behave the same as bindAs.
     */
    bindChildren: (parent: Node | any | (() => Node | any), element: Node | any | (() => Node | any), update?: (Node: any) => void) => Node | (() => Node);
    /**
     * Bind to a property of an object stored in this state instead of the state itself.
     * Shortcut for `mystate.bindAs((current)=> current[prop])`
     */
    bindProp: (prop: string) => Node | (() => Node);
    /**
     * Bind attribute values to state changes
     */
    bindAttr: (attribute: string) => any;
    /**
     * Bind style values to state changes
     */
    bindStyle: (style: string) => string;
    /**
     * Bind selected state to an element
     */
    bindSelect: (element: Node | any | (() => Node | any), update?: (Node: any) => void) => Node | (() => Node);
    /**
     * Bind selected state to an attribute
     */
    bindSelectAttr: (attribute: string) => any;
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
     * =>void} subscribe Register a callback that will be executed whenever the state is changed
     */
    "": (newState: T, oldState: T) => void;
    /**
     * Remove all of the observers and optionally reset the value to it's initial value
     */
    reset: (reinit: boolean) => {};
    /**
     * A flag to indicate that this is an fnstate object
     */
    isFnState: any;
};
/**
 * A container for a state value that can be bound to.
 */
export type FnState<T> = FnStateObj<T> & ((newState?: T) => T);
//# sourceMappingURL=fntags.d.mts.map