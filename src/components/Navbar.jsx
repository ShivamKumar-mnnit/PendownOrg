import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/book", label: "Book a Session" },
  { to: "/colleges", label: "For Colleges" },
  { to: "/compiler", label: "Online C&C" },
];

// Not real pages yet — shown in nav as a heads-up, not a working link.
const COMING_SOON = ["Resume Builder", "ATS Score Check"];

function ComingSoonBadge() {
  return (
    <span className="rounded-full bg-(--color-accent)/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--color-accent)">
      Soon
    </span>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-(--color-fg)" : "text-(--color-fg-muted) hover:text-(--color-fg)"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-surface)/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <NavLink to="/" className="flex items-center shrink-0" onClick={() => setOpen(false)}>
          <motion.span
            whileHover={{ rotate: -8, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Logo />
          </motion.span>
        </NavLink>

        <div className="hidden md:flex items-center gap-6">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          {COMING_SOON.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-fg-faint) cursor-default select-none"
            >
              {label}
              <ComingSoonBadge />
            </span>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <NavLink
            to="/book"
            className="inline-flex items-center rounded-full bg-(--color-accent-solid) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) hover:scale-[1.05] active:scale-[0.96] transition-[background-color,transform]"
          >
            Book Now
          </NavLink>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="text-(--color-fg)"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-(--color-border)"
          >
            <div className="px-5 pb-5 pt-2 flex flex-col gap-4">
              {LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
              {COMING_SOON.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-fg-faint) select-none"
                >
                  {label}
                  <ComingSoonBadge />
                </span>
              ))}
              <NavLink
                to="/book"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-(--color-accent-solid) px-4 py-2 text-sm font-semibold text-white"
              >
                Book Now
              </NavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
