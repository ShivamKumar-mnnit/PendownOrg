import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getInitialTheme, setTheme as persistTheme } from "../lib/theme";

export default function ThemeToggle({ className = "" }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  function toggle() {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
