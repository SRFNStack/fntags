[@srfnstack/fntags](../README.md) / [Modules](../modules.md) / fntags

# Module: fntags

## Table of contents

### Interfaces

- [FnStateObj](../interfaces/fntags.FnStateObj.md)

### Type Aliases

- [FnState](fntags.md#fnstate)

### Functions

- [fnstate](fntags.md#fnstate-1)
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

[fntags.mjs:106](https://github.com/SRFNStack/fntags/blob/bd8472b/src/fntags.mjs#L106)

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

[fntags.mjs:120](https://github.com/SRFNStack/fntags/blob/bd8472b/src/fntags.mjs#L120)

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

[fntags.mjs:686](https://github.com/SRFNStack/fntags/blob/bd8472b/src/fntags.mjs#L686)

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

[fntags.mjs:24](https://github.com/SRFNStack/fntags/blob/bd8472b/src/fntags.mjs#L24)

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

[fntags.mjs:677](https://github.com/SRFNStack/fntags/blob/bd8472b/src/fntags.mjs#L677)

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

[fntags.mjs:566](https://github.com/SRFNStack/fntags/blob/bd8472b/src/fntags.mjs#L566)

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

[fntags.mjs:701](https://github.com/SRFNStack/fntags/blob/bd8472b/src/fntags.mjs#L701)
