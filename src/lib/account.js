// The signed-in account. Sign-in happens on the Anobyt data service
// (src/lib/dataService.js); its token is also sent to the Netlify functions
// as `x-user-token`, which link it to the purchases / premium record with the
// same email (src/lib/server/auth.js). Every page reads it through useAccount().

import { useEffect, useState, useSyncExternalStore } from "react";
import { call } from "./testsApi";
import { authApi, getToken, onSignedOut, setToken } from "./dataService";

const enc = encodeURIComponent;

// Tokens from the old Netlify-only accounts no longer work; drop them.
try {
  localStorage.removeItem("anobyt_user_token");
} catch {
  /* storage blocked */
}

export const getUserToken = getToken;
export const userHeaders = () => (getToken() ? { "x-user-token": getToken() } : {});
const authed = (path, opts = {}) => call(path, { ...opts, headers: { ...userHeaders(), ...opts.headers } });

// ---- Shared account state (one fetch per page load, all components stay in sync) ----

// user: the data-service profile, plus the purchases record's grants/progress when linked.
let state = { user: null, features: null, loaded: false };
const subs = new Set();
function setState(next) {
  state = { ...state, ...next, loaded: true };
  subs.forEach((f) => f(state));
}

/** Data-service user + linked purchases record -> the shape the pages use. */
function merge(dsUser, local) {
  if (!dsUser) return null;
  return {
    ...(local || {}),
    ...dsUser,
    college: dsUser.college?.name || local?.college || "",
    collegeCode: dsUser.college?.code || "",
    collegeName: dsUser.college?.name || dsUser.organization || local?.collegeName || "",
    grants: local?.grants || [],
    progress: local?.progress,
  };
}

/** Loads the purchases / premium features linked to the account (Netlify). */
function loadFeatures(dsUser) {
  if (dsUser.mustChangePassword) return Promise.resolve(null);
  return authed("/api/auth/me").then(
    (d) => d,
    () => null,
  );
}

let loading = null;
export function refreshAccount() {
  if (!getToken()) {
    setState({ user: null, features: null });
    return Promise.resolve(state);
  }
  loading = authApi.me().then(
    async (me) => {
      const local = await loadFeatures(me);
      setState({ user: merge(me, local?.user), features: local?.features || null });
    },
    (e) => {
      if (e.status === 401 || e.status === 403) setToken("");
      setState({ user: null, features: null });
    },
  );
  return loading.then(() => state);
}
onSignedOut(() => setState({ user: null, features: null }));

const subscribe = (f) => {
  subs.add(f);
  if (!state.loaded && !loading) refreshAccount();
  return () => subs.delete(f);
};
const snapshot = () => state;

export function useAccount() {
  return useSyncExternalStore(subscribe, snapshot);
}

/** Saves the token from any login response and loads the account. */
async function signedIn(d) {
  if (!d?.token) return d; // sign-up that must confirm the email first
  setToken(d.token);
  setState({ user: merge(d.user, null), features: null });
  await refreshAccount();
  return d;
}
export const signup = (data) => authApi.register(data).then(signedIn);
export const login = (email, password) => authApi.login(email, password).then(signedIn);
export const loginWithCollege = (code, regNo, password) => authApi.loginCollege(code, regNo, password).then(signedIn);
export const loginWithGoogle = (idToken) => authApi.google(idToken).then(signedIn);
export const resetPassword = (t, newPassword) => authApi.resetPassword(t, newPassword).then(signedIn);
export const changePassword = (current, next) => authApi.changePassword(current, next).then(signedIn);
export async function logout(everywhere = false) {
  if (everywhere) await authApi.logoutAll().catch(() => null);
  setToken("");
  setState({ user: null, features: null });
}
export const updateProfile = (data) =>
  authApi.updateMe(data).then((me) => {
    setState({ user: merge(me, state.user) });
    return me;
  });
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
            refreshAccount().then(() => resolve(d.payment));
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
