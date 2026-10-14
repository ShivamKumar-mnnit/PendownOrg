// Student and college accounts, sign-in tokens and "who can open what".
// Shared by the accounts, content and tests APIs. Everything lives in the
// "anobyt-content" store:
//   user:<id>          the account (password stored as a PBKDF2 hash)
//   email:<address>    -> user id
//   secret:session     random key that signs sign-in tokens (made on first use)
//   access             which premium features exist, free or paid, and prices
//   runner             optional backup code runner (Judge0)

import { bool, num, str } from "./http.js";

export const FEATURES = {
  allAccess: { title: "Premium membership", text: "Everything for students: every premium practice problem, every premium course and the test builder." },
  practice: { title: "Premium practice", text: "Every premium coding problem in all four years, with the solutions and hints each year allows." },
  createTests: { title: "Create tests", text: "Build your own MCQ and coding tests, share a link and see every student's score." },
  studentData: { title: "Student records", text: "Add, update, import and export student records in one place." },
  collegePanel: { title: "College panel", text: "A dashboard for colleges: manage your students, follow their practice progress, create tests and see results." },
  allCourses: { title: "All premium courses", text: "Every paid module of every course, unlocked." },
};
// The college panel includes the two smaller tools.
// Premium membership includes practice, courses and the test builder.
const INCLUDED = { createTests: ["collegePanel", "allAccess"], studentData: ["collegePanel"], practice: ["allAccess"], allCourses: ["allAccess"] };

export const DEFAULT_ACCESS = {
  allAccess: { enabled: true, paid: true, price: 1499, days: 365 },
  practice: { enabled: true, paid: true, price: 499, days: 365 },
  createTests: { enabled: true, paid: true, price: 499, days: 365 },
  studentData: { enabled: true, paid: true, price: 299, days: 365 },
  collegePanel: { enabled: true, paid: true, price: 4999, days: 365 },
  allCourses: { enabled: true, paid: true, price: 1999, days: 365 },
};

export function cleanAccess(input) {
  const out = {};
  for (const id of Object.keys(FEATURES)) {
    const f = input?.[id] || {};
    const d = DEFAULT_ACCESS[id];
    out[id] = {
      enabled: f.enabled === undefined ? d.enabled : bool(f.enabled),
      paid: f.paid === undefined ? d.paid : bool(f.paid),
      price: Math.max(0, Math.round(num(f.price, d.price) * 100) / 100),
      days: Math.max(0, Math.trunc(num(f.days, d.days))),
    };
  }
  return out;
}

/** The features a user's grants include through a bundle (for showing "included in your membership"). */
export const includedIn = (id) => INCLUDED[id] || [];

export const readAccess = async (store) => cleanAccess((await store.get("access")) || {});

export async function readRunner(store) {
  const r = (await store.get("runner")) || {};
  return { judge0Url: str(r.judge0Url, 300), judge0Key: str(r.judge0Key, 300), judge0Host: str(r.judge0Host, 200), prefer: r.prefer === "judge0" ? "judge0" : "primary" };
}

// ---- Crypto helpers ----

const enc = new TextEncoder();
export const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64url = (s) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));
export const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function hmacRaw(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}

const ITER = 100_000;
export async function hashPassword(password, saltB64) {
  const salt = saltB64 ? Uint8Array.from(fromB64url(saltB64), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITER }, key, 256);
  return { salt: b64url(salt), hash: b64url(bits), iter: ITER };
}

export async function checkPassword(password, rec) {
  if (!rec?.salt || typeof password !== "string") return false;
  const { hash } = await hashPassword(password, rec.salt);
  let diff = hash.length ^ rec.hash.length;
  for (let i = 0; i < Math.min(hash.length, rec.hash.length); i++) diff |= hash.charCodeAt(i) ^ rec.hash.charCodeAt(i);
  return diff === 0;
}

async function sessionSecret(store) {
  let s = await store.get("secret:session");
  if (!s?.key) {
    s = { key: b64url(crypto.getRandomValues(new Uint8Array(32))), createdAt: Date.now() };
    await store.set("secret:session", s);
  }
  return s.key;
}

const TOKEN_DAYS = 30;
export async function makeUserToken(store, user) {
  const payload = b64url(enc.encode(JSON.stringify({ u: user.id, v: user.sv || 0, e: Date.now() + TOKEN_DAYS * 864e5 })));
  return `${payload}.${b64url(await hmacRaw(await sessionSecret(store), payload))}`;
}

/** The signed-in account behind `x-user-token`, or null. */
export async function readUser(request, store) {
  const token = request.headers.get("x-user-token") || "";
  if (!token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  try {
    if (sig !== b64url(await hmacRaw(await sessionSecret(store), payload))) return null;
    const { u, v, e } = JSON.parse(fromB64url(payload));
    if (!u || e < Date.now()) return null;
    const user = await store.get("user:" + u);
    if (!user || user.disabled || (user.sv || 0) !== v) return null;
    return user;
  } catch {
    return null;
  }
}

// ---- What a user can open ----

const live = (g, now = Date.now()) => !g.expiresAt || g.expiresAt > now;
export const activeGrants = (user) => (user?.grants || []).filter((g) => live(g));

/** True when the feature is switched on and is free, or the user bought it (or a bundle that includes it). */
export function hasFeature(user, id, access) {
  const cfg = access[id];
  if (!cfg?.enabled || !user) return false;
  if (!cfg.paid) return true;
  const ids = [id, ...(INCLUDED[id] || [])];
  return activeGrants(user).some((g) => g.type === "feature" && ids.includes(g.id));
}

export function featureSummary(user, access) {
  const out = {};
  for (const id of Object.keys(FEATURES)) {
    const cfg = access[id];
    const grant = activeGrants(user).find((g) => g.type === "feature" && g.id === id);
    out[id] = { ...FEATURES[id], ...cfg, has: hasFeature(user, id, access), expiresAt: grant?.expiresAt || 0 };
  }
  return out;
}

/** Which parts of a course this user has paid for: { all, modules: Set of module ids }. */
export function courseUnlocks(user, courseId, access) {
  const grants = activeGrants(user);
  const all = hasFeature(user, "allCourses", access) || grants.some((g) => g.type === "course" && g.id === courseId);
  const modules = new Set(grants.filter((g) => g.type === "module" && g.courseId === courseId).map((g) => g.moduleId));
  return { all, modules };
}

/** A module is free when the course is free, the admin marked it free, or it sits within the course's free-module count. */
export function moduleIsFree(course, index) {
  const m = course.modules[index];
  if (course.tier === "free" || m?.access === "free") return true;
  if (m?.access === "paid") return false;
  return index < (course.freeModules || 0);
}

/** The account as its owner sees it (no password hash). */
export function publicUser(u) {
  if (!u) return null;
  const { pass: _p, sv: _s, failed: _f, lockUntil: _l, ...rest } = u;
  return rest;
}
