import { useEffect, useState } from "react";

/** Tracks the `.dark` class on <html>, which ThemeToggle owns, so any
 * component can follow the site theme without a separate source of truth. */
export function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
