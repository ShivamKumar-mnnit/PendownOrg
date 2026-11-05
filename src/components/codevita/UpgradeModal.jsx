import { useEffect } from "react";
import { BookOpen, Check, Crown, FileCode2, Gauge, Lock, Timer, X } from "lucide-react";
import Buy from "../Buy";
import { refreshAccount, rupees, validity } from "../../lib/account";
import { CODEVITA_PERKS, CODEVITA_COURSE } from "../../lib/plans";

/**
 * The one upgrade popup for the course: a single plan, the Complete TCS CodeVita
 * Crash Course, priced by the server (the same row Razorpay charges).
 */
export default function UpgradeModal({ plan, totals, learn, mocks, problem, onClose, onDone }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const done = async (r) => {
    await refreshAccount();
    onDone?.(r);
  };
  const cv = plan?.codevita;
  const onSale = cv?.enabled && cv.paid && cv.price > 0;
  const value = [
    [BookOpen, `${learn?.total || "All"} lessons`, "Exam guide, every topic and the patterns behind the problems"],
    [FileCode2, `${totals?.problems || "All"} problems`, "Editorials from brute force to optimal, in C++, Java and Python"],
    [Timer, `${mocks || "All"} mock tests`, "Timed rounds with a report and leaderboard"],
    [Gauge, "Scorecards", "Test-case results, time, memory and what to fix next"],
  ];

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
            <p className="cv-eyebrow">{CODEVITA_COURSE}</p>
            <h2 id="cv-up-title">{problem ? `Unlock "${problem.title}" and the whole course` : "Unlock the whole crash course"}</h2>
            <p className="cv-muted">One payment opens every lesson, problem, editorial and mock test. No subscription.</p>
          </div>
        </div>

        <div className="cv-up-value">
          {value.map(([Icon, t, d]) => (
            <div key={t}>
              <Icon className="h-5 w-5" />
              <b>{t}</b>
              <span>{d}</span>
            </div>
          ))}
        </div>

        {onSale ? (
          <div className="cv-up-single">
            <div>
              <b>
                {CODEVITA_COURSE} – {rupees(cv.price)}
              </b>
              <span className="cv-muted">One-time payment · access for {validity(cv.days)}</span>
              <ul className="cv-ticks">
                {CODEVITA_PERKS.map((p) => (
                  <li key={p}>
                    <Check className="h-4 w-4" /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <Buy item={{ type: "feature", id: "codevita" }} price={cv.price} label="Get full access" className="btn" onDone={done} />
          </div>
        ) : (
          <p className="note">
            <Lock className="h-4 w-4" style={{ display: "inline" }} /> The course isn't on sale right now. Message us on WhatsApp and we'll set it up for you.
          </p>
        )}
        <p className="cv-fine">Access opens on your account straight after an online payment (UPI payments open once we confirm them). Anobyt is an independent practice platform, not affiliated with TCS.</p>
      </div>
    </div>
  );
}
