// Shared compile-proxy logic, used by the Netlify function (production), the
// Vite dev-server middleware (local `npm run dev`) and the test grader.
// Kept in one place so the environments can't drift.
//
// Why a proxy at all: the hosted compile service doesn't send
// Access-Control-Allow-Origin, so browsers refuse the request outright
// (blocked at the CORS preflight, before it ever reaches the service). A
// same-origin proxy sidesteps that, and as a bonus keeps the service's auth
// token out of the shipped client bundle.

const COMPILE_ENDPOINT = "https://api.anobyt.in/api/v1/compile";
const COMPILE_AUTH_TOKEN = "anVzdGZrb2Zm";

const ALLOWED_LANGUAGES = new Set(["python", "javascript", "java", "c", "cpp"]);
const MAX_CODE_CHARS = 100_000;
const MAX_STDIN_CHARS = 100_000;
const TIMEOUT_MS = 20_000;

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
  if (code.length > MAX_CODE_CHARS || (typeof stdin === "string" && stdin.length > MAX_STDIN_CHARS)) {
    return { statusCode: 413, body: { error: "Code or input is too large." } };
  }

  // Before, a slow, unreachable or non-JSON response from the compile
  // service threw here, so the function crashed with an empty 500 and the
  // page showed a confusing JSON parse error. Every failure now comes back
  // as a clear message.
  let res;
  try {
    res = await fetch(COMPILE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: COMPILE_AUTH_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ language, code, stdin: typeof stdin === "string" ? stdin : "" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
    return {
      statusCode: timedOut ? 504 : 502,
      body: { error: timedOut ? "The code runner took too long to respond. Please try again." : "Could not reach the code runner. Please try again." },
    };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { statusCode: 502, body: { error: `The code runner returned an unexpected response (${res.status}).` } };
  }
  if (!res.ok && !data?.error) data = { ...data, error: data?.message || `The code runner returned ${res.status}.` };
  return { statusCode: res.status, body: data };
}
