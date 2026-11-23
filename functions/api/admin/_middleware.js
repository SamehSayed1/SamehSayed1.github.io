// Every /api/admin/* call needs a valid session, except the login flow itself.
import { fail, isAuthed } from "../../../lib/core.js";

const OPEN = new Set(["/api/admin/session", "/api/admin/login", "/api/admin/setup", "/api/admin/logout"]);

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  // Mutating calls must come from our own admin page (blocks cross-site form posts).
  if (request.method !== "GET" && request.headers.get("x-admin") !== "1") return fail("طلب غير مسموح.", 403);
  if (OPEN.has(url.pathname)) return next();
  if (!(await isAuthed(request, env.DB))) return fail("يجب تسجيل الدخول.", 401);
  return next();
}
