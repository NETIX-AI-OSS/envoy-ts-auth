/**
 * The query parameter key used for redirecting after authentication.
 * @category Constants
 */
export const REDIRECT_DESTINATION_URL = "continue";

/**
 * Error messages used throughout the authentication library.
 * @category Constants
 * @property {string} NOT_INITIALIZED - Thrown if the package is not initialized.
 * @property {string} ALREADY_INITIALIZED - Thrown if the package is initialized more than once.
 * @property {string} MISSING_PROPERTIES - Thrown if required config properties are missing.
 * @property {string} CONFIG_UNAVAILABLE - Thrown if the config is unavailable.
 * @property {string} UNABLE_TO_CHECK_LOGIN_STATUS - Thrown if login status cannot be checked.
 */
export const ERROR_MESSAGES = {
  /** Thrown if the package is not initialized. */
  NOT_INITIALIZED:
    "envoy-ts-auth: Authentication package is not initialized. Call Auth.initialize(...) before using Auth.getInstance().",
  /** Thrown if the package is initialized more than once. */
  ALREADY_INITIALIZED:
    "envoy-ts-auth: Authentication package is already initialized.",
  /** Thrown if required config properties are missing. */
  MISSING_PROPERTIES: "envoy-ts-auth: Configuration properties are missing",
  /** Thrown if the config is unavailable. */
  CONFIG_UNAVAILABLE:
    "envoy-ts-auth: Auth config not available. This should not happen if you have initialized authentication via Auth.initialize(...). Please contact the author in case you encounter this error.",
  /** Thrown if login status cannot be checked. */
  UNABLE_TO_CHECK_LOGIN_STATUS:
    "envoy-ts-auth: Unable to check login status. Please check your network connection or try again later.",
};
