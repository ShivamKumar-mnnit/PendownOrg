import { useCallback, useState } from "react";
import { Copy, Pause, Play, Trash2 } from "lucide-react";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import { adminList, createCode, deleteCode, listCodes, updateCode } from "../../lib/contentApi";
import { Field, Gate, SectionTop } from "./shared";
import { fmtDate, useAdminData } from "./adminUtils";

const blank = { label: "", code: "", scopeAll: true, scope: [], expiresAt: "", maxUses: 2 };

export default function AccessCodes() {
  const load = useCallback(() => Promise.all([listCodes(), adminList("courses")]).then(([codes, courses]) => ({ codes, courses })), []);
  const state = useAdminData(load);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState("");
  const [now] = useState(() => Date.now());
  const premium = (state.data?.courses || []).filter((c) => c.tier === "premium");
  const titleOf = (id) => state.data?.courses.find((c) => c.id === id)?.title || id;

  async function act(fn) {
    setErr("");
    try {
      await fn();
      state.reload();
    } catch (e) {
      setErr(e.message);
    }
  }

  function create(e) {
    e.preventDefault();
    if (!f.scopeAll && !f.scope.length) return setErr("Pick at least one course, or allow all premium courses.");
    act(async () => {
      const rec = await createCode({ label: f.label, code: f.code, scope: f.scopeAll ? "all" : f.scope, expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).getTime() : 0, maxUses: f.maxUses });
      setCreated(rec);
      setF(blank);
    });
  }

  const shareText = (c) =>
    `Your Anobyt premium access code: *${c.code}*\n\nOpen ${window.location.origin}/courses, pick your course and enter this code to unlock the lessons.${c.expiresAt ? `\nValid until ${new Date(c.expiresAt).toLocaleDateString("en-IN")}.` : ""}`;
  function copy(c) {
    navigator.clipboard?.writeText(c.code).then(() => {
      setCopied(c.code);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  return (
    <div>
      <SectionTop
        title="Premium access"
        text="Create an access code for each student (for example after they pay), then send it to them. The code unlocks premium lessons; turning it off locks them again."
      />
      {err && <p className="note bad">{err}</p>}
      <Gate state={state}>
        <form className="panel" onSubmit={create}>
          <h3 style={{ fontSize: 19 }}>New access code</h3>
          <div className="three">
            <Field label="Student or batch name">
              <input className="inp" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="e.g. Riya Sharma" />
            </Field>
            <Field label="Valid until (optional)">
              <input className="inp" type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} />
            </Field>
            <Field label="Devices allowed (0 = unlimited)" hint="Each device the code is entered on counts once.">
              <input className="inp" type="number" min={0} value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} />
            </Field>
          </div>
          <Field label="Custom code (optional)" hint="Leave empty to generate a random code.">
            <input className="inp" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="e.g. DSA-BATCH-1" style={{ maxWidth: 320 }} />
          </Field>
          <label className="l">Unlocks</label>
          <div className="checks inline">
            <label>
              <input type="checkbox" checked={f.scopeAll} onChange={(e) => setF({ ...f, scopeAll: e.target.checked })} /> All premium courses
            </label>
            {!f.scopeAll &&
              premium.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={f.scope.includes(c.id)}
                    onChange={(e) => setF({ ...f, scope: e.target.checked ? [...f.scope, c.id] : f.scope.filter((x) => x !== c.id) })}
                  />{" "}
                  {c.title}
                </label>
              ))}
          </div>
          <button className="btn" style={{ marginTop: 16 }}>
            Create code
          </button>
          {created && (
            <div className="created">
              <span>
                Created <b className="mono">{created.code}</b>
              </span>
              <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(shareText(created))}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-4 w-4" /> Send on WhatsApp
              </a>
            </div>
          )}
        </form>

        <h3 style={{ fontSize: 19, margin: "26px 0 12px" }}>All codes</h3>
        {!state.data?.codes.length && (
          <div className="empty">
            <b>No codes yet</b>
            <span>Create one above for your first premium student.</span>
          </div>
        )}
        <div className="tablewrap" style={{ display: state.data?.codes.length ? "block" : "none" }}>
          <table className="dtable">
            <thead>
              <tr>
                <th>Code</th>
                <th>For</th>
                <th>Unlocks</th>
                <th>Devices</th>
                <th>Expires</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(state.data?.codes || []).map((c) => {
                const expired = c.expiresAt && c.expiresAt < now;
                return (
                  <tr key={c.code}>
                    <td>
                      <b className="mono">{c.code}</b>
                    </td>
                    <td>{c.label || "—"}</td>
                    <td>{c.scope === "all" ? "All premium" : c.scope.map(titleOf).join(", ")}</td>
                    <td>
                      {c.uses}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td>{c.expiresAt ? fmtDate(c.expiresAt).split(",")[0] : "Never"}</td>
                    <td>{expired ? <span className="bad">Expired</span> : c.active ? <span className="ok">Active</span> : <span className="note">Off</span>}</td>
                    <td>
                      <div className="tact" style={{ flexWrap: "nowrap" }}>
                        <button type="button" className="ib" title={copied === c.code ? "Copied" : "Copy code"} onClick={() => copy(c)}>
                          <Copy className="h-4 w-4" />
                        </button>
                        <a className="ib" title="Send on WhatsApp" href={`https://wa.me/?text=${encodeURIComponent(shareText(c))}`} target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon className="h-4 w-4" />
                        </a>
                        <button type="button" className="ib" title={c.active ? "Turn off (locks content)" : "Turn on"} onClick={() => act(() => updateCode(c.code, { active: !c.active }))}>
                          {c.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button type="button" className="ib danger" title="Delete" onClick={() => confirm(`Delete code ${c.code}? Students using it lose access.`) && act(() => deleteCode(c.code))}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Gate>
    </div>
  );
}
