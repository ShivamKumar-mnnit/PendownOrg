// Shared compile-proxy logic, used by both the Netlify function (production)
// and the Vite dev-server middleware (local `npm run dev`). Kept in one
// place so the two environments can't drift.
//
// Why a proxy at all: the hosted compile service doesn't send
// Access-Control-Allow-Origin, so browsers refuse the request outright
// (blocked at the CORS preflight, before it ever reaches the service). A
// same-origin proxy sidesteps that, and as a bonus keeps the service's auth
// token out of the shipped client bundle.

const COMPILE_ENDPOINT = "https://api.anobyt.in/api/v1/compile";
const COMPILE_AUTH_TOKEN = "anVzdGZrb2Zm";

const ALLOWED_LANGUAGES = new Set(["python", "javascript", "java", "c", "cpp"]);

/**
 * @param {{ language: string, code: string, stdin?: string }} body
 * @returns {Promise<{ statusCode: number, body: object }>}
 */
export async function handleCompile(body) {
  const { language, code, stdin } = body || {};

  if (typeof code !== "string" || !code.trim()) {
    return { statusCode: 400, body: { error: "Missing code." } };
  }
  if (!ALLOWED_LANGUAGES.has(language)) {
    return { statusCode: 400, body: { error: "Unsupported language." } };
  }

  const res = await fetch(COMPILE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: COMPILE_AUTH_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ language, code, stdin: typeof stdin === "string" ? stdin : "" }),
  });

  const data = await res.json();
  return { statusCode: res.status, body: data };
}
