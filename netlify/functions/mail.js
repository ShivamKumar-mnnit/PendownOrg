import nodemailer from "nodemailer";
import { dataServiceUser } from "../../src/lib/server/auth.js";
import { fail, json } from "../../src/lib/server/http.js";

// Sends one plain-text email with our own subject and body, for the super admin's bulk
// "Email login details" in a batch. Mail goes out through the same Hostinger mailbox the data
// service uses (MAIL_* in Netlify environment variables). The caller must be signed in to the
// data service as SUPERADMIN (its token in `x-user-token`).

let transport = null;
function mailer() {
  if (transport) return transport;
  const env = process.env;
  if (!env.MAIL_HOST || !env.MAIL_USERNAME || !env.MAIL_PASSWORD) return null;
  const port = Number(env.MAIL_PORT) || 465;
  transport = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port,
    secure: env.MAIL_SMTP_SSL ? env.MAIL_SMTP_SSL === "true" : port === 465,
    auth: { user: env.MAIL_USERNAME, pass: env.MAIL_PASSWORD },
    pool: true,
    maxConnections: 1,
    connectionTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transport;
}

const EMAIL = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]+$/;
// Header values must stay on one line.
const oneLine = (s) => String(s).replace(/[\r\n]+/g, " ").trim();

export default async function handler(request) {
  if (request.method !== "POST") return fail(405, "Use POST.");

  const token = request.headers.get("x-user-token") || "";
  const me = token ? await dataServiceUser(token) : null;
  if (!me) return fail(401, "Sign in again.");
  if (me.role !== "SUPERADMIN") return fail(403, "Only a super admin can send these emails.");

  // Before validating: the page sends an empty request to check this, and must hear 503 (not 400)
  // when the mailbox isn't configured.
  const t = mailer();
  if (!t) {
    // Names only, never values: tells the admin exactly what Netlify isn't passing to functions.
    const missing = ["MAIL_HOST", "MAIL_USERNAME", "MAIL_PASSWORD"].filter((k) => !process.env[k]);
    return fail(
      503,
      `Email isn't set up on the website yet: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} missing or empty for functions. ` +
        "In Netlify, give these variables the Functions scope and the Production context, then trigger a new deploy.",
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Send JSON: {to, subject, text}.");
  }
  const to = String(body?.to || "").trim();
  const subject = oneLine(body?.subject || "");
  const text = String(body?.text || "");
  // Checked before anything is sent: an empty request is how the page tests this endpoint exists.
  if (!EMAIL.test(to) || to.length > 200) return fail(400, "A valid 'to' email address is required.");
  if (!subject || subject.length > 200) return fail(400, "A subject (up to 200 characters) is required.");
  if (!text.trim() || text.length > 10_000) return fail(400, "A message (up to 10,000 characters) is required.");

  const from = process.env.MAIL_FROM || process.env.MAIL_USERNAME;
  try {
    const info = await t.sendMail({
      from: { name: oneLine(process.env.MAIL_FROM_NAME || "Anobyt"), address: from },
      to,
      subject,
      text,
    });
    return json({ status: "SENT", messageId: info.messageId });
  } catch (e) {
    return fail(502, `The mail server refused it: ${e?.response || e?.message || "unknown error"}`.slice(0, 300));
  }
}

export const config = { path: "/api/mail/send" };
