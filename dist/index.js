"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const async_storage_1 = __importDefault(
  require("@react-native-async-storage/async-storage"),
);
const settings_1 = require("./conf/settings");
const Cookies = require("js-cookie");
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
  constructor(config) {
    this.cachedToken = null;
    this.cachedUser = null;
    this.tokenTimestamp = null;
    this.userTimestamp = null;
    this.config = config;
  }
  /**
   * Initializes the Auth singleton with the given configuration.
   * Must be called before using any Auth methods.
   * @param config The authentication configuration object.
   * @throws If already initialized or config is invalid.
   */
  static initialize(config) {
    if (Auth.initialized) {
      throw new Error(settings_1.ERROR_MESSAGES.ALREADY_INITIALIZED);
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
  static getInstance() {
    if (!Auth.initialized || !Auth.instance) {
      throw new Error(settings_1.ERROR_MESSAGES.NOT_INITIALIZED);
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
  get authConfig() {
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
    const cookies = {};
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
  isKeyPresent(key) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      if (this.authConfig.NATIVE_PLATFORM) {
        try {
          const data = yield async_storage_1.default.getItem(key);
          return !!data;
        } catch (error) {
          console.error("Error checking key in AsyncStorage:", error);
          return false;
        }
      } else {
        const cookies = document.cookie.split(";").map((c) => c.trim());
        return cookies.some((c) => c.startsWith(`${key}=`));
      }
    });
  }
  /**
   * Gets the value for a key from storage (cookie or AsyncStorage).
   * @param key The key to retrieve.
   * @returns The value or null if not found.
   * @throws {Error} If the Auth config is unavailable.
   */
  getKeyValue(key) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      if (this.authConfig.NATIVE_PLATFORM) {
        const data = yield async_storage_1.default.getItem(key);
        return data === undefined ? null : String(data);
      } else {
        return Cookies.get(key) || null;
      }
    });
  }
  /**
   * Sets a key-value pair in storage (cookie or AsyncStorage).
   * @param data The key, value, and optional maxAge.
   * @throws {Error} If the Auth config is unavailable.
   */
  setKeyValue(data) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      if (this.authConfig.NATIVE_PLATFORM) {
        yield async_storage_1.default.setItem(data.key, data.value);
      } else {
        Cookies.set(data.key, data.value, {
          domain: this.authConfig.COOKIE_DOMAIN,
          secure: this.authConfig.COOKIE_SECURE,
          sameSite: "None",
          expires: data.maxAge
            ? Number(data.maxAge) / (60 * 60 * 24)
            : undefined,
        });
      }
    });
  }
  /**
   * Clears authentication cookies or AsyncStorage tokens.
   * @throws {Error} If the Auth config is unavailable.
   */
  clearCookies() {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      if (this.authConfig.NATIVE_PLATFORM) {
        yield async_storage_1.default.multiRemove(["token", "refresh"]);
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
    });
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
        loginUrl.searchParams.set(
          settings_1.REDIRECT_DESTINATION_URL,
          redirectUrl,
        );
      }
      location.href = loginUrl.toString();
    }
  }
  /**
   * Redirects the user to the source page or calls ON_LOGIN callback.
   * @throws {Error} If the Auth config is unavailable.
   */
  redirectToSourcePage() {
    var _a;
    if (!this.authConfig) throw AuthConfigUnavailableError();
    if (this.authConfig.ON_LOGIN instanceof Function) {
      return this.authConfig.ON_LOGIN();
    }
    const searchParams = new URLSearchParams(location.search);
    const sourceUrl =
      (_a = getValidatedRedirectUrl(
        searchParams.get(settings_1.REDIRECT_DESTINATION_URL),
        this.authConfig,
      )) !== null && _a !== void 0
        ? _a
        : this.authConfig.LAUNCHPAD_PAGE_URL;
    if (!this.authConfig.NATIVE_PLATFORM && sourceUrl)
      location.replace(sourceUrl);
  }
  /**
   * Gets the current user from the API or cache.
   * @returns The user object or null if not found.
   * @throws {Error} If the Auth config is unavailable.
   */
  getUser() {
    return __awaiter(this, void 0, void 0, function* () {
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
        const response = yield fetch(
          `${this.authConfig.AUTH_BASE_URL}/auth/me/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${yield this.getToken()}`,
            },
          },
        );
        if (response) {
          if (response.ok) {
            const data = yield response.json();
            this.userTimestamp = Date.now();
            this.cachedUser = data;
            return data;
          } else {
            this.redirectToLoginPage();
          }
        }
      } catch (error) {
        const err = error;
        console.error("auth-getUser error: ", err);
      }
    });
  }
  /**
   * Gets the permissions for the current user.
   * @returns Array of permissions or empty array.
   * @throws {Error} If the Auth config is unavailable.
   */
  getPermissions() {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      try {
        const user = yield this.getUser();
        if (user) {
          const permissions = (
            user === null || user === void 0 ? void 0 : user.groups_detailed
          )
            ? Object.values(
                user === null || user === void 0
                  ? void 0
                  : user.groups_detailed,
              )
                .map((u) => u.permissions)
                .flat()
            : [];
          return permissions;
        }
      } catch (error) {
        const err = error;
        console.error("Unable to get permissions: ", err);
      }
    });
  }
  /**
   * Gets the groups for the current user.
   * @returns Array of group names or empty array.
   * @throws {Error} If the Auth config is unavailable.
   */
  getGroups() {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      try {
        const user = yield this.getUser();
        if (user) {
          const groups = (
            user === null || user === void 0 ? void 0 : user.groups_detailed
          )
            ? Object.keys(
                user === null || user === void 0
                  ? void 0
                  : user.groups_detailed,
              )
            : [];
          return groups;
        }
      } catch (error) {
        const err = error;
        console.error("Unable to get groups: ", err);
      }
    });
  }
  /**
   * Gets the current access token from storage or API.
   * @returns The access token string or null.
   * @throws {Error} If the Auth config is unavailable.
   */
  getToken() {
    return __awaiter(this, void 0, void 0, function* () {
      const currentTime = Date.now();
      if (
        this.cachedToken &&
        this.tokenTimestamp &&
        currentTime - this.tokenTimestamp < Auth.CACHE_DURATION
      ) {
        return this.cachedToken;
      }
      if (!this.authConfig) throw AuthConfigUnavailableError();
      const isPresent = yield this.isKeyPresent("token");
      if (isPresent) {
        const token = yield this.getKeyValue("token");
        const response = yield fetch(
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
      yield this.reviveToken();
      const value = yield this.getKeyValue("token");
      return value;
    });
  }
  /**
   * Attempts to revive the access token using the refresh token.
   * @returns The new access token or error status/message.
   * @throws {Error} If the Auth config is unavailable.
   */
  reviveToken() {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      const isRefreshTokenPresent = yield this.isKeyPresent("refresh");
      if (!isRefreshTokenPresent) {
        return {
          status: "failed",
          message: "Refresh token cookie, not found. Please log in",
        };
      } else {
        const refreshToken = yield this.getKeyValue("refresh");
        if (!refreshToken) {
          return {
            status: "failed",
            message: "Invalid refresh token",
          };
        }
        try {
          const response = yield fetch(
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
              const data = yield response.json();
              if (data && data.access) {
                yield this.setKeyValue({
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
              yield this.logout();
              return;
            }
            if (
              (response === null || response === void 0
                ? void 0
                : response.status) === 403
            ) {
              yield this.clearCookies();
              this.redirectToLoginPage();
              return {
                status:
                  response === null || response === void 0
                    ? void 0
                    : response.status,
              };
            }
            if (response.status === 404) {
              return {
                status:
                  response === null || response === void 0
                    ? void 0
                    : response.status,
                message: "Cookie not found, please log in",
              };
            }
          }
        } catch (error) {
          const err = error;
          console.error("auth-reviveToken error: ", err);
        }
      }
    });
  }
  /**
   * Verifies the current access token, revives if needed.
   * @returns Status object indicating result.
   * @throws {Error} If the Auth config is unavailable.
   */
  verifyToken() {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      const isRefreshTokenPresent = yield this.isKeyPresent("refresh");
      if (!isRefreshTokenPresent) {
        return {
          status: "failed",
          message: "Refresh token cookie, not found. Please log in",
        };
      } else {
        const isTokenPresent = yield this.isKeyPresent("token");
        if (!isTokenPresent) {
          const response = yield this.reviveToken();
          if (response) return { status: "ok" };
          else
            return {
              status: "failed",
              message: "Access token cookie, not found. Please log in",
            };
        } else {
          const token = yield this.getKeyValue("token");
          if (!token) {
            return {
              status: "failed",
              message: "Access token cookie not found. Please log in",
            };
          }
          try {
            const response = yield fetch(
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
            if (
              (response === null || response === void 0
                ? void 0
                : response.status) === 401
            ) {
              yield this.reviveToken();
              return {
                status:
                  response === null || response === void 0
                    ? void 0
                    : response.status,
              };
            }
            if (
              (response === null || response === void 0
                ? void 0
                : response.status) === 403
            ) {
              yield this.clearCookies();
              this.redirectToLoginPage();
              return {
                status:
                  response === null || response === void 0
                    ? void 0
                    : response.status,
              };
            }
            if (
              (response === null || response === void 0
                ? void 0
                : response.status) === 404
            ) {
              return {
                status:
                  response === null || response === void 0
                    ? void 0
                    : response.status,
              };
            }
          } catch (error) {
            const err = error;
            console.error("auth-verifyToken error: ", err);
          }
        }
      }
    });
  }
  /**
   * Logs out the user by clearing cookies/storage and redirecting to login.
   * @throws {Error} If the Auth config is unavailable.
   */
  logout() {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      yield this.clearCookies();
      this.redirectToLoginPage();
    });
  }
  /**
   * Logs in the user with username and password.
   * @param username The username.
   * @param password The password.
   * @returns True if login successful, false otherwise.
   * @throws {Error} If the Auth config is unavailable.
   */
  login(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.authConfig) throw AuthConfigUnavailableError();
      try {
        const response = yield fetch(
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
            const data = yield response.json();
            if (data.refresh === undefined) return false;
            if (data && data.access) {
              yield this.setKeyValue({
                key: "token",
                value: data.access,
                maxAge: this.authConfig.COOKIE_TOKEN_TTL,
              });
              yield this.setKeyValue({
                key: "refresh",
                value: data.refresh,
                maxAge: this.authConfig.COOKIE_REFRESH_TTL,
              });
              this.redirectToSourcePage();
              return true;
            } else return false;
          }
        }
      } catch (error) {
        const err = error;
        console.error("auth-login error: ", err);
      }
    });
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
  isLoggedIn() {
    return __awaiter(this, void 0, void 0, function* () {
      var _a;
      try {
        const token = yield this.getToken();
        if (token) {
          if (!this.authConfig) throw AuthConfigUnavailableError();
          const searchParams = new URLSearchParams(location.search);
          const sourceUrl =
            (_a = searchParams.get(settings_1.REDIRECT_DESTINATION_URL)) !==
              null && _a !== void 0
              ? _a
              : this.authConfig.LAUNCHPAD_PAGE_URL;
          if (!this.authConfig.NATIVE_PLATFORM && sourceUrl)
            location.replace(sourceUrl);
          return true;
        }
        return false;
      } catch (error) {
        throw new Error(settings_1.ERROR_MESSAGES.UNABLE_TO_CHECK_LOGIN_STATUS);
      }
    });
  }
}
exports.Auth = Auth;
Auth.instance = null;
Auth.initialized = false;
Auth.CACHE_DURATION = 60 * 1000; // 1 minute
/**
 * Returns an error indicating the Auth config is unavailable.
 * @returns {Error}
 * @internal
 */
function AuthConfigUnavailableError() {
  return new Error(settings_1.ERROR_MESSAGES.CONFIG_UNAVAILABLE);
}
/**
 * Validates the AuthConfig object for required properties.
 * @param config The AuthConfig object to validate.
 * @throws {Error} If any required property is missing.
 * @internal
 */
function validateAuthConfig(config) {
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
  const missingProperties = requiredProperties.filter(
    (prop) => !config.hasOwnProperty(prop),
  );
  if (missingProperties.length > 0) {
    throw new Error(
      `${settings_1.ERROR_MESSAGES.MISSING_PROPERTIES}: ${missingProperties.join(", ")}`,
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
function getValidatedRedirectUrl(candidateUrl, config) {
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
  } catch (_a) {
    return null;
  }
}
function isAllowedRedirectHostname(hostname, baseDomain) {
  return (
    hostname === baseDomain || isSingleLevelSubdomain(hostname, baseDomain)
  );
}
function isSingleLevelSubdomain(hostname, baseDomain) {
  if (!hostname.endsWith(`.${baseDomain}`)) {
    return false;
  }
  const subdomain = hostname.slice(0, -(baseDomain.length + 1));
  return Boolean(subdomain) && !subdomain.includes(".");
}
function normalizeHostname(hostname) {
  return hostname.trim().toLowerCase().replace(/^\.+/, "").replace(/\.+$/, "");
}
