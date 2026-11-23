import { json, fail } from "../../../lib/core.js";

export async function onRequestPost({ request, env }) {
  const { ids } = await request.json().catch(() => ({}));
  if (!Array.isArray(ids) || !ids.length || ids.length > 500) return fail("ترتيب غير صحيح.");
  const stmt = env.DB.prepare("UPDATE works SET sort = ? WHERE id = ?");
  await env.DB.batch(ids.map((id, i) => stmt.bind((i + 1) * 10, String(id))));
  return json({ ok: true });
}
