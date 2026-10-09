// Browser client for the content API (netlify/functions/content.js):
// courses, events, FAQs, site settings, the admin inbox, event
// registrations and premium access.

import { useEffect, useState } from "react";
import { call } from "./testsApi";
import { DEFAULTS, DEFAULT_SETTINGS } from "./content/defaults";

const enc = encodeURIComponent;
const TOKEN_KEY = "anobyt_premium_token";

export function getPremiumToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
function setPremiumToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked */
  }
}
const premiumHeaders = () => (getPremiumToken() ? { "x-premium-token": getPremiumToken() } : {});

// Public
export const listContent = (col) => call(`/api/content/${col}`).then((d) => d.items);
export const getContent = (col, id) => call(`/api/content/${col}/${enc(id)}`, { headers: premiumHeaders() }).then((d) => d.item);
export const getSettings = () => call("/api/content/settings").then((d) => d.settings);
export const registerForEvent = (id, data) => call(`/api/events/${enc(id)}/register`, { method: "POST", body: data });
export const redeemCode = (code) =>
  call("/api/premium/redeem", { method: "POST", body: { code } }).then((d) => {
    setPremiumToken(d.token);
    return d;
  });
export const premiumStatus = () => (getPremiumToken() ? call("/api/premium/me", { headers: premiumHeaders() }) : Promise.resolve({ active: false }));
export const forgetPremium = () => setPremiumToken("");

/** Sends a form submission to the admin inbox. Never throws: WhatsApp stays the main channel. */
export const sendLead = (lead) => call("/api/leads", { method: "POST", body: lead }).catch(() => null);

// Admin
export const adminList = (col) => call(`/api/content/${col}?all=1`, { admin: true }).then((d) => d.items);
export const adminGet = (col, id) => call(`/api/content/${col}/${enc(id)}?full=1`, { admin: true }).then((d) => d.item);
export const adminCreate = (col, item) => call(`/api/content/${col}`, { method: "POST", body: item, admin: true }).then((d) => d.item);
export const adminUpdate = (col, id, item) => call(`/api/content/${col}/${enc(id)}`, { method: "PUT", body: item, admin: true }).then((d) => d.item);
export const adminDelete = (col, id) => call(`/api/content/${col}/${enc(id)}`, { method: "DELETE", admin: true });
export const adminReorder = (col, order) => call(`/api/content/${col}`, { method: "PUT", body: { order }, admin: true }).then((d) => d.items);
export const saveSettings = (s) => call("/api/content/settings", { method: "PUT", body: s, admin: true }).then((d) => d.settings);
export const listRegistrations = (id) => call(`/api/events/${enc(id)}/registrations`, { admin: true }).then((d) => d.registrations);
export const listLeads = () => call("/api/leads", { admin: true }).then((d) => d.leads);
export const updateLead = (id, patch) => call(`/api/leads/${enc(id)}`, { method: "PUT", body: patch, admin: true }).then((d) => d.lead);
export const deleteLead = (id) => call(`/api/leads/${enc(id)}`, { method: "DELETE", admin: true });
export const listCodes = () => call("/api/codes", { admin: true }).then((d) => d.codes);
export const createCode = (c) => call("/api/codes", { method: "POST", body: c, admin: true }).then((d) => d.code);
export const updateCode = (code, patch) => call(`/api/codes/${enc(code)}`, { method: "PUT", body: patch, admin: true }).then((d) => d.code);
export const deleteCode = (code) => call(`/api/codes/${enc(code)}`, { method: "DELETE", admin: true });

// Cached per page load so moving between pages doesn't refetch or flicker.
const cache = new Map();

/**
 * Live published items of a collection. Starts with the built-in defaults
 * (or the last loaded copy) so pages render immediately, then swaps in the
 * server's version. `loaded` turns true once the server answered.
 */
export function useCollection(col) {
  const [state, setState] = useState(() => cache.get(col) || { items: DEFAULTS[col].filter((x) => x.published), loaded: false });
  useEffect(() => {
    let on = true;
    listContent(col).then(
      (items) => {
        const next = { items, loaded: true };
        cache.set(col, next);
        if (on) setState(next);
      },
      () => on && setState((s) => ({ ...s, loaded: true, offline: true })),
    );
    return () => {
      on = false;
    };
  }, [col]);
  return state;
}

export function useSettings() {
  const [settings, setSettings] = useState(() => cache.get("settings") || DEFAULT_SETTINGS);
  useEffect(() => {
    let on = true;
    getSettings().then(
      (s) => {
        cache.set("settings", s);
        if (on) setSettings(s);
      },
      () => {},
    );
    return () => {
      on = false;
    };
  }, []);
  return settings;
}

/** Turns "2026-11-01T18:00" into a Date (viewer's local time). */
export const eventDate = (s) => (s ? new Date(s) : null);
export function isPast(e) {
  const end = eventDate(e.end) || eventDate(e.start);
  return end ? end.getTime() < Date.now() : false;
}

/** Lesson count: real lessons when the admin has added them, otherwise the advertised number. */
export function lessonTotal(c) {
  const real = typeof c.lessons === "number" ? c.lessons : (c.modules || []).reduce((n, m) => n + m.lessons.length, 0);
  return real || c.lessonCount || 0;
}
