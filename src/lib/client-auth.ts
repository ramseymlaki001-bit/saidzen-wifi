"use client";

export function getClientToken(): string | null {
  return null;
}

export function setClientToken(_token: string) {}

export function clearClientToken() {
  // Session cookies are cleared by the server logout endpoint.
}

export const saveStoredToken = setClientToken;
export const removeStoredToken = clearClientToken;
export const getStoredToken = getClientToken;

export function stripAuthFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("auth") || url.searchParams.has("token")) {
      url.searchParams.delete("auth");
      url.searchParams.delete("token");
      const qs = url.searchParams.toString();
      window.history.replaceState({}, "", url.pathname + (qs ? `?${qs}` : "") + url.hash);
    }
  } catch {
    /* ignore */
  }
}

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getClientToken();
  const headers = new Headers(options.headers || {});

  void token;

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}
