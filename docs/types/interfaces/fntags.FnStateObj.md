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

[fntags.mjs:122](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L122)

___

### bindAs

• **bindAs**: (`element?`: (`newValue`: `T`, `oldValue`: `T`) => `any`) => `Node`

#### Type declaration

▸ (`element?`): `Node`

Bind this state to the given element function. This causes the element to be replaced when the state changes.
If called with no parameters, the state's value will be rendered as an element.
Do not wrap form inputs (input, textarea, select) in bindAs — it replaces the element on every update and the focused input will lose focus mid-keystroke. Bind the `value` attribute with bindAttr instead.

##### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | (`newValue`: `T`, `oldValue`: `T`) => `any` |

##### Returns

`Node`

#### Defined in

[fntags.mjs:105](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L105)

___

### bindAttr

• **bindAttr**: (`attribute?`: (`newValue`: `T`, `oldValue`: `T`) => `any`) => `any`

#### Type declaration

▸ (`attribute?`): `any`

Bind attribute values to state changes.
Prefer this over bindAs for form inputs: binding the `value` attribute updates the element in place without replacing it, so focus and caret position are preserved.

##### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | (`newValue`: `T`, `oldValue`: `T`) => `any` |

##### Returns

`any`

#### Defined in

[fntags.mjs:113](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L113)

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

[fntags.mjs:108](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L108)

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

[fntags.mjs:111](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L111)

___

### bindSelect

• **bindSelect**: (`element?`: (`selectedKey`: `any`) => `any`) => `Node`

#### Type declaration

▸ (`element?`): `Node`

Bind selected state to an element

##### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | (`selectedKey`: `any`) => `any` |

##### Returns

`Node`

#### Defined in

[fntags.mjs:116](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L116)

___

### bindSelectAttr

• **bindSelectAttr**: (`attribute?`: (`selectedKey`: `any`) => `any`) => `any`

#### Type declaration

▸ (`attribute?`): `any`

Bind selected state to an attribute

##### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | (`selectedKey`: `any`) => `any` |

##### Returns

`any`

#### Defined in

[fntags.mjs:117](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L117)

___

### bindStyle

• **bindStyle**: (`style?`: (`newValue`: `T`, `oldValue`: `T`) => `string`) => `string`

#### Type declaration

▸ (`style?`): `string`

Bind style values to state changes

##### Parameters

| Name | Type |
| :------ | :------ |
| `style?` | (`newValue`: `T`, `oldValue`: `T`) => `string` |

##### Returns

`string`

#### Defined in

[fntags.mjs:115](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L115)

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

[fntags.mjs:124](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L124)

___

### isFnState

• **isFnState**: `boolean`

A flag to indicate that this is a fnstate object

#### Defined in

[fntags.mjs:129](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L129)

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

[fntags.mjs:118](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L118)

___

### selected

• **selected**: () => `any`

#### Type declaration

▸ (): `any`

Get the currently selected key

##### Returns

`any`

#### Defined in

[fntags.mjs:121](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L121)

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

[fntags.mjs:127](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L127)

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

[fntags.mjs:128](https://github.com/SRFNStack/fntags/blob/55fec87/src/fntags.mjs#L128)
