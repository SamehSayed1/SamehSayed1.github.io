// Public list of visible works, in display order.
import { json, publicWork } from "../../lib/core.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM works WHERE visible = 1 ORDER BY sort ASC, created_at DESC").all();
  // No caching: edits made in the dashboard must show up on the next page load.
  return json({ works: results.map(publicWork) }, 200, { "cache-control": "no-store" });
}
