import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, CheckCircle2, Code2, Timer, X } from "lucide-react";
import { useAccount } from "../../lib/account";
import { loadPromo } from "../../lib/codevita/api";
import "./promo.css";

const SEEN_KEY = "anobyt_cv_promo_seen";
// The placement-roadmap popup checks this key too, so a visitor never gets two popups in one visit.
const OTHER_POPUP_KEY = "anobyt_demo_popup_seen";
const IS_BOT = typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|lighthouse|pagespeed|headless/i.test(navigator.userAgent));
// Pages where a popup would get in the way: the course itself, sign-in, admin, and anywhere students write code or take a test.
const SKIP = [/^\/courses\/tcs-codevita/, /^\/admin/, /^\/account/, /^\/login/, /^\/verify-email/, /^\/reset-password/, /^\/workspace/, /^\/compiler/, /^\/problem/, /^\/assessment/, /^\/exam/, /^\/take/, /^\/t\//, /^\/results\//, /^\/courses\/[^/]+\/learn\//, /^\/junior/, /^\/code-room/, /^\/trainer/, /^\/interview-report/];

const session = {
  get(k) {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return "1"; // storage blocked: never risk showing it on every page
    }
  },
  set(k) {
    try {
      sessionStorage.setItem(k, "1");
    } catch {
      /* ignore */
    }
  },
};

/** Site-wide launch popup for the TCS CodeVita Crash Course. Text, price and on/off come from the admin. */
export default function PromoPopup() {
  const { pathname } = useLocation();
  const { features, loaded } = useAccount();
  const [promo, setPromo] = useState(null);
  const [open, setOpen] = useState(false);
  const owned = Boolean(features?.codevita?.has || features?.allAccess?.has);
  const skip = IS_BOT || SKIP.some((r) => r.test(pathname));

  useEffect(() => {
    if (skip || !loaded || owned || promo || session.get(SEEN_KEY)) return;
    let on = true;
    loadPromo().then(
      (d) => on && d?.promo?.enabled && setPromo(d),
      () => null,
    );
    return () => {
      on = false;
    };
  }, [skip, loaded, owned, promo]);

  useEffect(() => {
    if (!promo || skip || owned || session.get(SEEN_KEY)) return;
    const t = setTimeout(() => {
      if (session.get(SEEN_KEY)) return;
      session.set(SEEN_KEY);
      session.set(OTHER_POPUP_KEY);
      setOpen(true);
    }, Math.max(0, promo.promo.delaySec || 0) * 1000);
    return () => clearTimeout(t);
  }, [promo, skip, owned, pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Navigating to a skipped page (e.g. the course itself) closes it.
  useEffect(() => {
    if (skip) setOpen(false);
  }, [skip]);

  const p = promo?.promo;
  const close = () => setOpen(false);
  return (
    <AnimatePresence>
      {open && p && (
        <motion.div className="cvp-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="cvp-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cvp-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="cvp-x" onClick={close} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <div className="cvp-art" aria-hidden="true">
              <div className="cvp-win">
                <div className="cvp-dots">
                  <i />
                  <i />
                  <i />
                  <span>solution.cpp</span>
                </div>
                <pre>
                  <b>int</b> main() {"{"}
                  {"\n"}  <b>int</b> n; cin {">>"} n;
                  {"\n"}  <em>// think, then code</em>
                  {"\n"}  cout {"<<"} solve(n);
                  {"\n"}
                  {"}"}
                </pre>
                <div className="cvp-verdict">
                  <CheckCircle2 className="h-4 w-4" /> Accepted · 10/10 tests
                </div>
              </div>
            </div>
            <div className="cvp-body">
              <h2 id="cvp-title">{p.headline}</h2>
              <p className="cvp-text">{p.text}</p>
              <ul className="cvp-feats">
                <li>
                  <BookOpen className="h-4 w-4" /> Lessons
                </li>
                <li>
                  <Code2 className="h-4 w-4" /> Practice + solutions
                </li>
                <li>
                  <Timer className="h-4 w-4" /> Mock tests
                </li>
              </ul>
              {promo.price > 0 && <p className="cvp-price">{p.priceText}</p>}
              <div className="cvp-cta">
                <Link to="/courses/tcs-codevita" className="btn" onClick={close}>
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </Link>
                <button type="button" className="btn ghost" onClick={close}>
                  {p.later}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
