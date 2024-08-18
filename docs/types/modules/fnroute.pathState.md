[@srfnstack/fntags](../README.md) / [Exports](../modules.md) / [fnroute](fnroute.md) / pathState

# Namespace: pathState

[fnroute](fnroute.md).pathState

The current path state

## Table of contents

### References

- [isFnState](fnroute.pathState.md#isfnstate)

### Functions

- [assign](fnroute.pathState.md#assign)
- [bindAs](fnroute.pathState.md#bindas)
- [bindAttr](fnroute.pathState.md#bindattr)
- [bindChildren](fnroute.pathState.md#bindchildren)
- [bindProp](fnroute.pathState.md#bindprop)
- [bindSelect](fnroute.pathState.md#bindselect)
- [bindSelectAttr](fnroute.pathState.md#bindselectattr)
- [bindStyle](fnroute.pathState.md#bindstyle)
- [getPath](fnroute.pathState.md#getpath)
- [reset](fnroute.pathState.md#reset)
- [select](fnroute.pathState.md#select)
- [selected](fnroute.pathState.md#selected)
- [setPath](fnroute.pathState.md#setpath)
- [subscribe](fnroute.pathState.md#subscribe)

## References

### isFnState

Re-exports [isFnState](fnroute.pathParameters.md#isfnstate)

## Functions

### assign

▸ **assign**(`update`): `void`

Perform an Object.assign() on the current state using the provided update, triggers
a state change and is a shortcut for `mystate(Object.assign(mystate(), update))`

#### Parameters

| Name | Type |
| :------ | :------ |
| `update` | [`PathState`](fnroute.md#pathstate) |

#### Returns

`void`

#### Defined in

[fntags.d.mts:166](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L166)

___

### bindAs

▸ **bindAs**(`element?`): `Node`

Bind this state to the given element function. This causes the element to be replaced when state changes.
If called with no parameters, the state's value will be rendered as an element.

#### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | () => `any` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:124](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L124)

___

### bindAttr

▸ **bindAttr**(`attribute?`): `any`

Bind attribute values to state changes

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | () => `any` |

#### Returns

`any`

#### Defined in

[fntags.d.mts:139](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L139)

___

### bindChildren

▸ **bindChildren**(`parent`, `element`): `Node`

Bind the values of this state to the given element.
Values are items/elements of an array.
If the current value is not an array, this will behave the same as bindAs.

#### Parameters

| Name | Type |
| :------ | :------ |
| `parent` | () => `any` |
| `element` | (`childState`: `any`) => `any` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:130](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L130)

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

[fntags.d.mts:135](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L135)

___

### bindSelect

▸ **bindSelect**(`element?`): `Node`

Bind selected state to an element

#### Parameters

| Name | Type |
| :------ | :------ |
| `element?` | () => `any` |

#### Returns

`Node`

#### Defined in

[fntags.d.mts:147](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L147)

___

### bindSelectAttr

▸ **bindSelectAttr**(`attribute?`): `any`

Bind selected state to an attribute

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute?` | () => `any` |

#### Returns

`any`

#### Defined in

[fntags.d.mts:151](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L151)

___

### bindStyle

▸ **bindStyle**(`style?`): `string`

Bind style values to state changes

#### Parameters

| Name | Type |
| :------ | :------ |
| `style?` | () => `string` |

#### Returns

`string`

#### Defined in

[fntags.d.mts:143](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L143)

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

[fntags.d.mts:172](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L172)

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

[fntags.d.mts:184](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L184)

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

[fntags.d.mts:157](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L157)

___

### selected

▸ **selected**(): `any`

Get the currently selected key

#### Returns

`any`

#### Defined in

[fntags.d.mts:161](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L161)

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

[fntags.d.mts:176](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L176)

___

### subscribe

▸ **subscribe**(`subscriber`): `void`

Register a callback that will be executed whenever the state is changed

#### Parameters

| Name | Type |
| :------ | :------ |
| `subscriber` | (`newState`: [`PathState`](fnroute.md#pathstate), `oldState`: [`PathState`](fnroute.md#pathstate)) => `void` |

#### Returns

`void`

#### Defined in

[fntags.d.mts:180](https://github.com/srfnstack/fntags/blob/8c5b29e/src/fntags.d.mts#L180)
