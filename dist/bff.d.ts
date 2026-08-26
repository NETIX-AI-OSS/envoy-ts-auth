/** Browser authentication through a same-origin backend-for-frontend (BFF). */
export type BffAuthConfig = {
    /** Same-origin BFF base path, for example `/bff`. */
    baseUrl: string;
    /** Password login endpoint retained for applications that still expose it. */
    loginEndpoint?: string;
    /** Starts OAuth authorization-code login. The BFF, not JavaScript, owns PKCE and state. */
    authorizationEndpoint?: string;
    /** OAuth redirect URI handled by the BFF. Exposed for client/deployment configuration only. */
    callbackEndpoint?: string;
    sessionEndpoint?: string;
    userEndpoint?: string;
    logoutEndpoint?: string;
    /** Supplies the synchronizer token sent on unsafe requests. */
    getCsrfToken: () => string | Promise<string>;
    /** Injectable navigation hook for routers and tests. Defaults to `location.assign`. */
    navigate?: (url: string) => void;
};
export type BffSession<T> = {
    authenticated: true;
    user: T;
} | {
    authenticated: false;
    user: null;
};
export declare class BffAuth {
    private readonly config;
    constructor(config: BffAuthConfig);
    private browserOrigin;
    private assertSameOrigin;
    private endpoint;
    private safeReturnTo;
    request(input: string | URL, init?: RequestInit): Promise<Response>;
    /**
     * Builds the same-origin entry point for authorization-code login. The BFF
     * must generate and retain state and the PKCE verifier before it
     * redirects to the identity provider. No OAuth secret is stored in the browser.
     */
    getAuthorizationUrl(returnTo?: string): URL;
    /** Starts one-point login. An existing central IdP session avoids another password prompt. */
    startAuthorizationCodeLogin(returnTo?: string): void;
    /** The same-origin callback URL to register for this application at the identity provider. */
    getOAuthCallbackUrl(): URL;
    login(username: string, password: string): Promise<boolean>;
    verifySession(): Promise<boolean>;
    getUser<T = Record<string, unknown>>(): Promise<T | null>;
    /** Restores application state after the BFF callback has created its host-only session. */
    bootstrap<T = Record<string, unknown>>(): Promise<BffSession<T>>;
    logout(): Promise<void>;
}
