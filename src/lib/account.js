// Browser side of student / college accounts and payments
// (netlify/functions/accounts.js). The sign-in token lives in localStorage;
// every page that needs the account reads it through useAccount().

import { useEffect, useState, useSyncExternalStore } from "react";
import { call } from "./testsApi";

const TOKEN_KEY = "anobyt_user_token";
const enc = encodeURIComponent;

export function getUserToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
function setUserToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: stays signed in for this page only */
  }
}
export const userHeaders = () => (getUserToken() ? { "x-user-token": getUserToken() } : {});
const authed = (path, opts = {}) => call(path, { ...opts, headers: { ...userHeaders(), ...opts.headers } });

// ---- Shared account state (one fetch per page load, all components stay in sync) ----

let state = { user: null, features: null, loaded: false };
const subs = new Set();
function setState(next) {
  state = { ...state, ...next, loaded: true };
  subs.forEach((f) => f(state));
}
let loading = null;
export function refreshAccount() {
  if (!getUserToken()) {
    setState({ user: null, features: null });
    return Promise.resolve(state);
  }
  loading = authed("/api/auth/me").then(
    (d) => setState({ user: d.user, features: d.features }),
    (e) => {
      if (e.status === 401) setUserToken("");
      setState({ user: null, features: null });
    },
  );
  return loading.then(() => state);
}

const subscribe = (f) => {
  subs.add(f);
  if (!state.loaded && !loading) refreshAccount();
  return () => subs.delete(f);
};
const snapshot = () => state;

export function useAccount() {
  return useSyncExternalStore(subscribe, snapshot);
}

function signedIn(d) {
  setUserToken(d.token);
  setState({ user: d.user, features: d.features });
  return d;
}
export const signup = (data) => call("/api/auth/signup", { method: "POST", body: data }).then(signedIn);
export const login = (email, password) => call("/api/auth/login", { method: "POST", body: { email, password } }).then(signedIn);
export async function logout(everywhere = false) {
  await authed("/api/auth/logout", { method: "POST", body: { everywhere } }).catch(() => null);
  setUserToken("");
  setState({ user: null, features: null });
}
export const updateProfile = (data) =>
  authed("/api/auth/me", { method: "PUT", body: data }).then((d) => {
    if (d.token) setUserToken(d.token);
    setState({ user: d.user });
    return d;
  });
/** Saves solved practice problems to the account (ignored when signed out). */
export const syncSolved = (ids) => (getUserToken() ? authed("/api/auth/progress", { method: "PUT", body: { solved: ids } }).catch(() => null) : Promise.resolve(null));
export const myPayments = () => authed("/api/pay/mine").then((d) => d.payments);

// ---- Payments ----

let payConfig = null;
export const getPayConfig = (fresh = false) => {
  if (!payConfig || fresh) payConfig = call("/api/pay/config").catch((e) => ((payConfig = null), Promise.reject(e)));
  return payConfig;
};

export function usePayConfig() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => {
    let on = true;
    getPayConfig().then(
      (c) => on && setCfg(c),
      () => on && setCfg({ features: {}, razorpay: null, upi: null, offline: true }),
    );
    return () => {
      on = false;
    };
  }, []);
  return cfg;
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection."));
    document.body.appendChild(s);
  });
}

/**
 * Opens Razorpay checkout for an item ({type:"feature", id} | {type:"course", id} |
 * {type:"module", courseId, moduleId}). Resolves with the verified payment, or
 * null when the student closes the window.
 */
export async function payWithRazorpay(item) {
  const order = await authed("/api/pay/order", { method: "POST", body: { item } });
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      prefill: order.prefill,
      theme: { color: "#4f46e5" },
      handler: (r) =>
        authed("/api/pay/verify", { method: "POST", body: { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature } }).then(
          (d) => {
            setState({ user: d.user, features: d.features });
            resolve(d.payment);
          },
          reject,
        ),
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r.error?.description || "The payment failed. No money was taken, or it will be refunded by your bank.")));
    rzp.open();
  });
}

export const payManually = (item, utr) => authed("/api/pay/manual", { method: "POST", body: { item, utr } }).then((d) => d.payment);

export const rupees = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const validity = (days) => (days ? (days % 365 === 0 ? `${days / 365} year${days > 365 ? "s" : ""}` : `${days} days`) : "lifetime");

// ---- Workspace (student records) ----

export const listStudents = () => authed("/api/workspace/students");
export const addStudent = (s) => authed("/api/workspace/students", { method: "POST", body: s }).then((d) => d.student);
export const saveStudent = (id, s) => authed(`/api/workspace/students/${enc(id)}`, { method: "PUT", body: s }).then((d) => d.student);
export const removeStudent = (id) => authed(`/api/workspace/students/${enc(id)}`, { method: "DELETE" });
export const importStudents = (rows) => authed("/api/workspace/students/import", { method: "POST", body: { rows } });

// ---- Tests owned by the signed-in user ----

export const myTests = () => authed("/api/tests?mine=1");
export const myTest = (id) => authed(`/api/tests/${enc(id)}?full=1`).then((d) => d.test);
export const createMyTest = (t) => authed("/api/tests", { method: "POST", body: t }).then((d) => d.test);
export const updateMyTest = (id, t) => authed(`/api/tests/${enc(id)}`, { method: "PUT", body: t }).then((d) => d.test);
export const deleteMyTest = (id) => authed(`/api/tests/${enc(id)}`, { method: "DELETE" });
export const myTestResults = (id) => authed(`/api/tests/${enc(id)}/results`).then((d) => d.submissions);

// ---- Admin ----

const adm = (path, opts = {}) => call(path, { ...opts, admin: true });
export const adminAccess = () => adm("/api/manage/access");
export const saveAccess = (a) => adm("/api/manage/access", { method: "PUT", body: a }).then((d) => d.access);
export const adminPaySettings = () => adm("/api/manage/payment-settings");
export const savePaySettings = (s) => adm("/api/manage/payment-settings", { method: "PUT", body: s });
export const testPayAccount = (id) => adm(`/api/manage/payment-test/${enc(id)}`, { method: "POST", body: {} });
export const adminPayments = () => adm("/api/manage/payments").then((d) => d.payments);
export const decidePayment = (id, action) => adm(`/api/manage/payments/${enc(id)}`, { method: "PUT", body: { action } }).then((d) => d.payment);
export const adminUsers = () => adm("/api/manage/users").then((d) => d.users);
export const adminUser = (id) => adm(`/api/manage/users/${enc(id)}`);
export const adminCreateUser = (u) => adm("/api/manage/users", { method: "POST", body: u }).then((d) => d.user);
export const adminSaveUser = (id, u) => adm(`/api/manage/users/${enc(id)}`, { method: "PUT", body: u }).then((d) => d.user);
export const adminDeleteUser = (id) => adm(`/api/manage/users/${enc(id)}`, { method: "DELETE" });
export const adminRunner = () => adm("/api/manage/runner").then((d) => d.runner);
export const saveRunner = (r) => adm("/api/manage/runner", { method: "PUT", body: r }).then((d) => d.runner);
export const testRunner = (which = "") => adm(`/api/manage/runner/test${which ? "/" + which : ""}`, { method: "POST", body: {} }).then((d) => d.results);
