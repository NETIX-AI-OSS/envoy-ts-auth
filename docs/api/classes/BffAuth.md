[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / BffAuth

# Class: BffAuth

Defined in: src/bff.ts:26

## Constructors

### Constructor

> **new BffAuth**(`config`): `BffAuth`

Defined in: src/bff.ts:39

#### Parameters

##### config

[`BffAuthConfig`](../type-aliases/BffAuthConfig.md)

#### Returns

`BffAuth`

## Methods

### bootstrap()

> **bootstrap**\<`T`\>(): `Promise`\<[`BffSession`](../type-aliases/BffSession.md)\<`T`\>\>

Defined in: src/bff.ts:135

Restores application state after the BFF callback has created its host-only session.

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<[`BffSession`](../type-aliases/BffSession.md)\<`T`\>\>

***

### getAuthorizationUrl()

> **getAuthorizationUrl**(`returnTo?`): `URL`

Defined in: src/bff.ts:95

Builds the same-origin entry point for authorization-code login. The BFF
must generate and retain state and the PKCE verifier before it
redirects to the identity provider. No OAuth secret is stored in the browser.

#### Parameters

##### returnTo?

`string`

#### Returns

`URL`

***

### getOAuthCallbackUrl()

> **getOAuthCallbackUrl**(): `URL`

Defined in: src/bff.ts:109

The same-origin callback URL to register for this application at the identity provider.

#### Returns

`URL`

***

### getUser()

> **getUser**\<`T`\>(): `Promise`\<`T` \| `null`\>

Defined in: src/bff.ts:127

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`T` \| `null`\>

***

### login()

> **login**(`username`, `password`): `Promise`\<`boolean`\>

Defined in: src/bff.ts:113

#### Parameters

##### username

`string`

##### password

`string`

#### Returns

`Promise`\<`boolean`\>

***

### logout()

> **logout**(): `Promise`\<`void`\>

Defined in: src/bff.ts:143

#### Returns

`Promise`\<`void`\>

***

### request()

> **request**(`input`, `init?`): `Promise`\<`Response`\>

Defined in: src/bff.ts:80

#### Parameters

##### input

`string` \| `URL`

##### init?

`RequestInit` = `{}`

#### Returns

`Promise`\<`Response`\>

***

### startAuthorizationCodeLogin()

> **startAuthorizationCodeLogin**(`returnTo?`): `void`

Defined in: src/bff.ts:102

Starts one-point login. An existing central IdP session avoids another password prompt.

#### Parameters

##### returnTo?

`string`

#### Returns

`void`

***

### verifySession()

> **verifySession**(): `Promise`\<`boolean`\>

Defined in: src/bff.ts:122

#### Returns

`Promise`\<`boolean`\>
