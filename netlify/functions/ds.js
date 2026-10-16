// Same-origin proxy to the data service for deploys other than https://anobyt.in
// (branch deploys, previews). The data service only allows the anobyt.in origin
// (CORS), so those sites call /ds/* here and this forwards the request without
// the browser's Origin header. Production calls the data service directly.

const TARGET = process.env.DATA_SERVICE_URL || "https://dataservice.anobyt.in";
const PASS = ["x-secret-key", "authorization", "content-type", "accept"];

export default async function handler(request) {
  const url = new URL(request.url);
  const headers = {};
  for (const h of PASS) {
    const v = request.headers.get(h);
    if (v) headers[h] = v;
  }
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let res;
  try {
    res = await fetch(TARGET + url.pathname.replace(/^\/ds/, "") + url.search, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });
  } catch {
    return new Response(JSON.stringify({ status: 502, message: "Could not reach the data service." }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
  const out = new Headers();
  for (const h of ["content-type", "content-disposition", "retry-after"]) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("Cache-Control", "no-store");
  return new Response(res.status === 204 ? null : await res.arrayBuffer(), { status: res.status, headers: out });
}

export const config = { path: "/ds/*" };
