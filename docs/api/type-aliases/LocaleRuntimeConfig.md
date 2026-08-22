[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / LocaleRuntimeConfig

# Type Alias: LocaleRuntimeConfig

> **LocaleRuntimeConfig** = `object`

Defined in: [src/locale.ts:80](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L80)

## Properties

### anonymousEffectiveEndpoint?

> `optional` **anonymousEffectiveEndpoint?**: `string`

Defined in: [src/locale.ts:94](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L94)

Defaults to `/auth/organization-locale/effective/`.

***

### apiBaseUrl

> **apiBaseUrl**: `string`

Defined in: [src/locale.ts:81](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L81)

***

### application

> **application**: `string`

Defined in: [src/locale.ts:82](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L82)

***

### effectiveEndpoint?

> `optional` **effectiveEndpoint?**: `string`

Defined in: [src/locale.ts:90](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L90)

Defaults to `/api/organization-locale/effective/`.

***

### fetch?

> `optional` **fetch?**: *typeof* `fetch`

Defined in: [src/locale.ts:86](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L86)

Defaults to global fetch.

***

### getAccessToken

> **getAccessToken**: () => `Promise`\<`string` \| `null`\>

Defined in: [src/locale.ts:84](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L84)

#### Returns

`Promise`\<`string` \| `null`\>

***

### healthEndpoint?

> `optional` **healthEndpoint?**: `string`

Defined in: [src/locale.ts:88](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L88)

Defaults to `/healthz/`.

***

### maxCacheEntries?

> `optional` **maxCacheEntries?**: `number`

Defined in: [src/locale.ts:96](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L96)

Maximum cached identity/application/language entries, default 8.

***

### now?

> `optional` **now?**: () => `number`

Defined in: [src/locale.ts:99](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L99)

#### Returns

`number`

***

### preferenceEndpoint?

> `optional` **preferenceEndpoint?**: `string`

Defined in: [src/locale.ts:92](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L92)

Defaults to `/auth/me/language/`.

***

### storage

> **storage**: [`LocaleStorage`](../interfaces/LocaleStorage.md)

Defined in: [src/locale.ts:83](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L83)

***

### storageNamespace?

> `optional` **storageNamespace?**: `string`

Defined in: [src/locale.ts:98](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L98)

Storage namespace, useful when an app embeds multiple environments.
