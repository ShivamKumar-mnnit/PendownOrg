import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { ForgotForm, SignInForm, SignUpForm } from "../components/AuthForms";
import { authApi, homeFor } from "../lib/dataService";
import { resetPassword, useAccount } from "../lib/account";
import { usePageSEO } from "../lib/seo";

const TITLES = {
  login: ["Sign in", "Your tests, interviews, scorecard and courses in one place."],
  signup: ["Create your account", "Free to create. Your progress, results and purchases stay with your account."],
  forgot: ["Reset your password", "We'll email you a link to choose a new one."],
};

/** Where to land after signing in: ?next=, else the admin panel or the dashboard. */
function landing(params, user) {
  const next = params.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return homeFor(user);
}

export default function Login() {
  usePageSEO({ title: "Sign in", description: "Sign in to Anobyt to take tests, see your interviews and scorecard.", path: "/login", noindex: true });
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user, loaded } = useAccount();
  const [mode, setMode] = useState(TITLES[params.get("mode")] ? params.get("mode") : "login");

  useEffect(() => {
    if (loaded && user && !user.mustChangePassword) nav(landing(params, user), { replace: true });
  }, [loaded, user, nav, params]);

  if (!loaded) return <Page narrow={480}><p className="note">Loading…</p></Page>;
  // Signed in with a temporary password: the PasswordGate in Layout takes over.
  if (user) return null;

  const [title, lead] = TITLES[mode];
  return (
    <Page narrow={480}>
      <Head title={title}>{lead}</Head>
      {mode === "login" && <SignInForm onMode={setMode} />}
      {mode === "signup" && <SignUpForm onMode={setMode} />}
      {mode === "forgot" && <ForgotForm onMode={setMode} />}
      <p className="note" style={{ fontSize: 13, textAlign: "center", marginTop: 18 }}>
        Trainer? <Link className="linkish" to="/trainer">Trainer sign-in</Link> · College coordinator? <Link className="linkish" to="/colleges">Onboard your batch</Link>
      </p>
    </Page>
  );
}

/** /verify-email?token=… from the confirmation email. */
export function VerifyEmail() {
  usePageSEO({ title: "Confirm your email", description: "Confirm your Anobyt email address.", path: "/verify-email", noindex: true });
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState(token ? "busy" : "missing");
  const [msg, setMsg] = useState("");
  const { user } = useAccount();

  useEffect(() => {
    if (!token) return;
    authApi.verifyEmail(token).then(
      (d) => (setState("ok"), setMsg(d?.message || "Your email is confirmed.")),
      (e) => (setState("bad"), setMsg(e.message)),
    );
  }, [token]);

  return (
    <Page narrow={520}>
      <Head title="Confirm your email" />
      <div className="panel">
        {state === "busy" && <p className="note" style={{ marginTop: 0 }}>Checking your link…</p>}
        {state === "missing" && <p className="note bad" style={{ marginTop: 0 }}>This link is missing its token. Open the link from the email again.</p>}
        {state === "ok" && <p className="note ok" style={{ marginTop: 0 }}>{msg}</p>}
        {state === "bad" && (
          <p className="note bad" style={{ marginTop: 0 }}>
            {msg} {user ? "You can send a fresh link from your account page." : "Sign in to send a fresh link."}
          </p>
        )}
        <Link className="btn" to={user ? "/account" : "/login"} style={{ marginTop: 14 }}>
          {user ? "Go to your account" : "Sign in"}
        </Link>
      </div>
    </Page>
  );
}

/** /reset-password?token=… from the reset email. Signs the user in when done. */
export function ResetPassword() {
  usePageSEO({ title: "Choose a new password", description: "Reset your Anobyt password.", path: "/reset-password", noindex: true });
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";
  const [f, setF] = useState({ next: "", again: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (f.next !== f.again) return setErr("The passwords don't match.");
    setBusy(true);
    try {
      const d = await resetPassword(token, f.next);
      nav(homeFor(d.user), { replace: true });
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <Page narrow={480}>
      <Head title="Choose a new password">You'll be signed in once it's saved. Other devices get signed out.</Head>
      <div className="panel">
        {!token ? (
          <p className="note bad" style={{ marginTop: 0 }}>
            This link is missing its token. <Link className="linkish" to="/login?mode=forgot">Ask for a new reset link</Link>.
          </p>
        ) : (
          <form onSubmit={submit}>
            <label className="l" style={{ marginTop: 0 }} htmlFor="rp-new">New password</label>
            <input id="rp-new" className="inp" type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} required minLength={8} maxLength={100} autoComplete="new-password" />
            <label className="l" htmlFor="rp-again">Repeat it</label>
            <input id="rp-again" className="inp" type="password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} required minLength={8} autoComplete="new-password" />
            {err && (
              <p className="note bad">
                {err} <Link className="linkish" to="/login?mode=forgot">Get a new link</Link>
              </p>
            )}
            <button className="btn" style={{ marginTop: 16, width: "100%" }} disabled={busy}>
              {busy ? "Saving…" : "Save and sign in"}
            </button>
          </form>
        )}
      </div>
    </Page>
  );
}
