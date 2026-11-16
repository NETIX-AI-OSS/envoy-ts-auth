[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / LocaleRuntimeConfig

# Type Alias: LocaleRuntimeConfig

> **LocaleRuntimeConfig** = `object`

Defined in: [src/locale.ts:80](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L80)

## Properties

### anonymousEffectiveEndpoint?

> `optional` **anonymousEffectiveEndpoint?**: `string`

Defined in: [src/locale.ts:94](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L94)

Defaults to `/auth/organization-locale/effective/`.

***

### apiBaseUrl

> **apiBaseUrl**: `string`

Defined in: [src/locale.ts:81](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L81)

***

### application

> **application**: `string`

Defined in: [src/locale.ts:82](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L82)

***

### effectiveEndpoint?

> `optional` **effectiveEndpoint?**: `string`

Defined in: [src/locale.ts:90](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L90)

Defaults to `/api/organization-locale/effective/`.

***

### fallbackLanguage?

> `optional` **fallbackLanguage?**: `string`

Defined in: [src/locale.ts:104](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L104)

Locale served when a read path is handed an unparseable language, default `"en"`.
Set it to the deployment's own default so a misconfigured organization degrades to
its own language rather than to English.

***

### fetch?

> `optional` **fetch?**: *typeof* `fetch`

Defined in: [src/locale.ts:86](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L86)

Defaults to global fetch.

***

### getAccessToken

> **getAccessToken**: () => `Promise`\<`string` \| `null`\>

Defined in: [src/locale.ts:84](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L84)

#### Returns

`Promise`\<`string` \| `null`\>

***

### healthEndpoint?

> `optional` **healthEndpoint?**: `string`

Defined in: [src/locale.ts:88](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L88)

Defaults to `/healthz/`.

***

### maxCacheEntries?

> `optional` **maxCacheEntries?**: `number`

Defined in: [src/locale.ts:96](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L96)

Maximum cached identity/application/language entries, default 8.

***

### now?

> `optional` **now?**: () => `number`

Defined in: [src/locale.ts:111](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L111)

#### Returns

`number`

***

### onInvalidLanguage?

> `optional` **onInvalidLanguage?**: (`language`, `fallback`) => `void`

Defined in: [src/locale.ts:110](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L110)

Called once per distinct unparseable language code a read path receives. Defaults to
`console.warn`; apps should route it to their error tracker, because this is the only
signal left once the read paths stop throwing.

#### Parameters

##### language

`string`

##### fallback

`string`

#### Returns

`void`

***

### preferenceEndpoint?

> `optional` **preferenceEndpoint?**: `string`

Defined in: [src/locale.ts:92](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L92)

Defaults to `/auth/me/language/`.

***

### storage

> **storage**: [`LocaleStorage`](../interfaces/LocaleStorage.md)

Defined in: [src/locale.ts:83](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L83)

***

### storageNamespace?

> `optional` **storageNamespace?**: `string`

Defined in: [src/locale.ts:98](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L98)

Storage namespace, useful when an app embeds multiple environments.
