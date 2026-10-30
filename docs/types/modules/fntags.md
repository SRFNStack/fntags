[@srfnstack/fntags](../README.md) / [Modules](../modules.md) / fntags

# Module: fntags

## Table of contents

### Interfaces

- [BindRowsOptions](../interfaces/fntags.BindRowsOptions.md)
- [FnStateObj](../interfaces/fntags.FnStateObj.md)

### Type Aliases

- [FnState](fntags.md#fnstate)

### Functions

- [delegateEvents](fntags.md#delegateevents)
- [fnstate](fntags.md#fnstate-1)
- [fntemplate](fntags.md#fntemplate)
- [getAttrs](fntags.md#getattrs)
- [h](fntags.md#h)
- [hmrRoot](fntags.md#hmrroot)
- [isAttrs](fntags.md#isattrs)
- [registeredComponent](fntags.md#registeredcomponent)
- [registeredState](fntags.md#registeredstate)
- [renderNode](fntags.md#rendernode)
- [setDevMode](fntags.md#setdevmode)
- [styled](fntags.md#styled)

## Type Aliases

### FnState

Ƭ **FnState**\<`T`\>: [`FnStateObj`](../interfaces/fntags.FnStateObj.md)\<`T`\> & (`newState?`: `T`) => `T`

A container for a state value that can be bound to.

#### Type parameters

| Name | Description |
| :------ | :------ |
| `T` | The type of data stored in the state container |

#### Defined in

[fntags.mjs:240](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L240)

## Functions

### delegateEvents

▸ **delegateEvents**(`types`): `void`

Opt in to event delegation for the given event types. After this call, an `on<type>` handler on an element
created by h(), or by an fntemplate compiled after this call, is stored on the element as a property
(`element.__fnon_<type>`) instead of being added with addEventListener, and one listener per type is added to
`document`. This saves a listener, and usually a closure, per element, which adds up in long lists.

Semantics and caveats:
- Only elements created after the call are delegated. Elements that already exist keep their listeners, and
  templates compiled before the call keep using addEventListener for every instance.
- Delegated handlers run when the event bubbles up to `document`, after every native listener on the target
  and its ancestors has run. Calling stopPropagation() in a native listener therefore prevents delegated
  handlers from running, and a delegated handler cannot stop a native listener on an ancestor.
- Among delegated handlers the order is innermost first, like native bubbling: the walk follows the event's
  composed path from the target up to `document`. stopPropagation() (or stopImmediatePropagation()) in a
  delegated handler stops the walk. Removing an element during dispatch does not shorten the walk, because
  the path is fixed when the event is dispatched, as it is for native listeners.
- Inside a delegated handler `this` and `e.currentTarget` are the element the handler belongs to.
- Elements must be connected to the document (directly or through open shadow roots) for handlers to run.
- Events that do not bubble (focus, blur, mouseenter, mouseleave, load, scroll, ...) are never delegated:
  they are skipped with a dev-mode warning and keep using addEventListener.
- Delegation cannot be turned off again for a type.

Any `on<type>` attribute, delegated or not, also accepts `[fn, arg]`, which calls `fn.call(element, arg, event)`,
so every row of a list can share one handler function instead of allocating a closure per row.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `types` | `string` \| `string`[] | the event types to delegate, e.g. ['click', 'input'] |

#### Returns

`void`

#### Defined in

[fntags.mjs:2326](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2326)

___

### fnstate

▸ **fnstate**\<`T`\>(`initialValue`, `mapKey?`): [`FnState`](fntags.md#fnstate)\<`T`\>

Create a state object that can be bound to.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `initialValue` | `T` | The initial state |
| `mapKey?` | (`T`: `any`) => `any` | A map function to extract a key from an element in the array. Receives the array value to extract the key from. A key can be any unique value. |

#### Returns

[`FnState`](fntags.md#fnstate)\<`T`\>

A function that can be used to get and set the state.
When getting the state, you get the actual reference to the underlying value.
If you perform modifications to the value, be sure to call the state function with the updated value when you're done
or the changes won't be reflected correctly and binding updates won't be triggered even though the state appears to be correct.

#### Defined in

[fntags.mjs:254](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L254)

___

### fntemplate

▸ **fntemplate**(`templateFn`): (`any`: `any`) => `Node`

Create a compiled template function. The returned function takes a single object that contains the properties
defined in the template.

The template function receives a context function. Calling `ctx('prop')` returns a placeholder that can be used
as a child, as an attribute value, or as a style value. The template is rendered once to a dom tree; each
instantiation clones that tree and fills the placeholders from the context object, which avoids re-executing
the tag functions and can speed up situations where a similar element is created many times.

Child placeholders are empty text nodes in the template. A primitive context value is written into the text node
in place. A bindAs/bindSelect getter whose current node is a text node adopts the placeholder as its live node,
so state changes keep updating the clone. A function value is evaluated like renderNode does. Nodes, arrays and
promises replace the placeholder with their rendered node. As with h(), an attribute value of '', null or undefined
(including the initial value of a bound attribute) means no attribute.

The locations of all placeholders are compiled once into a single firstChild/nextSibling walk over the clone,
which stops at the last bound node, so instantiation does not depend on the size of the unbound parts of the tree.

You cannot bind state to the initial template. If you attempt to, the state will be read, but the elements will
not be updated when the state changes because they will not be bound to the cloned element.
All state bindings must be passed in the context to the compiled template to work correctly.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `templateFn` | (`any`: `any`) => `Node` | A function that returns a html node. |

#### Returns

`fn`

A function that takes a context object and returns a rendered node.

▸ (`any`): `Node`

##### Parameters

| Name | Type |
| :------ | :------ |
| `any` | `any` |

##### Returns

`Node`

#### Defined in

[fntags.mjs:2714](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2714)

___

### getAttrs

▸ **getAttrs**(`children`): `any`

helper to get the attr object

#### Parameters

| Name | Type |
| :------ | :------ |
| `children` | `any` |

#### Returns

`any`

the attr object or an empty object

#### Defined in

[fntags.mjs:2471](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2471)

___

### h

▸ **h**\<`T`\>(`tag`, `...children`): `T`

A function to create dom elements with the given attributes and children.

The first element of the children array can be an object containing element attributes.
The attribute names are the standard attribute names used in html, and should all be lower case as usual.

Any attribute starting with 'on' that is a function is added as an event listener with the 'on' removed.
i.e. { onclick: fn } gets added to the element as element.addEventListener('click', fn)
An event attribute can also be an array [fn, arg], which calls fn.call(element, arg, event).
For event types passed to delegateEvents, the handler is stored on the element and run by a single
listener on document instead (see delegateEvents for how ordering differs).

The style attribute can be an object and the properties of the object will be added as style properties to the element.
i.e. { style: { color: blue } } becomes element.style.color = blue

An attribute value of null, undefined or '' means no attribute: it is removed if present and never written,
so { class: '' } produces an element without a class attribute. The value attribute and boolean attributes
(disabled, checked, ...) are exempt and keep their property semantics.

The rest of the arguments will be considered children of this element and appended to it in the same order as passed.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `HTMLElement` \| `SVGElement` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tag` | `string` | html tag to use when created the element |
| `...children` | `any`[] | optional attributes object and children for the element |

#### Returns

`T`

an html element

#### Defined in

[fntags.mjs:89](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L89)

___

### hmrRoot

▸ **hmrRoot**(`container`, `appFn`): `HTMLElement`

Create an HMR-aware root mount point. Renders the app into the container and
registers a global rerender callback so the vite plugin can trigger re-renders
automatically when modules are hot-updated.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `container` | `HTMLElement` | The DOM element to mount into |
| `appFn` | `Node` \| () => `Node` | A function that returns the app's root element, or the element itself |

#### Returns

`HTMLElement`

The container element

#### Defined in

[fntags.mjs:2561](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2561)

___

### isAttrs

▸ **isAttrs**(`val`): `boolean`

Check if the given value is an object that can be used as attributes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `val` | `any` | The value to check |

#### Returns

`boolean`

true if the value is an object that can be used as attributes

#### Defined in

[fntags.mjs:2462](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2462)

___

### registeredComponent

▸ **registeredComponent**(`id`, `fn`): `Function`

Register a component function for HMR. Returns a stable proxy that always delegates
to the latest registered implementation. When a module re-executes after HMR, the
proxy's target is updated so callers holding stale import bindings get the new code.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | A stable identifier for this component (typically 'filepath:exportName') |
| `fn` | `Function` | The component function |

#### Returns

`Function`

A stable proxy function

#### Defined in

[fntags.mjs:2514](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2514)

___

### registeredState

▸ **registeredState**(`id`, `initialValue`, `mapKey?`): `any`

Get or create a state instance from the global HMR registry.
During development with HMR, the Vite plugin rewrites fnstate() calls to use this function,
ensuring state instances survive module reloads.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | A stable identifier for this state instance (typically 'filepath:varName') |
| `initialValue` | `any` | The initial value, used only when creating a new state |
| `mapKey?` | (`v`: `any`) => `string` | Optional key function, used only when creating a new state |

#### Returns

`any`

The state instance from the registry

#### Defined in

[fntags.mjs:2539](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2539)

___

### renderNode

▸ **renderNode**(`node`): `Node`

Convert non objects (objects are assumed to be nodes) to text nodes and allow promises to resolve to nodes.
Arrays are flattened at any depth into a DocumentFragment.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | `any` | The node to render |

#### Returns

`Node`

The rendered node

#### Defined in

[fntags.mjs:2198](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2198)

___

### setDevMode

▸ **setDevMode**(`on`): `void`

Toggle dev-mode warnings. Defaults to true. Call `setDevMode(false)` in
production to skip diagnostic checks such as the focus-loss warning fired
when bindAs replaces a subtree containing the focused element.

#### Parameters

| Name | Type |
| :------ | :------ |
| `on` | `boolean` |

#### Returns

`void`

#### Defined in

[fntags.mjs:40](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L40)

___

### styled

▸ **styled**\<`T`\>(`style`, `tag`, `children`): `T`

A function to create an element with a pre-defined style.
For example, the flex* elements in fnelements.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `HTMLElement` \| `SVGElement` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `style` | `any` | The style to apply to the element |
| `tag` | `string` | The tag to use when creating the element |
| `children` | `any`[] \| `Node`[] | The children to append to the element |

#### Returns

`T`

The styled element

#### Defined in

[fntags.mjs:2486](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L2486)
