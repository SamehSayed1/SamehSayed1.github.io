import { json, fail, checkPassword, setPassword, createSessionCookie } from "../../../lib/core.js";

export async function onRequestPost({ request, env }) {
  const { current, next } = await request.json().catch(() => ({}));
  if (typeof current !== "string" || !(await checkPassword(env.DB, current))) return fail("كلمة المرور الحالية غير صحيحة.", 401);
  if (typeof next !== "string" || next.length < 8) return fail("يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.");
  await setPassword(env.DB, next); // also signs out other devices
  return json({ ok: true }, 200, { "set-cookie": await createSessionCookie(env.DB) });
}
