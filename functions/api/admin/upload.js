// Stores one uploaded file (sent as the raw request body) in KV.
import { json, fail, randomHex, MAX_UPLOAD } from "../../../lib/core.js";

const EXT = {
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav",
  "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/ogg": "ogg",
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};
const TOO_BIG = "حجم الملف أكبر من 25 ميجابايت. اضغط الملف أو استخدم رابط يوتيوب.";

export async function onRequestPost({ request, env }) {
  const type = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!EXT[type]) return fail("نوع الملف غير مدعوم. استخدم MP4 أو MP3 أو WAV أو صورة JPG/PNG.");
  if (Number(request.headers.get("content-length") || 0) > MAX_UPLOAD) return fail(TOO_BIG, 413);
  const body = await request.arrayBuffer();
  if (!body.byteLength) return fail("الملف فارغ.");
  if (body.byteLength > MAX_UPLOAD) return fail(TOO_BIG, 413);
  const key = `m/${Date.now().toString(36)}-${randomHex(6)}.${EXT[type]}`;
  await env.MEDIA.put(key, body, { metadata: { type, size: body.byteLength } });
  return json({ url: `/media/${key}`, size: body.byteLength }, 201);
}
