import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { CheckCircle2, Clock, LayoutDashboard, LogOut, MailWarning, ShieldCheck } from "lucide-react";
import { Page } from "../components/ui";
import { ChangePasswordForm } from "../components/AuthForms";
import { logout, myPayments, rupees, updateProfile, useAccount } from "../lib/account";
import { ROLE_LABELS, authApi, fmtDay, homeFor, isAdminRole } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

export default function Account() {
  usePageSEO({ title: "Your account", description: "Your Anobyt profile, password and purchases.", path: "/account", noindex: true });
  const { user, features, loaded } = useAccount();
  const location = useLocation();
  if (!loaded) return <Page narrow={520}><p className="note">Loading…</p></Page>;
  // Older links point at /account?next=…&mode=signup; the sign-in page takes the same parameters.
  if (!user) return <Navigate to={`/login${location.search || "?next=/account"}`} replace />;
  return <Profile user={user} features={features} />;
}

function Profile({ user, features }) {
  const [pays, setPays] = useState(null);
  const [edit, setEdit] = useState(false);
  useEffect(() => {
    myPayments().then(setPays, () => setPays([]));
  }, []);
  const owned = Object.entries(features || {}).filter(([, f]) => f.has);
  const courseGrants = (user.grants || []).filter((g) => g.type !== "feature");
  const admin = isAdminRole(user);

  return (
    <Page narrow={980}>
      <div className="admin-top">
        <div>
          <span className="eyebrow">{ROLE_LABELS[user.role] || "Account"}</span>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>Hi, {user.name.split(" ")[0]}</h1>
          <p className="note" style={{ marginTop: 4 }}>
            {[user.email, user.college, user.regNo && `Reg. no ${user.regNo}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="row">
          <Link className="btn" to={homeFor(user)}>
            <LayoutDashboard className="h-4 w-4" /> {user.role === "SUPERADMIN" ? "Admin panel" : admin ? "Trainer dashboard" : "Dashboard"}
          </Link>
          {admin && (
            <Link className="btn ghost" to="/workspace">
              College panel
            </Link>
          )}
          <button type="button" className="btn ghost" onClick={() => logout()}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {user.email && !user.emailVerified && !user.googleLinked && <VerifyBanner email={user.email} />}

      <div className="two" style={{ gap: 20, alignItems: "start" }}>
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
              <dt>Email</dt>
              <dd>
                {user.email || "—"}{" "}
                {user.emailVerified && <ShieldCheck className="h-4 w-4 ok" style={{ display: "inline", verticalAlign: -3 }} aria-label="Confirmed" />}
              </dd>
              <dt>Phone</dt>
              <dd>{user.phone || "—"}</dd>
              {admin ? (
                <>
                  <dt>Organisation</dt>
                  <dd>{user.organization || "—"}</dd>
                </>
              ) : (
                <>
                  <dt>College</dt>
                  <dd>{user.college || "—"}</dd>
                  <dt>Domain</dt>
                  <dd>{user.domain || "—"}</dd>
                  <dt>Resume</dt>
                  <dd>
                    {user.resumeLink ? (
                      <a className="linkish" href={user.resumeLink} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </>
              )}
              <dt>Member since</dt>
              <dd>{fmtDay(user.createdAt)}</dd>
            </dl>
          )}
        </div>

        <div className="panel">
          <h3 style={{ fontSize: 19 }}>Password and sign-in</h3>
          <div style={{ marginTop: 14 }}>
            <ChangePasswordForm />
          </div>
          <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 20, paddingTop: 16 }}>
            <p className="note" style={{ marginTop: 0, fontSize: 14 }}>Lost a phone or used a shared computer? Sign out every device at once.</p>
            <button
              type="button"
              className="btn ghost"
              onClick={() => confirm("Sign out on every device, including this one?") && logout(true)}
            >
              Sign out everywhere
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 19 }}>Your premium access</h3>
        {features === null ? (
          <p className="note">
            {user.email && !user.emailVerified && !user.googleLinked
              ? "Confirm your email to link purchases made with this address."
              : "Purchases couldn't be loaded right now."}
          </p>
        ) : (
          <>
            {!owned.length && !courseGrants.length && <p className="note">Nothing premium yet. Free courses, problems and the compiler are open to you.</p>}
            <ul className="ck">
              {owned.map(([id, f]) => (
                <li key={id}>
                  <b style={{ color: "var(--color-fg)" }}>{f.title}</b>
                  {f.paid ? (f.expiresAt ? ` · until ${fmtDay(f.expiresAt)}` : " · lifetime") : " · free for everyone"}
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
          </>
        )}
        <Link className="btn ghost" to="/premium" style={{ marginTop: 14 }}>
          See premium plans
        </Link>
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
                  <td>{fmtDay(p.createdAt)}</td>
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

function VerifyBanner({ email }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="panel" style={{ marginBottom: 20, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <MailWarning className="h-5 w-5" style={{ color: "var(--color-accent)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <b>Confirm your email</b>
        <p className="note" style={{ margin: "2px 0 0", fontSize: 14 }}>
          {msg || `We sent a link to ${email}. Confirming it keeps your account recoverable.`}
        </p>
      </div>
      <button
        type="button"
        className="btn ghost"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            setMsg((await authApi.resendVerification())?.message || "A new link is on its way.");
          } catch (e) {
            setMsg(e.message);
          }
          setBusy(false);
        }}
      >
        {busy ? "Sending…" : "Resend link"}
      </button>
    </div>
  );
}

function ProfileForm({ user, onDone }) {
  const admin = isAdminRole(user);
  const [f, setF] = useState({ name: user.name || "", phone: user.phone || "", domain: user.domain || "", resumeLink: user.resumeLink || "", organization: user.organization || "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const body = { name: f.name.trim(), phone: f.phone.trim() };
      if (admin) body.organization = f.organization.trim();
      else Object.assign(body, { domain: f.domain.trim(), resumeLink: f.resumeLink.trim() });
      await updateProfile(body);
      onDone();
    } catch (x) {
      setMsg(x.message);
    }
    setBusy(false);
  }
  return (
    <form onSubmit={save}>
      <label className="l">Name</label>
      <input className="inp" value={f.name} onChange={set("name")} required maxLength={100} />
      <label className="l">Phone</label>
      <input className="inp" type="tel" value={f.phone} onChange={set("phone")} maxLength={20} />
      {admin ? (
        <>
          <label className="l">Organisation</label>
          <input className="inp" value={f.organization} onChange={set("organization")} maxLength={150} />
        </>
      ) : (
        <>
          <label className="l">Domain</label>
          <input className="inp" value={f.domain} onChange={set("domain")} maxLength={100} placeholder="SDE, Data, Product…" />
          <label className="l">Resume link</label>
          <input className="inp" type="url" value={f.resumeLink} onChange={set("resumeLink")} maxLength={1000} placeholder="https://drive.google.com/…" />
        </>
      )}
      {msg && <p className="note bad">{msg}</p>}
      <button className="btn" style={{ marginTop: 14 }} disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
