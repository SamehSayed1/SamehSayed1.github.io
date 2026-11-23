(() => {
"use strict";

const DIALECTS = { eg: "مصري", fusha: "فصحى", sa: "سعودي", en: "إنجليزي" };
const TYPES = { ad: "إعلان تجاري", app: "إعلان تطبيق", corp: "فيديو شركات", cartoon: "رسوم متحركة", book: "كتاب صوتي", ivr: "رد آلي IVR" };
const KIND_LABEL = { video: "فيديو", audio: "صوت", youtube: "يوتيوب" };
const MAX = 25 * 1024 * 1024;
const MIME_BY_EXT = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime", mp3: "audio/mpeg",
  wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (s) => { s = Math.round(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const mb = (n) => (n / 1024 / 1024).toFixed(1) + " ميجابايت";
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const I = {
  up: "M12 7.4 5.7 13.7l1.4 1.4L12 10.2l4.9 4.9 1.4-1.4z", down: "M12 16.6 5.7 10.3l1.4-1.4L12 13.8l4.9-4.9 1.4 1.4z",
  edit: "M4 17.2V20h2.8l8.3-8.3-2.8-2.8zm15.7-9.5a1 1 0 0 0 0-1.4l-1.9-1.9a1 1 0 0 0-1.4 0l-1.5 1.5 2.8 2.8z",
  del: "M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7zm4 2v8h2v-8zm4 0v8h2v-8z",
  eye: "M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  eyeOff: "M3.3 2 22 20.7 20.7 22l-3.3-3.3A11 11 0 0 1 12 20c-5 0-9-4.5-10-7a13 13 0 0 1 4-5.1L2 3.3zm5 6.3A4 4 0 0 0 14 14l-1.5-1.5A2 2 0 0 1 9.5 9.8zM12 4c5 0 9 4.5 10 7-.5 1.3-1.6 2.9-3 4.3l-2.9-2.9A4 4 0 0 0 11.1 7.4L8.7 5A10 10 0 0 1 12 4z",
  audio: "M12 3v10.6A4 4 0 1 0 14 17V7h4V3z",
};

/* ---------------- API ---------------- */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || "GET",
    credentials: "same-origin",
    headers: { "x-admin": "1", ...(opts.body ? { "content-type": "application/json" } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !opts.allow401) { showAuth(false); throw new Error(data.error || "يجب تسجيل الدخول."); }
  if (!res.ok) throw new Error(data.error || "حدث خطأ، حاول مرة أخرى.");
  return data;
}

function upload(file, type, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.setRequestHeader("x-admin", "1");
    xhr.setRequestHeader("content-type", type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let data = {}; try { data = JSON.parse(xhr.responseText); } catch {}
      xhr.status < 300 ? resolve(data) : reject(new Error(data.error || "فشل رفع الملف."));
    };
    xhr.onerror = () => reject(new Error("انقطع الاتصال أثناء رفع الملف."));
    xhr.send(file);
  });
}

/* ---------------- toast ---------------- */
let toastT;
function toast(msg, isErr) {
  const t = $("#toast");
  t.textContent = msg; t.classList.toggle("err", !!isErr); t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3200);
}

/* ---------------- auth ---------------- */
let setupMode = false;
function showAuth(setup) {
  setupMode = setup;
  $("#app").hidden = true; $("#auth").hidden = false;
  closeAll();
  $("#authTitle").textContent = setup ? "إنشاء كلمة المرور" : "لوحة التحكم";
  $("#authSub").textContent = setup ? "هذه أول مرة تفتح فيها اللوحة. اختر كلمة مرور قوية (8 أحرف على الأقل) لا يعرفها أحد غيرك." : "أدخل كلمة المرور للمتابعة.";
  $("#pw2Wrap").hidden = !setup;
  $("#pw2").required = setup;
  $("#pw1").autocomplete = setup ? "new-password" : "current-password";
  $("#authBtn").textContent = setup ? "حفظ والدخول" : "دخول";
  $("#authErr").hidden = true;
  $("#pw1").value = ""; $("#pw2").value = "";
  setTimeout(() => $("#pw1").focus(), 50);
}

$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#authErr"), btn = $("#authBtn"), pw = $("#pw1").value;
  err.hidden = true;
  if (setupMode && pw !== $("#pw2").value) { err.textContent = "كلمتا المرور غير متطابقتين."; err.hidden = false; return; }
  btn.disabled = true;
  try {
    await api(setupMode ? "/api/admin/setup" : "/api/admin/login", { method: "POST", body: { password: pw }, allow401: true });
    await openApp();
  } catch (x) { err.textContent = x.message; err.hidden = false; }
  btn.disabled = false;
});

$("#logoutBtn").addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" }).catch(() => {});
  showAuth(false);
});

/* ---------------- list ---------------- */
let works = [];

async function openApp() {
  $("#auth").hidden = true; $("#app").hidden = false;
  await loadWorks();
}
async function loadWorks() {
  const data = await api("/api/admin/works");
  works = data.works;
  render();
}

function thumbHTML(w) {
  if (w.kind === "audio" && !w.poster) return `<div class="thumb audio">${svg(I.audio)}${w.dur ? `<span class="badge">${fmt(w.dur)}</span>` : ""}</div>`;
  return `<div class="thumb">${w.poster ? `<img src="${esc(w.poster)}" alt="" loading="lazy">` : ""}${w.dur ? `<span class="badge">${fmt(w.dur)}</span>` : ""}</div>`;
}

function render() {
  const q = $("#search").value.trim().toLowerCase();
  const shown = works.filter((w) => !q || (w.title.ar + " " + w.title.en).toLowerCase().includes(q));
  const vis = works.filter((w) => w.visible).length;
  $("#summary").innerHTML =
    `<li><b>${works.length}</b> عمل</li><li><b>${vis}</b> ظاهر</li>` + (works.length - vis ? `<li><b>${works.length - vis}</b> مخفي</li>` : "") +
    Object.entries(DIALECTS).map(([k, v]) => `<li style="--c:var(--c-${k})"><i></i>${v}<b>${works.filter((w) => w.dialects.includes(k)).length}</b></li>`).join("");
  $("#empty").hidden = works.length > 0;
  $("#list").innerHTML = shown.map((w) => {
    const i = works.indexOf(w);
    return `<li class="item${w.visible ? "" : " off"}" data-id="${esc(w.id)}">
      <div class="order">
        <button class="icon-btn" data-act="up" title="تحريك لأعلى" aria-label="تحريك لأعلى" ${i === 0 || q ? "disabled" : ""}>${svg(I.up)}</button>
        <button class="icon-btn" data-act="down" title="تحريك لأسفل" aria-label="تحريك لأسفل" ${i === works.length - 1 || q ? "disabled" : ""}>${svg(I.down)}</button>
      </div>
      ${thumbHTML(w)}
      <div class="info">
        <h3>${esc(w.title.ar)}</h3>
        <div class="tags">${w.dialects.map((d) => `<span class="tag tag-${d}">${DIALECTS[d] || d}</span>`).join("")}<span class="tag tag-type">${TYPES[w.type] || w.type}</span><span class="tag tag-type">${KIND_LABEL[w.kind]}</span>${w.visible ? "" : `<span class="tag tag-hidden">مخفي</span>`}</div>
      </div>
      <div class="actions">
        <button class="icon-btn" data-act="vis" title="${w.visible ? "إخفاء من الموقع" : "إظهار في الموقع"}" aria-label="${w.visible ? "إخفاء من الموقع" : "إظهار في الموقع"}">${svg(w.visible ? I.eye : I.eyeOff)}</button>
        <button class="icon-btn" data-act="edit" title="تعديل" aria-label="تعديل">${svg(I.edit)}</button>
        <button class="icon-btn del" data-act="del" title="حذف" aria-label="حذف">${svg(I.del)}</button>
      </div>
    </li>`;
  }).join("");
}
$("#search").addEventListener("input", render);

const payloadOf = (w, over = {}) => ({
  kind: w.kind, src: w.src, poster: w.poster, dialects: w.dialects, type: w.type,
  title_ar: w.title.ar, title_en: w.title.en, note_ar: w.note.ar, note_en: w.note.en, dur: w.dur, visible: w.visible, ...over,
});

$("#list").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  const id = b.closest(".item").dataset.id, w = works.find((x) => x.id === id), i = works.indexOf(w);
  const act = b.dataset.act;
  if (act === "edit") return openEditor(w);
  if (act === "del") return askDelete(w);
  if (act === "vis") {
    try {
      const { work } = await api(`/api/admin/works/${encodeURIComponent(id)}`, { method: "PUT", body: payloadOf(w, { visible: !w.visible }) });
      works[i] = work; render(); toast(work.visible ? "أصبح العمل ظاهرًا في الموقع." : "تم إخفاء العمل من الموقع.");
    } catch (x) { toast(x.message, true); }
    return;
  }
  const j = act === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= works.length) return;
  [works[i], works[j]] = [works[j], works[i]];
  render();
  const moved = $(`.item[data-id="${CSS.escape(id)}"] [data-act="${act}"]`); if (moved && !moved.disabled) moved.focus();
  try { await api("/api/admin/reorder", { method: "POST", body: { ids: works.map((x) => x.id) } }); }
  catch (x) { toast(x.message, true); loadWorks(); }
});

$("#addBtn").addEventListener("click", () => openEditor(null));
$("[data-add]").addEventListener("click", () => openEditor(null));

/* ---------------- delete ---------------- */
let toDelete = null;
function askDelete(w) {
  toDelete = w;
  $("#confirmText").textContent = `سيُحذف «${w.title.ar}» نهائيًا من الموقع، ولا يمكن التراجع عن ذلك.`;
  openModal("#confirm"); $("#confirmYes").focus();
}
$("#confirmYes").addEventListener("click", async () => {
  if (!toDelete) return;
  const btn = $("#confirmYes"); btn.disabled = true;
  try {
    await api(`/api/admin/works/${encodeURIComponent(toDelete.id)}`, { method: "DELETE" });
    works = works.filter((x) => x !== toDelete); render(); closeModal("#confirm"); toast("تم حذف العمل.");
  } catch (x) { toast(x.message, true); }
  btn.disabled = false; toDelete = null;
});

/* ---------------- modals ---------------- */
let lastFocus = null, busy = false;
function openModal(sel) { lastFocus = document.activeElement; $(sel).hidden = false; document.body.style.overflow = "hidden"; }
function closeModal(sel) {
  if (busy) return;
  $(sel).hidden = true;
  if ($$(".modal").every((m) => m.hidden)) document.body.style.overflow = "";
  if (sel === "#editor") resetPreview();
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
const closeAll = () => $$(".modal").forEach((m) => { m.hidden = true; });
$$(".modal").forEach((m) => {
  m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) closeModal("#" + m.id); });
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const open = $$(".modal").filter((m) => !m.hidden).pop();
  if (open) closeModal("#" + open.id);
});

/* ---------------- password ---------------- */
$("#pwBtn").addEventListener("click", () => { $("#pwForm").reset(); $("#pwErr").hidden = true; openModal("#pwModal"); $("#pwCur").focus(); });
$("#pwForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#pwErr"); err.hidden = true;
  try {
    await api("/api/admin/password", { method: "POST", body: { current: $("#pwCur").value, next: $("#pwNew").value }, allow401: true });
    closeModal("#pwModal"); toast("تم تغيير كلمة المرور. تم تسجيل الخروج من الأجهزة الأخرى.");
  } catch (x) { err.textContent = x.message; err.hidden = false; }
});

/* ---------------- editor ---------------- */
let editing = null;
let st = {}; // working state of the form

$("#dialectChips").innerHTML = Object.entries(DIALECTS).map(([k, v]) =>
  `<label><input type="checkbox" value="${k}"><span style="--c:var(--c-${k})"><i></i>${v}</span></label>`).join("");
$("#typeSel").innerHTML = Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");

const kind = () => $('input[name="kind"]:checked').value;

function openEditor(w) {
  editing = w;
  st = { src: w?.src || "", poster: w?.poster || "", dur: w?.dur || 0, file: null, fileType: "", posterBlob: null, previewUrl: null, posterUrl: null };
  $("#editTitle").textContent = w ? "تعديل العمل" : "إضافة عمل";
  $(`input[name="kind"][value="${w?.kind || "video"}"]`).checked = true;
  $("#titleAr").value = w?.title.ar || "";
  $("#titleEn").value = w && w.title.en !== w.title.ar ? w.title.en : "";
  $("#noteAr").value = w?.note.ar || "";
  $("#noteEn").value = w && w.note.en !== w.note.ar ? w.note.en : "";
  $$("#dialectChips input").forEach((c) => (c.checked = !!w?.dialects.includes(c.value)));
  $("#typeSel").value = w?.type || "ad";
  $("#visibleIn").checked = w ? w.visible : true;
  $("#ytUrl").value = w?.kind === "youtube" ? w.src : "";
  $("#editErr").hidden = true;
  $("#progress").hidden = true;
  applyKind(true);
  openModal("#editor");
  setTimeout(() => (w ? $("#titleAr") : $("#drop")).focus(), 60);
}

function applyKind(initial) {
  const k = kind();
  const keepSrc = editing && editing.kind === k;
  if (!initial) {
    st.file = null; st.posterBlob = null;
    st.src = keepSrc ? editing.src : "";
    st.poster = keepSrc ? editing.poster : "";
    st.dur = keepSrc ? editing.dur : 0;
  }
  $("#fileGroup").hidden = k === "youtube";
  $("#ytGroup").hidden = k !== "youtube";
  $("#posterGroup").hidden = k !== "video";
  $("#fileIn").accept = k === "video" ? "video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm" : "audio/*,.mp3,.wav,.m4a,.aac,.ogg";
  $("#dropTitle").textContent = (st.src || st.file) ? (k === "video" ? "استبدال ملف الفيديو" : "استبدال الملف الصوتي") : (k === "video" ? "اختر ملف الفيديو أو اسحبه هنا" : "اختر الملف الصوتي أو اسحبه هنا");
  $("#dropHint").textContent = (k === "video" ? "MP4" : "MP3 أو WAV") + " — بحد أقصى 25 ميجابايت";
  renderPreview();
  renderPoster();
  updateYtThumb();
}
$$('input[name="kind"]').forEach((r) => r.addEventListener("change", () => applyKind(false)));

function resetPreview() {
  if (st.previewUrl) URL.revokeObjectURL(st.previewUrl);
  if (st.posterUrl) URL.revokeObjectURL(st.posterUrl);
  st.previewUrl = st.posterUrl = null;
  $("#preview").innerHTML = ""; $("#preview").hidden = true;
}

function renderPreview() {
  const k = kind(), box = $("#preview");
  if (st.previewUrl) { URL.revokeObjectURL(st.previewUrl); st.previewUrl = null; }
  const src = st.file ? (st.previewUrl = URL.createObjectURL(st.file)) : st.src;
  if (!src || k === "youtube") { box.hidden = true; box.innerHTML = ""; $("#grabBtn").hidden = true; return; }
  const meta = st.file ? `<div class="file-meta"><span>${esc(st.file.name)}</span><span>${mb(st.file.size)}</span></div>` : "";
  box.innerHTML = k === "video"
    ? `<video controls playsinline preload="metadata" src="${esc(src)}"></video>${meta}`
    : `<audio controls preload="metadata" src="${esc(src)}"></audio>${meta}`;
  box.hidden = false;
  const media = box.querySelector("video,audio");
  media.addEventListener("loadedmetadata", () => { if (isFinite(media.duration)) st.dur = Math.round(media.duration); });
  $("#grabBtn").hidden = k !== "video";
  // A newly picked video gets an automatic thumbnail.
  if (k === "video" && st.file && !st.posterBlob) {
    media.addEventListener("loadeddata", () => { media.currentTime = Math.min(1, (media.duration || 2) * 0.2); }, { once: true });
    media.addEventListener("seeked", () => grabFrame(media), { once: true });
  }
}

function renderPoster() {
  const box = $("#posterBox");
  if (st.posterUrl) { URL.revokeObjectURL(st.posterUrl); st.posterUrl = null; }
  const src = st.posterBlob ? (st.posterUrl = URL.createObjectURL(st.posterBlob)) : st.poster;
  box.innerHTML = src ? `<img src="${esc(src)}" alt="الصورة المصغّرة">` : `<span class="muted small">تُنشأ تلقائيًا من الفيديو</span>`;
}

function grabFrame(video) {
  try {
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return;
    const scale = Math.min(1, 1280 / w), c = document.createElement("canvas");
    c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
    c.toBlob((b) => { if (b) { st.posterBlob = b; renderPoster(); } }, "image/jpeg", 0.85);
  } catch { toast("تعذّر التقاط الصورة من هذا الفيديو.", true); }
}
$("#grabBtn").addEventListener("click", () => { const v = $("#preview video"); if (v) grabFrame(v); });

function fileType(f) {
  if (f.type) return f.type === "audio/x-wav" || f.type === "audio/wave" ? "audio/wav" : f.type;
  return MIME_BY_EXT[(f.name.split(".").pop() || "").toLowerCase()] || "";
}
function pickFile(f) {
  if (!f) return;
  const k = kind(), t = fileType(f);
  if (k === "video" && !t.startsWith("video/")) return toast("اختر ملف فيديو (MP4).", true);
  if (k === "audio" && !t.startsWith("audio/")) return toast("اختر ملفًا صوتيًا (MP3 أو WAV).", true);
  if (f.size > MAX) return toast(`حجم الملف ${mb(f.size)}، والحد الأقصى 25 ميجابايت. اضغط الملف أو استخدم رابط يوتيوب.`, true);
  st.file = f; st.fileType = t; st.posterBlob = null; st.dur = 0;
  $("#dropTitle").textContent = k === "video" ? "استبدال ملف الفيديو" : "استبدال الملف الصوتي";
  renderPreview();
}
const drop = $("#drop");
drop.addEventListener("click", () => $("#fileIn").click());
drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#fileIn").click(); } });
$("#fileIn").addEventListener("change", (e) => { pickFile(e.target.files[0]); e.target.value = ""; });
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => pickFile(e.dataTransfer.files[0]));

$("#posterIn").addEventListener("change", (e) => {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) return toast("حجم الصورة كبير. اختر صورة أقل من 5 ميجابايت.", true);
  st.posterBlob = f; renderPoster();
});

function ytId(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.endsWith("youtube.com")) return u.searchParams.get("v") || (u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{6,})/) || [])[1] || null;
  } catch {}
  return null;
}
function updateYtThumb() {
  const id = kind() === "youtube" ? ytId($("#ytUrl").value) : null, img = $("#ytThumb");
  img.hidden = !id; if (id) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
$("#ytUrl").addEventListener("input", updateYtThumb);

function setProgress(p, text) {
  $("#progress").hidden = false;
  $("#progressBar").style.width = Math.round(p * 100) + "%";
  $("#progressText").textContent = text;
}

$("#editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#editErr"); err.hidden = true;
  const k = kind();
  const dialects = $$("#dialectChips input:checked").map((c) => c.value);
  const fail = (m) => { err.textContent = m; err.hidden = false; err.scrollIntoView({ block: "nearest" }); };
  if (!$("#titleAr").value.trim()) return fail("اكتب عنوان العمل بالعربية.");
  if (!dialects.length) return fail("اختر لهجة أو لغة واحدة على الأقل.");
  if (k === "youtube" && !ytId($("#ytUrl").value)) return fail("أضف رابط فيديو صحيحًا من يوتيوب.");
  if (k !== "youtube" && !st.file && !st.src) return fail(k === "video" ? "اختر ملف الفيديو." : "اختر الملف الصوتي.");

  busy = true;
  const save = $("#saveBtn"); save.disabled = true;
  try {
    let src = k === "youtube" ? $("#ytUrl").value.trim() : st.src;
    let poster = k === "video" ? st.poster : k === "youtube" ? "" : "";
    const jobs = [];
    if (k !== "youtube" && st.file) jobs.push({ blob: st.file, type: st.fileType, set: (u) => (src = u), label: "رفع الملف" });
    if (k === "video" && st.posterBlob) jobs.push({ blob: st.posterBlob, type: fileType(st.posterBlob) || "image/jpeg", set: (u) => (poster = u), label: "رفع الصورة" });
    const total = jobs.reduce((a, j) => a + j.blob.size, 0);
    let done = 0;
    for (const j of jobs) {
      const res = await upload(j.blob, j.type, (p) => setProgress((done + p * j.blob.size) / total, `${j.label}… ${Math.round(((done + p * j.blob.size) / total) * 100)}%`));
      done += j.blob.size; j.set(res.url);
    }
    setProgress(1, "جارٍ الحفظ…");
    const body = {
      kind: k, src, poster, dialects, type: $("#typeSel").value,
      title_ar: $("#titleAr").value, title_en: $("#titleEn").value, note_ar: $("#noteAr").value, note_en: $("#noteEn").value,
      dur: k === "youtube" ? 0 : st.dur, visible: $("#visibleIn").checked,
    };
    if (editing) {
      const { work } = await api(`/api/admin/works/${encodeURIComponent(editing.id)}`, { method: "PUT", body });
      works[works.indexOf(editing)] = work;
    } else {
      const { work } = await api("/api/admin/works", { method: "POST", body });
      works.unshift(work);
    }
    busy = false;
    render(); closeModal("#editor");
    toast(editing ? "تم حفظ التعديلات." : "تمت إضافة العمل، وهو الآن في أول القائمة.");
  } catch (x) {
    fail(x.message);
  } finally {
    busy = false; save.disabled = false; $("#progress").hidden = true;
  }
});

/* ---------------- start ---------------- */
(async () => {
  try {
    const s = await api("/api/admin/session", { allow401: true });
    if (s.needsSetup) showAuth(true);
    else if (s.authed) await openApp();
    else showAuth(false);
  } catch {
    document.body.innerHTML = '<p style="padding:40px;text-align:center;font-family:sans-serif">تعذّر الاتصال بالخادم. حدّث الصفحة بعد قليل.</p>';
  }
})();
})();
