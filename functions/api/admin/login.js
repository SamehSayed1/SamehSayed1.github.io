import { json, fail, checkPassword, createSessionCookie, tooManyAttempts, recordFailure, clientIp } from "../../../lib/core.js";

export async function onRequestPost({ request, env }) {
  const ip = clientIp(request);
  if (await tooManyAttempts(env.DB, ip)) return fail("محاولات خاطئة كثيرة. حاول مرة أخرى بعد 15 دقيقة.", 429);
  const { password } = await request.json().catch(() => ({}));
  if (typeof password !== "string" || !(await checkPassword(env.DB, password))) {
    await recordFailure(env.DB, ip);
    return fail("كلمة المرور غير صحيحة.", 401);
  }
  return json({ ok: true }, 200, { "set-cookie": await createSessionCookie(env.DB) });
}
