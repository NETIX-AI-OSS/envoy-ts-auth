[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / LocaleStorage

# Interface: LocaleStorage

Defined in: src/locale.ts:38

Minimal asynchronous storage contract shared by browsers and React Native.

## Methods

### getItem()

> **getItem**(`key`): `Promise`\<`string` \| `null`\>

Defined in: src/locale.ts:39

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### removeItem()

> **removeItem**(`key`): `Promise`\<`void`\>

Defined in: src/locale.ts:41

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### setItem()

> **setItem**(`key`, `value`): `Promise`\<`void`\>

Defined in: src/locale.ts:40

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
