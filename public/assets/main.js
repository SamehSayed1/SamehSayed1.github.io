(() => {
"use strict";

/* ================= CONFIG ================= */
const WA_NUMBER = "201122401533";

/* dialects */
const DIALECTS = {
  eg:    { ar: "مصري",    en: "Egyptian" },
  fusha: { ar: "فصحى",    en: "Standard Arabic" },
  sa:    { ar: "سعودي",   en: "Saudi" },
  en:    { ar: "إنجليزي", en: "English" },
};

/* work types */
const TYPES = {
  ad:      { ar: "إعلان تجاري",     en: "Commercial" },
  app:     { ar: "إعلان تطبيق",     en: "App Promo" },
  corp:    { ar: "فيديو شركات",     en: "Corporate" },
  cartoon: { ar: "رسوم متحركة",     en: "Cartoon & Characters" },
  book:    { ar: "كتاب صوتي",       en: "Audiobook" },
  ivr:     { ar: "رد آلي IVR",      en: "IVR" },
};

/* ===== WORKS =====
   The live list comes from the admin dashboard (GET /api/works).
   This copy is only a fallback, shown if the API can't be reached.      */
let WORKS = [
  { id: "almadina", d: ["fusha"], type: "corp", dur: 48,
    title: { ar: "المدينة الأولى لتقنية المعلومات", en: "Al Madina Al Oula IT" },
    note:  { ar: "إعلان تعريفي لشركة تقنية بأداء فصيح رصين وواثق.", en: "Corporate promo for an IT company, in a confident, polished Standard Arabic read." } },
  { id: "alreef", d: ["sa"], type: "app", dur: 28,
    title: { ar: "إعلان تطبيق الريف", en: "Al Reef App" },
    note:  { ar: "إعلان تطبيق بلهجة سعودية قريبة من الجمهور.", en: "App promo in a warm, natural Saudi dialect." } },
  { id: "cartoon-en", d: ["en"], type: "cartoon", dur: 76,
    title: { ar: "رسوم متحركة بالإنجليزية — جميع الأصوات بصوتي", en: "English Cartoon — Every Voice Is Mine" },
    note:  { ar: "عدة شخصيات في المشهد نفسه، جميعها بصوت واحد.", en: "Several characters in one scene — all performed by one voice." } },
  { id: "modern-home", d: ["eg"], type: "ad", dur: 35,
    title: { ar: "إعلان مودرن هوم للمفروشات", en: "Modern Home Furnishings" },
    note:  { ar: "تعليق صوتي وتصوير ومونتاج — المشروع بالكامل من تنفيذي.", en: "Voice-over, filming and editing — the whole piece was produced by me." } },
  { id: "audiobook", d: ["fusha"], type: "book", dur: 104,
    title: { ar: "كتاب صوتي: فن اللامبالاة", en: "Audiobook: “The Subtle Art…” (Arabic)" },
    note:  { ar: "سرد هادئ ومريح يأسر المستمع حتى الصفحة الأخيرة.", en: "Calm, engaging narration that keeps listeners to the last page." } },
  { id: "car", audio: true, src: "assets/audio/car-commercial-fusha.wav", d: ["fusha"], type: "ad", dur: 0,
    title: { ar: "إعلان سيارات", en: "Car Commercial" },
    note:  { ar: "أداء إعلاني فخم وحماسي باللغة العربية الفصحى.", en: "A bold, premium commercial read in Standard Arabic." } },
  { id: "saudia", d: ["sa"], type: "ad", dur: 24,
    title: { ar: "الخطوط السعودية", en: "Saudia Airlines" },
    note:  { ar: "تعليق صوتي بلهجة سعودية بأسلوب رسمي ودافئ.", en: "Saudi-dialect voice-over with a formal yet warm tone." } },
  { id: "warshati", d: ["sa"], type: "app", dur: 22,
    title: { ar: "إعلان تطبيق ورشتي", en: "Warshati App" },
    note:  { ar: "إعلان سريع الإيقاع بلهجة سعودية.", en: "Fast-paced app promo in Saudi dialect." } },
  { id: "azlogistic", d: ["fusha"], type: "corp", dur: 12,
    title: { ar: "إعلان AZ Logistic", en: "AZ Logistic" },
    note:  { ar: "إعلان قصير ومباشر لشركة لوجستيات بالفصحى.", en: "Short, punchy logistics ad in Standard Arabic." } },
  { id: "cartoon-ar", d: ["eg"], type: "cartoon", dur: 68,
    title: { ar: "دبلجة رسوم متحركة — جميع الأصوات بصوتي", en: "Cartoon Dub — Every Voice Is Mine" },
    note:  { ar: "دبلجة عربية لمشاهد رسوم متحركة بأصوات شخصيات متنوعة.", en: "Arabic cartoon dub with a range of character voices." } },
  { id: "ivr", d: ["fusha", "en"], type: "ivr", dur: 35,
    title: { ar: "رد آلي IVR — Tech Manage", en: "IVR System — Tech Manage" },
    note:  { ar: "رسائل رد آلي بالعربية الفصحى والإنجليزية.", en: "Phone-system prompts recorded in both Arabic and English." } },
];

/* One shape for every work, whether it came from the fallback list or the API. */
function normWork(w) {
  const kind = w.kind || (w.audio ? "audio" : "video");
  const ytId = kind === "youtube" ? ((w.src || "").match(/[?&]v=([\w-]+)/) || [])[1] : null;
  return {
    id: w.id, kind, ytId,
    src: w.src || `assets/video/${w.id}.mp4`,
    poster: w.poster != null ? w.poster : kind === "audio" ? "" : `assets/img/posters/${w.id}.jpg`,
    d: (w.d || w.dialects || []).filter((k) => DIALECTS[k]),
    type: TYPES[w.type] ? w.type : "ad",
    dur: w.dur || 0,
    title: { ar: w.title.ar, en: w.title.en || w.title.ar },
    note: { ar: w.note?.ar || "", en: w.note?.en || w.note?.ar || "" },
  };
}
WORKS = WORKS.map(normWork);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const SERVICES = [
  { k: "ad",      icon: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zm13.5 1A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23z",
    ar: ["إعلانات تجارية", "إعلانات تلفزيونية وإعلانات لمنصات التواصل بأداء مقنع يحقق المبيعات."],
    en: ["Commercials", "TV and social ads with a performance that sells."] },
  { k: "app",     icon: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 3v13h10V5zm5 14.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
    ar: ["إعلانات التطبيقات والموشن جرافيك", "شرح مزايا تطبيقك بصوت واضح وإيقاع مضبوط."],
    en: ["App & Motion-Graphics Promos", "Explain your product with clear, perfectly paced delivery."] },
  { k: "corp",    icon: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4h2a2 2 0 0 1 2 2v10h-6v-4h-4v4zm4-14v2h2V7zm4 0v2h2V7zm-4 4v2h2v-2zm4 0v2h2v-2z",
    ar: ["فيديوهات الشركات", "أفلام تعريفية وعروض تقديمية بأسلوب احترافي ورسمي."],
    en: ["Corporate Videos", "Company profiles and presentations in a professional tone."] },
  { k: "cartoon", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 18a5.5 5.5 0 0 1-5-3.2h10A5.5 5.5 0 0 1 12 18z",
    ar: ["الرسوم المتحركة وأصوات الشخصيات", "عدة شخصيات بصوت واحد، ولكل شخصية روحها الخاصة."],
    en: ["Cartoons & Characters", "Multiple characters, one voice — each with its own personality."] },
  { k: "book",    icon: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5a1 1 0 0 0 0 2H20v2H6.5A2.5 2.5 0 0 1 4 19.5zM8 6v2h8V6z",
    ar: ["الكتب الصوتية والسرد", "سرد هادئ وممتع يجعل المستمع يتابع حتى النهاية."],
    en: ["Audiobooks & Narration", "Calm, immersive storytelling that keeps people listening."] },
  { k: "ivr",     icon: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z",
    ar: ["الرد الآلي IVR", "رسائل الرد الآلي ومراكز الاتصال بالعربية والإنجليزية."],
    en: ["IVR & Phone Systems", "Call-center and on-hold prompts in Arabic and English."] },
];

const PROCESS = {
  ar: [["أرسل التفاصيل", "النص، ونوع المشروع، واللهجة المطلوبة."], ["نتفق على الأداء", "الأسلوب والإحساس المناسبان لجمهورك."], ["التسجيل والمعالجة", "تسجيل نقي ومعالجة للصوت بجودة الاستوديو."], ["التسليم والتعديل", "تستلم الملفات، وتُعدَّل أي ملاحظات فورًا."]],
  en: [["Send the details", "Your script, project type and the dialect you need."], ["Agree on the read", "The style and feeling that fits your audience."], ["Record & polish", "Clean recording and studio-grade audio cleanup."], ["Deliver & refine", "Get your files — and any notes get handled."]],
};

const REVIEWS = [
  { n: "Osama M.", t: "شكرا جزيلا أ.سامح على اتقانك وأمانتك في العمل، سعيد بالعمل معك على مدار شهرين، ومستمرين بإذن الله في أعمالنا القادمة.",
    en: "Thank you so much, Sameh, for your mastery and integrity. Happy to have worked with you for two months — and we'll keep going in our next projects." },
  { n: "Mohamed Nagy", t: "ثاني تعامل ولن يكون الأخير بإذن الله… وممتاز جودة وسرعة، أنصح بالتعامل معه.",
    en: "Second collaboration and certainly not the last. Excellent quality and speed — highly recommended." },
  { n: "Ghaleb A.", t: "ممتاز في التعامل وعمل سريع ومتقن.",
    en: "Excellent to deal with — fast and precise work." },
];

/* ================= I18N ================= */
const T = {
  ar: {
    name: "سامح سيد",
    "nav.work": "أعمالي", "nav.services": "الخدمات", "nav.reviews": "آراء العملاء", "nav.contact": "تواصل معي", "nav.cta": "احجز صوتك",
    "hero.eyebrow": "معلّق صوتي محترف",
    "hero.title": "صوت يمنح كلماتك <em>حياة</em>،<br>ويجعل رسالتك <span class=\"mark\">لا تُنسى</span>.",
    "hero.lead": "معلّق صوتي بخبرة تزيد عن 5 سنوات، أقدّم أداءً صوتيًا احترافيًا يجمع بين جودة الصوت، والإحساس، والتنوع في الأسلوب، باللهجة المصرية، والفصحى، والسعودية، والإنجليزية؛ لأمنح كل مشروع صوتًا يليق به ويترك أثرًا لدى جمهوره.",
    "hero.listen": "استمع إلى أعمالي", "hero.wa": "تواصل عبر واتساب", "hero.years": "سنوات من الخبرة", "hero.studio": "تسجيل بجودة احترافية",
    "demo.title": "استمع إلى صوتي — إعلان سيارات",
    "stats.years": "سنوات من الخبرة", "stats.dialects": "لهجات ولغات",
    "work.kicker": "معرض الأعمال", "work.title": "استمع إلى الفرق بنفسك", "work.sub": "اختر اللهجة أو اللغة، ثم اضغط على أي عمل لتشغيله.",
    "f.all": "الكل",
    "svc.kicker": "الخدمات", "svc.title": "صوت واحد لجميع أنواع المشاريع", "proc.title": "كيف نعمل معًا؟",
    "rev.kicker": "آراء العملاء", "rev.title": "ماذا قال العملاء؟", "rev.role": "صاحب مشروع",
    "ct.kicker": "تواصل معي", "ct.title": "هل أنت مستعد لتسجيل مشروعك؟", "ct.sub": "أرسل إليّ تفاصيل مشروعك والنص إن كان جاهزًا، وسأرد عليك في أقرب وقت ممكن.", "ct.wa": "راسلني عبر واتساب", "ct.wa2": "رد سريع ومباشر",
    "f.title": "أو أرسل رسالة عبر البريد الإلكتروني", "f.name": "الاسم", "f.email": "بريدك الإلكتروني", "f.subject": "عنوان الرسالة", "f.msg": "تفاصيل المشروع",
    "f.file": "إرفاق ملف (النص أو أي مرجع) — اختياري", "f.send": "إرسال الرسالة", "f.sending": "جارٍ الإرسال…", "f.ok": "تم إرسال رسالتك بنجاح، شكرًا لك! سأرد عليك قريبًا.",
    "foot.role": "معلّق صوتي",
    "card.audio": "عيّنة صوتية", "card.play": "تشغيل",
    wa: "السلام عليكم أستاذ سامح، أنا شفت الموقع بتاعك وعندي مشروع تعليق صوتي حابب أتكلم معاك بخصوصه 🙏🏻",
  },
  en: {
    name: "Sameh Sayed",
    "nav.work": "Work", "nav.services": "Services", "nav.reviews": "Reviews", "nav.contact": "Contact", "nav.cta": "Book my voice",
    "hero.eyebrow": "Professional Voice-over Artist",
    "hero.title": "A voice that brings your words to <em>life</em> — and makes your message <span class=\"mark\">unforgettable</span>.",
    "hero.lead": "Voice-over artist with 5+ years of experience, delivering professional performances that combine audio quality, real feeling and stylistic range — in Egyptian, Standard Arabic, Saudi and English — so every project gets the voice it deserves and leaves a lasting impression on its audience.",
    "hero.listen": "Listen to my work", "hero.wa": "Chat on WhatsApp", "hero.years": "Years of experience", "hero.studio": "Professional-quality recording",
    "demo.title": "Hear my voice — Car Commercial",
    "stats.years": "Years of experience", "stats.dialects": "Dialects & languages",
    "work.kicker": "Portfolio", "work.title": "Hear the difference", "work.sub": "Pick a dialect or language, then tap any piece to play it.",
    "f.all": "All",
    "svc.kicker": "Services", "svc.title": "One voice for every kind of project", "proc.title": "How we work",
    "rev.kicker": "Client reviews", "rev.title": "What clients say", "rev.role": "Project owner",
    "ct.kicker": "Contact", "ct.title": "Ready to record your project?", "ct.sub": "Send me your project details — and the script if it's ready — and I'll get back to you quickly.", "ct.wa": "Message me on WhatsApp", "ct.wa2": "Quick, direct reply",
    "f.title": "Or send an email", "f.name": "Name", "f.email": "Your email", "f.subject": "Subject", "f.msg": "Project details",
    "f.file": "Attach a file (script or reference) — optional", "f.send": "Send message", "f.sending": "Sending…", "f.ok": "Your message was sent — thank you! I'll reply soon.",
    "foot.role": "Voice-over Artist",
    "card.audio": "Audio sample", "card.play": "Play",
    wa: "Hi Sameh, I saw your website and I'd like to talk about a voice-over project.",
  },
};

let lang = "ar";
try { const s = localStorage.getItem("lang"); if (s === "en" || s === "ar") lang = s; } catch (e) {}
const q = new URLSearchParams(location.search).get("lang");
if (q === "en" || q === "ar") lang = q;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (s) => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const PLAY = "M8 5v14l11-7z";
const STAR = "M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z";

function applyLang() {
  const t = T[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach((el) => { const k = el.dataset.i18n; if (t[k] != null) el.textContent = t[k]; });
  $$("[data-i18n-html]").forEach((el) => { const k = el.dataset.i18nHtml; if (t[k] != null) el.innerHTML = t[k]; });
  addSparks();
  document.title = lang === "ar" ? "سامح سيد — معلّق صوتي" : "Sameh Sayed — Voice-over Artist";
  const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t.wa)}`;
  $$(".js-wa").forEach((a) => (a.href = wa));
  renderDialectChips(); renderFilters(); renderGrid(); renderServices(); renderReviews();
  if (fileName.dataset.picked) fileName.textContent = fileName.dataset.picked;
}

/* ---------- sparks rising from the highlighted word ---------- */
function addSparks() {
  const em = $("h1 em"); if (!em || em.parentElement.classList.contains("life")) return;
  const wrap = document.createElement("span"); wrap.className = "life";
  em.replaceWith(wrap); wrap.appendChild(em);
  const S = [[6,".3s","1.7s","-8px",14,""],[20,".55s","1.8s","10px",10,"dot"],[36,".4s","1.6s","-6px",12,""],[52,".7s","1.8s","12px",9,"dot"],[68,".35s","1.7s","-10px",15,""],[84,".6s","1.6s","7px",10,"dot"],[94,".8s","1.7s","-4px",11,""]];
  wrap.insertAdjacentHTML("beforeend", '<span class="sparks" aria-hidden="true">' + S.map(([l,w,d,dx,sz,c]) => '<i class="' + c + '" style="left:' + l + '%;--w:' + w + ';--d:' + d + ';--dx:' + dx + ';--s:' + sz + 'px"></i>').join("") + "</span>");
}

/* ---------- hero chips ---------- */
function renderDialectChips() {
  $("#heroDialects").innerHTML = Object.entries(DIALECTS).map(([k, v]) =>
    `<a class="chip tag-${k}" href="#work" data-jump="${k}"><i></i><b>${v[lang]}</b></a>`).join("");
  $$("#heroDialects [data-jump]").forEach((a) => a.addEventListener("click", () => setFilter(a.dataset.jump)));
}

/* ---------- filters ---------- */
let filter = "all";
function renderFilters() {
  const count = (k) => WORKS.filter((w) => w.d.includes(k)).length;
  const btn = (k, label, n, c) =>
    `<button class="f-btn" role="tab" data-f="${k}" aria-selected="${filter === k}" ${c ? `style="--c:var(--c-${k})"` : ""}>${c ? "<i></i>" : ""}${label}<small>${n}</small></button>`;
  $("#filters").innerHTML = btn("all", T[lang]["f.all"], WORKS.length, false) +
    Object.entries(DIALECTS).map(([k, v]) => btn(k, v[lang], count(k), true)).join("");
  $$("#filters .f-btn").forEach((b) => b.addEventListener("click", () => setFilter(b.dataset.f)));
}
function setFilter(k) {
  filter = k;
  $$("#filters .f-btn").forEach((b) => b.setAttribute("aria-selected", b.dataset.f === k));
  $$("#grid .card").forEach((c) => c.classList.toggle("hide", k !== "all" && !c.dataset.d.split(" ").includes(k)));
}

/* ---------- grid ---------- */
const tagsHTML = (w) =>
  w.d.map((k) => `<span class="tag tag-${k}">${DIALECTS[k][lang]}</span>`).join("") +
  `<span class="tag tag-type">${TYPES[w.type][lang]}</span>`;

function renderGrid() {
  $("#grid").innerHTML = WORKS.map((w, i) => {
    const isAudio = w.kind === "audio";
    const media = isAudio && !w.poster
      ? `<div class="eq" aria-hidden="true">${Array.from({ length: 14 }, (_, j) => `<i style="height:${20 + ((j * 37) % 60)}px;animation-delay:-${(j * 0.13).toFixed(2)}s"></i>`).join("")}</div><span class="lbl">${T[lang]["card.audio"]}</span>`
      : `<img src="${esc(w.poster)}" alt="" loading="lazy" width="960" height="540">`;
    return `<article class="card${isAudio && !w.poster ? " card-audio" : ""}" data-i="${i}" data-d="${w.d.join(" ")}" tabindex="0" role="button" aria-label="${esc(T[lang]["card.play"] + ": " + w.title[lang])}">
      <div class="thumb">${media}<span class="pbtn">${icon(PLAY)}</span>${w.dur ? `<span class="dur">${fmt(w.dur)}</span>` : ""}</div>
      <div class="card-body"><div class="card-tags">${tagsHTML(w)}</div><h3>${esc(w.title[lang])}</h3>${w.note[lang] ? `<p>${esc(w.note[lang])}</p>` : ""}</div>
    </article>`;
  }).join("");
  setFilter(filter);
  $$("#grid .card").forEach((c) => {
    const w = WORKS[+c.dataset.i];
    c.addEventListener("click", () => openLB(w));
    c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLB(w); } });
    if (w.kind === "video" && matchMedia("(hover:hover) and (pointer:fine)").matches) hoverPreview(c, w);
  });
}

function hoverPreview(card, w) {
  let v, t;
  card.addEventListener("mouseenter", () => {
    t = setTimeout(() => {
      if (!v) { v = document.createElement("video"); v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto"; v.src = w.src; $(".thumb", card).prepend(v); }
      v.currentTime = 0; v.play().then(() => card.classList.add("previewing")).catch(() => {});
    }, 350);
  });
  card.addEventListener("mouseleave", () => { clearTimeout(t); if (v) { v.pause(); card.classList.remove("previewing"); } });
}

/* ---------- lightbox ---------- */
const lb = $("#lb"), lbVideo = $("#lbVideo");
let lastFocus;
function openLB(w) {
  stopDemo();
  lastFocus = document.activeElement;
  const media = $(".lb-media");
  if (w.kind === "audio") {
    media.innerHTML = `<div class="lb-audio"><div class="eq" aria-hidden="true">${Array.from({ length: 22 }, (_, j) => `<i style="height:${24 + ((j * 41) % 90)}px;animation-delay:-${(j * 0.11).toFixed(2)}s"></i>`).join("")}</div><audio controls autoplay src="${esc(w.src)}"></audio></div>`;
  } else if (w.kind === "youtube" && w.ytId) {
    media.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(w.ytId)}?autoplay=1&rel=0&modestbranding=1" title="${esc(w.title[lang])}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  } else {
    media.innerHTML = `<video controls playsinline autoplay poster="${esc(w.poster)}" src="${esc(w.src)}"></video>`;
  }
  $("#lbTags").innerHTML = tagsHTML(w);
  $("#lbTitle").textContent = w.title[lang];
  $("#lbNote").textContent = w.note[lang];
  lb.hidden = false;
  document.body.style.overflow = "hidden";
  $("#lbX").focus();
}
function closeLB() {
  $$(".lb-media video, .lb-media audio").forEach((m) => m.pause());
  $(".lb-media").innerHTML = "";
  lb.hidden = true;
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}
$("#lbX").addEventListener("click", closeLB);
lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLB(); });

/* ---------- services / process / reviews ---------- */
function renderServices() {
  $("#services-list").innerHTML = SERVICES.map((s) =>
    `<div class="svc reveal in"><div class="ic">${icon(s.icon)}</div><h3>${s[lang][0]}</h3><p>${s[lang][1]}</p></div>`).join("");
  $("#process").innerHTML = PROCESS[lang].map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join("");
}
function renderReviews() {
  $("#reviews-list").innerHTML = REVIEWS.map((r) =>
    `<figure class="rev reveal in"><span class="q" aria-hidden="true">”</span>
      <div class="stars" aria-label="5/5">${icon(STAR).repeat(5)}</div>
      <blockquote ${lang === "ar" ? 'dir="rtl"' : ""}>${lang === "ar" ? r.t : r.en}</blockquote>
      <figcaption class="who"><span class="av">${r.n[0]}</span><span><b dir="ltr">${r.n}</b><small>${T[lang]["rev.role"]}</small></span></figcaption>
    </figure>`).join("");
}

/* ---------- hero demo player with real waveform ---------- */
const demo = $("#demo"), demoAudio = $("#demoAudio"), canvas = $("#demoWave");
let peaks = null;

function drawWave() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w) return;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const bars = Math.floor(w / 4);
  const p = peaks || Array.from({ length: 200 }, (_, i) => 0.25 + 0.5 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11)));
  const prog = demoAudio.duration ? demoAudio.currentTime / demoAudio.duration : 0;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#4361EE"); g.addColorStop(1, "#8E3BF0");
  const rtl = document.documentElement.dir === "rtl";
  for (let i = 0; i < bars; i++) {
    const v = p[Math.floor((i / bars) * p.length)];
    const bh = Math.max(3, v * (h - 4));
    const x = rtl ? w - (i * 4) - 2.5 : i * 4;
    ctx.fillStyle = i / bars <= prog ? g : "rgba(102,112,148,.28)";
    ctx.beginPath();
    (ctx.roundRect ? ctx.roundRect(x, (h - bh) / 2, 2.5, bh, 1.25) : ctx.rect(x, (h - bh) / 2, 2.5, bh));
    ctx.fill();
  }
}
async function loadPeaks() {
  try {
    const buf = await (await fetch(demoAudio.src)).arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    const audio = await ac.decodeAudioData(buf);
    const data = audio.getChannelData(0), N = 240, step = Math.floor(data.length / N);
    const out = [];
    for (let i = 0; i < N; i++) { let m = 0; for (let j = 0; j < step; j += 16) { const a = Math.abs(data[i * step + j]); if (a > m) m = a; } out.push(m); }
    const max = Math.max(...out) || 1;
    peaks = out.map((x) => Math.pow(x / max, 0.8));
    ac.close && ac.close();
    drawWave();
  } catch (e) { /* keep placeholder wave */ }
}
function stopDemo() { if (!demoAudio.paused) demoAudio.pause(); }
$("#demoPlay").addEventListener("click", () => { demoAudio.paused ? demoAudio.play() : demoAudio.pause(); });
demoAudio.addEventListener("play", () => demo.classList.add("playing"));
demoAudio.addEventListener("pause", () => demo.classList.remove("playing"));
demoAudio.addEventListener("ended", () => { demo.classList.remove("playing"); demoAudio.currentTime = 0; drawWave(); });
demoAudio.addEventListener("loadedmetadata", () => {
  $("#demoDur").textContent = fmt(demoAudio.duration);
  const ad = $('[data-dur="car"]'); if (ad) ad.textContent = fmt(demoAudio.duration);
});
demoAudio.addEventListener("timeupdate", () => { $("#demoCur").textContent = fmt(demoAudio.currentTime); drawWave(); });
canvas.addEventListener("click", (e) => {
  if (!demoAudio.duration) return;
  const r = canvas.getBoundingClientRect();
  let x = (e.clientX - r.left) / r.width;
  if (document.documentElement.dir === "rtl") x = 1 - x;
  demoAudio.currentTime = x * demoAudio.duration;
  drawWave();
});
window.addEventListener("resize", drawWave);

/* ---------- form ---------- */
const fileIn = $("#fileIn"), fileName = $("#fileName");
fileIn.addEventListener("change", () => {
  const f = fileIn.files[0];
  if (f) { fileName.dataset.picked = f.name; fileName.textContent = f.name; }
  else { delete fileName.dataset.picked; fileName.textContent = T[lang]["f.file"]; }
});
/* The form posts into a hidden iframe, so the page never reloads or jumps. */
const form = $("#mailForm"), sink = $("#formSink"), ok = $("#formOk"), sendBtn = $("button[type=submit]", form);
$("#nextUrl").value = new URL("thanks.html", location.href).href;
let sending = false;
form.addEventListener("submit", () => {
  sending = true; ok.hidden = true;
  sendBtn.disabled = true; sendBtn.firstElementChild.textContent = T[lang]["f.sending"];
});
sink.addEventListener("load", () => {
  if (!sending) return;
  sending = false;
  sendBtn.disabled = false; sendBtn.firstElementChild.textContent = T[lang]["f.send"];
  form.reset(); delete fileName.dataset.picked; fileName.textContent = T[lang]["f.file"];
  ok.hidden = false;
  ok.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

/* ---------- count-up stats ---------- */
function countUp(el) {
  const to = +el.dataset.count, dur = 1600, t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * e);
    if (p < 1) requestAnimationFrame(step);
  };
  el.textContent = "0";
  requestAnimationFrame(step);
}
const counters = $$("[data-count]");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const co = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } }), { threshold: 0.6 });
  counters.forEach((c) => { c.textContent = "0"; co.observe(c); });
}

/* ---------- keep the address bar clean ---------- */
// Old links may carry "?sent=1" or "#top": drop them without reloading.
if (location.search || location.hash === "#top") history.replaceState(null, "", location.pathname + (location.hash === "#top" ? "" : location.hash));
// In-page links scroll smoothly without adding "#..." to the URL.
document.addEventListener("click", (e) => {
  // The name/logo goes back to the top of the page (no reload, nothing added to the URL).
  const brand = e.target.closest("a.brand");
  if (brand && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault();
    scrollTo({ top: 0, behavior: "smooth" });
    if (location.hash || location.search) history.replaceState(null, "", location.pathname);
    return;
  }
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented) return;
  const id = a.getAttribute("href").slice(1);
  const el = id === "top" ? null : document.getElementById(id);
  if (id !== "top" && !el) return;
  e.preventDefault();
  if (el) el.scrollIntoView({ behavior: "smooth" }); else scrollTo({ top: 0, behavior: "smooth" });
  if (location.hash) history.replaceState(null, "", location.pathname);
});

/* ---------- nav / lang / reveal ---------- */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 10);
addEventListener("scroll", onScroll, { passive: true }); onScroll();

$("#langBtn").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyLang(); drawWave();
});

const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;
$$(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

$("#yr").textContent = new Date().getFullYear();
applyLang();

/* Load the live works managed from the admin dashboard. */
fetch("/api/works", { headers: { accept: "application/json" } })
  .then((r) => (r.ok && (r.headers.get("content-type") || "").includes("json") ? r.json() : null))
  .then((data) => {
    if (!data || !Array.isArray(data.works)) return;
    WORKS = data.works.map(normWork);
    renderFilters(); renderGrid();
  })
  .catch(() => {});
drawWave();
if ("requestIdleCallback" in window) requestIdleCallback(loadPeaks, { timeout: 2500 }); else setTimeout(loadPeaks, 1200);
})();
