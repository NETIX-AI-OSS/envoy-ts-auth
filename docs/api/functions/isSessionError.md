[**envoy-ts-auth**](../README.md)

***

[envoy-ts-auth](../README.md) / isSessionError

# Function: isSessionError()

> **isSessionError**(`status`): `boolean`

Defined in: [src/index.ts:882](https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/bb36c85c77ff6e4deb6c43324d024053b8dfc765/src/index.ts#L882)

Whether an HTTP status from a business API call signals a broken session — only 401 qualifies, not 403 (permission-denied, still authenticated).

## Parameters

### status

`number`

HTTP status code from a business API response.

## Returns

`boolean`
