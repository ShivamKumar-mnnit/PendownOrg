// Microsoft Teams meetings, created in the browser with Microsoft Graph. The data service only
// stores the resulting join link (and later the recording link), so no Microsoft secret lives on
// any server: the person creating meetings signs in with their own Microsoft 365 work account in
// a popup (OAuth authorization code + PKCE, the flow Azure "Single-page application" apps use).
//
// Turned on by VITE_MS_CLIENT_ID (and VITE_MS_TENANT_ID for a single-tenant app). Until it is
// set, the pages ask for the Teams link to be pasted instead. Setup: docs/trainer-interviews-api.md.

const CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || "";
const TENANT = import.meta.env.VITE_MS_TENANT_ID || "organizations";
const SCOPES = "openid profile offline_access OnlineMeetings.ReadWrite";
const AUTH = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0`;
const TOKEN_KEY = "anobyt_ms_token";

export const teamsConfigured = () => !!CLIENT_ID;
const redirectUri = () => `${window.location.origin}/ms-auth.html`;

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

function cached() {
  try {
    const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null");
    return t && t.expiresAt > Date.now() + 60_000 ? t.accessToken : "";
  } catch {
    return "";
  }
}

/** Waits for the popup to come back to /ms-auth.html (same origin) and returns its query params. */
function waitForRedirect(popup) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        return reject(new Error("Microsoft sign-in was closed before it finished."));
      }
      if (Date.now() - started > 5 * 60_000) {
        clearInterval(timer);
        popup.close();
        return reject(new Error("Microsoft sign-in timed out. Try again."));
      }
      let href = "";
      try {
        href = popup.location.href; // throws while the popup is on login.microsoftonline.com
      } catch {
        return;
      }
      if (!href.startsWith(redirectUri())) return;
      clearInterval(timer);
      const params = new URLSearchParams(popup.location.search);
      popup.close();
      resolve(params);
    }, 300);
  });
}

/**
 * Returns a Graph access token, signing in with a popup when needed. Call it straight from a
 * click handler: the popup is opened before the first await so browsers don't block it.
 */
export async function microsoftToken() {
  if (!CLIENT_ID) throw new Error("Teams isn't set up yet. Paste the Teams meeting link instead.");
  const have = cached();
  if (have) return have;

  const popup = window.open("about:blank", "anobyt-ms-signin", "width=520,height=680");
  if (!popup) throw new Error("Allow popups for this site to sign in with Microsoft.");
  const verifier = random(48);
  const state = random(16);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const q = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    response_mode: "query",
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  popup.location.href = `${AUTH}/authorize?${q}`;

  const back = await waitForRedirect(popup);
  if (back.get("error")) throw new Error(back.get("error_description") || back.get("error"));
  if (back.get("state") !== state || !back.get("code")) throw new Error("Microsoft sign-in failed. Try again.");

  const res = await fetch(`${AUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code: back.get("code"),
      redirect_uri: redirectUri(),
      code_verifier: verifier,
      scope: SCOPES,
    }),
  });
  const t = await res.json().catch(() => ({}));
  if (!res.ok || !t.access_token) throw new Error(t.error_description?.split("\r\n")[0] || "Couldn't get a Microsoft token.");
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken: t.access_token, expiresAt: Date.now() + t.expires_in * 1000 }));
  } catch {
    /* signs in again next time */
  }
  return t.access_token;
}

export function signOutMicrosoft() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing saved */
  }
}

/**
 * Creates a Teams meeting owned by the signed-in Microsoft account and returns {joinUrl, meetingId}.
 * Everyone with the link skips the lobby, so students and trainers join without being admitted.
 */
export async function createTeamsMeeting({ subject, startsAt, minutes = 30 }, token) {
  const access = token || (await microsoftToken());
  const start = new Date(startsAt);
  const res = await fetch("https://graph.microsoft.com/v1.0/me/onlineMeetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: subject.slice(0, 250),
      startDateTime: start.toISOString(),
      endDateTime: new Date(start.getTime() + minutes * 60_000).toISOString(),
      lobbyBypassSettings: { scope: "everyone", isDialInBypassEnabled: false },
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (res.status === 401) signOutMicrosoft();
  if (!res.ok || !d.joinWebUrl) throw new Error(d.error?.message || `Teams meeting couldn't be created (${res.status}).`);
  return { joinUrl: d.joinWebUrl, meetingId: d.id };
}

/** Subject line used for interview meetings. */
export const meetingSubject = (i) => `Anobyt mock interview #${i.interviewNo ?? ""}: ${i.studentName || "Student"} with ${i.mentorName || "trainer"}`.replace(" #:", ":");
