import { useEffect } from "react";
import { Check, Crown, FileCode2, Gauge, ListChecks, Lock, Timer, X } from "lucide-react";
import Buy from "../Buy";
import { refreshAccount, rupees, validity } from "../../lib/account";
import { CODEVITA_PERKS } from "../../lib/plans";

const VALUE = [
  [ListChecks, "Full question bank", "Every level and topic, organised by pattern"],
  [FileCode2, "Editorials that teach", "Brute force to optimal, dry runs, C++, Java and Python"],
  [Timer, "Timed practice", "Practise against the clock like the real round"],
  [Gauge, "Scorecards", "Test-case results, time, memory and what to improve"],
];

/**
 * The upgrade popup for locked CodeVita problems. Leads with what the student gets,
 * then the prices from the existing payment system (CodeVita premium, Premium
 * membership, or the linked course when the admin set one).
 */
export default function UpgradeModal({ plan, totals, problem, onClose, onDone }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const done = async (r) => {
    await refreshAccount();
    onDone?.(r);
  };
  const options = [
    plan?.codevita?.enabled && plan.codevita.paid && { item: { type: "feature", id: "codevita" }, name: "CodeVita premium", price: plan.codevita.price, note: validity(plan.codevita.days), perks: ["Everything in this course", "Scorecards and progress tracking"] },
    plan?.course?.price > 0 && { item: { type: "course", id: plan.course.id }, name: plan.course.title, price: plan.course.price, note: "course + practice", perks: ["All course lessons", "Unlocks CodeVita premium too"] },
    plan?.allAccess?.enabled && plan.allAccess.paid && { item: { type: "feature", id: "allAccess" }, name: "Premium membership", price: plan.allAccess.price, note: validity(plan.allAccess.days), perks: ["CodeVita premium included", "Every premium course and practice problem"], best: true },
  ].filter(Boolean);

  return (
    <div className="cv-modal-back" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cv-modal" role="dialog" aria-modal="true" aria-labelledby="cv-up-title">
        <button type="button" className="cv-x" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="cv-up-head">
          <span className="cv-up-icon">
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <p className="cv-eyebrow">CodeVita premium</p>
            <h2 id="cv-up-title">{problem ? `Unlock "${problem.title}" and the full bank` : "Get CodeVita-ready with premium"}</h2>
            <p className="cv-muted">
              {totals ? `${totals.problems} problems across ${totals.topics?.length || 0} topics. ${totals.free} are free; premium opens the rest, ` : "Premium opens every problem, "}
              with editorials written to teach you how to think, not just what to type.
            </p>
          </div>
        </div>

        <div className="cv-up-value">
          {VALUE.map(([Icon, t, d]) => (
            <div key={t}>
              <Icon className="h-5 w-5" />
              <b>{t}</b>
              <span>{d}</span>
            </div>
          ))}
        </div>

        <ul className="cv-ticks">
          {CODEVITA_PERKS.map((p) => (
            <li key={p}>
              <Check className="h-4 w-4" /> {p}
            </li>
          ))}
        </ul>

        {options.length ? (
          <div className="cv-up-plans">
            {options.map((o) => (
              <div key={o.name} className={`cv-up-plan${o.best ? " best" : ""}`}>
                <div className="cv-up-plan-top">
                  <b>{o.name}</b>
                  {o.best && <span className="cv-pill gold">Best value</span>}
                </div>
                <div className="cv-price">
                  {rupees(o.price)} <small>/ {o.note}</small>
                </div>
                <ul>
                  {o.perks.map((p) => (
                    <li key={p}>
                      <Check className="h-3.5 w-3.5" /> {p}
                    </li>
                  ))}
                </ul>
                <Buy item={o.item} price={o.price} label={`Get ${o.best ? "membership" : "access"}`} className={o.best ? "btn" : "btn ghost"} onDone={done} />
              </div>
            ))}
          </div>
        ) : (
          <p className="note">
            <Lock className="h-4 w-4" style={{ display: "inline" }} /> Premium isn't on sale right now. Message us on WhatsApp and we'll set it up for you.
          </p>
        )}
        <p className="cv-fine">Access opens on your account straight after an online payment (UPI payments open once we confirm them). Anobyt is an independent practice platform, not affiliated with TCS.</p>
      </div>
    </div>
  );
}
