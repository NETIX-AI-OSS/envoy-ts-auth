import AsyncStorage from "@react-native-async-storage/async-storage";
import { ERROR_MESSAGES, REDIRECT_DESTINATION_URL } from "./conf/settings";
import Cookies = require("js-cookie");
export { BffAuth, type BffAuthConfig, type BffSession } from "./bff";

/**
 * Options for {@link fetchIdempotentWithRetry}.
 * @internal
 */
type RetryOptions = {
  /** Extra attempts after the first, default 2 (3 attempts total). */
  maxRetries?: number;
  /** Base delay (ms) for exponential backoff, default 250. */
  baseDelayMs?: number;
  /** Backoff/Retry-After cap (ms), default 2000. */
  maxDelayMs?: number;
  /** Injectable sleep, defaults to a `setTimeout`-based implementation. */
  sleep?: (ms: number) => Promise<void>;
};

let defaultRetrySleep: (ms: number) => Promise<void> = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Test-only hook that swaps the default `setTimeout`-based sleep used by {@link fetchIdempotentWithRetry}, so tests skip real backoff delays.
 * @internal
 */
export function __setDefaultRetrySleepForTests(
  sleep: (ms: number) => Promise<void>,
) {
  defaultRetrySleep = sleep;
}

const RETRYABLE_STATUSES = new Set([429, 408]);

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUSES.has(status) || (status >= 500 && status <= 599);
}

function computeBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return exponential * (0.5 + Math.random() * 0.5);
}

/**
 * Parses a `Retry-After` header (seconds form only) into milliseconds, or null so callers fall back to the computed backoff delay.
 * @internal
 */
function parseRetryAfterMs(response: Response): number | null {
  const header = response.headers?.get?.("Retry-After");
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

/**
 * Fetch wrapper with jittered-exponential-backoff retries for transient failures — only call it for idempotent GET/HEAD/OPTIONS requests, never POST/PUT/PATCH/DELETE.
 * @internal
 */
async function fetchIdempotentWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  opts?: RetryOptions,
): Promise<Response> {
  const maxRetries = opts?.maxRetries ?? 2;
  const baseDelayMs = opts?.baseDelayMs ?? 250;
  const maxDelayMs = opts?.maxDelayMs ?? 2000;
  const sleep = opts?.sleep ?? defaultRetrySleep;

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.ok || !isRetryableStatus(response.status)) {
        return response;
      }
      if (attempt >= maxRetries) {
        return response;
      }
      const retryAfterMs =
        response.status === 429 ? parseRetryAfterMs(response) : null;
      const delay =
        retryAfterMs !== null
          ? Math.min(retryAfterMs, maxDelayMs)
          : computeBackoffDelay(attempt, baseDelayMs, maxDelayMs);
      await sleep(delay);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      if (attempt >= maxRetries) {
        throw error;
      }
      await sleep(computeBackoffDelay(attempt, baseDelayMs, maxDelayMs));
    }
  }
}

/**
 * Key-value pair for storage operations (cookie or AsyncStorage), used by {@link Auth.setKeyValue}.
 * @category Types
 */
export type KeyVal = { key: string; value: string; maxAge?: string };

/** Shape of an error object returned from an API response. */
type ErrorHandler = {
  response: {
    status: number;
    data: {
      messages: string[];
    };
  };
};

/**
 * Configuration object for authentication.
 * @category Types
 */
export type AuthConfig = {
  /** Token cookie time-to-live (in seconds) */
  COOKIE_TOKEN_TTL: string;
  /** Refresh token cookie time-to-live (in seconds) */
  COOKIE_REFRESH_TTL: string;
  /** Whether the cookie is secure */
  COOKIE_SECURE: boolean;
  /** Domain for the cookie */
  COOKIE_DOMAIN: string;
  /** Base hostname allowed for redirects */
  BASE_DOMAIN: string;
  /** Current app hostname used when preserving redirects */
  CURRENT_APP_DOMAIN: string;
  /** URL for the login page */
  LOGIN_PAGE_URL: string;
  /** Base URL for authentication API */
  AUTH_BASE_URL: string;
  /** URL for the launchpad page */
  LAUNCHPAD_PAGE_URL: string;
  /** Endpoint for refreshing tokens */
  REFRESH_ENDPOINT: string;
  /** Endpoint for verifying tokens */
  VERIFY_ENDPOINT: string;
  /** Endpoint for obtaining tokens */
  TOKEN_ENDPOINT: string;
  /** Optional endpoint for revoking the server-side session during logout */
  LOGOUT_ENDPOINT?: string;
  /** Set to true if running on a native platform */
  NATIVE_PLATFORM?: boolean;
  /**
   * Browser migration control. `legacy-shared-cookie` (the default) preserves
   * one-point login for existing applications. Set `bff-only` only after the
   * application has moved all API traffic and login bootstrap to BffAuth.
   */
  BROWSER_SESSION_MODE?: "legacy-shared-cookie" | "bff-only";
  /**
   * @deprecated Use `BROWSER_SESSION_MODE`. Retained so upgrading this library
   * cannot break applications during the coordinated BFF migration.
   */
  ALLOW_INSECURE_BROWSER_TOKEN_STORAGE?: boolean;
  /** Callback for login event */
  ON_LOGIN?: () => void;
  /** Callback for logout event */
  ON_LOGOUT?: () => void;
};

/**
 * Singleton class for authentication and authorization utilities — call {@link Auth.initialize} once, then {@link Auth.getInstance} for all methods.
 * @category Auth
 */
class Auth {
  private static instance: Auth | null = null;
  private static initialized = false;
  private config: AuthConfig;
  private cachedToken: string | null = null;
  private cachedUser: Record<string, any> | null = null;
  private tokenTimestamp: number | null = null;
  private userTimestamp: number | null = null;
  private static readonly CACHE_DURATION = 60 * 1000; // 1 minute

  private constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Initializes the Auth singleton with the given configuration; must be called before any other Auth method.
   * @param config The authentication configuration object.
   * @throws If already initialized or config is invalid.
   */
  static initialize(config: AuthConfig) {
    if (Auth.initialized) {
      throw new Error(ERROR_MESSAGES.ALREADY_INITIALIZED);
    }
    validateAuthConfig(config);
    if (!config.NATIVE_PLATFORM && config.BROWSER_SESSION_MODE === "bff-only") {
      throw new Error(
        "envoy-ts-auth: Auth browser token APIs are disabled in bff-only mode. Use BffAuth with host-only HttpOnly cookies.",
      );
    }
    Auth.instance = new Auth(config);
    Auth.initialized = true;
  }

  /**
   * Returns the singleton Auth instance.
   * @returns {Auth} The Auth instance.
   * @throws If Auth is not initialized.
   */
  static getInstance(): Auth {
    if (!Auth.initialized || !Auth.instance) {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
    return Auth.instance;
  }

  /** Resets the Auth singleton so it can be re-initialized (for tests/reconfiguration). */
  static reset() {
    Auth.instance = null;
    Auth.initialized = false;
  }

  private get authConfig() {
    return this.config;
  }

  /** Drops all in-memory state; token changes must also drop the cached user, since permissions/org membership belong to the token subject that populated it. */
  private clearSessionCache() {
    this.cachedToken = null;
    this.cachedUser = null;
    this.tokenTimestamp = null;
    this.userTimestamp = null;
  }

  /** Removes only the access token, retaining the refresh token for a single refresh attempt. */
  private async clearAccessToken() {
    this.clearSessionCache();
    if (this.authConfig.NATIVE_PLATFORM) {
      await AsyncStorage.removeItem("token");
    } else {
      Cookies.remove("token", {
        domain: this.authConfig.COOKIE_DOMAIN,
        secure: this.authConfig.COOKIE_SECURE,
        sameSite: "None",
      });
    }
  }

  /** Best-effort server revocation; local invalidation never depends on it. */
  private async revokeServerSession(
    accessToken: string | null,
    refreshToken: string | null,
  ) {
    if (
      !this.authConfig.LOGOUT_ENDPOINT ||
      (!accessToken && !refreshToken)
    ) {
      return;
    }
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      await fetch(
        `${this.authConfig.AUTH_BASE_URL}${this.authConfig.LOGOUT_ENDPOINT}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(refreshToken ? { refresh: refreshToken } : {}),
        },
      );
    } catch (error: unknown) {
      console.error("envoy-ts-auth-logout revoke error: ", error);
    }
  }

  /**
   * Returns all cookies as an object. Not available on native platforms.
   * @returns Object of cookie key-value pairs or message if unavailable.
   */
  allCookies() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    if (this.authConfig.NATIVE_PLATFORM) {
      return { message: "Unavailable" };
    }
    const cookies: Record<string, string> = {};
    document.cookie.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (!key) return;
      try {
        cookies[decodeURIComponent(key)] = decodeURIComponent(value);
      } catch (e) {
        console.warn(`Failed to decode cookie ${key}=${value}`, e);
      }
    });
    return cookies;
  }

  /**
   * Checks whether a given key is present in the storage (cookie or AsyncStorage).
   * @param key - The key to check for presence.
   * @returns A promise that resolves to `true` if the key is present, otherwise `false`.
   * @throws {Error} If the Auth config is unavailable.
   */
  async isKeyPresent(key: string) {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    if (this.authConfig.NATIVE_PLATFORM) {
      try {
        const data = await AsyncStorage.getItem(key);
        return !!data;
      } catch (error) {
        console.error("Error checking key in AsyncStorage:", error);
        return false;
      }
    } else {
      const cookies = document.cookie.split(";").map((c) => c.trim());
      return cookies.some((c) => c.startsWith(`${key}=`));
    }
  }

  /**
   * Gets the value for a key from storage (cookie or AsyncStorage).
   * @param key The key to retrieve.
   * @returns The value or null if not found.
   * @throws {Error} If the Auth config is unavailable.
   */
  async getKeyValue(key: string) {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    if (this.authConfig.NATIVE_PLATFORM) {
      const data = await AsyncStorage.getItem(key);
      return data === undefined ? null : String(data);
    } else {
      return Cookies.get(key) || null;
    }
  }

  /**
   * Sets a key-value pair in storage (cookie or AsyncStorage).
   * @param data The key, value, and optional maxAge.
   * @throws {Error} If the Auth config is unavailable.
   */
  async setKeyValue(data: KeyVal) {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    if (this.authConfig.NATIVE_PLATFORM) {
      await AsyncStorage.setItem(data.key, data.value);
    } else {
      Cookies.set(data.key, data.value, {
        domain: this.authConfig.COOKIE_DOMAIN,
        secure: this.authConfig.COOKIE_SECURE,
        sameSite: "None",
        expires: data.maxAge ? Number(data.maxAge) / (60 * 60 * 24) : undefined,
      });
    }
  }

  /**
   * Clears authentication cookies or AsyncStorage tokens.
   * @throws {Error} If the Auth config is unavailable.
   */
  async clearCookies() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    this.clearSessionCache();
    if (this.authConfig.NATIVE_PLATFORM) {
      await AsyncStorage.multiRemove(["token", "refresh"]);
    } else {
      Cookies.remove("token", {
        domain: this.authConfig.COOKIE_DOMAIN,
        secure: this.authConfig.COOKIE_SECURE,
        sameSite: "None",
      });
      Cookies.remove("refresh", {
        domain: this.authConfig.COOKIE_DOMAIN,
        secure: this.authConfig.COOKIE_SECURE,
        sameSite: "None",
      });
    }
  }

  /**
   * Redirects the user to the login page or calls ON_LOGOUT callback.
   * @throws {Error} If the Auth config is unavailable.
   */
  redirectToLoginPage() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    if (this.authConfig.ON_LOGOUT instanceof Function) {
      return this.authConfig.ON_LOGOUT();
    }
    if (!this.authConfig.NATIVE_PLATFORM && this.authConfig.LOGIN_PAGE_URL) {
      const loginUrl = new URL(this.authConfig.LOGIN_PAGE_URL);
      const redirectUrl = getValidatedRedirectUrl(
        location.href,
        this.authConfig,
      );

      if (
        redirectUrl &&
        normalizeHostname(location.hostname) ===
          normalizeHostname(this.authConfig.CURRENT_APP_DOMAIN)
      ) {
        loginUrl.searchParams.set(REDIRECT_DESTINATION_URL, redirectUrl);
      }

      location.href = loginUrl.toString();
    }
  }

  /**
   * Redirects the user to the source page or calls ON_LOGIN callback.
   * @throws {Error} If the Auth config is unavailable.
   */
  redirectToSourcePage() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    if (this.authConfig.ON_LOGIN instanceof Function) {
      return this.authConfig.ON_LOGIN();
    }
    const searchParams = new URLSearchParams(location.search);
    const sourceUrl =
      getValidatedRedirectUrl(
        searchParams.get(REDIRECT_DESTINATION_URL),
        this.authConfig,
      ) ?? this.authConfig.LAUNCHPAD_PAGE_URL;
    if (!this.authConfig.NATIVE_PLATFORM && sourceUrl)
      location.replace(sourceUrl);
  }

  /**
   * Gets the current user from the API or cache; only a 401 triggers the login redirect, other failures (403/429/5xx) resolve to `null`.
   * @returns The user object or null if not found.
   * @throws {Error} If the Auth config is unavailable.
   */
  async getUser() {
    const currentTime = Date.now();
    let tokenForRequest: string | null = null;
    if (
      this.cachedUser &&
      this.userTimestamp &&
      currentTime - this.userTimestamp < Auth.CACHE_DURATION
    ) {
      // Confirm cache still belongs to this session before returning it.
      tokenForRequest = await this.getToken();
      if (tokenForRequest && this.cachedUser) {
        return this.cachedUser;
      }
      if (!tokenForRequest) return null;
    }
    if (!this.authConfig) throw AuthConfigUnavailableError();
    try {
      const token = tokenForRequest ?? (await this.getToken());
      if (!token) {
        return null;
      }
      const response = await fetchIdempotentWithRetry(
        `${this.authConfig.AUTH_BASE_URL}/auth/me/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response) {
        if (response.ok) {
          const data = await response.json();
          this.userTimestamp = Date.now();
          this.cachedUser = data;
          return data;
        } else if (isSessionError(response.status)) {
          await this.clearCookies();
          this.redirectToLoginPage();
        } else {
          // Not a session error (403/429/5xx): let caller render its own UI.
          return null;
        }
      }
    } catch (error: unknown) {
      const err = error as ErrorHandler;
      console.error("envoy-ts-auth-getUser error: ", err);
    }
  }

  /**
   * Gets the permissions for the current user.
   * @returns Array of permissions or empty array.
   * @throws {Error} If the Auth config is unavailable.
   */
  async getPermissions() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    try {
      const user = await this.getUser();
      if (user) {
        // Union `permissions` + `groups_detailed`, normalize, dedupe codenames.
        const topLevel: string[] = Array.isArray(user.permissions) ? user.permissions : [];
        const groupPermissions: string[] = user?.groups_detailed
          ? Object.values(user.groups_detailed)
              .map((entry: any) => entry?.permissions ?? [])
              .flat()
          : [];
        const normalized = [...topLevel, ...groupPermissions].map(
          (permission) => String(permission).split(".").pop() as string,
        );
        return Array.from(new Set(normalized));
      }
    } catch (error: unknown) {
      const err = error as ErrorHandler;
      console.error("Unable to get permissions: ", err);
    }
  }

  /**
   * Whether the current user holds the given permission codename.
   * @param codename Canonical bare permission codename (e.g. "gateway-config-apply").
   */
  async hasPermission(codename: string): Promise<boolean> {
    const permissions = (await this.getPermissions()) ?? [];
    return permissions.includes(codename);
  }

  /**
   * Whether the current user holds ANY of the given permission codenames.
   */
  async hasAnyPermission(codenames: readonly string[]): Promise<boolean> {
    const permissions = new Set((await this.getPermissions()) ?? []);
    return codenames.some((codename) => permissions.has(codename));
  }

  /**
   * Whether the current user holds ALL of the given permission codenames.
   */
  async hasAllPermissions(codenames: readonly string[]): Promise<boolean> {
    const permissions = new Set((await this.getPermissions()) ?? []);
    return codenames.every((codename) => permissions.has(codename));
  }

  /**
   * Gets the groups for the current user.
   * @returns Array of group names or empty array.
   * @throws {Error} If the Auth config is unavailable.
   */
  async getGroups() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    try {
      const user = await this.getUser();
      if (user) {
        const groups: string[] = user?.groups_detailed
          ? Object.keys(user?.groups_detailed)
          : [];
        return groups;
      }
    } catch (error: unknown) {
      const err = error as ErrorHandler;
      console.error("Unable to get groups: ", err);
    }
  }

  /**
   * Gets the current access token from storage or API.
   * @returns The access token string or null.
   * @throws {Error} If the Auth config is unavailable.
   */
  async getToken() {
    const currentTime = Date.now();
    if (
      this.cachedToken &&
      this.tokenTimestamp &&
      currentTime - this.tokenTimestamp < Auth.CACHE_DURATION
    ) {
      // Cookies can change in another tab; never let cache outlive that.
      const storedToken = await this.getKeyValue("token");
      if (storedToken === this.cachedToken) {
        return this.cachedToken;
      }
      this.clearSessionCache();
    }
    if (!this.authConfig) throw AuthConfigUnavailableError();
    const isPresent = await this.isKeyPresent("token");
    if (isPresent) {
      const token = await this.getKeyValue("token");
      let response: Response | null = null;
      try {
        response = await fetch(
          `${this.authConfig.AUTH_BASE_URL}${this.authConfig.VERIFY_ENDPOINT}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ token }),
          },
        );
      } catch (error: unknown) {
        const err = error as ErrorHandler;
        console.error("envoy-ts-auth-getToken verify error: ", err);
      }
      if (response?.status === 200) {
        this.cachedToken = token;
        this.tokenTimestamp = Date.now();
        return token;
      }
      if (response?.status === 403) {
        await this.clearCookies();
        this.redirectToLoginPage();
        return null;
      }
    }
    const revivedToken = await this.reviveToken();
    return typeof revivedToken === "string" ? revivedToken : null;
  }

  /**
   * Attempts to revive the access token using the refresh token.
   * @returns The new access token or error status/message.
   * @throws {Error} If the Auth config is unavailable.
   */
  async reviveToken() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    const isRefreshTokenPresent = await this.isKeyPresent("refresh");
    if (!isRefreshTokenPresent) {
      await this.clearCookies();
      return {
        status: "failed",
        message: "Refresh token cookie, not found. Please log in",
      };
    } else {
      const refreshToken = await this.getKeyValue("refresh");
      if (!refreshToken) {
        await this.clearCookies();
        return {
          status: "failed",
          message: "Invalid refresh token",
        };
      }
      try {
        // Token is untrusted; clear it before the call so it can't be reused.
        await this.clearAccessToken();
        const response = await fetch(
          `${this.authConfig.AUTH_BASE_URL}${this.authConfig.REFRESH_ENDPOINT}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken}`,
            },
            body: JSON.stringify({ refresh: refreshToken }),
          },
        );
        if (response) {
          if (!this.authConfig) throw AuthConfigUnavailableError();
          if (response.ok) {
            const data = await response.json();
            if (data && data.access) {
              await this.setKeyValue({
                key: "token",
                value: data.access,
                maxAge: this.authConfig.COOKIE_TOKEN_TTL || "300",
              });
              if (data.refresh) {
                await this.setKeyValue({
                  key: "refresh",
                  value: data.refresh,
                  maxAge: this.authConfig.COOKIE_REFRESH_TTL,
                });
              }
              this.cachedToken = data.access;
              this.tokenTimestamp = Date.now();
              return data.access;
            } else {
              await this.clearCookies();
              this.redirectToLoginPage();
              return { status: "failed", message: "Invalid refresh response" };
            }
          }
          if (response.status === 401) {
            await this.clearCookies();
            this.redirectToLoginPage();
            return { status: response.status };
          }
          if (response?.status === 403) {
            await this.clearCookies();
            this.redirectToLoginPage();
            return { status: response?.status };
          }
          if (response.status === 404) {
            await this.clearCookies();
            return {
              status: response?.status,
              message: "Cookie not found, please log in",
            };
          }
          await this.clearCookies();
          return { status: response.status };
        }
      } catch (error: unknown) {
        const err = error as ErrorHandler;
        console.error("envoy-ts-auth-reviveToken error: ", err);
        await this.clearCookies();
        return { status: "failed", message: "Unable to refresh session" };
      }
    }
  }

  /**
   * Verifies the current access token, revives if needed.
   * @returns Status object indicating result.
   * @throws {Error} If the Auth config is unavailable.
   */
  async verifyToken() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    const isRefreshTokenPresent = await this.isKeyPresent("refresh");
    if (!isRefreshTokenPresent) {
      await this.clearCookies();
      return {
        status: "failed",
        message: "Refresh token cookie, not found. Please log in",
      };
    } else {
      const isTokenPresent = await this.isKeyPresent("token");
      if (!isTokenPresent) {
        const response = await this.reviveToken();
        if (typeof response === "string") return { status: "ok" };
        else
          return {
            status: "failed",
            message: "Access token cookie, not found. Please log in",
          };
      } else {
        const token = await this.getKeyValue("token");
        if (!token) {
          await this.clearCookies();
          return {
            status: "failed",
            message: "Access token cookie not found. Please log in",
          };
        }
        try {
          const response = await fetch(
            `${this.authConfig.AUTH_BASE_URL}${this.authConfig.VERIFY_ENDPOINT}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ token }),
            },
          );
          if (response.ok) {
            this.cachedToken = token;
            this.tokenTimestamp = Date.now();
            return { status: "ok" };
          }
          if (response?.status === 401) {
            const revivedToken = await this.reviveToken();
            return typeof revivedToken === "string"
              ? { status: "ok" }
              : { status: response.status };
          }
          if (response?.status === 403) {
            await this.clearCookies();
            this.redirectToLoginPage();
            return { status: response?.status };
          }
          if (response?.status === 404) {
            await this.clearCookies();
            return { status: response?.status };
          }
          await this.clearCookies();
          return { status: response.status };
        } catch (error: unknown) {
          const err = error as ErrorHandler;
          console.error("envoy-ts-auth-verifyToken error: ", err);
          await this.clearCookies();
          return { status: "failed" };
        }
      }
    }
  }

  /**
   * Logs out the user: clears local storage, best-effort revokes the server session, then redirects to login.
   * @throws {Error} If the Auth config is unavailable.
   */
  async logout() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    try {
      accessToken = await this.getKeyValue("token");
      refreshToken = await this.getKeyValue("refresh");
    } catch (error: unknown) {
      console.error("envoy-ts-auth-logout storage error: ", error);
    }
    // Clear local creds first; a slow auth service can't stay logged in.
    await this.clearCookies();
    await this.revokeServerSession(accessToken, refreshToken);
    this.redirectToLoginPage();
  }

  /**
   * Logs in the user with username and password.
   * @param username The username.
   * @param password The password.
   * @returns True if login successful, false otherwise.
   * @throws {Error} If the Auth config is unavailable.
   */
  async login(username: string, password: string) {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    try {
      const response = await fetch(
        `${this.authConfig.AUTH_BASE_URL}${this.authConfig.TOKEN_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        },
      );
      if (response) {
        if (!this.authConfig) throw AuthConfigUnavailableError();
        if (response.status === 200) {
          const data = await response.json();
          if (data.refresh === undefined) {
            await this.clearCookies();
            return false;
          }
          if (data && data.access) {
            // Login can change accounts; drop old subject's caches first.
            const previousAccessToken = await this.getKeyValue("token");
            const previousRefreshToken = await this.getKeyValue("refresh");
            await this.clearCookies();
            await this.revokeServerSession(
              previousAccessToken,
              previousRefreshToken,
            );
            await this.setKeyValue({
              key: "token",
              value: data.access,
              maxAge: this.authConfig.COOKIE_TOKEN_TTL,
            });
            await this.setKeyValue({
              key: "refresh",
              value: data.refresh,
              maxAge: this.authConfig.COOKIE_REFRESH_TTL,
            });
            this.cachedToken = data.access;
            this.tokenTimestamp = Date.now();
            this.redirectToSourcePage();
            return true;
          } else return false;
        }
      }
    } catch (error: unknown) {
      const err = error as ErrorHandler;
      console.error("envoy-ts-auth-login error: ", err);
      await this.clearCookies();
      return false;
    }
  }

  /**
   * Checks if logged in; on web, a valid token also triggers a redirect to `continue` or `LAUNCHPAD_PAGE_URL` (side-effect, for login/guard pages).
   * @returns True if logged in, false otherwise.
   * @throws {Error} If unable to check login status.
   */
  async isLoggedIn() {
    try {
      const token = await this.getToken();
      if (token) {
        if (!this.authConfig) throw AuthConfigUnavailableError();
        const searchParams = new URLSearchParams(location.search);
        const sourceUrl =
          getValidatedRedirectUrl(
            searchParams.get(REDIRECT_DESTINATION_URL),
            this.authConfig,
          ) ?? this.authConfig.LAUNCHPAD_PAGE_URL;
        if (!this.authConfig.NATIVE_PLATFORM && sourceUrl)
          location.replace(sourceUrl);
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(ERROR_MESSAGES.UNABLE_TO_CHECK_LOGIN_STATUS);
    }
  }
}

export { Auth };

/**
 * Whether an HTTP status from a business API call signals a broken session — only 401 qualifies, not 403 (permission-denied, still authenticated).
 * @param status HTTP status code from a business API response.
 * @category Auth
 */
export function isSessionError(status: number): boolean {
  return status === 401;
}

// Canonical permission catalog, generated from user-management.
export {
  PERMISSIONS,
  PERMISSION_SET,
  PERMISSIONS_BY_MODULE,
  type Permission,
} from "./permissions.generated";

export {
  LocaleRuntime,
  createAsyncStorageLocaleStorage,
  createBrowserLocaleStorage,
  type AsyncStorageLike,
  type BrowserStorageLike,
  type EffectiveLocale,
  type LocaleCacheEnvelope,
  type LocaleIdentity,
  type LocaleRefreshResult,
  type LocaleRuntimeConfig,
  type LocaleStorage,
  type LocaleTranslations,
} from "./locale";

function AuthConfigUnavailableError() {
  return new Error(ERROR_MESSAGES.CONFIG_UNAVAILABLE);
}

/** Validates required AuthConfig fields and BASE_DOMAIN/CURRENT_APP_DOMAIN format; throws if invalid. */
function validateAuthConfig(config: AuthConfig) {
  const requiredProperties = [
    "COOKIE_TOKEN_TTL",
    "COOKIE_REFRESH_TTL",
    "COOKIE_SECURE",
    "COOKIE_DOMAIN",
    "BASE_DOMAIN",
    "CURRENT_APP_DOMAIN",
    "LOGIN_PAGE_URL",
    "AUTH_BASE_URL",
    "LAUNCHPAD_PAGE_URL",
    "REFRESH_ENDPOINT",
    "VERIFY_ENDPOINT",
    "TOKEN_ENDPOINT",
  ];
  const missingProperties: string[] = requiredProperties.filter(
    (prop) => !config.hasOwnProperty(prop),
  );
  if (missingProperties.length > 0) {
    throw new Error(
      `${ERROR_MESSAGES.MISSING_PROPERTIES}: ${missingProperties.join(", ")}`,
    );
  }

  if (
    config.BROWSER_SESSION_MODE !== undefined &&
    config.BROWSER_SESSION_MODE !== "legacy-shared-cookie" &&
    config.BROWSER_SESSION_MODE !== "bff-only"
  ) {
    throw new Error(
      "envoy-ts-auth: BROWSER_SESSION_MODE must be legacy-shared-cookie or bff-only.",
    );
  }

  const baseDomain = normalizeHostname(config.BASE_DOMAIN);
  const currentAppDomain = normalizeHostname(config.CURRENT_APP_DOMAIN);

  if (!baseDomain) {
    throw new Error("envoy-ts-auth: BASE_DOMAIN must be a valid hostname.");
  }

  if (
    currentAppDomain !== baseDomain &&
    !isSingleLevelSubdomain(currentAppDomain, baseDomain)
  ) {
    throw new Error(
      "envoy-ts-auth: CURRENT_APP_DOMAIN must match BASE_DOMAIN or be a single-level subdomain of it.",
    );
  }
}

function getValidatedRedirectUrl(
  candidateUrl: string | null,
  config: AuthConfig,
): string | null {
  if (!candidateUrl) return null;

  try {
    const parsedUrl = new URL(candidateUrl);
    const hostname = normalizeHostname(parsedUrl.hostname);
    const baseDomain = normalizeHostname(config.BASE_DOMAIN);

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.username ||
      parsedUrl.password ||
      !isAllowedRedirectHostname(hostname, baseDomain)
    ) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

function isAllowedRedirectHostname(hostname: string, baseDomain: string) {
  return (
    hostname === baseDomain || isSingleLevelSubdomain(hostname, baseDomain)
  );
}

function isSingleLevelSubdomain(hostname: string, baseDomain: string) {
  if (!hostname.endsWith(`.${baseDomain}`)) {
    return false;
  }

  const subdomain = hostname.slice(0, -(baseDomain.length + 1));
  return Boolean(subdomain) && !subdomain.includes(".");
}

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/^\.+/, "").replace(/\.+$/, "");
}
