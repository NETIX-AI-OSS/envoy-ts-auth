/** The query parameter key used for redirecting after authentication. */
export const REDIRECT_DESTINATION_URL = "continue";

/** Error messages used throughout the authentication library. */
export const ERROR_MESSAGES = {
  NOT_INITIALIZED:
    "envoy-ts-auth: Authentication package is not initialized. Call Auth.initialize(...) before using Auth.getInstance().",
  ALREADY_INITIALIZED:
    "envoy-ts-auth: Authentication package is already initialized.",
  MISSING_PROPERTIES: "envoy-ts-auth: Configuration properties are missing",
  CONFIG_UNAVAILABLE:
    "envoy-ts-auth: Auth config not available. This should not happen if you have initialized authentication via Auth.initialize(...). Please contact the author in case you encounter this error.",
  UNABLE_TO_CHECK_LOGIN_STATUS:
    "envoy-ts-auth: Unable to check login status. Please check your network connection or try again later.",
};
