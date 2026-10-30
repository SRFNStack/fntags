[@srfnstack/fntags](../README.md) / [Modules](../modules.md) / [fntags](../modules/fntags.md) / BindRowsOptions

# Interface: BindRowsOptions\<\>

[fntags](../modules/fntags.md).BindRowsOptions

Options for bindRows.

## Table of contents

### Properties

- [handlers](fntags.BindRowsOptions.md#handlers)
- [values](fntags.BindRowsOptions.md#values)

## Properties

### handlers

• **handlers**: `Object`

Event handlers by slot name. The named slots must be on* attributes.

#### Defined in

[fntags.mjs:235](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L235)

___

### values

• **values**: (`item`: `any`, `selected`: `any`) => {}

#### Type declaration

▸ (`item`, `selected`): `Object`

Map an item and the currently selected key to the template's slot values.
Defaults to the item itself. Return a fresh object: it is kept and compared slot by slot against the next result.
A slot value may also be a bind getter (bindAs, bindAttr, bindStyle) or a node; bindings created here are cleaned up when values re-runs or the row is removed.

##### Parameters

| Name | Type |
| :------ | :------ |
| `item` | `any` |
| `selected` | `any` |

##### Returns

`Object`

#### Defined in

[fntags.mjs:232](https://github.com/SRFNStack/fntags/blob/82fe0b3/src/fntags.mjs#L232)
