"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BffAuth = void 0;
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
class BffAuth {
    constructor(config) {
        this.config = Object.assign({ loginEndpoint: "/login", authorizationEndpoint: "/oauth/authorize", callbackEndpoint: "/oauth/callback", sessionEndpoint: "/session", userEndpoint: "/me", logoutEndpoint: "/logout" }, config);
        this.assertSameOrigin(this.config.baseUrl);
    }
    browserOrigin() {
        var _a;
        const browserOrigin = (_a = globalThis.location) === null || _a === void 0 ? void 0 : _a.origin;
        if (!browserOrigin) {
            throw new Error("envoy-ts-auth: BffAuth requires a browser origin.");
        }
        return browserOrigin;
    }
    assertSameOrigin(input) {
        const browserOrigin = this.browserOrigin();
        const url = new URL(input, browserOrigin);
        if (url.origin !== browserOrigin) {
            throw new Error("envoy-ts-auth: BFF endpoints and return targets must be same-origin.");
        }
        return url;
    }
    endpoint(path) {
        const base = this.config.baseUrl.replace(/\/$/, "");
        const suffix = path.startsWith("/") ? path : `/${path}`;
        return this.assertSameOrigin(`${base}${suffix}`);
    }
    safeReturnTo(input) {
        const url = this.assertSameOrigin(input !== null && input !== void 0 ? input : globalThis.location.href);
        return `${url.pathname}${url.search}${url.hash}`;
    }
    request(input_1) {
        return __awaiter(this, arguments, void 0, function* (input, init = {}) {
            var _a;
            const url = this.assertSameOrigin(input.toString());
            const method = ((_a = init.method) !== null && _a !== void 0 ? _a : "GET").toUpperCase();
            const headers = new Headers(init.headers);
            if (UNSAFE_METHODS.has(method)) {
                headers.set("X-CSRFToken", yield this.config.getCsrfToken());
            }
            return fetch(url, Object.assign(Object.assign({}, init), { method, headers, credentials: "same-origin" }));
        });
    }
    /**
     * Builds the same-origin entry point for authorization-code login. The BFF
     * must generate and retain state and the PKCE verifier before it
     * redirects to the identity provider. No OAuth secret is stored in the browser.
     */
    getAuthorizationUrl(returnTo) {
        const url = this.endpoint(this.config.authorizationEndpoint);
        url.searchParams.set("return_to", this.safeReturnTo(returnTo));
        return url;
    }
    /** Starts one-point login. An existing central IdP session avoids another password prompt. */
    startAuthorizationCodeLogin(returnTo) {
        var _a;
        const target = this.getAuthorizationUrl(returnTo).toString();
        const navigate = (_a = this.config.navigate) !== null && _a !== void 0 ? _a : ((url) => globalThis.location.assign(url));
        navigate(target);
    }
    /** The same-origin callback URL to register for this application at the identity provider. */
    getOAuthCallbackUrl() {
        return this.endpoint(this.config.callbackEndpoint);
    }
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request(this.endpoint(this.config.loginEndpoint), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            return response.ok;
        });
    }
    verifySession() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request(this.endpoint(this.config.sessionEndpoint));
            return response.ok;
        });
    }
    getUser() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request(this.endpoint(this.config.userEndpoint));
            if (response.status === 401)
                return null;
            if (!response.ok)
                throw new Error(`BFF user request failed (${response.status}).`);
            return (yield response.json());
        });
    }
    /** Restores application state after the BFF callback has created its host-only session. */
    bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.verifySession()))
                return { authenticated: false, user: null };
            const user = yield this.getUser();
            return user === null
                ? { authenticated: false, user: null }
                : { authenticated: true, user };
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request(this.endpoint(this.config.logoutEndpoint), {
                method: "POST",
            });
            if (!response.ok && response.status !== 401) {
                throw new Error(`BFF logout failed (${response.status}).`);
            }
        });
    }
}
exports.BffAuth = BffAuth;
