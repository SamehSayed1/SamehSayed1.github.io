import { json, fail, cleanWork, publicWork, releaseMedia } from "../../../../lib/core.js";

export async function onRequestPut({ request, env, params }) {
  const old = await env.DB.prepare("SELECT * FROM works WHERE id = ?").bind(params.id).first();
  if (!old) return fail("العمل غير موجود.", 404);
  const { work, error } = cleanWork(await request.json().catch(() => ({})));
  if (error) return fail(error);
  await env.DB.prepare(
    `UPDATE works SET kind=?, src=?, poster=?, dialects=?, type=?, title_ar=?, title_en=?, note_ar=?, note_en=?, dur=?, visible=?
     WHERE id = ?`
  ).bind(work.kind, work.src, work.poster, work.dialects.join(","), work.type, work.title_ar, work.title_en,
    work.note_ar, work.note_en, work.dur, work.visible, params.id).run();
  // Files that were replaced are removed from storage.
  await releaseMedia(env, [old.src, old.poster].filter((u) => u !== work.src && u !== work.poster), params.id);
  const row = await env.DB.prepare("SELECT * FROM works WHERE id = ?").bind(params.id).first();
  return json({ work: publicWork(row) });
}

export async function onRequestDelete({ env, params }) {
  const old = await env.DB.prepare("SELECT * FROM works WHERE id = ?").bind(params.id).first();
  if (!old) return fail("العمل غير موجود.", 404);
  await env.DB.prepare("DELETE FROM works WHERE id = ?").bind(params.id).run();
  await releaseMedia(env, [old.src, old.poster], params.id);
  return json({ ok: true });
}
