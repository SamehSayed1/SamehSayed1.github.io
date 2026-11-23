// First visit only: the owner chooses the admin password.
import { json, fail, getSetting, setPassword, createSessionCookie } from "../../../lib/core.js";

export async function onRequestPost({ request, env }) {
  if (await getSetting(env.DB, "pw_hash")) return fail("تم إعداد كلمة المرور مسبقًا.", 409);
  const { password } = await request.json().catch(() => ({}));
  if (typeof password !== "string" || password.length < 8) return fail("يجب ألا تقل كلمة المرور عن 8 أحرف.");
  await setPassword(env.DB, password);
  return json({ ok: true }, 200, { "set-cookie": await createSessionCookie(env.DB) });
}
