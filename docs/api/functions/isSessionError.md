[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / isSessionError

# Function: isSessionError()

> **isSessionError**(`status`): `boolean`

Defined in: [src/index.ts:917](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/2888867dc4e0d2c82b4e2fd9aace10fe39ffd776/src/index.ts#L917)

Whether an HTTP status from a business API call signals a broken session, only 401 qualifies, not 403 (permission-denied, still authenticated).

## Parameters

### status

`number`

HTTP status code from a business API response.

## Returns

`boolean`
