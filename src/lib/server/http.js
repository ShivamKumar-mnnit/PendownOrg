// Small helpers shared by the server-side API handlers (Netlify functions
// in production, Vite dev middleware locally).

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const fail = (status, error) => json({ error }, status);

export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Admin requests send `x-admin-key`, which must equal ADMIN_PASSWORD. */
export function adminState(request, env) {
  const configured = typeof env.ADMIN_PASSWORD === "string" && env.ADMIN_PASSWORD.length > 0;
  const ok = configured && safeEqual(request.headers.get("x-admin-key") || "", env.ADMIN_PASSWORD);
  return { configured, ok };
}

export const needAdmin = (admin) =>
  admin.configured
    ? fail(401, "Wrong admin password.")
    : fail(503, "Admin password is not set up. Add ADMIN_PASSWORD in Netlify environment variables.");

export async function readBody(request) {
  if (request.method !== "POST" && request.method !== "PUT") return { body: null };
  try {
    const raw = await request.text();
    return { body: raw ? JSON.parse(raw) : {} };
  } catch {
    return { error: fail(400, "Invalid JSON body.") };
  }
}

export const str = (v, max = 20000) => (typeof v === "string" ? v.slice(0, max) : "");
export const num = (v, d = 0) => (v !== "" && v !== null && Number.isFinite(Number(v)) ? Number(v) : d);
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** In-memory store for local development (data resets when the dev server restarts). */
export function memoryStore() {
  const m = new Map();
  return {
    async get(k) {
      return m.has(k) ? structuredClone(m.get(k)) : null;
    },
    async set(k, v) {
      m.set(k, structuredClone(v));
    },
    async delete(k) {
      m.delete(k);
    },
    async list(prefix) {
      return [...m.keys()].filter((k) => k.startsWith(prefix));
    },
  };
}
