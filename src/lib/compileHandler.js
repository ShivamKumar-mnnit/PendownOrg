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

// Judge0 language ids (Judge0 CE), used when a backup runner is configured.
const JUDGE0_LANGS = { python: 71, javascript: 63, java: 62, c: 50, cpp: 54 };

/**
 * Runs code on the main runner (api.anobyt.in). When that runner is down and
 * the admin has saved a backup Judge0 runner (admin → Compiler), the code
 * runs there instead, so students still get a result.
 *
 * @param {{ language: string, code: string, stdin?: string }} body
 * @param {{ judge0Url?: string, judge0Key?: string, judge0Host?: string, prefer?: string }} [runner]
 * @returns {Promise<{ statusCode: number, body: object }>}
 */
export async function handleCompile(body, runner) {
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
  const backup = runner && runner.judge0Url ? runner : null;
  if (backup && runner.prefer === "judge0") return runJudge0({ language, code, stdin }, backup);
  const first = await runPrimary({ language, code, stdin });
  if (backup && first.statusCode >= 500) {
    const second = await runJudge0({ language, code, stdin }, backup);
    if (second.statusCode < 500) return second;
  }
  return first;
}

/** Calls a Judge0 server (self-hosted, or RapidAPI with a key) and maps its answer to our shape. */
export async function runJudge0({ language, code, stdin }, runner, fetchImpl = fetch) {
  const b64 = (s) => Buffer.from(String(s ?? ""), "utf8").toString("base64");
  const unb64 = (s) => (s ? Buffer.from(s, "base64").toString("utf8") : "");
  const headers = { "Content-Type": "application/json" };
  if (runner.judge0Key) {
    if (/rapidapi/i.test(runner.judge0Url)) {
      headers["X-RapidAPI-Key"] = runner.judge0Key;
      headers["X-RapidAPI-Host"] = runner.judge0Host || new URL(runner.judge0Url).host;
    } else headers["X-Auth-Token"] = runner.judge0Key;
  }
  let res;
  try {
    res = await fetchImpl(`${runner.judge0Url.replace(/\/+$/, "")}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers,
      body: JSON.stringify({ source_code: b64(code), language_id: JUDGE0_LANGS[language], stdin: b64(stdin) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
    return { statusCode: timedOut ? 504 : 502, body: { error: timedOut ? "The backup code runner took too long to respond." : "Could not reach the backup code runner." } };
  }
  let d;
  try {
    d = await res.json();
  } catch {
    return { statusCode: 502, body: { error: `The backup code runner returned an unexpected response (${res.status}).` } };
  }
  if (!res.ok) return { statusCode: res.status >= 500 ? 502 : res.status, body: { error: d?.message || d?.error || `The backup code runner returned ${res.status}.` } };
  const statusId = d.status?.id;
  const compileOut = unb64(d.compile_output);
  return {
    statusCode: 200,
    body: {
      status: statusId === 3 ? "SUCCESS" : "ERROR",
      stdout: unb64(d.stdout),
      stderr: compileOut || unb64(d.stderr) || (statusId !== 3 ? d.status?.description || "" : ""),
      exitCode: typeof d.exit_code === "number" ? d.exit_code : statusId === 3 ? 0 : 1,
      executionTimeMs: d.time ? Math.round(Number(d.time) * 1000) : undefined,
      verdict: d.status?.description,
      runner: "backup",
    },
  };
}

async function runPrimary({ language, code, stdin }) {
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
