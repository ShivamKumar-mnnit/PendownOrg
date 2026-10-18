// Browser client for the Anobyt data service (Spring Boot, dataservice.anobyt.in):
// logins, colleges, batches (templates), students, question bank, MCQ tests and
// attempts, interviews, scorecards, announcements and college onboarding.
//
// Every request sends X-Secret-Key, plus `Authorization: Bearer <token>` once
// signed in. The key ships in the bundle by design: it only stops casual
// scripts, the logins protect the data.
//
// The server only allows the https://anobyt.in origin (CORS), so everywhere
// else requests go through a same-origin proxy at /ds: the Vite proxy in
// `npm run dev` (vite.config.js), the ds Netlify function on branch deploys.

const PROD_HOSTS = ["anobyt.in"];
const BASE =
  import.meta.env.VITE_DATA_API_URL ||
  (typeof window !== "undefined" && PROD_HOSTS.includes(window.location.hostname) ? "https://dataservice.anobyt.in" : "/ds");
const KEY = import.meta.env.VITE_DATA_API_KEY || "9cf3f911e5c7ac0bde2826a82359248e537fd8aa8b5af41d98135c9dbf147803";
const TOKEN_KEY = "anobyt_ds_token";

export const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://anobyt.in";

// ---- Sign-in token ----

let token = "";
try {
  token = localStorage.getItem(TOKEN_KEY) || "";
} catch {
  /* storage blocked: signed out until they sign in on this page */
}
const tokenSubs = new Set();

export const getToken = () => token;
export function setToken(t) {
  token = t || "";
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* stays signed in for this page only */
  }
}
/** Called when the server rejects the saved token (expired, logged out everywhere, deactivated). */
export const onSignedOut = (fn) => (tokenSubs.add(fn), () => tokenSubs.delete(fn));

// ---- Requests ----

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function detailText(details) {
  if (!details) return "";
  if (Array.isArray(details))
    return details
      .slice(0, 5)
      .map((d) => (typeof d === "string" ? d : d.row ? `Row ${d.row}: ${d.message || d.error}` : d.message || JSON.stringify(d)))
      .join("; ");
  if (typeof details === "object")
    return Object.entries(details)
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
  return String(details);
}

function queryString(query) {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") p.set(k, v);
  const s = p.toString();
  return s ? "?" + s : "";
}

/**
 * Calls the data service. `body` is sent as JSON, `form` as multipart. Resolves
 * with the parsed JSON (null for empty responses), or the raw Response when `raw`.
 * Errors are ApiError with the server's message, ready to show to the user.
 */
export async function api(path, { method = "GET", body, form, query, raw = false, auth = true } = {}) {
  const headers = { "X-Secret-Key": KEY };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res;
  try {
    res = await fetch(BASE + path + queryString(query), {
      method,
      headers,
      body: form || (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  if (res.ok && raw) return res;
  const text = await res.text().catch(() => "");
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON */
  }
  if (res.ok) return data;

  if (res.status === 429) {
    const wait = Number(res.headers.get("Retry-After")) || 60;
    throw new ApiError(`Too many requests. Please wait ${wait > 90 ? `${Math.ceil(wait / 60)} minutes` : `${wait} seconds`} and try again.`, 429);
  }
  // A saved token that stopped working: sign out everywhere on this page.
  if (res.status === 401 && auth && token && !path.startsWith("/api/auth/login") && path !== "/api/auth/change-password") {
    setToken("");
    tokenSubs.forEach((f) => f());
  }
  const extra = detailText(data?.details);
  let message = data?.message || data?.error || (res.status >= 500 ? "The server had a problem. Please try again in a moment." : `Request failed (${res.status}).`);
  if (extra && !message.includes(extra)) message += ` (${extra})`;
  throw new ApiError(message, res.status, data?.details);
}

/** Downloads a file endpoint (Excel exports and templates) and saves it. */
export async function download(path, fallbackName, query) {
  const res = await api(path, { raw: true, query });
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const name = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)?.[1] || fallbackName;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = decodeURIComponent(name);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const fileForm = (file, fields = {}) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null && v !== "") f.append(k, v);
  if (file) f.append("file", file);
  return f;
};
const enc = encodeURIComponent;

// ---- Labels shared by the pages ----

export const ROLE_LABELS = { STUDENT: "Student", ADMIN: "Admin (trainer / company)", SUPERADMIN: "Super admin" };
export const TEST_TYPES = { MCQ: "MCQ test", CODING: "Coding", MOCK_INTERVIEW: "Mock interviews", MIXED: "Mixed" };
export const QUESTION_TYPES = { SINGLE: "Single correct", MULTIPLE: "Multiple correct", NUMERIC: "Numeric answer" };
export const DIFFICULTIES = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };
export const TEST_STATUS = { DRAFT: "Draft", PUBLISHED: "Live", CLOSED: "Closed" };
export const INTERVIEW_STATUS = { UPCOMING: "Upcoming", IN_PROGRESS: "In progress", DONE: "Done", CANCELLED: "Cancelled", NO_SHOW: "No show" };
export const MEETING_PLATFORMS = { TEAMS: "Microsoft Teams", GOOGLE_MEET: "Google Meet", ZOOM: "Zoom", OTHER: "Other" };
export const ONBOARDING_STATUS = { NEW: "New", IN_PROGRESS: "In progress", COMPLETED: "Completed", REJECTED: "Rejected" };

export const isAdminRole = (u) => u?.role === "ADMIN" || u?.role === "SUPERADMIN";
/** Where someone lands after signing in: trainers on their dashboard, super admins in the admin panel. */
export const homeFor = (u) => (u?.role === "SUPERADMIN" ? "/admin" : u?.role === "ADMIN" ? "/trainer" : "/dashboard");
export const testLink = (slug) => `${SITE_URL}/t/${slug}`;
/** 1 -> "1st", 2 -> "2nd" ... */
export const ordinal = (n) => (n ? n + (["th", "st", "nd", "rd"][((n % 100) >> 3) ^ 1 && n % 10] || "th") : "—");

// ---- Interview statuses ----
// The trainer-interviews server update renamed SCHEDULED -> UPCOMING and COMPLETED -> DONE and
// added IN_PROGRESS. Older servers still use the old names, so responses are normalised to the
// new names and updates are translated back once the server turns out to be an older one.

const LEGACY_IN = { SCHEDULED: "UPCOMING", COMPLETED: "DONE" };
const LEGACY_OUT = { UPCOMING: "SCHEDULED", DONE: "COMPLETED", IN_PROGRESS: "SCHEDULED" };
let legacyInterviews = false;
/** True once a response shows the server predates trainer interviews (no numbers, scorecards or recording links). */
export const isLegacyInterviews = () => legacyInterviews;
function normInterview(i) {
  if (!i || typeof i !== "object" || !("scheduledAt" in i)) return i;
  if (!("interviewNo" in i)) legacyInterviews = true;
  return LEGACY_IN[i.status] ? { ...i, status: LEGACY_IN[i.status] } : i;
}
const normInterviews = (p) => p.then((r) => (Array.isArray(r) ? r.map(normInterview) : normInterview(r)));
const outStatus = (b) => (legacyInterviews && b?.status && LEGACY_OUT[b.status] ? { ...b, status: LEGACY_OUT[b.status] } : b);

// ---- Public ----

export const health = () => api("/api/health", { auth: false });
export const listColleges = (q = "") => api("/api/colleges", { query: { q }, auth: false });
export const downloadSheetTemplate = (kind) => download(`/api/files/templates/${kind}`, `${kind}-template.xlsx`);
export const submitOnboarding = (fields, file) => api("/api/onboarding-requests", { method: "POST", form: fileForm(file, fields), auth: false });

// ---- Auth ----

export const authApi = {
  register: (b) => api("/api/auth/register", { method: "POST", body: b, auth: false }),
  login: (email, password) => api("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  loginCollege: (collegeCode, regNo, password) => api("/api/auth/login/college", { method: "POST", body: { collegeCode, regNo, password }, auth: false }),
  google: (idToken) => api("/api/auth/google", { method: "POST", body: { idToken }, auth: false }),
  verifyEmail: (t) => api("/api/auth/verify-email", { method: "POST", body: { token: t }, auth: false }),
  forgotPassword: (email) => api("/api/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (t, newPassword) => api("/api/auth/reset-password", { method: "POST", body: { token: t, newPassword }, auth: false }),
  changePassword: (currentPassword, newPassword) => api("/api/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  me: () => api("/api/auth/me"),
  updateMe: (b) => api("/api/auth/me", { method: "PATCH", body: b }),
  resendVerification: () => api("/api/auth/resend-verification", { method: "POST" }),
  logoutAll: () => api("/api/auth/logout-all", { method: "POST" }),
};

// ---- Super admin ----

export const superApi = {
  stats: () => api("/api/admin/stats"),
  users: (query) => api("/api/admin/users", { query }),
  user: (id) => api(`/api/admin/users/${enc(id)}`),
  createUser: (b) => api("/api/admin/users", { method: "POST", body: b }),
  updateUser: (id, b) => api(`/api/admin/users/${enc(id)}`, { method: "PATCH", body: b }),
  resetPassword: (id) => api(`/api/admin/users/${enc(id)}/reset-password`, { method: "POST" }),
  deleteUser: (id) => api(`/api/admin/users/${enc(id)}`, { method: "DELETE" }),
  deleteCollege: (id) => api(`/api/colleges/${enc(id)}`, { method: "DELETE" }),
  onboarding: (query) => api("/api/onboarding-requests", { query }),
  onboardingOne: (id) => api(`/api/onboarding-requests/${enc(id)}`),
  updateOnboarding: (id, b) => api(`/api/onboarding-requests/${enc(id)}`, { method: "PATCH", body: b }),
  convertOnboarding: (id, b) => api(`/api/onboarding-requests/${enc(id)}/convert`, { method: "POST", body: b }),
};

// ---- Admin (trainer / company) ----

export const adminApi = {
  createCollege: (b) => api("/api/colleges", { method: "POST", body: b }),
  updateCollege: (id, b) => api(`/api/colleges/${enc(id)}`, { method: "PUT", body: b }),

  templates: (query) => api("/api/templates", { query }),
  template: (id) => api(`/api/templates/${enc(id)}`),
  createTemplate: (b) => api("/api/templates", { method: "POST", body: b }),
  updateTemplate: (id, b) => api(`/api/templates/${enc(id)}`, { method: "PATCH", body: b }),
  deleteTemplate: (id) => api(`/api/templates/${enc(id)}`, { method: "DELETE" }),

  students: (tid, query) => api(`/api/templates/${enc(tid)}/students`, { query }),
  addStudent: (tid, b) => api(`/api/templates/${enc(tid)}/students`, { method: "POST", body: b }),
  bulkStudents: (tid, file) => api(`/api/templates/${enc(tid)}/students/bulk`, { method: "POST", form: fileForm(file) }),
  updateStudent: (tid, sid, b) => api(`/api/templates/${enc(tid)}/students/${enc(sid)}`, { method: "PATCH", body: b }),
  resetStudentPassword: (tid, sid) => api(`/api/templates/${enc(tid)}/students/${enc(sid)}/reset-password`, { method: "POST" }),
  removeStudent: (tid, sid) => api(`/api/templates/${enc(tid)}/students/${enc(sid)}`, { method: "DELETE" }),
  exportStudents: (tid) => download(`/api/templates/${enc(tid)}/students/export`, "students.xlsx"),

  questions: (query) => api("/api/questions", { query }),
  createQuestion: (b) => api("/api/questions", { method: "POST", body: b }),
  updateQuestion: (id, b) => api(`/api/questions/${enc(id)}`, { method: "PUT", body: b }),
  deleteQuestion: (id) => api(`/api/questions/${enc(id)}`, { method: "DELETE" }),
  bulkQuestions: (file, testId) => api("/api/questions/bulk", { method: "POST", form: fileForm(file), query: { testId } }),

  tests: (query) => api("/api/tests", { query }),
  test: (id) => api(`/api/tests/${enc(id)}`),
  createTest: (b) => api("/api/tests", { method: "POST", body: b }),
  updateTest: (id, b) => api(`/api/tests/${enc(id)}`, { method: "PATCH", body: b }),
  addTestQuestions: (id, questionIds) => api(`/api/tests/${enc(id)}/questions`, { method: "POST", body: { questionIds } }),
  removeTestQuestion: (id, qid) => api(`/api/tests/${enc(id)}/questions/${enc(qid)}`, { method: "DELETE" }),
  previewTest: (id) => api(`/api/tests/${enc(id)}/preview`),
  publishTest: (id) => api(`/api/tests/${enc(id)}/publish`, { method: "POST" }),
  closeTest: (id) => api(`/api/tests/${enc(id)}/close`, { method: "POST" }),
  deleteTest: (id) => api(`/api/tests/${enc(id)}`, { method: "DELETE" }),
  results: (id) => api(`/api/tests/${enc(id)}/results`),
  exportResults: (id) => download(`/api/tests/${enc(id)}/results/export`, "results.xlsx"),
  leaderboard: (id, limit = 100) => api(`/api/tests/${enc(id)}/leaderboard`, { query: { limit } }),
  analytics: (id) => api(`/api/tests/${enc(id)}/analytics`),
  attempt: (id) => api(`/api/attempts/${enc(id)}`),

  interviews: (tid, status) =>
    normInterviews(api(`/api/templates/${enc(tid)}/interviews`, { query: { status: legacyInterviews ? LEGACY_OUT[status] || status : status } })),
  scheduleInterview: (tid, b) => normInterviews(api(`/api/templates/${enc(tid)}/interviews`, { method: "POST", body: b })),
  bulkInterviews: (tid, file, createZoomMeetings, sendConfirmations) =>
    api(`/api/templates/${enc(tid)}/interviews/bulk`, { method: "POST", form: fileForm(file), query: { createZoomMeetings, sendConfirmations } }),
  updateInterview: (id, b) => normInterviews(api(`/api/interviews/${enc(id)}`, { method: "PATCH", body: outStatus(b) })),
  zoomInterview: (id, sendConfirmation = true) => api(`/api/interviews/${enc(id)}/zoom`, { method: "POST", query: { sendConfirmation } }),
  resendInterview: (id) => api(`/api/interviews/${enc(id)}/resend-confirmation`, { method: "POST" }),
  interviewLog: (id) => api(`/api/interviews/${enc(id)}/notifications`),
  exportInterviews: (tid) => download(`/api/templates/${enc(tid)}/interviews/export`, "interviews.xlsx"),
  deleteInterview: (id, sendConfirmation = true) => api(`/api/interviews/${enc(id)}`, { method: "DELETE", query: { sendConfirmation } }),

  scorecard: (tid, query) => api(`/api/templates/${enc(tid)}/scorecard`, { query }),
  exportScorecard: (tid, query) => download(`/api/templates/${enc(tid)}/scorecard/export`, "scorecard.xlsx", query),

  announce: (tid, b) => api(`/api/templates/${enc(tid)}/announcements`, { method: "POST", body: b }),
  announcements: (tid) => api(`/api/templates/${enc(tid)}/announcements`),
  deleteAnnouncement: (tid, aid) => api(`/api/templates/${enc(tid)}/announcements/${enc(aid)}`, { method: "DELETE" }),
};

// ---- Trainer interviews, scorecards and meeting links ----
// The assigned trainer, the batch owner and super admins can change status, links and the
// scorecard (anyone else gets 403). On older servers these 404 and the pages fall back to the
// batch endpoints. docs/trainer-interviews-api.md lists them.

export const interviewApi = {
  /** The signed-in trainer's interviews: {counts, interviews}. Filters: status, templateId, from, to. */
  dashboard: (query) => api("/api/trainer/interviews", { query }).then((r) => ({ ...r, interviews: (r?.interviews || []).map(normInterview) })),
  one: (id) => normInterviews(api(`/api/interviews/${enc(id)}`)),
  /** UPCOMING -> IN_PROGRESS -> DONE (or NO_SHOW / CANCELLED); the server sets startedAt / endedAt. */
  setStatus: (id, status) => normInterviews(api(`/api/interviews/${enc(id)}/status`, { method: "PATCH", body: { status } })),
  /** Stores the meeting / recording links the frontend created or pasted (only fields sent change, "" clears one). */
  setLinks: (id, b) => normInterviews(api(`/api/interviews/${enc(id)}/links`, { method: "PUT", body: b })),
  scorecard: (id) => api(`/api/interviews/${enc(id)}/scorecard`),
  /** Sections 0-10; the server works out overallPercent and marks the interview DONE. */
  saveScorecard: (id, b) => api(`/api/interviews/${enc(id)}/scorecard`, { method: "PUT", body: b }),
  publish: (id, notifyStudent = true) => api(`/api/interviews/${enc(id)}/scorecard/publish`, { method: "POST", body: { notifyStudent } }),
  unpublish: (id) => api(`/api/interviews/${enc(id)}/scorecard/unpublish`, { method: "POST" }),
  /** Meeting-links register rows. Filters: templateId, interviewerId, from, to, onlyWithRecording. */
  recordings: (query) => api("/api/interviews/recordings", { query }),
  exportRecordings: (query) => download("/api/interviews/recordings/export", "interview-recordings.xlsx", query),
  exportScorecards: (tid) => download(`/api/templates/${enc(tid)}/interview-scorecards/export`, "interview-scorecards.xlsx"),
  /** Trainer accounts an interview can be assigned to: [{id, name, email, organization}]. */
  trainers: () => api("/api/trainers"),
  /**
   * Emails the meeting link (with a calendar invite) to the student and / or trainer.
   * Body: {meetingLink?, meetingPlatform?, sendTo?: ["STUDENT", "TRAINER"], message?, calendarInvite?}.
   * Returns {sent, deliveries: [{recipient, name, email, status: SENT | FAILED | SKIPPED, error}]}.
   */
  sendMeetingEmail: (id, b) => api(`/api/interviews/${enc(id)}/send-meeting-email`, { method: "POST", body: b }),
};

// ---- Email ----

export const emailApi = {
  /**
   * Meeting email with a calendar invite, from explicit details (no interview id needed).
   * Body: {studentName, studentEmail, trainerName, trainerEmail, meetingLink, meetingPlatform,
   * startTime, durationMinutes, title, message?, sendTo?: ["STUDENT", "TRAINER"], calendarInvite?}.
   */
  meetingInvite: (b) => api("/api/email/meeting-invite", { method: "POST", body: b }),
  /** Sends a test email to check the mail setup. */
  test: (to) => api("/api/email/test", { method: "POST", body: { to } }),
};

// ---- Student ----

export const studentApi = {
  tests: () => api("/api/student/tests"),
  testBySlug: (slug) => api(`/api/student/tests/link/${enc(slug)}`),
  start: (testId) => api(`/api/student/tests/${enc(testId)}/start`, { method: "POST" }),
  save: (attemptId, answers) => api(`/api/attempts/${enc(attemptId)}/answers`, { method: "PUT", body: { answers } }),
  event: (attemptId, type, detail) => api(`/api/attempts/${enc(attemptId)}/events`, { method: "POST", body: { type, detail } }),
  submit: (attemptId, answers) => api(`/api/attempts/${enc(attemptId)}/submit`, { method: "POST", body: { answers } }),
  attempts: () => api("/api/attempts/me"),
  attempt: (id) => api(`/api/attempts/${enc(id)}`),
  leaderboard: (testId) => api(`/api/student/tests/${enc(testId)}/leaderboard`),
  interviews: () => normInterviews(api("/api/interviews/me")),
  /** Published interview scorecards only. */
  interviewScorecards: () => api("/api/student/interview-scorecards"),
  /** One published interview scorecard (404 until the trainer publishes it). */
  interviewScorecard: (interviewId) => api(`/api/student/interview-scorecards/${enc(interviewId)}`),
  scorecard: () => api("/api/student/scorecard"),
  announcements: () => api("/api/student/announcements"),
};

// ---- Formatting ----

export const fmtWhen = (ts) => (ts ? new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");
export const fmtDay = (ts) => (ts ? new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
/** Whether a test (with optional startsAt / endsAt) is upcoming, open or over. */
export function testWindow(t, now = Date.now()) {
  if (t.startsAt && new Date(t.startsAt).getTime() > now) return { state: "soon", text: `Opens ${fmtWhen(t.startsAt)}` };
  if (t.endsAt && new Date(t.endsAt).getTime() < now) return { state: "ended", text: `Closed ${fmtWhen(t.endsAt)}` };
  return { state: "open", text: t.endsAt ? `Open until ${fmtWhen(t.endsAt)}` : "Open now" };
}
export const pct = (n) => (n === null || n === undefined ? "—" : `${Math.round(n * 10) / 10}%`);
/** ISO instant -> value for <input type="datetime-local"> in the viewer's time zone. */
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
/** <input type="datetime-local"> value -> ISO instant (or undefined when empty). */
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : undefined);
