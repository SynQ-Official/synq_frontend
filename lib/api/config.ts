/**
 * Where the SynQ Nest API lives. Every backend route is versioned under
 * `/api/v1` (see synq_backend/apps/api/BACKEND_API.md).
 *
 * Server code (Next route handlers) may use the private `API_SERVICE_URL`;
 * the browser only sees `NEXT_PUBLIC_API_URL`.
 */
export const API_BASE_URL = (
  process.env.API_SERVICE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const API_PREFIX = "/api/v1";

/** Absolute URL of a versioned backend route, e.g. apiUrl("/auth/login"). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}
