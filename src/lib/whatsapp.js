// Central place for everything WhatsApp-related.
// AlgoMate has no backend, so "sending" a WhatsApp message always means:
// build a wa.me link with the message pre-filled, open it, and let a human
// (student, college coordinator, or admin) press Send inside WhatsApp.

// Admin's WhatsApp number (digits only, with country code, no + or spaces).
export const ADMIN_WHATSAPP = "917017903175";
export const ADMIN_WHATSAPP_DISPLAY = "+91 70179 03175";

/**
 * Normalize a loosely-typed phone number into digits-only, assuming Indian
 * numbers when no country code is present (10-digit local numbers).
 */
export function normalizePhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  return digits;
}

/**
 * Build a wa.me deep link with a pre-filled message.
 * @param {string} phoneDigits - digits-only phone number, with country code.
 * @param {string} message - the message text to pre-fill.
 */
export function buildWaLink(phoneDigits, message) {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

/** Shortcut for messages headed to the AlgoMate admin number. */
export function buildAdminWaLink(message) {
  return buildWaLink(ADMIN_WHATSAPP, message);
}

/** Open a wa.me link in a new tab. Must be called from a user gesture (click/submit). */
export function openWhatsApp(link) {
  window.open(link, "_blank", "noopener,noreferrer");
}
