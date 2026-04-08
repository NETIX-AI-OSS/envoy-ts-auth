# Getting Started

## Prerequisites

- Node.js 18+
- Yarn 1+ (or npm equivalent)
- An auth backend exposing token, verify, and refresh endpoints

## Install

```bash
yarn add github:NETIX-AI-OSS/auth
```

Alternative:

```bash
npm i github:NETIX-AI-OSS/auth
```

## Bootstrapping

```ts
import { Auth, type AuthConfig } from "auth";

const config: AuthConfig = {
  COOKIE_TOKEN_TTL: "300",
  COOKIE_REFRESH_TTL: "86400",
  COOKIE_SECURE: true,
  COOKIE_DOMAIN: ".example.com",
  BASE_DOMAIN: "example.com",
  CURRENT_APP_DOMAIN: "app.example.com",
  LOGIN_PAGE_URL: "https://auth.example.com/login",
  AUTH_BASE_URL: "https://auth.example.com",
  LAUNCHPAD_PAGE_URL: "https://app.example.com",
  REFRESH_ENDPOINT: "/auth/token/refresh/",
  VERIFY_ENDPOINT: "/auth/token/verify/",
  TOKEN_ENDPOINT: "/auth/token/",
  NATIVE_PLATFORM: false,
};

Auth.initialize(config);
```

## First Runtime Checks

```ts
const auth = Auth.getInstance();

const status = await auth.verifyToken();
if (status?.status !== "ok") {
  auth.redirectToLoginPage();
}
```

## Common Usage

```ts
const auth = Auth.getInstance();
const token = await auth.getToken();
const user = await auth.getUser();
const groups = await auth.getGroups();
const permissions = await auth.getPermissions();
```

## Native Runtime

Set `NATIVE_PLATFORM: true` to switch storage from browser cookies to AsyncStorage.
