"use client";

import Cookies from "js-cookie";

/**
 * Custom fetch wrapper that automatically includes authentication headers
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const userId = Cookies.get("user_id");
  const token = Cookies.get("token");
  const orgId = Cookies.get("organization_id");
  const email = Cookies.get("email"); // You'll need to store email in cookie too

  const headers = new Headers(options.headers);
  
  if (userId) headers.set("x-user-id", userId);
  if (token) headers.set("x-token", token);
  if (orgId) headers.set("x-org-id", orgId);
  if (email) headers.set("x-email", email);

  return fetch(url, {
    ...options,
    headers,
  });
}
