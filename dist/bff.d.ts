/** Browser authentication through a same-origin backend-for-frontend (BFF). */
export type BffAuthConfig = {
    /** Same-origin BFF base path, for example `/bff`. */
    baseUrl: string;
    loginEndpoint?: string;
    sessionEndpoint?: string;
    userEndpoint?: string;
    logoutEndpoint?: string;
    /** Supplies the synchronizer token sent on unsafe requests. */
    getCsrfToken: () => string | Promise<string>;
};
export declare class BffAuth {
    private readonly config;
    constructor(config: BffAuthConfig);
    private assertSameOrigin;
    private endpoint;
    request(input: string, init?: RequestInit): Promise<Response>;
    login(username: string, password: string): Promise<boolean>;
    verifySession(): Promise<boolean>;
    getUser<T = Record<string, unknown>>(): Promise<T | null>;
    logout(): Promise<void>;
}
