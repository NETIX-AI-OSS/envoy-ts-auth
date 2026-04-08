/**
 * The query parameter key used for redirecting after authentication.
 * @category Constants
 */
export declare const REDIRECT_DESTINATION_URL = "continue";
/**
 * Error messages used throughout the authentication library.
 * @category Constants
 * @property {string} NOT_INITIALIZED - Thrown if the package is not initialized.
 * @property {string} ALREADY_INITIALIZED - Thrown if the package is initialized more than once.
 * @property {string} MISSING_PROPERTIES - Thrown if required config properties are missing.
 * @property {string} CONFIG_UNAVAILABLE - Thrown if the config is unavailable.
 * @property {string} UNABLE_TO_CHECK_LOGIN_STATUS - Thrown if login status cannot be checked.
 */
export declare const ERROR_MESSAGES: {
    /** Thrown if the package is not initialized. */
    NOT_INITIALIZED: string;
    /** Thrown if the package is initialized more than once. */
    ALREADY_INITIALIZED: string;
    /** Thrown if required config properties are missing. */
    MISSING_PROPERTIES: string;
    /** Thrown if the config is unavailable. */
    CONFIG_UNAVAILABLE: string;
    /** Thrown if login status cannot be checked. */
    UNABLE_TO_CHECK_LOGIN_STATUS: string;
};
