[@srfnstack/fntags](../README.md) / [Exports](../modules.md) / [fnroute](fnroute.md) / pathParameters

# Namespace: pathParameters

[fnroute](fnroute.md).pathParameters

The path parameters of the current route

## Table of contents

### Variables

- [isFnState](fnroute.pathParameters.md#isfnstate)

### Functions

- [](fnroute.pathParameters.md#)
- [assign](fnroute.pathParameters.md#assign)
- [bindAs](fnroute.pathParameters.md#bindas)
- [bindAttr](fnroute.pathParameters.md#bindattr)
- [bindChildren](fnroute.pathParameters.md#bindchildren)
- [bindProp](fnroute.pathParameters.md#bindprop)
- [bindSelect](fnroute.pathParameters.md#bindselect)
- [bindSelectAttr](fnroute.pathParameters.md#bindselectattr)
- [bindStyle](fnroute.pathParameters.md#bindstyle)
- [getPath](fnroute.pathParameters.md#getpath)
- [reset](fnroute.pathParameters.md#reset)
- [select](fnroute.pathParameters.md#select)
- [selected](fnroute.pathParameters.md#selected)
- [setPath](fnroute.pathParameters.md#setpath)

## Variables

### isFnState

• **isFnState**: `any`

A flag to indicate that this is an fnstate object

#### Defined in

[fntags.mjs:174](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L174)

## Functions

▸ ****(`newState`, `oldState`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `newState` | `any` |
| `oldState` | `any` |

#### Returns

`void`

#### Defined in

[fntags.mjs:172](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L172)

___

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

[fntags.mjs:166](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L166)

___

### bindAs

▸ **bindAs**(`element`, `update`): `Node` \| () => `Node`

Bind this state to the given element. This causes the element to update when state changes.
If called with no parameters, the state's value will be rendered as an element. If the first parameters is not a function,
the second parameter (the update function) must be provided and must be a function. This function receives the node the state is bound to.

#### Parameters

| Name | Type |
| :------ | :------ |
| `element` | (`T`: `any`) => `any` |
| `update` | (`Node`: `any`) => `void` |

#### Returns

`Node` \| () => `Node`

#### Defined in

[fntags.mjs:150](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L150)

___

### bindAttr

▸ **bindAttr**(`attribute`): `any`

Bind attribute values to state changes

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | `string` |

#### Returns

`any`

#### Defined in

[fntags.mjs:158](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L158)

___

### bindChildren

▸ **bindChildren**(`parent`, `element`, `update`): `Node` \| () => `Node`

Bind the values of this state to the given element.
Values are items/elements of an array.
If the current value is not an array, this will behave the same as bindAs.

#### Parameters

| Name | Type |
| :------ | :------ |
| `parent` | `Node` |
| `element` | `any` |
| `update` | (`Node`: `any`) => `void` |

#### Returns

`Node` \| () => `Node`

#### Defined in

[fntags.mjs:153](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L153)

___

### bindProp

▸ **bindProp**(`prop`): `Node` \| () => `Node`

Bind to a property of an object stored in this state instead of the state itself.
Shortcut for `mystate.bindAs((current)=> current[prop])`

#### Parameters

| Name | Type |
| :------ | :------ |
| `prop` | `string` |

#### Returns

`Node` \| () => `Node`

#### Defined in

[fntags.mjs:156](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L156)

___

### bindSelect

▸ **bindSelect**(`element`, `update`): `Node` \| () => `Node`

Bind selected state to an element

#### Parameters

| Name | Type |
| :------ | :------ |
| `element` | `any` |
| `update` | (`Node`: `any`) => `void` |

#### Returns

`Node` \| () => `Node`

#### Defined in

[fntags.mjs:160](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L160)

___

### bindSelectAttr

▸ **bindSelectAttr**(`attribute`): `any`

Bind selected state to an attribute

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | `string` |

#### Returns

`any`

#### Defined in

[fntags.mjs:161](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L161)

___

### bindStyle

▸ **bindStyle**(`style`): `string`

Bind style values to state changes

#### Parameters

| Name | Type |
| :------ | :------ |
| `style` | `string` |

#### Returns

`string`

#### Defined in

[fntags.mjs:159](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L159)

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

[fntags.mjs:168](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L168)

___

### reset

▸ **reset**(`reinit`): `Object`

Remove all of the observers and optionally reset the value to it's initial value

#### Parameters

| Name | Type |
| :------ | :------ |
| `reinit` | `boolean` |

#### Returns

`Object`

#### Defined in

[fntags.mjs:173](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L173)

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

[fntags.mjs:162](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L162)

___

### selected

▸ **selected**(): `any`

Get the currently selected key

#### Returns

`any`

#### Defined in

[fntags.mjs:165](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L165)

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

[fntags.mjs:171](https://github.com/narcolepticsnowman/fntags/blob/4775f59/src/fntags.mjs#L171)
