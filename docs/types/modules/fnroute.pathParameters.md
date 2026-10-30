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
- [bindRows](fnroute.pathParameters.md#bindrows)
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

[fntags.d.mts:290](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L290)

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

[fntags.d.mts:272](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L272)

___

### bindAs

▸ **bindAs**(`element?`): `Node`

Bind this state to the given element function. This causes the element to be replaced when the state changes.
If called with no parameters, the state's value will be rendered as an element.
Do not wrap form inputs (input, textarea, select) in bindAs: it replaces the element on every update and the focused input will lose focus mid-keystroke. Bind the `value` attribute with bindAttr instead.

#### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | (`newValue`: `any`, `oldValue`: `any`) => `any` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:220](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L220)

___

### bindAttr

▸ **bindAttr**(`attribute?`): `any`

Bind attribute values to state changes.
Prefer this over bindAs for form inputs: binding the `value` attribute updates the element in place without replacing it, so focus and caret position are preserved.

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | (`newValue`: `any`, `oldValue`: `any`) => `any` |

#### Returns

`any`

#### Defined in

[fntags.d.mts:245](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L245)

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

[fntags.d.mts:226](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L226)

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

[fntags.d.mts:240](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L240)

___

### bindRows

▸ **bindRows**(`parent`, `template`, `options?`): `Node`

Bind the values of this state
to rows stamped from an fntemplate whose template has a single root element. `values(item, selected)` maps an item to the template's slots and
runs at mount, then only when the item's reference changes or the row gains or loses selection; only changed slots are written. Slots named in
`handlers` are event slots, called as handler(event, item) with the row's current item through one shared function per name.
Rows keep no per-row state or subscriptions, so use this for rows that are a pure function of item and selection, and bindChildren for rows
with their own state or nested reactivity. Items are compared by reference: update them immutably.

#### Parameters

| Name | Type |
| :------ | :------ |
| `parent` | `Node` \| () => `any` |
| `template` | (`context`: `any`) => `Node` |
| `options?` | `BindRowsOptions` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:235](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L235)

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

[fntags.d.mts:253](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L253)

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

[fntags.d.mts:257](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L257)

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

[fntags.d.mts:249](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L249)

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

[fntags.d.mts:278](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L278)

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

[fntags.d.mts:263](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L263)

___

### selected

▸ **selected**(): `any`

Get the currently selected key

#### Returns

`any`

#### Defined in

[fntags.d.mts:267](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L267)

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

[fntags.d.mts:282](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L282)

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

[fntags.d.mts:286](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.d.mts#L286)
