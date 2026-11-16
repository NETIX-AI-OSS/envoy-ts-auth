[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / BffAuthConfig

# Type Alias: BffAuthConfig

> **BffAuthConfig** = `object`

Defined in: [src/bff.ts:2](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L2)

Browser authentication through a same-origin backend-for-frontend (BFF).

## Properties

### authorizationEndpoint?

> `optional` **authorizationEndpoint?**: `string`

Defined in: [src/bff.ts:8](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L8)

Starts OAuth authorization-code login. The BFF, not JavaScript, owns PKCE and state.

***

### baseUrl

> **baseUrl**: `string`

Defined in: [src/bff.ts:4](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L4)

Same-origin BFF base path, for example `/bff`.

***

### callbackEndpoint?

> `optional` **callbackEndpoint?**: `string`

Defined in: [src/bff.ts:10](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L10)

OAuth redirect URI handled by the BFF. Exposed for client/deployment configuration only.

***

### getCsrfToken

> **getCsrfToken**: () => `string` \| `Promise`\<`string`\>

Defined in: [src/bff.ts:15](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L15)

Supplies the synchronizer token sent on unsafe requests.

#### Returns

`string` \| `Promise`\<`string`\>

***

### loginEndpoint?

> `optional` **loginEndpoint?**: `string`

Defined in: [src/bff.ts:6](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L6)

Password login endpoint retained for applications that still expose it.

***

### logoutEndpoint?

> `optional` **logoutEndpoint?**: `string`

Defined in: [src/bff.ts:13](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L13)

***

### navigate?

> `optional` **navigate?**: (`url`) => `void`

Defined in: [src/bff.ts:17](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L17)

Injectable navigation hook for routers and tests. Defaults to `location.assign`.

#### Parameters

##### url

`string`

#### Returns

`void`

***

### sessionEndpoint?

> `optional` **sessionEndpoint?**: `string`

Defined in: [src/bff.ts:11](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L11)

***

### userEndpoint?

> `optional` **userEndpoint?**: `string`

Defined in: [src/bff.ts:12](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/bff.ts#L12)
