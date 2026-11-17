// Same-origin proxy to the data service, the Cloudflare version of netlify/functions/ds.js.
// Production (https://anobyt.in) calls the data service directly; preview deploys
// (*.pages.dev) call /ds/* here because the data service only allows the anobyt.in origin (CORS).
// This forwards the request without the browser's Origin header.

const PASS = ["x-secret-key", "authorization", "content-type", "accept"];

export async function onRequest({ request, env }) {
  const target = env.DATA_SERVICE_URL || "https://dataservice.anobyt.in";
  const url = new URL(request.url);
  const headers = {};
  for (const h of PASS) {
    const v = request.headers.get(h);
    if (v) headers[h] = v;
  }
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let res;
  try {
    res = await fetch(target + url.pathname.replace(/^\/ds/, "") + url.search, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });
  } catch {
    return Response.json({ status: 502, message: "Could not reach the data service." }, { status: 502 });
  }
  const out = new Headers();
  for (const h of ["content-type", "content-disposition", "retry-after"]) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("Cache-Control", "no-store");
  return new Response(res.status === 204 ? null : await res.arrayBuffer(), { status: res.status, headers: out });
}
