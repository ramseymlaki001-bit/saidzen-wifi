"use client";

/**
 * Kikao cha upande wa mteja — token inahifadhiwa sehemu 3
 * ili kivinjari kisizime kuki (iframe, Safari, Chrome).
 */

const STORAGE_KEY = "saidzen_session_token";

function readUrlToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("auth") || params.get("token");
    if (t && t.trim().length > 10) return t.trim();
  } catch {
    /* ignore */
  }
  return null;
}

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const fromUrl = readUrlToken();
    if (fromUrl) {
      persistToken(fromUrl);
      return fromUrl;
    }

    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim().length > 10) return local.trim();

    const session = sessionStorage.getItem(STORAGE_KEY);
    if (session && session.trim().length > 10) return session.trim();

    const match = document.cookie.match(
      new RegExp("(^|;\\s*)(session_token|saidzen_session_token)=([^;]+)")
    );
    if (match && match[3]) return decodeURIComponent(match[3]).trim();
  } catch {
    /* ignore */
  }

  return null;
}

function persistToken(token: string) {
  if (typeof window === "undefined" || !token) return;
  try {
    localStorage.setItem(STORAGE_KEY, token);
    sessionStorage.setItem(STORAGE_KEY, token);
    document.cookie = `session_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function setClientToken(token: string) {
  persistToken(token);
}

export function clearClientToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    document.cookie = "session_token=; path=/; max-age=0; SameSite=Lax";
  } catch {
    /* ignore */
  }
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

  if (token) {
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("x-session-token")) {
      headers.set("x-session-token", token);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}
