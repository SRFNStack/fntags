[@srfnstack/fntags](../README.md) / [Modules](../modules.md) / [fntags](../modules/fntags.md) / FnStateObj

# Interface: FnStateObj\<T\>

[fntags](../modules/fntags.md).FnStateObj

A container for a state value that can be bound to.

## Type parameters

| Name | Description |
| :------ | :------ |
| `T` | The type of data stored in the state container |

## Table of contents

### Properties

- [assign](fntags.FnStateObj.md#assign)
- [bindAs](fntags.FnStateObj.md#bindas)
- [bindAttr](fntags.FnStateObj.md#bindattr)
- [bindChildren](fntags.FnStateObj.md#bindchildren)
- [bindProp](fntags.FnStateObj.md#bindprop)
- [bindSelect](fntags.FnStateObj.md#bindselect)
- [bindSelectAttr](fntags.FnStateObj.md#bindselectattr)
- [bindStyle](fntags.FnStateObj.md#bindstyle)
- [getPath](fntags.FnStateObj.md#getpath)
- [isFnState](fntags.FnStateObj.md#isfnstate)
- [reset](fntags.FnStateObj.md#reset)
- [select](fntags.FnStateObj.md#select)
- [selected](fntags.FnStateObj.md#selected)
- [setPath](fntags.FnStateObj.md#setpath)
- [subscribe](fntags.FnStateObj.md#subscribe)

## Properties

### assign

• **assign**: (`update`: `T`) => `void`

#### Type declaration

▸ (`update`): `void`

Perform an Object.assign() on the current state using the provided update, triggers
a state change and is a shortcut for `mystate(Object.assign(mystate(), update))`

##### Parameters

| Name | Type |
| :------ | :------ |
| `update` | `T` |

##### Returns

`void`

#### Defined in

[fntags.mjs:93](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L93)

___

### bindAs

• **bindAs**: (`element?`: (`value`: `T`) => `any`) => `Node`

#### Type declaration

▸ (`element?`): `Node`

Bind this state to the given element function. This causes the element to be replaced when state changes.
If called with no parameters, the state's value will be rendered as an element.

##### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | (`value`: `T`) => `any` |

##### Returns

`Node`

#### Defined in

[fntags.mjs:78](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L78)

___

### bindAttr

• **bindAttr**: (`attribute?`: (`value`: `T`, `oldValue`: `T`) => `any`) => `any`

#### Type declaration

▸ (`attribute?`): `any`

Bind attribute values to state changes

##### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | (`value`: `T`, `oldValue`: `T`) => `any` |

##### Returns

`any`

#### Defined in

[fntags.mjs:85](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L85)

___

### bindChildren

• **bindChildren**: (`parent`: `any`, `element`: (`childState`: `any`) => `any`) => `Node`

#### Type declaration

▸ (`parent`, `element`): `Node`

Bind the values of this state to the given element.
Values are items/elements of an array.
If the current value is not an array, this will behave the same as bindAs.

##### Parameters

| Name | Type |
| :------ | :------ |
| `parent` | `any` |
| `element` | (`childState`: `any`) => `any` |

##### Returns

`Node`

#### Defined in

[fntags.mjs:80](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L80)

___

### bindProp

• **bindProp**: (`prop`: `string`) => `Node`

#### Type declaration

▸ (`prop`): `Node`

Bind to a property of an object stored in this state instead of the state itself.
Shortcut for `mystate.bindAs((current)=> current[prop])`

##### Parameters

| Name | Type |
| :------ | :------ |
| `prop` | `string` |

##### Returns

`Node`

#### Defined in

[fntags.mjs:83](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L83)

___

### bindSelect

• **bindSelect**: (`element?`: (`value`: `T`) => `any`) => `Node`

#### Type declaration

▸ (`element?`): `Node`

Bind selected state to an element

##### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | (`value`: `T`) => `any` |

##### Returns

`Node`

#### Defined in

[fntags.mjs:87](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L87)

___

### bindSelectAttr

• **bindSelectAttr**: (`attribute?`: (`value`: `T`) => `any`) => `any`

#### Type declaration

▸ (`attribute?`): `any`

Bind selected state to an attribute

##### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | (`value`: `T`) => `any` |

##### Returns

`any`

#### Defined in

[fntags.mjs:88](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L88)

___

### bindStyle

• **bindStyle**: (`style?`: (`value`: `T`, `oldValue`: `T`) => `string`) => `string`

#### Type declaration

▸ (`style?`): `string`

Bind style values to state changes

##### Parameters

| Name | Type |
| :------ | :------ |
| `style?` | (`value`: `T`, `oldValue`: `T`) => `string` |

##### Returns

`string`

#### Defined in

[fntags.mjs:86](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L86)

___

### getPath

• **getPath**: (`path`: `string`) => `any`

#### Type declaration

▸ (`path`): `any`

Get a value at the given property path, an error is thrown if the value is not an object
This returns a reference to the real current value. If you perform any modifications to the object, be sure to call setPath after you're done or the changes
will not be reflected correctly.

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

##### Returns

`any`

#### Defined in

[fntags.mjs:95](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L95)

___

### isFnState

• **isFnState**: `boolean`

A flag to indicate that this is a fnstate object

#### Defined in

[fntags.mjs:101](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L101)

___

### reset

• **reset**: (`reinit`: `boolean`) => {}

#### Type declaration

▸ (`reinit`): `Object`

Remove all of the observers and optionally reset the value to it's initial value

##### Parameters

| Name | Type |
| :------ | :------ |
| `reinit` | `boolean` |

##### Returns

`Object`

#### Defined in

[fntags.mjs:100](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L100)

___

### select

• **select**: (`key`: `any`) => `void`

#### Type declaration

▸ (`key`): `void`

Mark the element with the given key as selected
where the key is identified using the mapKey function passed on creation of the fnstate.
This causes the bound select functions to be executed.

##### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `any` |

##### Returns

`void`

#### Defined in

[fntags.mjs:89](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L89)

___

### selected

• **selected**: () => `any`

#### Type declaration

▸ (): `any`

Get the currently selected key

##### Returns

`any`

#### Defined in

[fntags.mjs:92](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L92)

___

### setPath

• **setPath**: (`path`: `string`, `value`: `any`, `fillWithObjects`: `boolean`) => `void`

#### Type declaration

▸ (`path`, `value`, `fillWithObjects`): `void`

Set a value at the given property path

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `value` | `any` |
| `fillWithObjects` | `boolean` |

##### Returns

`void`

#### Defined in

[fntags.mjs:98](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L98)

___

### subscribe

• **subscribe**: (`subscriber`: (`newState`: `T`, `oldState`: `T`) => `void`) => `void`

#### Type declaration

▸ (`subscriber`): `void`

Register a callback that will be executed whenever the state is changed

##### Parameters

| Name | Type |
| :------ | :------ |
| `subscriber` | (`newState`: `T`, `oldState`: `T`) => `void` |

##### Returns

`void`

#### Defined in

[fntags.mjs:99](https://github.com/SRFNStack/fntags/blob/2959003/src/fntags.mjs#L99)
