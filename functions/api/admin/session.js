import { json, getSetting, isAuthed } from "../../../lib/core.js";

export async function onRequestGet({ request, env }) {
  const needsSetup = !(await getSetting(env.DB, "pw_hash"));
  return json({ needsSetup, authed: needsSetup ? false : await isAuthed(request, env.DB) });
}
