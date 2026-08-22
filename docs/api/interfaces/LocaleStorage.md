[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / LocaleStorage

# Interface: LocaleStorage

Defined in: [src/locale.ts:38](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L38)

Minimal asynchronous storage contract shared by browsers and React Native.

## Methods

### getItem()

> **getItem**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [src/locale.ts:39](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L39)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### removeItem()

> **removeItem**(`key`): `Promise`\<`void`\>

Defined in: [src/locale.ts:41](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L41)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### setItem()

> **setItem**(`key`, `value`): `Promise`\<`void`\>

Defined in: [src/locale.ts:40](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/98d0dbc4081c38ff58de5aebb52d5f4e72e595aa/src/locale.ts#L40)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
