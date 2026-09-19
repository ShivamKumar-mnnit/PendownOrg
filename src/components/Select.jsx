import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Fully custom dropdown — deliberately NOT a native <select>. Native
 * option-list popups are rendered by the OS/browser itself, outside the
 * normal DOM, and inconsistently honor authored colors (some
 * browser/OS combos ignore `color-scheme` or `<option>` styling
 * entirely, which is what caused the "white text on white background"
 * bug). Building the list ourselves guarantees it always matches the
 * site's theme, on every device.
 */
export default function Select({ value, onChange, options, placeholder = "Select...", error, name }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = normalized.find((o) => o.value === value);

  return (
    // Elevated above sibling fields only while open, so the dropdown
    // never gets painted underneath the next field down the form.
    <div ref={ref} className={`relative ${open ? "z-20" : ""}`}>
      <button
        type="button"
        name={name}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-(--color-input) px-4 py-2.5 text-sm text-left outline-none transition-colors focus:border-(--color-accent) ${
          error ? "border-rose-500/60" : "border-(--color-border)"
        } ${selected ? "text-(--color-fg)" : "text-(--color-fg-faint)"}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-(--color-fg-faint) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            // Solid --color-surface, not --color-card — the card token is
            // only ~3-5% opaque in dark mode (fine for cards sitting on
            // the page, but a floating overlay needs to fully hide what's
            // behind it or content bleeds through, as seen in the bug).
            className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-(--color-border-strong) bg-(--color-surface) p-1.5 shadow-2xl origin-top"
          >
            {normalized.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-(--color-accent)/10 text-(--color-accent)"
                        : "text-(--color-fg) hover:bg-(--color-input)"
                    }`}
                  >
                    {opt.label}
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
