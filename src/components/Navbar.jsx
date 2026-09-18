import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, PenLine } from "lucide-react";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/book", label: "Book a Session" },
  { to: "/colleges", label: "For Colleges" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-white" : "text-zinc-400 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <NavLink to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400">
            <PenLine className="h-4.5 w-4.5 text-zinc-950" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">PenDown</span>
        </NavLink>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <NavLink
          to="/book"
          className="hidden md:inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
        >
          Book Now
        </NavLink>

        <button
          className="md:hidden text-zinc-200"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-white/10 px-5 pb-5 pt-2 flex flex-col gap-4">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/book"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Book Now
          </NavLink>
        </div>
      )}
    </header>
  );
}
