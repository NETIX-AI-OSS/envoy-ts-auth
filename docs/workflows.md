# Auth Workflows

This page captures runtime behavior of `auth` during token checks, refresh attempts, and login/logout transitions.

## Runtime State Diagram

```mermaid
stateDiagram-v2
  [*] --> Ready
  Ready --> CheckingToken: getToken() / verifyToken()
  CheckingToken --> ValidToken: token valid
  CheckingToken --> RefreshFlow: token missing or invalid
  RefreshFlow --> ValidToken: refresh success
  RefreshFlow --> LoginRedirect: refresh missing/invalid/forbidden
  ValidToken --> UserLoaded: getUser()
  UserLoaded --> Ready
  LoginRedirect --> [*]
```

## Verify + Refresh Sequence

```mermaid
sequenceDiagram
  autonumber
  participant App
  participant Auth
  participant API as Auth API
  participant Store as Cookie/AsyncStorage

  App->>Auth: verifyToken()
  Auth->>Store: has refresh?
  alt no refresh
    Auth-->>App: failed
  else refresh exists
    Auth->>Store: has token?
    alt no token
      Auth->>API: refresh(refresh)
      alt refresh ok
        API-->>Auth: access
        Auth->>Store: set token
        Auth-->>App: ok
      else refresh fails
        Auth->>Auth: clear + redirect/login callback
        Auth-->>App: failed
      end
    else token exists
      Auth->>API: verify(token)
      alt verify ok
        API-->>Auth: ok
        Auth-->>App: ok
      else verify 401
        Auth->>API: refresh(refresh)
        API-->>Auth: refresh response
        Auth-->>App: status
      else verify 403
        Auth->>Auth: clear + redirect/login callback
        Auth-->>App: failed
      end
    end
  end
```

## Login Sequence

```mermaid
flowchart LR
  A[login(username, password)] --> B[POST TOKEN_ENDPOINT]
  B --> C{200 + access + refresh?}
  C -- yes --> D[Store token]
  D --> E[Store refresh]
  E --> F[redirectToSourcePage or ON_LOGIN]
  C -- no --> G[return false/undefined]
```

## Logout Sequence

```mermaid
flowchart LR
  A[logout()] --> B[clearCookies or AsyncStorage remove]
  B --> C[redirectToLoginPage or ON_LOGOUT]
```

## Redirect Validation

All redirect targets derived from the `continue` query parameter are validated before use:

```mermaid
flowchart TD
  A[continue URL candidate] --> B{parseable URL?}
  B -- no --> F[fall back to LAUNCHPAD_PAGE_URL]
  B -- yes --> C{protocol == https:?}
  C -- no --> F
  C -- yes --> D{"hostname == BASE_DOMAIN<br/>or single-level subdomain?"}
  D -- no --> F
  D -- yes --> E[use as redirect target]
```

`redirectToLoginPage` additionally only appends `continue` when the current page's hostname matches `CURRENT_APP_DOMAIN`.
