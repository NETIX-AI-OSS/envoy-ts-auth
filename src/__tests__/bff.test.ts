import { beforeEach, describe, expect, it, vi } from "vitest";

import { BffAuth } from "../bff";

describe("BffAuth", () => {
  beforeEach(() => {
    vi.stubGlobal("location", new URL("https://app.example.com/dashboard"));
    vi.stubGlobal("fetch", vi.fn());
  });

  it("rejects cross-origin BFF endpoints", () => {
    expect(
      () => new BffAuth({ baseUrl: "https://auth.example.com", getCsrfToken: () => "csrf" }),
    ).toThrow("same-origin");
  });

  it("sends same-origin credentials and CSRF without exposing a token", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    const auth = new BffAuth({ baseUrl: "/bff", getCsrfToken: () => "csrf-token" });

    await auth.logout();

    expect(fetch).toHaveBeenCalledWith(
      new URL("https://app.example.com/bff/logout"),
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        headers: expect.any(Headers),
      }),
    );
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("X-CSRFToken")).toBe("csrf-token");
    expect("getToken" in auth).toBe(false);
  });

  it("loads the current user through the BFF session", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 7 }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const auth = new BffAuth({ baseUrl: "/bff", getCsrfToken: () => "csrf" });

    await expect(auth.getUser()).resolves.toEqual({ id: 7 });
  });
});
