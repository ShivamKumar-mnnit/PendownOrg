import { useCallback, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { adminRunner, saveRunner, testRunner } from "../../lib/account";
import { LANG_NAMES } from "../../lib/problemBank";
import { Field, Gate, SectionTop } from "./shared";
import { useAdminData } from "./adminUtils";

/** Health check for the code runner, plus an optional backup runner (Judge0) used when the main one is down. */
export default function RunnerAdmin() {
  const load = useCallback(() => adminRunner(), []);
  const state = useAdminData(load);
  return (
    <div>
      <SectionTop
        title="Compiler and code runner"
        text="The compiler, practice problems and coding tests run code on api.anobyt.in. Check that every language works, and add a backup runner so code still runs if that server is down."
      />
      <Gate state={state}>{state.data && <RunnerFields initial={state.data} />}</Gate>
    </div>
  );
}

function Check({ which, label }) {
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function run() {
    setBusy(true);
    setErr("");
    try {
      setRes(await testRunner(which));
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }
  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" className="btn ghost" onClick={run} disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {label}
      </button>
      {err && <p className="note bad">{err}</p>}
      {res && (
        <div className="tablewrap" style={{ marginTop: 10 }}>
          <table className="dtable">
            <tbody>
              {res.map((r) => (
                <tr key={r.language}>
                  <td>
                    <b>{LANG_NAMES[r.language]}</b>
                  </td>
                  <td>
                    {r.ok ? (
                      <span className="ok">
                        <CheckCircle2 className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> Works · {r.ms} ms{r.runner === "backup" ? " · backup" : ""}
                      </span>
                    ) : (
                      <span className="bad">
                        <XCircle className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> {String(r.message).slice(0, 200)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RunnerFields({ initial }) {
  const [r, setR] = useState(initial);
  const [msg, setMsg] = useState("");
  async function save(e) {
    e.preventDefault();
    setMsg("");
    try {
      setR(await saveRunner(r));
      setMsg("Saved.");
    } catch (x) {
      setMsg(x.message);
    }
  }
  return (
    <>
      <div className="panel">
        <h3 style={{ fontSize: 19 }}>Main runner</h3>
        <p className="note">Runs a tiny program (read a number, print it doubled) in each language.</p>
        <Check which="main" label="Check the main runner" />
      </div>
      <form className="panel" style={{ marginTop: 16 }} onSubmit={save}>
        <h3 style={{ fontSize: 19 }}>Backup runner (optional)</h3>
        <p className="note">
          Any Judge0 server works: your own, or Judge0 CE on RapidAPI (URL <span className="mono">https://judge0-ce.p.rapidapi.com</span> with your RapidAPI key).
        </p>
        <div className="three">
          <Field label="Judge0 URL">
            <input className="inp mono" value={r.judge0Url} onChange={(e) => setR({ ...r, judge0Url: e.target.value.trim() })} placeholder="https://judge0-ce.p.rapidapi.com" />
          </Field>
          <Field label="API key">
            <input className="inp mono" type="password" value={r.judge0Key} onChange={(e) => setR({ ...r, judge0Key: e.target.value })} placeholder={r.hasKey ? "Saved. Leave empty to keep it" : "Key or token"} autoComplete="off" />
          </Field>
          <Field label="When to use it">
            <select className="inp" value={r.prefer} onChange={(e) => setR({ ...r, prefer: e.target.value })}>
              <option value="primary">Only when the main runner fails</option>
              <option value="judge0">Always (skip the main runner)</option>
            </select>
          </Field>
        </div>
        <div className="row" style={{ marginTop: 14, alignItems: "center" }}>
          <button className="btn">Save</button>
          {r.hasKey && (
            <button type="button" className="btn ghost" onClick={() => setR({ ...r, clearKey: true, hasKey: false })}>
              Remove saved key
            </button>
          )}
          {msg && <span className="note" style={{ margin: 0 }}>{msg}</span>}
        </div>
        {initial.judge0Url && <Check which="backup" label="Check the backup runner" />}
      </form>
      <p className="note" style={{ marginTop: 16 }}>
        If the main runner can't be reached, JavaScript also runs inside the student's browser, so the compiler never goes fully dark.
      </p>
    </>
  );
}
