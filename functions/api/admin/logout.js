import { json, clearSessionCookie } from "../../../lib/core.js";

export const onRequestPost = () => json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
