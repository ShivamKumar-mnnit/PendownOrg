import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { adminLogin, setAdminKey } from "../../lib/testsApi";

export function ServerLogin({ status, onDone }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  if (status === 503)
    return (
      <div className="panel" style={{ maxWidth: 640 }}>
        <h3>One-time setup needed</h3>
        <p className="note">
          This section is saved on the server, so it needs a server admin password. In Netlify, open Site configuration → Environment
          variables, add <b>ADMIN_PASSWORD</b> with a strong password, then redeploy. After that, unlock this page with that password.
        </p>
      </div>
    );
  return (
    <form
      className="panel"
      style={{ maxWidth: 440 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await adminLogin(key);
        if (r.ok) {
          setAdminKey(key);
          onDone();
        } else setErr(r.error || "Incorrect password.");
      }}
    >
      <h3>Enter the server admin password</h3>
      <p className="note">This section uses the ADMIN_PASSWORD set in Netlify, which is different from the old sessions passcode.</p>
      <input className="inp" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_PASSWORD" style={{ marginTop: 12 }} />
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 12 }} disabled={!key}>
        Continue
      </button>
    </form>
  );
}

/** Wraps an admin section: shows the login/setup screen or the error, else the children. */
export function Gate({ state, children }) {
  if (state.needLogin) return <ServerLogin status={state.needLogin} onDone={state.reload} />;
  if (state.error) return <p className="note bad">{state.error}</p>;
  if (state.data === null) return <p className="note">Loading…</p>;
  return children;
}

export function SectionTop({ title, text, children }) {
  return (
    <div className="admin-top" style={{ marginTop: 8 }}>
      <div>
        <h2 style={{ fontSize: 24 }}>{title}</h2>
        {text && <p className="note" style={{ marginTop: 4 }}>{text}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

export function MoveButtons({ i, count, onMove }) {
  return (
    <>
      <button type="button" className="ib" title="Move up" disabled={i === 0} onClick={() => onMove(i, -1)}>
        <ArrowUp className="h-4 w-4" />
      </button>
      <button type="button" className="ib" title="Move down" disabled={i === count - 1} onClick={() => onMove(i, 1)}>
        <ArrowDown className="h-4 w-4" />
      </button>
    </>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="l">{label}</label>
      {children}
      {hint && <p className="note" style={{ marginTop: 4, fontSize: 13 }}>{hint}</p>}
    </div>
  );
}
