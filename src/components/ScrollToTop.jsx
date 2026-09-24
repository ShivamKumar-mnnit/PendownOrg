import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router doesn't reset scroll position on navigation like a classic
 * multi-page site does — without this, clicking e.g. "Book a Session" from
 * partway down the homepage lands on /book still scrolled to that same
 * spot. Jumps to top on every route change, unless the link included a
 * hash (like /#faq) — those are handled by Home's own hash-scroll effect,
 * which needs the page to NOT have already jumped to the top first.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
