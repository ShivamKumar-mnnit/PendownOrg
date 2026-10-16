import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, KeyRound, Mail } from "lucide-react";
import Select from "./Select";
import { Head, Page } from "./ui";
import { changePassword, login, loginWithCollege, loginWithGoogle, signup } from "../lib/account";
import { authApi, listColleges } from "../lib/dataService";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/**
 * Sign in with email + password, or college code + registration number
 * (students added by their college), or Google when VITE_GOOGLE_CLIENT_ID is set.
 * `onMode` switches the parent to "signup" / "forgot".
 */
export function SignInForm({ onDone, onMode, adminOnly = false }) {
  const [how, setHow] = useState("email");
  const [f, setF] = useState({ email: "", password: "", college: "", regNo: "" });
  const [colleges, setColleges] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (how !== "college" || colleges) return;
    listColleges().then(setColleges, () => setColleges([]));
  }, [how, colleges]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const d = how === "email" ? await login(f.email.trim(), f.password) : await loginWithCollege(f.college, f.regNo.trim(), f.password);
      onDone?.(d);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  }

  return (
    <div className="panel">
      {!adminOnly && (
        <div className="seg tabs" style={{ marginBottom: 18 }}>
          <button type="button" className={how === "email" ? "on" : ""} onClick={() => setHow("email")}>
            <Mail className="h-4 w-4" /> Email
          </button>
          <button type="button" className={how === "college" ? "on" : ""} onClick={() => setHow("college")}>
            <Building2 className="h-4 w-4" /> College ID
          </button>
        </div>
      )}
      <form onSubmit={submit}>
        {how === "email" ? (
          <>
            <label className="l" style={{ marginTop: 0 }} htmlFor="si-email">Email</label>
            <input id="si-email" className="inp" type="email" value={f.email} onChange={set("email")} required autoComplete="email" />
          </>
        ) : (
          <>
            <label className="l" style={{ marginTop: 0 }}>College</label>
            {colleges && colleges.length ? (
              <Select
                value={f.college}
                onChange={(v) => setF({ ...f, college: v })}
                placeholder="Choose your college"
                options={colleges.map((c) => ({ value: c.code, label: `${c.name}${c.city ? `, ${c.city}` : ""}` }))}
              />
            ) : (
              <input className="inp" value={f.college} onChange={set("college")} required placeholder={colleges ? "College code, e.g. MNNIT" : "Loading colleges…"} />
            )}
            <label className="l" htmlFor="si-reg">Registration / roll number</label>
            <input id="si-reg" className="inp" value={f.regNo} onChange={set("regNo")} required autoComplete="username" />
          </>
        )}
        <label className="l" htmlFor="si-pass">Password</label>
        <input id="si-pass" className="inp" type="password" value={f.password} onChange={set("password")} required autoComplete="current-password" />
        {how === "college" && <p className="note" style={{ fontSize: 13, marginTop: 6 }}>First time? Use the temporary password your college or Anobyt shared with you. You'll set your own right after.</p>}
        {err && <p className="note bad">{err}</p>}
        <button className="btn" style={{ marginTop: 18, width: "100%" }} disabled={busy || (how === "college" && !f.college)}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {onMode && (
        <div className="row" style={{ justifyContent: "space-between", marginTop: 14, fontSize: 14 }}>
          <button type="button" className="linkish" onClick={() => onMode("forgot")}>
            Forgot password?
          </button>
          {!adminOnly && (
            <button type="button" className="linkish" onClick={() => onMode("signup")}>
              New here? Create an account
            </button>
          )}
        </div>
      )}
      {!adminOnly && GOOGLE_CLIENT_ID && <GoogleButton onDone={onDone} onError={setErr} />}
    </div>
  );
}

export function SignUpForm({ onDone, onMode }) {
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const d = await signup({ name: f.name.trim(), email: f.email.trim(), password: f.password, phone: f.phone.trim() || undefined });
      if (d.token) onDone?.(d);
      else setPending(f.email.trim());
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  }

  if (pending)
    return (
      <div className="panel">
        <h3 style={{ fontSize: 20 }}>Check your inbox</h3>
        <p className="note">
          We sent a confirmation link to <b>{pending}</b>. Open it to activate your account, then sign in.
        </p>
        <button type="button" className="btn" style={{ marginTop: 14 }} onClick={() => onMode?.("login")}>
          Back to sign in
        </button>
      </div>
    );

  return (
    <div className="panel">
      <form onSubmit={submit}>
        <label className="l" style={{ marginTop: 0 }} htmlFor="su-name">Full name</label>
        <input id="su-name" className="inp" value={f.name} onChange={set("name")} required maxLength={100} autoComplete="name" />
        <label className="l" htmlFor="su-email">Email</label>
        <input id="su-email" className="inp" type="email" value={f.email} onChange={set("email")} required autoComplete="email" />
        <div className="two">
          <div>
            <label className="l" htmlFor="su-pass">Password</label>
            <input id="su-pass" className="inp" type="password" value={f.password} onChange={set("password")} required minLength={8} maxLength={100} autoComplete="new-password" />
          </div>
          <div>
            <label className="l" htmlFor="su-phone">Phone (optional)</label>
            <input id="su-phone" className="inp" type="tel" value={f.phone} onChange={set("phone")} maxLength={20} placeholder="70xxxxxxxx" autoComplete="tel" />
          </div>
        </div>
        <p className="note" style={{ fontSize: 13, marginTop: 6 }}>At least 8 characters. We'll email you a link to confirm your address.</p>
        {err && <p className="note bad">{err}</p>}
        <button className="btn" style={{ marginTop: 16, width: "100%" }} disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      {onMode && (
        <p className="note" style={{ fontSize: 14 }}>
          Already have an account?{" "}
          <button type="button" className="linkish" onClick={() => onMode("login")}>
            Sign in
          </button>
        </p>
      )}
      {GOOGLE_CLIENT_ID && <GoogleButton onDone={onDone} onError={setErr} />}
    </div>
  );
}

export function ForgotForm({ onMode }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  }

  return (
    <div className="panel">
      {sent ? (
        <p className="note ok" style={{ marginTop: 0 }}>
          If an account exists for {email}, a reset link is on its way. It works once, so use the latest email if you asked more than once.
        </p>
      ) : (
        <form onSubmit={submit}>
          <label className="l" style={{ marginTop: 0 }} htmlFor="fp-email">Account email</label>
          <input id="fp-email" className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          {err && <p className="note bad">{err}</p>}
          <button className="btn" style={{ marginTop: 16, width: "100%" }} disabled={busy}>
            {busy ? "Sending…" : "Email me a reset link"}
          </button>
          <p className="note" style={{ fontSize: 13 }}>Signed in with a college ID and no email on file? Ask your college coordinator to reset your password.</p>
        </form>
      )}
      {onMode && (
        <button type="button" className="linkish" style={{ marginTop: 12 }} onClick={() => onMode("login")}>
          Back to sign in
        </button>
      )}
    </div>
  );
}

/** Set a new password. `forced` when the account still has a temporary one. */
export function ChangePasswordForm({ forced = false, onDone }) {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk(false);
    if (f.next !== f.again) return setErr("The new passwords don't match.");
    if (f.next === f.current) return setErr("Choose a password different from the current one.");
    setBusy(true);
    try {
      await changePassword(f.current, f.next);
      setF({ current: "", next: "", again: "" });
      setOk(true);
      onDone?.();
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit}>
      <label className="l" style={{ marginTop: 0 }} htmlFor="cp-cur">{forced ? "Temporary password" : "Current password"}</label>
      <input id="cp-cur" className="inp" type="password" value={f.current} onChange={set("current")} required autoComplete="current-password" />
      <div className="two">
        <div>
          <label className="l" htmlFor="cp-new">New password</label>
          <input id="cp-new" className="inp" type="password" value={f.next} onChange={set("next")} required minLength={8} maxLength={100} autoComplete="new-password" />
        </div>
        <div>
          <label className="l" htmlFor="cp-again">Repeat new password</label>
          <input id="cp-again" className="inp" type="password" value={f.again} onChange={set("again")} required minLength={8} autoComplete="new-password" />
        </div>
      </div>
      {err && <p className="note bad">{err}</p>}
      {ok && !forced && <p className="note ok">Password changed. Other devices have been signed out.</p>}
      <button className="btn" style={{ marginTop: 16 }} disabled={busy}>
        <KeyRound className="h-4 w-4" /> {busy ? "Saving…" : forced ? "Set my password" : "Change password"}
      </button>
    </form>
  );
}

// ---- Google Identity Services ----

let gisLoading = null;
function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  gisLoading ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => ((gisLoading = null), reject(new Error("Could not load Google sign-in.")));
    document.head.appendChild(s);
  });
  return gisLoading;
}

function GoogleButton({ onDone, onError }) {
  const box = useRef(null);
  const cb = useRef({ onDone, onError });
  useEffect(() => {
    cb.current = { onDone, onError };
  }, [onDone, onError]);

  useEffect(() => {
    let on = true;
    loadGis().then(
      () => {
        if (!on || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (r) =>
            loginWithGoogle(r.credential).then(
              (d) => cb.current.onDone?.(d),
              (e) => cb.current.onError?.(e.message),
            ),
        });
        window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", text: "continue_with", shape: "pill", width: 300 });
      },
      (e) => on && cb.current.onError?.(e.message),
    );
    return () => {
      on = false;
    };
  }, []);

  return (
    <div style={{ marginTop: 18, borderTop: "1px solid var(--color-border)", paddingTop: 18, display: "grid", placeItems: "center", gap: 8 }}>
      <span className="note" style={{ margin: 0, fontSize: 13 }}>or</span>
      <div ref={box} />
    </div>
  );
}

/** Shown instead of every page while the account still has a temporary password. */
export function PasswordGate({ user }) {
  return (
    <Page narrow={560}>
      <Head eyebrow="One more step" title={`Welcome, ${user.name.split(" ")[0]}`}>
        Your account was set up with a temporary password. Choose your own to continue.
      </Head>
      <div className="panel">
        <ChangePasswordForm forced />
      </div>
    </Page>
  );
}

/** Small "sign in to continue" card used inside pages. */
export function SignInPrompt({ next, text = "Sign in to continue." }) {
  return (
    <div className="empty">
      <b>{text}</b>
      <span>
        <Link className="btn" to={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} style={{ marginTop: 10 }}>
          Sign in
        </Link>
      </span>
    </div>
  );
}
