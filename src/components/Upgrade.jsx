import { Link } from "react-router-dom";
import { Check, Crown, Lock } from "lucide-react";
import Buy from "./Buy";
import { rupees, validity } from "../lib/account";
import { MEMBER_PERKS, PRACTICE_PERKS } from "../lib/plans";

/**
 * The upgrade box shown wherever something needs premium access: what the
 * student gets, the price, how long it lasts and a button to pay.
 * `plan` comes from the practice API: { practice, allAccess } prices.
 */
export default function Upgrade({ plan, title = "Unlock premium practice", text, compact = false, onDone }) {
  const options = [
    plan?.practice?.enabled && plan.practice.paid && { id: "practice", name: "Premium practice", f: plan.practice, perks: PRACTICE_PERKS },
    plan?.allAccess?.enabled && plan.allAccess.paid && { id: "allAccess", name: "Premium membership", f: plan.allAccess, perks: MEMBER_PERKS, best: true },
  ].filter(Boolean);
  return (
    <div className={`upgrade${compact ? " compact" : ""}`}>
      <div className="upgrade-head">
        <span className="upgrade-icon">
          <Lock className="h-5 w-5" />
        </span>
        <div>
          <h3>{title}</h3>
          {text && <p>{text}</p>}
        </div>
      </div>
      {options.length ? (
        <div className="upgrade-plans">
          {options.map((o) => (
            <div key={o.id} className={`upgrade-plan${o.best ? " best" : ""}`}>
              <div className="meta" style={{ justifyContent: "flex-start", gap: 8 }}>
                {o.best ? <Crown className="h-4 w-4" /> : null}
                <b>{o.name}</b>
                {o.best && <span className="tag prem">Best value</span>}
              </div>
              <div className="price">
                {rupees(o.f.price)} <small>/ {validity(o.f.days)}</small>
              </div>
              {!compact && (
                <ul className="ticks">
                  {o.perks.map((p) => (
                    <li key={p}>
                      <Check className="h-4 w-4" /> {p}
                    </li>
                  ))}
                </ul>
              )}
              <Buy item={{ type: "feature", id: o.id }} price={o.f.price} label={`Get ${o.name.toLowerCase()}`} className={o.best ? "btn" : "btn ghost"} onDone={onDone} />
            </div>
          ))}
        </div>
      ) : (
        <p className="note">Premium access isn't on sale right now. Message us on WhatsApp and we'll set it up for you.</p>
      )}
      <p className="upgrade-foot">
        Access opens straight after an online payment (UPI payments open once we confirm them). <Link to="/premium" className="linkish">Compare free and premium</Link>
      </p>
    </div>
  );
}
