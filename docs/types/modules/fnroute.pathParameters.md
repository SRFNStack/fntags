[@srfnstack/fntags](../README.md) / [Modules](../modules.md) / [fnroute](fnroute.md) / pathParameters

# Namespace: pathParameters

[fnroute](fnroute.md).pathParameters

The path parameters of the current route

## Table of contents

### Variables

- [isFnState](fnroute.pathParameters.md#isfnstate)

### Functions

- [assign](fnroute.pathParameters.md#assign)
- [bindAs](fnroute.pathParameters.md#bindas)
- [bindAttr](fnroute.pathParameters.md#bindattr)
- [bindChildren](fnroute.pathParameters.md#bindchildren)
- [bindProp](fnroute.pathParameters.md#bindprop)
- [bindSelect](fnroute.pathParameters.md#bindselect)
- [bindSelectAttr](fnroute.pathParameters.md#bindselectattr)
- [bindStyle](fnroute.pathParameters.md#bindstyle)
- [getPath](fnroute.pathParameters.md#getpath)
- [select](fnroute.pathParameters.md#select)
- [selected](fnroute.pathParameters.md#selected)
- [setPath](fnroute.pathParameters.md#setpath)
- [subscribe](fnroute.pathParameters.md#subscribe)

## Variables

### isFnState

• **isFnState**: `boolean`

A flag to indicate that this is a fnstate object

#### Defined in

[fntags.d.mts:166](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L166)

## Functions

### assign

▸ **assign**(`update`): `void`

Perform an Object.assign() on the current state using the provided update, triggers
a state change and is a shortcut for `mystate(Object.assign(mystate(), update))`

#### Parameters

| Name | Type |
| :------ | :------ |
| `update` | `any` |

#### Returns

`void`

#### Defined in

[fntags.d.mts:148](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L148)

___

### bindAs

▸ **bindAs**(`element?`): `Node`

Bind this state to the given element function. This causes the element to be replaced when the state changes.
If called with no parameters, the state's value will be rendered as an element.

#### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | (`newValue`: `any`, `oldValue`: `any`) => `any` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:106](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L106)

___

### bindAttr

▸ **bindAttr**(`attribute?`): `any`

Bind attribute values to state changes

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | (`newValue`: `any`, `oldValue`: `any`) => `any` |

#### Returns

`any`

#### Defined in

[fntags.d.mts:121](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L121)

___

### bindChildren

▸ **bindChildren**(`parent`, `element`): `Node`

Bind the values of this state to the given element.
Values are items/elements of an array.
If the current value is not an array, this will behave the same as bindAs.

#### Parameters

| Name | Type |
| :------ | :------ |
| `parent` | `any` |
| `element` | (`childState`: `any`) => `any` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:112](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L112)

___

### bindProp

▸ **bindProp**(`prop`): `Node`

Bind to a property of an object stored in this state instead of the state itself.
Shortcut for `mystate.bindAs((current)=> current[prop])`

#### Parameters

| Name | Type |
| :------ | :------ |
| `prop` | `string` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:117](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L117)

___

### bindSelect

▸ **bindSelect**(`element?`): `Node`

Bind selected state to an element

#### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | (`selectedKey`: `any`) => `any` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:129](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L129)

___

### bindSelectAttr

▸ **bindSelectAttr**(`attribute?`): `any`

Bind selected state to an attribute

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | (`selectedKey`: `any`) => `any` |

#### Returns

`any`

#### Defined in

[fntags.d.mts:133](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L133)

___

### bindStyle

▸ **bindStyle**(`style?`): `string`

Bind style values to state changes

#### Parameters

| Name | Type |
| :------ | :------ |
| `style?` | (`newValue`: `any`, `oldValue`: `any`) => `string` |

#### Returns

`string`

#### Defined in

[fntags.d.mts:125](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L125)

___

### getPath

▸ **getPath**(`path`): `any`

Get a value at the given property path, an error is thrown if the value is not an object
This returns a reference to the real current value. If you perform any modifications to the object, be sure to call setPath after you're done or the changes
will not be reflected correctly.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`any`

#### Defined in

[fntags.d.mts:154](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L154)

___

### select

▸ **select**(`key`): `void`

Mark the element with the given key as selected
where the key is identified using the mapKey function passed on creation of the fnstate.
This causes the bound select functions to be executed.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `any` |

#### Returns

`void`

#### Defined in

[fntags.d.mts:139](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L139)

___

### selected

▸ **selected**(): `any`

Get the currently selected key

#### Returns

`any`

#### Defined in

[fntags.d.mts:143](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L143)

___

### setPath

▸ **setPath**(`path`, `value`, `fillWithObjects`): `void`

Set a value at the given property path

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `value` | `any` |
| `fillWithObjects` | `boolean` |

#### Returns

`void`

#### Defined in

[fntags.d.mts:158](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L158)

___

### subscribe

▸ **subscribe**(`subscriber`): `void`

Register a callback that will be executed whenever the state is changed

#### Parameters

| Name | Type |
| :------ | :------ |
| `subscriber` | (`newState`: `any`, `oldState`: `any`) => `void` |

#### Returns

`void`

#### Defined in

[fntags.d.mts:162](https://github.com/SRFNStack/fntags/blob/a7feb16/src/fntags.d.mts#L162)
