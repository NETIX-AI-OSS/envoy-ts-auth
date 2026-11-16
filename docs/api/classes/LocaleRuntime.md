[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / LocaleRuntime

# Class: LocaleRuntime

Defined in: [src/locale.ts:143](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L143)

Framework-neutral organization locale coordinator.

Consumers own their i18n bindings. This class only handles identity-safe
persistence, health-gated network reconciliation, and conditional requests.

## Constructors

### Constructor

> **new LocaleRuntime**(`config`): `LocaleRuntime`

Defined in: [src/locale.ts:170](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L170)

#### Parameters

##### config

[`LocaleRuntimeConfig`](../type-aliases/LocaleRuntimeConfig.md)

#### Returns

`LocaleRuntime`

## Methods

### checkHealth()

> **checkHealth**(): `Promise`\<`boolean`\>

Defined in: [src/locale.ts:220](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L220)

Returns true only when user-management answers its health endpoint successfully.

#### Returns

`Promise`\<`boolean`\>

***

### clearIdentity()

> **clearIdentity**(`identity`): `Promise`\<`void`\>

Defined in: [src/locale.ts:440](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L440)

Removes all persisted locale and pending-preference state for one identity.

#### Parameters

##### identity

[`LocaleIdentity`](../type-aliases/LocaleIdentity.md)

#### Returns

`Promise`\<`void`\>

***

### fetchAnonymousEffective()

> **fetchAnonymousEffective**(`language`, `localeContextToken?`): `Promise`\<[`EffectiveLocale`](../type-aliases/EffectiveLocale.md)\>

Defined in: [src/locale.ts:382](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L382)

Fetches universal-login copy before authentication. The context token is
carried only in X-Locale-Context and is never persisted by this runtime.

#### Parameters

##### language

`string`

##### localeContextToken?

`string` \| `null`

#### Returns

`Promise`\<[`EffectiveLocale`](../type-aliases/EffectiveLocale.md)\>

***

### handleLogout()

> **handleLogout**(`identity?`): `Promise`\<`void`\>

Defined in: [src/locale.ts:455](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L455)

Logout hook: clears the supplied (or active) identity without affecting other users.

#### Parameters

##### identity?

[`LocaleIdentity`](../type-aliases/LocaleIdentity.md)

#### Returns

`Promise`\<`void`\>

***

### hydrate()

> **hydrate**(`identity`, `language`): `Promise`\<[`LocaleCacheEnvelope`](../type-aliases/LocaleCacheEnvelope.md) \| `null`\>

Defined in: [src/locale.ts:233](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L233)

Loads an exact identity/org/app/language cache match, otherwise returns null.

#### Parameters

##### identity

[`LocaleIdentity`](../type-aliases/LocaleIdentity.md)

##### language

`string`

#### Returns

`Promise`\<[`LocaleCacheEnvelope`](../type-aliases/LocaleCacheEnvelope.md) \| `null`\>

***

### notifyTokenChanged()

> **notifyTokenChanged**(): `void`

Defined in: [src/locale.ts:432](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L432)

Call after access-token replacement so no in-flight response crosses sessions.

#### Returns

`void`

***

### reconcilePendingLanguage()

> **reconcilePendingLanguage**(`identity`): `Promise`\<`boolean`\>

Defined in: [src/locale.ts:306](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L306)

Replays the latest offline language choice. Returns false while still pending.

#### Parameters

##### identity

[`LocaleIdentity`](../type-aliases/LocaleIdentity.md)

#### Returns

`Promise`\<`boolean`\>

***

### refreshEffective()

> **refreshEffective**(`identity`, `language`): `Promise`\<[`LocaleRefreshResult`](../type-aliases/LocaleRefreshResult.md)\>

Defined in: [src/locale.ts:260](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L260)

Health-gated authenticated refresh with ETag support and per-request deduplication.
On a transient outage it returns the exact cached catalog when one exists.

#### Parameters

##### identity

[`LocaleIdentity`](../type-aliases/LocaleIdentity.md)

##### language

`string`

#### Returns

`Promise`\<[`LocaleRefreshResult`](../type-aliases/LocaleRefreshResult.md)\>

***

### setActiveIdentity()

> **setActiveIdentity**(`identity`): `void`

Defined in: [src/locale.ts:421](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L421)

Marks an identity active and drops request state when the subject/org changes.

#### Parameters

##### identity

[`LocaleIdentity`](../type-aliases/LocaleIdentity.md) \| `null`

#### Returns

`void`

***

### setPreferredLanguage()

> **setPreferredLanguage**(`identity`, `language`): `Promise`\<`boolean`\>

Defined in: [src/locale.ts:287](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L287)

Saves the latest choice first, then attempts to reconcile it with the server.

#### Parameters

##### identity

[`LocaleIdentity`](../type-aliases/LocaleIdentity.md)

##### language

`string`

#### Returns

`Promise`\<`boolean`\>
