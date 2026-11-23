// Serves uploaded files from KV, with Range support so videos can seek.
export async function onRequestGet({ request, env, params }) {
  const key = (params.path || []).join("/");
  if (!/^m\/[\w.-]+$/.test(key)) return new Response("Not found", { status: 404 });
  const { value, metadata } = await env.MEDIA.getWithMetadata(key, "arrayBuffer");
  if (!value) return new Response("Not found", { status: 404 });
  const total = value.byteLength;
  const headers = {
    "content-type": metadata?.type || "application/octet-stream",
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
  };
  const range = request.headers.get("range");
  const m = range && range.match(/bytes=(\d*)-(\d*)/);
  if (m && (m[1] !== "" || m[2] !== "")) {
    let start = m[1] === "" ? total - Number(m[2]) : Number(m[1]);
    let end = m[1] !== "" && m[2] !== "" ? Number(m[2]) : total - 1;
    start = Math.max(0, start);
    end = Math.min(end, total - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
    return new Response(value.slice(start, end + 1), {
      status: 206,
      headers: { ...headers, "content-range": `bytes ${start}-${end}/${total}`, "content-length": String(end - start + 1) },
    });
  }
  return new Response(value, { headers: { ...headers, "content-length": String(total) } });
}
