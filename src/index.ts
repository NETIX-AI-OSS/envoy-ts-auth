import AsyncStorage from "@react-native-async-storage/async-storage";
import { ERROR_MESSAGES, REDIRECT_DESTINATION_URL } from "./conf/settings";
import Cookies = require("js-cookie");

/**
 * Represents a key-value pair for storage operations (cookie or AsyncStorage).
 *
 * Used by {@link Auth.setKeyValue}.
 *
 * @property key - The key to set in storage.
 * @property value - The value to store.
 * @property [maxAge] - Optional max age (in seconds) for the key (used for cookies).
 * @category Types
 */
export type KeyVal = { key: string; value: string; maxAge?: string };

/**
 * Error handler type for API responses.
 * @internal
 * @category Types
 */
/**
 * Represents the structure of an error object returned from an API response.
 *
 * @property response - The HTTP response containing error details.
 * @property response.status - The HTTP status code of the error response.
 * @property response.data - The data payload containing error messages.
 * @property response.data.messages - An array of error message strings describing the error(s).
 */
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
  /** Set to true if running on a native platform */
  NATIVE_PLATFORM?: boolean;
  /** Callback for login event */
  ON_LOGIN?: () => void;
  /** Callback for logout event */
  ON_LOGOUT?: () => void;
};

/**
 * Internal: Current authentication configuration.
 */

/**
 * Singleton class for authentication and authorization utilities.
 *
 * Provides methods for token management, user info, login/logout, and redirection.
 *
 * Usage:
 *   1. Call {@link Auth.initialize} once with your config.
 *   2. Use {@link Auth.getInstance} to access all methods.
 *
 * @example
 *   Auth.initialize(config);
 *   const auth = Auth.getInstance();
 *   const user = await auth.getUser();
 *
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
   * Initializes the Auth singleton with the given configuration.
   * Must be called before using any Auth methods.
   * @param config The authentication configuration object.
   * @throws If already initialized or config is invalid.
   */
  static initialize(config: AuthConfig) {
    if (Auth.initialized) {
      throw new Error(ERROR_MESSAGES.ALREADY_INITIALIZED);
    }
    validateAuthConfig(config);
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

  /**
   * Resets the Auth singleton, allowing re-initialization.
   * Intended for use in tests and environments that require reconfiguration.
   */
  static reset() {
    Auth.instance = null;
    Auth.initialized = false;
  }

  private get authConfig() {
    return this.config;
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
   * Gets the current user from the API or cache.
   * @returns The user object or null if not found.
   * @throws {Error} If the Auth config is unavailable.
   */
  async getUser() {
    const currentTime = Date.now();
    if (
      this.cachedUser &&
      this.userTimestamp &&
      currentTime - this.userTimestamp < Auth.CACHE_DURATION
    ) {
      return this.cachedUser;
    }
    if (!this.authConfig) throw AuthConfigUnavailableError();
    try {
      const response = await fetch(
        `${this.authConfig.AUTH_BASE_URL}/auth/me/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await this.getToken()}`,
          },
        },
      );
      if (response) {
        if (response.ok) {
          const data = await response.json();
          this.userTimestamp = Date.now();
          this.cachedUser = data;
          return data;
        } else {
          this.redirectToLoginPage();
        }
      }
    } catch (error: unknown) {
      const err = error as ErrorHandler;
      console.error("auth-getUser error: ", err);
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
        const permissions: string[] = user?.groups_detailed
          ? Object.values(user?.groups_detailed)
              .map((u: any) => u.permissions)
              .flat()
          : [];
        return permissions;
      }
    } catch (error: unknown) {
      const err = error as ErrorHandler;
      console.error("Unable to get permissions: ", err);
    }
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
      return this.cachedToken;
    }
    if (!this.authConfig) throw AuthConfigUnavailableError();
    const isPresent = await this.isKeyPresent("token");
    if (isPresent) {
      const token = await this.getKeyValue("token");
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
      if (response.status === 200) {
        this.cachedToken = token;
        this.tokenTimestamp = Date.now();
        return token;
      }
    }
    await this.reviveToken();
    const value = await this.getKeyValue("token");
    return value;
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
      return {
        status: "failed",
        message: "Refresh token cookie, not found. Please log in",
      };
    } else {
      const refreshToken = await this.getKeyValue("refresh");
      if (!refreshToken) {
        return {
          status: "failed",
          message: "Invalid refresh token",
        };
      }
      try {
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
              return data.access;
            } else {
              this.redirectToLoginPage();
            }
          }
          if (response.status === 401) {
            await this.logout();
            return;
          }
          if (response?.status === 403) {
            await this.clearCookies();
            this.redirectToLoginPage();
            return { status: response?.status };
          }
          if (response.status === 404) {
            return {
              status: response?.status,
              message: "Cookie not found, please log in",
            };
          }
        }
      } catch (error: unknown) {
        const err = error as ErrorHandler;
        console.error("auth-reviveToken error: ", err);
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
      return {
        status: "failed",
        message: "Refresh token cookie, not found. Please log in",
      };
    } else {
      const isTokenPresent = await this.isKeyPresent("token");
      if (!isTokenPresent) {
        const response = await this.reviveToken();
        if (response) return { status: "ok" };
        else
          return {
            status: "failed",
            message: "Access token cookie, not found. Please log in",
          };
      } else {
        const token = await this.getKeyValue("token");
        if (!token) {
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
            return { status: "ok" };
          }
          if (response?.status === 401) {
            await this.reviveToken();
            return { status: response?.status };
          }
          if (response?.status === 403) {
            await this.clearCookies();
            this.redirectToLoginPage();
            return { status: response?.status };
          }
          if (response?.status === 404) {
            return { status: response?.status };
          }
        } catch (error: unknown) {
          const err = error as ErrorHandler;
          console.error("auth-verifyToken error: ", err);
        }
      }
    }
  }

  /**
   * Logs out the user by clearing cookies/storage and redirecting to login.
   * @throws {Error} If the Auth config is unavailable.
   */
  async logout() {
    if (!this.authConfig) throw AuthConfigUnavailableError();
    await this.clearCookies();
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
          if (data.refresh === undefined) return false;
          if (data && data.access) {
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
            this.redirectToSourcePage();
            return true;
          } else return false;
        }
      }
    } catch (error: unknown) {
      const err = error as ErrorHandler;
      console.error("auth-login error: ", err);
    }
  }

  /**
   * Checks if the user is logged in (token present and valid).
   *
   * **Side-effect**: On web platforms, if a valid token is found, the user is
   * automatically redirected to the `continue` query-param URL or the configured
   * `LAUNCHPAD_PAGE_URL`. Designed for use on login/guard pages where an already-
   * authenticated user should be bounced away immediately.
   *
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

/**
 * Exports the Auth class for authentication utilities.
 * @category Auth
 */
export { Auth };

/**
 * Returns an error indicating the Auth config is unavailable.
 * @returns {Error}
 * @internal
 */
function AuthConfigUnavailableError() {
  return new Error(ERROR_MESSAGES.CONFIG_UNAVAILABLE);
}

/**
 * Validates the AuthConfig object for required properties.
 * @param config The AuthConfig object to validate.
 * @throws {Error} If any required property is missing.
 * @internal
 */
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

  const baseDomain = normalizeHostname(config.BASE_DOMAIN);
  const currentAppDomain = normalizeHostname(config.CURRENT_APP_DOMAIN);

  if (!baseDomain) {
    throw new Error("auth: BASE_DOMAIN must be a valid hostname.");
  }

  if (
    currentAppDomain !== baseDomain &&
    !isSingleLevelSubdomain(currentAppDomain, baseDomain)
  ) {
    throw new Error(
      "auth: CURRENT_APP_DOMAIN must match BASE_DOMAIN or be a single-level subdomain of it.",
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
