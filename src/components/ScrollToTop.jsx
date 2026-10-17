import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router doesn't reset scroll position on navigation like a classic
 * multi-page site does — without this, clicking e.g. "Book a session" from
 * partway down the homepage lands on /book still scrolled to that same
 * spot. Jumps to top on every route change.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Links like /colleges#bulk-onboard land on that section once it renders.
    const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) el.scrollIntoView({ block: "start" });
    else window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search, hash]);

  return null;
}
