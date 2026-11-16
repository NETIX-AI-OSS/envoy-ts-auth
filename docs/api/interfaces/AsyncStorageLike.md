[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / AsyncStorageLike

# Interface: AsyncStorageLike

Defined in: [src/locale.ts:45](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L45)

React Native AsyncStorage-compatible subset.

## Methods

### getItem()

> **getItem**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [src/locale.ts:46](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L46)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### removeItem()

> **removeItem**(`key`): `Promise`\<`void`\>

Defined in: [src/locale.ts:48](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L48)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### setItem()

> **setItem**(`key`, `value`): `Promise`\<`void`\>

Defined in: [src/locale.ts:47](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/locale.ts#L47)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>
