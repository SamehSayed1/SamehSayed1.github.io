// Shared helpers for the Pages Functions (API + admin).

export const DIALECTS = ["eg", "fusha", "sa", "en"];
export const TYPES = ["ad", "app", "corp", "cartoon", "book", "ivr"];
export const KINDS = ["video", "audio", "youtube"];
export const MAX_UPLOAD = 25 * 1024 * 1024; // KV value limit
const COOKIE = "admin_session";
const SESSION_DAYS = 30;

const enc = new TextEncoder();

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
export const fail = (message, status = 400) => json({ error: message }, status);

const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
export const randomHex = (n = 16) =>
  [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

/* ---------- settings ---------- */
export async function getSetting(db, key) {
  const row = await db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return row ? row.value : null;
}
export async function setSetting(db, key, value) {
  await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, String(value)).run();
}

/* ---------- passwords (PBKDF2-SHA256) ---------- */
export async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return b64u(bits);
}
export async function setPassword(db, password) {
  const salt = randomHex(16);
  await setSetting(db, "pw_salt", salt);
  await setSetting(db, "pw_hash", await hashPassword(password, salt));
  // A new session version logs out every existing session.
  await setSetting(db, "session_ver", randomHex(8));
  if (!(await getSetting(db, "session_secret"))) await setSetting(db, "session_secret", randomHex(32));
}
export async function checkPassword(db, password) {
  const [salt, hash] = [await getSetting(db, "pw_salt"), await getSetting(db, "pw_hash")];
  if (!salt || !hash) return false;
  const got = await hashPassword(password, salt);
  if (got.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

/* ---------- sessions (HMAC-signed cookie) ---------- */
async function hmacKey(db) {
  const secret = await getSetting(db, "session_secret");
  if (!secret) return null;
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function createSessionCookie(db) {
  const key = await hmacKey(db);
  const ver = (await getSetting(db, "session_ver")) || "0";
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`admin.${ver}.${exp}`));
  const token = `${exp}.${b64u(sig)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`;
}
export const clearSessionCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function isAuthed(request, db) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [expStr, sig] = m[1].split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp < Date.now() / 1000) return false;
  const key = await hmacKey(db);
  if (!key) return false;
  const ver = (await getSetting(db, "session_ver")) || "0";
  try {
    return await crypto.subtle.verify("HMAC", key, fromB64u(sig), enc.encode(`admin.${ver}.${exp}`));
  } catch {
    return false;
  }
}

/* ---------- login throttling: max 8 failures / 15 min per IP ---------- */
export async function tooManyAttempts(db, ip) {
  const since = Math.floor(Date.now() / 1000) - 900;
  await db.prepare("DELETE FROM login_attempts WHERE at < ?").bind(since).run();
  const row = await db.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND at >= ?").bind(ip, since).first();
  return (row?.n || 0) >= 8;
}
export async function recordFailure(db, ip) {
  await db.prepare("INSERT INTO login_attempts (ip, at) VALUES (?, ?)").bind(ip, Math.floor(Date.now() / 1000)).run();
}
export const clientIp = (request) => request.headers.get("cf-connecting-ip") || "local";

/* ---------- works ---------- */
export function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{6,})/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

// Validate and normalise a work coming from the admin form.
export function cleanWork(input) {
  const s = (v, max = 400) => String(v ?? "").trim().slice(0, max);
  const w = {
    kind: s(input.kind, 10),
    src: s(input.src, 600),
    poster: s(input.poster, 600),
    dialects: (Array.isArray(input.dialects) ? input.dialects : String(input.dialects || "").split(","))
      .map((d) => s(d, 10)).filter((d) => DIALECTS.includes(d)),
    type: s(input.type, 20),
    title_ar: s(input.title_ar, 160),
    title_en: s(input.title_en, 160),
    note_ar: s(input.note_ar, 400),
    note_en: s(input.note_en, 400),
    dur: Math.max(0, Math.min(36000, Math.round(Number(input.dur) || 0))),
    visible: input.visible === false || input.visible === 0 || input.visible === "0" ? 0 : 1,
  };
  if (!KINDS.includes(w.kind)) return { error: "نوع العمل غير صحيح." };
  if (!TYPES.includes(w.type)) return { error: "تصنيف العمل غير صحيح." };
  if (!w.dialects.length) return { error: "اختر لهجة أو لغة واحدة على الأقل." };
  if (!w.title_ar) return { error: "اكتب عنوان العمل بالعربية." };
  if (!w.src) return { error: w.kind === "youtube" ? "أضف رابط يوتيوب." : "ارفع ملف العمل." };
  if (w.kind === "youtube") {
    const id = youtubeId(w.src);
    if (!id) return { error: "رابط يوتيوب غير صحيح." };
    w.src = `https://www.youtube.com/watch?v=${id}`;
    if (!w.poster) w.poster = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  } else if (!/^\/(media|assets)\//.test(w.src)) {
    return { error: "مسار الملف غير صحيح." };
  }
  if (w.poster && !/^(\/(media|assets)\/|https:\/\/i\.ytimg\.com\/)/.test(w.poster)) return { error: "مسار الصورة غير صحيح." };
  if (!w.title_en) w.title_en = w.title_ar;
  return { work: w };
}

export function publicWork(r) {
  return {
    id: r.id, kind: r.kind, src: r.src, poster: r.poster,
    dialects: r.dialects ? r.dialects.split(",") : [], type: r.type,
    title: { ar: r.title_ar, en: r.title_en || r.title_ar },
    note: { ar: r.note_ar, en: r.note_en || r.note_ar },
    dur: r.dur, visible: !!r.visible, sort: r.sort,
  };
}

// Delete uploaded media from KV when no other work uses it.
export async function releaseMedia(env, urls, exceptId) {
  for (const url of urls) {
    if (!url || !url.startsWith("/media/")) continue;
    const still = await env.DB.prepare("SELECT COUNT(*) AS n FROM works WHERE (src = ?1 OR poster = ?1) AND id != ?2")
      .bind(url, exceptId).first();
    if (!still?.n) await env.MEDIA.delete(url.slice("/media/".length));
  }
}
