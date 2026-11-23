import { json, fail, cleanWork, publicWork, randomHex } from "../../../../lib/core.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM works ORDER BY sort ASC, created_at DESC").all();
  return json({ works: results.map(publicWork) });
}

export async function onRequestPost({ request, env }) {
  const { work, error } = cleanWork(await request.json().catch(() => ({})));
  if (error) return fail(error);
  const top = await env.DB.prepare("SELECT MIN(sort) AS s FROM works").first();
  const id = `w-${Date.now().toString(36)}-${randomHex(3)}`;
  const sort = (top?.s ?? 10) - 10; // new works appear first
  await env.DB.prepare(
    `INSERT INTO works (id, sort, kind, src, poster, dialects, type, title_ar, title_en, note_ar, note_en, dur, visible)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, sort, work.kind, work.src, work.poster, work.dialects.join(","), work.type,
    work.title_ar, work.title_en, work.note_ar, work.note_en, work.dur, work.visible).run();
  const row = await env.DB.prepare("SELECT * FROM works WHERE id = ?").bind(id).first();
  return json({ work: publicWork(row) }, 201);
}
