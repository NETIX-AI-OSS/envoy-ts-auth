[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / BffAuthConfig

# Type Alias: BffAuthConfig

> **BffAuthConfig** = `object`

Defined in: src/bff.ts:2

Browser authentication through a same-origin backend-for-frontend (BFF).

## Properties

### authorizationEndpoint?

> `optional` **authorizationEndpoint?**: `string`

Defined in: src/bff.ts:8

Starts OAuth authorization-code login. The BFF, not JavaScript, owns PKCE and state.

***

### baseUrl

> **baseUrl**: `string`

Defined in: src/bff.ts:4

Same-origin BFF base path, for example `/bff`.

***

### callbackEndpoint?

> `optional` **callbackEndpoint?**: `string`

Defined in: src/bff.ts:10

OAuth redirect URI handled by the BFF. Exposed for client/deployment configuration only.

***

### getCsrfToken

> **getCsrfToken**: () => `string` \| `Promise`\<`string`\>

Defined in: src/bff.ts:15

Supplies the synchronizer token sent on unsafe requests.

#### Returns

`string` \| `Promise`\<`string`\>

***

### loginEndpoint?

> `optional` **loginEndpoint?**: `string`

Defined in: src/bff.ts:6

Password login endpoint retained for applications that still expose it.

***

### logoutEndpoint?

> `optional` **logoutEndpoint?**: `string`

Defined in: src/bff.ts:13

***

### navigate?

> `optional` **navigate?**: (`url`) => `void`

Defined in: src/bff.ts:17

Injectable navigation hook for routers and tests. Defaults to `location.assign`.

#### Parameters

##### url

`string`

#### Returns

`void`

***

### sessionEndpoint?

> `optional` **sessionEndpoint?**: `string`

Defined in: src/bff.ts:11

***

### userEndpoint?

> `optional` **userEndpoint?**: `string`

Defined in: src/bff.ts:12
