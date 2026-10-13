import { useCallback, useState } from "react";
import { Check, Download, Plus, Trash2, X } from "lucide-react";
import { adminPaySettings, adminPayments, decidePayment, rupees, savePaySettings, testPayAccount } from "../../lib/account";
import { Field, Gate, SectionTop } from "./shared";
import { downloadCsv, fmtDate, useAdminData } from "./adminUtils";

const STATUS = { paid: ["ok", "Paid"], pending: ["note", "Waiting for you"], failed: ["bad", "Failed"], rejected: ["bad", "Rejected"], created: ["note", "Started"] };

export default function PaymentsAdmin() {
  return (
    <div>
      <AccountsForm />
      <div style={{ height: 40 }} />
      <PaymentsLog />
    </div>
  );
}

function AccountsForm() {
  const load = useCallback(() => adminPaySettings(), []);
  const state = useAdminData(load);
  return (
    <div>
      <SectionTop
        title="Payment accounts"
        text="Add your Razorpay keys to take card, UPI and netbanking payments automatically. Without Razorpay, add a UPI ID: students pay and send the transaction ID, and you approve it below."
      />
      <Gate state={state}>{state.data && <AccountsFields initial={state.data} onSaved={state.reload} />}</Gate>
    </div>
  );
}

function AccountsFields({ initial, onSaved }) {
  const [s, setS] = useState(initial.settings);
  const [msg, setMsg] = useState("");
  const [tests, setTests] = useState({});
  const setAcc = (i, patch) => setS({ ...s, accounts: s.accounts.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const add = (provider) => setS({ ...s, accounts: [...s.accounts, { provider, label: provider === "upi" ? "UPI" : "Razorpay", keyId: "", keySecret: "", webhookSecret: "", upiId: "", payeeName: "", instructions: "", active: !s.accounts.some((a) => a.provider === provider && a.active) }] });
  const webhook = `${window.location.origin}/api/pay/webhook`;

  async function save(e) {
    e?.preventDefault();
    setMsg("");
    try {
      await savePaySettings(s);
      setMsg("Saved.");
      onSaved();
    } catch (x) {
      setMsg(x.message);
    }
  }
  async function test(a) {
    setTests((t) => ({ ...t, [a.id]: "Checking…" }));
    const r = await testPayAccount(a.id).catch((x) => ({ ok: false, message: x.message }));
    setTests((t) => ({ ...t, [a.id]: r.message }));
  }

  return (
    <form className="panel" onSubmit={save}>
      {initial.env && (
        <p className="note ok" style={{ marginTop: 0 }}>
          Razorpay keys from Netlify environment variables are in use (key {initial.env.keyId}). They take priority over accounts saved here.
        </p>
      )}
      <Field label="Business name shown at checkout">
        <input className="inp" value={s.businessName} onChange={(e) => setS({ ...s, businessName: e.target.value })} style={{ maxWidth: 360 }} />
      </Field>
      {s.accounts.map((a, i) => (
        <div key={a.id || i} className="lesson-ed">
          <div className="qhead">
            <span className={`tag ${a.provider === "upi" ? "" : "t-mcq"}`}>{a.provider === "upi" ? "UPI (manual)" : "Razorpay"}</span>
            <input className="inp" style={{ flex: 1, minWidth: 160 }} value={a.label} onChange={(e) => setAcc(i, { label: e.target.value })} placeholder="Name, e.g. Main account" />
            <label className="mini">
              <input
                type="radio"
                name={`active-${a.provider}`}
                checked={a.active}
                onChange={() => setS({ ...s, accounts: s.accounts.map((x, j) => (x.provider === a.provider ? { ...x, active: j === i } : x)) })}
              />{" "}
              In use
            </label>
            <button type="button" className="ib danger" title="Remove account" onClick={() => confirm("Remove this payment account?") && setS({ ...s, accounts: s.accounts.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {a.provider === "razorpay" ? (
            <>
              <div className="three">
                <Field label="Key ID" hint="Razorpay Dashboard → Account & Settings → API keys.">
                  <input className="inp mono" value={a.keyId} onChange={(e) => setAcc(i, { keyId: e.target.value.trim() })} placeholder="rzp_live_…" />
                </Field>
                <Field label="Key secret">
                  <input className="inp mono" type="password" value={a.keySecret} onChange={(e) => setAcc(i, { keySecret: e.target.value })} placeholder={a.hasSecret ? "Saved. Leave empty to keep it" : "Paste the secret"} autoComplete="off" />
                </Field>
                <Field label="Webhook secret (recommended)" hint="Catches payments when a student closes the window early.">
                  <input className="inp mono" type="password" value={a.webhookSecret} onChange={(e) => setAcc(i, { webhookSecret: e.target.value })} placeholder={a.hasWebhookSecret ? "Saved. Leave empty to keep it" : "Optional"} autoComplete="off" />
                </Field>
              </div>
              <p className="note" style={{ fontSize: 13 }}>
                Webhook URL for Razorpay (event <b>order.paid</b>): <span className="mono">{webhook}</span>
              </p>
              {a.id && a.hasSecret && (
                <div className="row" style={{ alignItems: "center" }}>
                  <button type="button" className="btn ghost" onClick={() => test(a)}>
                    Check these keys
                  </button>
                  {tests[a.id] && <span className="note" style={{ margin: 0 }}>{tests[a.id]}</span>}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="two">
                <Field label="UPI ID">
                  <input className="inp mono" value={a.upiId} onChange={(e) => setAcc(i, { upiId: e.target.value.trim() })} placeholder="yourname@okaxis" />
                </Field>
                <Field label="Name shown to students">
                  <input className="inp" value={a.payeeName} onChange={(e) => setAcc(i, { payeeName: e.target.value })} placeholder="Anobyt" />
                </Field>
              </div>
              <Field label="Note for students (optional)">
                <input className="inp" value={a.instructions} onChange={(e) => setAcc(i, { instructions: e.target.value })} placeholder="e.g. Access opens within 2 hours of payment." />
              </Field>
            </>
          )}
        </div>
      ))}
      <div className="row" style={{ marginTop: 16, alignItems: "center" }}>
        <button type="button" className="chip" onClick={() => add("razorpay")}>
          <Plus className="h-3.5 w-3.5" style={{ display: "inline", verticalAlign: -2 }} /> Razorpay account
        </button>
        <button type="button" className="chip" onClick={() => add("upi")}>
          <Plus className="h-3.5 w-3.5" style={{ display: "inline", verticalAlign: -2 }} /> UPI account
        </button>
        <button className="btn" style={{ marginLeft: "auto" }}>
          Save payment settings
        </button>
        {msg && <span className="note" style={{ margin: 0 }}>{msg}</span>}
      </div>
    </form>
  );
}

function PaymentsLog() {
  const load = useCallback(() => adminPayments(), []);
  const state = useAdminData(load);
  const [filter, setFilter] = useState("all");
  const [err, setErr] = useState("");
  const pays = state.data || [];
  const shown = pays.filter((p) => filter === "all" || p.status === filter);
  const revenue = pays.filter((p) => p.status === "paid").reduce((n, p) => n + p.amount, 0);
  const pending = pays.filter((p) => p.status === "pending").length;

  async function decide(p, action) {
    if (action === "reject" && !confirm("Reject this payment? The student won't get access.")) return;
    setErr("");
    try {
      await decidePayment(p.id, action);
      state.reload();
    } catch (x) {
      setErr(x.message);
    }
  }

  return (
    <div>
      <SectionTop title="Payments" text="Every purchase. UPI payments wait here until you check the transaction ID in your bank app and approve it.">
        <button
          type="button"
          className="btn ghost"
          disabled={!pays.length}
          onClick={() =>
            downloadCsv(
              [["Date", "Student", "Email", "Item", "Amount", "Status", "Method", "Payment / UTR"], ...pays.map((p) => [fmtDate(p.createdAt), p.userName, p.userEmail, p.title, p.amount, p.status, p.provider, p.paymentId || p.utr || p.id])],
              "payments.csv",
            )
          }
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </SectionTop>
      {err && <p className="note bad">{err}</p>}
      <Gate state={state}>
        <div className="kpis">
          <div>
            <b>{rupees(revenue)}</b>
            <span>Received</span>
          </div>
          <div>
            <b>{pays.filter((p) => p.status === "paid").length}</b>
            <span>Paid orders</span>
          </div>
          <div>
            <b>{pending}</b>
            <span>Waiting for approval</span>
          </div>
        </div>
        <div className="row" style={{ marginBottom: 12 }}>
          {[
            ["all", "All"],
            ["pending", "Waiting"],
            ["paid", "Paid"],
            ["failed", "Failed"],
            ["rejected", "Rejected"],
          ].map(([k, l]) => (
            <button key={k} type="button" className={`chip${filter === k ? " on" : ""}`} onClick={() => setFilter(k)}>
              {l}
            </button>
          ))}
        </div>
        {!shown.length ? (
          <div className="empty">
            <b>No payments here yet</b>
          </div>
        ) : (
          <div className="tablewrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Item</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.createdAt)}</td>
                    <td>
                      {p.userName}
                      <small style={{ display: "block", color: "var(--color-fg-muted)" }}>{p.userEmail}</small>
                    </td>
                    <td>{p.title}</td>
                    <td>{rupees(p.amount)}</td>
                    <td>
                      {p.provider === "upi" ? "UPI" : "Razorpay"}
                      <small className="mono" style={{ display: "block", color: "var(--color-fg-muted)" }}>{p.utr || p.paymentId || ""}</small>
                    </td>
                    <td>
                      <span className={STATUS[p.status]?.[0]}>{STATUS[p.status]?.[1] || p.status}</span>
                    </td>
                    <td>
                      {(p.status === "pending" || p.status === "failed") && (
                        <div className="tact" style={{ flexWrap: "nowrap" }}>
                          <button type="button" className="ib" title="Approve and give access" onClick={() => decide(p, "approve")}>
                            <Check className="h-4 w-4" />
                          </button>
                          {p.status === "pending" && (
                            <button type="button" className="ib danger" title="Reject" onClick={() => decide(p, "reject")}>
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Gate>
    </div>
  );
}
