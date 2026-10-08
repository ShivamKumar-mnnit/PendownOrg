import { useEffect } from "react";

const SELECTOR = "main .card, main .steps > div, main .yrs > div, main .more a, main .panel:not(.pipe), main .cta";

/**
 * Fades cards and panels in as they scroll into view, re-run on every route
 * change. Elements that render later (results, filtered lists) are left
 * alone and simply appear. Everything is forced visible after 3s, so a
 * missed intersection never leaves content hidden.
 */
export function useReveal(key) {
  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let observer;
    let fallback;
    // Wait a frame so the new route's content is in the DOM.
    const frame = requestAnimationFrame(() => {
      const els = Array.from(document.querySelectorAll(SELECTOR));
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const t = e.target;
            t.classList.add("in");
            observer.unobserve(t);
            setTimeout(() => (t.style.transitionDelay = ""), 900);
          });
        },
        { threshold: 0.12 }
      );
      els.forEach((el, i) => {
        el.classList.add("rv");
        el.style.transitionDelay = `${(i % 4) * 70}ms`;
        observer.observe(el);
      });
      fallback = setTimeout(() => els.forEach((el) => el.classList.add("in")), 3000);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
      observer?.disconnect();
    };
  }, [key]);
}
