import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, LogOut } from "lucide-react";
import { Head, Page } from "../components/ui";
import { login, logout, myPayments, rupees, signup, updateProfile, useAccount } from "../lib/account";
import { usePageSEO } from "../lib/seo";

const fmt = (ts) => (ts ? new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function Account() {
  usePageSEO({ title: "Your account", description: "Sign in to Anobyt to unlock courses, tests and the college panel.", path: "/account", noindex: true });
  const { user, features, loaded } = useAccount();
  if (!loaded) return <Page narrow={520}><p className="note">Loading…</p></Page>;
  return user ? <Profile user={user} features={features} /> : <SignIn />;
}

function SignIn() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", college: "", year: "", website: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") await login(f.email, f.password);
      else await signup(f);
      const next = params.get("next");
      if (next && next.startsWith("/")) nav(next);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  }

  return (
    <Page narrow={520}>
      <Head title={mode === "login" ? "Sign in" : "Create your account"}>
        {mode === "login" ? "Pick up where you left off: your courses, tests and progress." : "Free to create. Your practice progress and purchases stay with your account."}
      </Head>
      <div className="seg tabs" style={{ marginBottom: 16 }}>
        <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
          Sign in
        </button>
        <button type="button" className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>
          Create account
        </button>
      </div>
      <form className="panel" onSubmit={submit}>
        {mode === "signup" && (
          <>
            <label className="l" style={{ marginTop: 0 }}>Full name</label>
            <input className="inp" value={f.name} onChange={set("name")} required autoComplete="name" />
          </>
        )}
        <label className="l" style={mode === "login" ? { marginTop: 0 } : undefined}>Email</label>
        <input className="inp" type="email" value={f.email} onChange={set("email")} required autoComplete="email" />
        <label className="l">Password</label>
        <input className="inp" type="password" value={f.password} onChange={set("password")} required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        {mode === "signup" && (
          <>
            <p className="note" style={{ marginTop: 4, fontSize: 13 }}>At least 8 characters.</p>
            <div className="two">
              <div>
                <label className="l">Phone (optional)</label>
                <input className="inp" value={f.phone} onChange={set("phone")} autoComplete="tel" />
              </div>
              <div>
                <label className="l">Year (optional)</label>
                <select className="inp" value={f.year} onChange={set("year")}>
                  <option value="">Choose</option>
                  {["1st year", "2nd year", "3rd year", "4th year", "Graduate", "Faculty / TPO"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="l">College (optional)</label>
            <input className="inp" value={f.college} onChange={set("college")} />
            <input className="hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden="true" />
          </>
        )}
        {err && <p className="note bad">{err}</p>}
        <button className="btn" style={{ marginTop: 18, width: "100%" }} disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        {mode === "login" && <p className="note" style={{ fontSize: 13 }}>Forgot your password? Message us on WhatsApp and we'll reset it.</p>}
      </form>
    </Page>
  );
}

function Profile({ user, features }) {
  const [pays, setPays] = useState(null);
  const [edit, setEdit] = useState(false);
  useEffect(() => {
    myPayments().then(setPays, () => setPays([]));
  }, []);
  const owned = Object.entries(features || {}).filter(([, f]) => f.has);
  const workspace = features?.studentData?.has || features?.createTests?.has || features?.collegePanel?.has;
  const courseGrants = (user.grants || []).filter((g) => g.type !== "feature");

  return (
    <Page narrow={980}>
      <div className="admin-top">
        <div>
          <span className="eyebrow">{user.role === "college" ? "College account" : "Student account"}</span>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>Hi, {user.name.split(" ")[0]}</h1>
          <p className="note" style={{ marginTop: 4 }}>
            {user.email}
            {user.collegeName || user.college ? ` · ${user.collegeName || user.college}` : ""}
          </p>
        </div>
        <div className="row">
          {workspace && (
            <Link className="btn" to="/workspace">
              Open {features?.collegePanel?.has ? "college panel" : "workspace"}
            </Link>
          )}
          <button type="button" className="btn ghost" onClick={() => logout()}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      <div className="two" style={{ gap: 20, alignItems: "start" }}>
        <div className="panel">
          <h3 style={{ fontSize: 19 }}>Your access</h3>
          {!owned.length && !courseGrants.length && <p className="note">Nothing premium yet. Free courses, problems and the compiler are open to you.</p>}
          <ul className="ck">
            {owned.map(([id, f]) => (
              <li key={id}>
                <b style={{ color: "var(--color-fg)" }}>{f.title}</b>
                {f.paid ? (f.expiresAt ? ` · until ${fmt(f.expiresAt)}` : " · lifetime") : " · free for everyone"}
              </li>
            ))}
            {courseGrants.map((g, i) => (
              <li key={i}>
                <Link className="linkish" to={`/courses/${g.type === "course" ? g.id : g.courseId}`}>
                  {g.type === "course" ? `Course: ${g.id}` : `Module of ${g.courseId}`}
                </Link>
              </li>
            ))}
          </ul>
          <Link className="btn ghost" to="/premium" style={{ marginTop: 14 }}>
            See premium plans
          </Link>
        </div>
        <div className="panel">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 19 }}>Profile</h3>
            <button type="button" className="linkish" onClick={() => setEdit(!edit)}>
              {edit ? "Close" : "Edit"}
            </button>
          </div>
          {edit ? (
            <ProfileForm user={user} onDone={() => setEdit(false)} />
          ) : (
            <dl className="kv">
              <dt>Name</dt>
              <dd>{user.name}</dd>
              <dt>Phone</dt>
              <dd>{user.phone || "—"}</dd>
              <dt>College</dt>
              <dd>{user.collegeName || user.college || "—"}</dd>
              <dt>Year</dt>
              <dd>{user.year || "—"}</dd>
              <dt>Problems solved</dt>
              <dd>{user.progress?.solved?.length || 0}</dd>
            </dl>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: 19, margin: "28px 0 12px" }}>Purchases</h3>
      {pays === null ? (
        <p className="note">Loading…</p>
      ) : !pays.length ? (
        <div className="empty">
          <b>No purchases yet</b>
          <span>When you buy a course or a tool it shows up here.</span>
        </div>
      ) : (
        <div className="tablewrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>Item</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pays.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{rupees(p.amount)}</td>
                  <td>{fmt(p.createdAt)}</td>
                  <td>
                    {p.status === "paid" ? (
                      <span className="ok">
                        <CheckCircle2 className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> Paid
                      </span>
                    ) : p.status === "pending" ? (
                      <span className="note">
                        <Clock className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> Waiting for confirmation
                      </span>
                    ) : (
                      <span className="bad">{p.status === "rejected" ? "Not confirmed" : "Failed"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}

function ProfileForm({ user, onDone }) {
  const [f, setF] = useState({ name: user.name, phone: user.phone || "", college: user.college || "", year: user.year || "", password: "", newPassword: "" });
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    setMsg("");
    try {
      await updateProfile(f.newPassword ? f : { ...f, password: undefined, newPassword: undefined });
      onDone();
    } catch (x) {
      setMsg(x.message);
    }
  }
  return (
    <form onSubmit={save}>
      <label className="l">Name</label>
      <input className="inp" value={f.name} onChange={set("name")} />
      <div className="two">
        <div>
          <label className="l">Phone</label>
          <input className="inp" value={f.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="l">Year</label>
          <input className="inp" value={f.year} onChange={set("year")} />
        </div>
      </div>
      <label className="l">College</label>
      <input className="inp" value={f.college} onChange={set("college")} />
      <label className="l">Change password (optional)</label>
      <div className="two">
        <input className="inp" type="password" value={f.password} onChange={set("password")} placeholder="Current password" autoComplete="current-password" />
        <input className="inp" type="password" value={f.newPassword} onChange={set("newPassword")} placeholder="New password" autoComplete="new-password" />
      </div>
      {msg && <p className="note bad">{msg}</p>}
      <button className="btn" style={{ marginTop: 14 }}>
        Save
      </button>
    </form>
  );
}
