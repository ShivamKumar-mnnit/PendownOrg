// Browser client for the tests API (netlify/functions/tests.js). The admin
// password is kept in sessionStorage only, so it is forgotten when the tab
// closes.

const KEY = "anobyt_admin_key";

export const TEST_TYPE_LABELS = { mcq: "MCQ test", coding: "Coding assessment", olympiad: "Olympiad" };
export const KIND_LABELS = { single: "Single correct", multi: "Multiple correct", numeric: "Numeric answer", coding: "Coding problem" };
export const LANG_LABELS = { python: "Python", javascript: "JavaScript", java: "Java", c: "C", cpp: "C++" };

export function getAdminKey() {
  try {
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}
export function setAdminKey(key) {
  try {
    if (key) sessionStorage.setItem(KEY, key);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the key just won't survive a reload */
  }
}

export async function call(path, { method = "GET", body, admin = false, headers: extra } = {}) {
  const headers = { ...extra };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (admin) headers["x-admin-key"] = getAdminKey();
  let res;
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON (e.g. the function isn't deployed) */
  }
  if (!res.ok || !data) {
    const err = new Error(data?.error || `The server is unavailable right now (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const adminLogin = (key) =>
  fetch("/api/admin/login", { method: "POST", headers: { "x-admin-key": key, "Content-Type": "application/json" }, body: "{}" }).then(
    async (res) => {
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, error: data?.error };
    },
    () => ({ ok: false, status: 0, error: "Could not reach the server." }),
  );

export const listPublishedTests = () => call("/api/tests").then((d) => d.tests);
export const listAllTests = () => call("/api/tests?all=1", { admin: true }).then((d) => d.tests);
export const getTest = (id) => call(`/api/tests/${encodeURIComponent(id)}`).then((d) => d.test);
export const getFullTest = (id) => call(`/api/tests/${encodeURIComponent(id)}?full=1`, { admin: true }).then((d) => d.test);
export const createTest = (test) => call("/api/tests", { method: "POST", body: test, admin: true }).then((d) => d.test);
export const updateTest = (id, test) => call(`/api/tests/${encodeURIComponent(id)}`, { method: "PUT", body: test, admin: true }).then((d) => d.test);
export const deleteTest = (id) => call(`/api/tests/${encodeURIComponent(id)}`, { method: "DELETE", admin: true });
export const getResults = (id) => call(`/api/tests/${encodeURIComponent(id)}/results`, { admin: true }).then((d) => d.submissions);
export const submitTest = (id, payload) => call(`/api/tests/${encodeURIComponent(id)}/submit`, { method: "POST", body: payload });
