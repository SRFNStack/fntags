[@srfnstack/fntags](../README.md) / [Modules](../modules.md) / fnroute

# Module: fnroute

## Table of contents

### Namespaces

- [pathParameters](fnroute.pathParameters.md)
- [pathState](fnroute.pathState.md)

### Type Aliases

- [PathParameters](fnroute.md#pathparameters)
- [PathState](fnroute.md#pathstate)
- [RouteEvent](fnroute.md#routeevent)

### Variables

- [afterRouteChange](fnroute.md#afterroutechange)
- [beforeRouteChange](fnroute.md#beforeroutechange)
- [routeChangeComplete](fnroute.md#routechangecomplete)

### Functions

- [fnlink](fnroute.md#fnlink)
- [goTo](fnroute.md#goto)
- [listenFor](fnroute.md#listenfor)
- [pathParameters](fnroute.md#pathparameters-1)
- [pathState](fnroute.md#pathstate-1)
- [route](fnroute.md#route)
- [routeSwitch](fnroute.md#routeswitch)
- [setRootPath](fnroute.md#setrootpath)

## Type Aliases

### PathParameters

Ƭ **PathParameters**\<\>: `Object`

#### Defined in

[fnroute.mjs:188](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L188)

___

### PathState

Ƭ **PathState**\<\>: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `context` | `any` |
| `currentPath` | `string` |
| `rootPath` | `string` |

#### Defined in

[fnroute.mjs:199](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L199)

___

### RouteEvent

Ƭ **RouteEvent**\<\>: `string`

#### Defined in

[fnroute.mjs:218](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L218)

## Variables

### afterRouteChange

• `Const` **afterRouteChange**: `string` = `'afterRouteChange'`

After the route is changed

#### Defined in

[fnroute.mjs:229](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L229)

___

### beforeRouteChange

• `Const` **beforeRouteChange**: `string` = `'beforeRouteChange'`

Before the route is changed

#### Defined in

[fnroute.mjs:224](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L224)

___

### routeChangeComplete

• `Const` **routeChangeComplete**: `string` = `'routeChangeComplete'`

After the route is changed and the route element is rendered

#### Defined in

[fnroute.mjs:234](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L234)

## Functions

### fnlink

▸ **fnlink**(`...children`): `HTMLAnchorElement`

A link element that is a link to another route in this single page app

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...children` | `any`[] | The attributes of the anchor element and any children |

#### Returns

`HTMLAnchorElement`

An anchor element that will navigate to the specified route when clicked

#### Defined in

[fnroute.mjs:108](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L108)

___

### goTo

▸ **goTo**(`route`, `context?`, `replace?`, `silent?`): `void`

A function to navigate to the specified route

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `route` | `string` | `undefined` | The route to navigate to |
| `context` | `any` | `{}` | Data related to the route change |
| `replace` | `boolean` | `false` | Whether to replace the state or push it. pushState is used by default. |
| `silent` | `boolean` | `false` | Prevent route change events from being emitted for this route change |

#### Returns

`void`

#### Defined in

[fnroute.mjs:138](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L138)

___

### listenFor

▸ **listenFor**(`event`, `handler`): () => `void`

Listen for routing events

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `any` | a string event to listen for |
| `handler` | `any` | A function that will be called when the event occurs. The function receives the new and old pathState objects, in that order. |

#### Returns

`fn`

a function to stop listening with the passed handler.

▸ (): `void`

##### Returns

`void`

#### Defined in

[fnroute.mjs:252](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L252)

___

### pathParameters

▸ **pathParameters**(`newState?`): `any`

The path parameters of the current route

#### Parameters

| Name | Type |
| :------ | :------ |
| `newState?` | `any` |

#### Returns

`any`

#### Defined in

[fntags.d.mts:193](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.d.mts#L193)

___

### pathState

▸ **pathState**(`newState?`): [`PathState`](fnroute.md#pathstate)

The current path state

#### Parameters

| Name | Type |
| :------ | :------ |
| `newState?` | [`PathState`](fnroute.md#pathstate) |

#### Returns

[`PathState`](fnroute.md#pathstate)

#### Defined in

[fntags.d.mts:193](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fntags.d.mts#L193)

___

### route

▸ **route**(`...children`): `HTMLDivElement`

An element that is displayed only if the current route starts with elements path attribute.

For example,
 route({path: "/proc"},
     div(
         "proc",
         div({path: "/cpuinfo"},
             "cpuinfo"
             )
         )
     )

 You can override this behavior by setting the attribute, absolute to any value

 route({path: "/usr"},
     div(
         "proc",
         div({path: "/cpuinfo", absolute: true},
             "cpuinfo"
             )
         )
     )

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...children` | `any`[] | The attributes and children of this element. |

#### Returns

`HTMLDivElement`

A div element that will only be displayed if the current route starts with the path attribute.

#### Defined in

[fnroute.mjs:34](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L34)

___

### routeSwitch

▸ **routeSwitch**(`...children`): `Node` \| () => `Node`

An element that only renders the first route that matches and updates when the route is changed
The primary purpose of this element is to provide catchall routes for not found pages and path variables

#### Parameters

| Name | Type |
| :------ | :------ |
| `...children` | `any`[] |

#### Returns

`Node` \| () => `Node`

#### Defined in

[fnroute.mjs:60](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L60)

___

### setRootPath

▸ **setRootPath**(`rootPath`): `void`

Set the root path of the app. This is necessary to make deep linking work in cases where the same html file is served from all paths.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `rootPath` | `string` | The root path of the app |

#### Returns

`void`

#### Defined in

[fnroute.mjs:269](https://github.com/SRFNStack/fntags/blob/0c329ca/src/fnroute.mjs#L269)
