[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / LocaleStorage

# Interface: LocaleStorage

Defined in: [src/locale.ts:38](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L38)

Minimal asynchronous storage contract shared by browsers and React Native.

## Methods

### getItem()

> **getItem**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [src/locale.ts:39](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L39)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### removeItem()

> **removeItem**(`key`): `Promise`\<`void`\>

Defined in: [src/locale.ts:41](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L41)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### setItem()

> **setItem**(`key`, `value`): `Promise`\<`void`\>

Defined in: [src/locale.ts:40](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L40)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
