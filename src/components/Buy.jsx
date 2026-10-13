import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, Lock, X } from "lucide-react";
import { payManually, payWithRazorpay, rupees, useAccount, usePayConfig } from "../lib/account";

/**
 * "Buy" button for anything sold on the site. Signed-out visitors are sent
 * to sign in first. Pays through Razorpay when the admin has added keys,
 * otherwise through UPI with the transaction ID checked by the admin.
 */
export default function Buy({ item, price, label, className = "btn", onDone }) {
  const { user } = useAccount();
  const cfg = usePayConfig();
  const loc = useLocation();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [upiOpen, setUpiOpen] = useState(false);

  if (!user)
    return (
      <Link className={className} to={`/account?next=${encodeURIComponent(loc.pathname + loc.search)}`}>
        <Lock className="h-4 w-4" /> Sign in to buy · {rupees(price)}
      </Link>
    );

  async function buy() {
    setMsg("");
    if (cfg?.razorpay) {
      setBusy(true);
      try {
        const done = await payWithRazorpay(item);
        if (done) {
          setMsg("Payment received. Unlocked!");
          onDone?.(done);
        }
      } catch (e) {
        setMsg(e.message);
      }
      setBusy(false);
    } else if (cfg?.upi) setUpiOpen(true);
    else setMsg("Online payments aren't set up yet. Message us on WhatsApp to buy.");
  }

  return (
    <>
      <button type="button" className={className} onClick={buy} disabled={busy || !cfg}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {label || "Buy"} · {rupees(price)}
      </button>
      {msg && <p className={`note ${/Unlocked/.test(msg) ? "ok" : "bad"}`} style={{ marginTop: 8 }}>{msg}</p>}
      {upiOpen && <UpiDialog upi={cfg.upi} item={item} price={price} title={label} onClose={() => setUpiOpen(false)} onSent={() => setMsg("")} />}
    </>
  );
}

function UpiDialog({ upi, item, price, title, onClose, onSent }) {
  const [utr, setUtr] = useState("");
  const [state, setState] = useState({ busy: false, err: "", done: false });
  const link = `upi://pay?pa=${encodeURIComponent(upi.upiId)}&pn=${encodeURIComponent(upi.payeeName || "Anobyt")}&am=${price}&cu=INR&tn=${encodeURIComponent((title || "Anobyt").slice(0, 40))}`;

  async function send(e) {
    e.preventDefault();
    setState({ busy: true, err: "", done: false });
    try {
      await payManually(item, utr.trim());
      setState({ busy: false, err: "", done: true });
      onSent?.();
    } catch (x) {
      setState({ busy: false, err: x.message, done: false });
    }
  }

  return (
    <div className="modal-back" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel">
        <button type="button" className="ib modal-x" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <h3>Pay {rupees(price)} by UPI</h3>
        {state.done ? (
          <>
            <p className="note ok">Thanks! We've received your payment details. Access opens as soon as we confirm the payment, usually within a few hours.</p>
            <Link className="btn" to="/account" onClick={onClose}>
              See my purchases
            </Link>
          </>
        ) : (
          <form onSubmit={send}>
            <ol className="upi-steps">
              <li>
                Pay <b>{rupees(price)}</b> to <b className="mono">{upi.upiId}</b>
                {upi.payeeName ? ` (${upi.payeeName})` : ""} from any UPI app.{" "}
                <a href={link} className="linkish">
                  Open UPI app
                </a>
              </li>
              <li>Copy the 12-digit UPI transaction ID (UTR) from the payment receipt.</li>
              <li>Paste it below and send.</li>
            </ol>
            {upi.instructions && <p className="note">{upi.instructions}</p>}
            <input className="inp mono" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="UPI transaction ID, e.g. 412345678901" required />
            {state.err && <p className="note bad">{state.err}</p>}
            <button className="btn" style={{ marginTop: 12 }} disabled={state.busy || utr.trim().length < 6}>
              {state.busy ? "Sending…" : "Send for confirmation"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
