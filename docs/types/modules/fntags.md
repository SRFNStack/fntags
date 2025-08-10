[@srfnstack/fntags](../README.md) / [Modules](../modules.md) / fntags

# Module: fntags

## Table of contents

### Interfaces

- [FnStateObj](../interfaces/fntags.FnStateObj.md)

### Type Aliases

- [FnState](fntags.md#fnstate)

### Functions

- [fnstate](fntags.md#fnstate-1)
- [fntemplate](fntags.md#fntemplate)
- [getAttrs](fntags.md#getattrs)
- [h](fntags.md#h)
- [isAttrs](fntags.md#isattrs)
- [renderNode](fntags.md#rendernode)
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

[fntags.mjs:179](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.mjs#L179)

## Functions

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

[fntags.mjs:193](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.mjs#L193)

___

### fntemplate

▸ **fntemplate**(`templateFn`): (`any`: `any`) => `Node`

Create a compiled template function. The returned function takes a single object that contains the properties
defined in the template.

This allows fast rendering by pre-creating a dom element with the entire template structure then cloning and populating
the clone with data from the provided context. This avoids the work of having to re-execute the tag functions
one by one and can speed up situations where a similar element is created many times.

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

[fntags.mjs:91](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.mjs#L91)

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

[fntags.mjs:762](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.mjs#L762)

___

### h

▸ **h**\<`T`\>(`tag`, `...children`): `T`

A function to create dom elements with the given attributes and children.

The first element of the children array can be an object containing element attributes.
The attribute names are the standard attribute names used in html, and should all be lower case as usual.

Any attribute starting with 'on' that is a function is added as an event listener with the 'on' removed.
i.e. { onclick: fn } gets added to the element as element.addEventListener('click', fn)

The style attribute can be an object and the properties of the object will be added as style properties to the element.
i.e. { style: { color: blue } } becomes element.style.color = blue

The rest of the arguments will be considered children of this element and appended to it in the same order as passed.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `HTMLElement` \| `SVGElement` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tag` | `string` | html tag to use when created the element |
| `...children` | `any` | optional attributes object and children for the element |

#### Returns

`T`

an html element

#### Defined in

[fntags.mjs:24](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.mjs#L24)

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

[fntags.mjs:753](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.mjs#L753)

___

### renderNode

▸ **renderNode**(`node`): `Node`

Convert non objects (objects are assumed to be nodes) to text nodes and allow promises to resolve to nodes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | `any` | The node to render |

#### Returns

`Node`

The rendered node

#### Defined in

[fntags.mjs:639](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.mjs#L639)

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

[fntags.mjs:777](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.mjs#L777)
