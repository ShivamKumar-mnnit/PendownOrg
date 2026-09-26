import { Link } from "react-router-dom";
import { Mail, MessageCircle, Terminal, ArrowRight } from "lucide-react";
import Logo from "./Logo";
import { DOMAINS } from "../lib/domains";
import { COMPANIES } from "../lib/companies";
import { LANGUAGES } from "../lib/compiler";
import { buildAdminWaLink } from "../lib/whatsapp";

const CONTACT_EMAIL = "anobyt@anobyt.in";

const COMPANY_LINKS = [
  { label: "Home", to: "/" },
  { label: "Book a Session", to: "/book" },
  { label: "For Colleges", to: "/colleges" },
  { label: "FAQ", to: "/#faq" },
  { label: "Admin", to: "/admin" },
];

function ColumnHeading({ children }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-(--color-fg-faint)">{children}</h3>;
}

export default function Footer() {
  return (
    <footer className="border-t border-(--color-border) bg-(--color-surface)/70 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
        {/* Brand + promo cards */}
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo badgeClassName="h-7 w-7" textClassName="text-base" />
          <p className="mt-3 max-w-sm text-sm text-(--color-fg-muted)">
            1:1 mock interviews and mentorship for college students. Real
            mentors, honest feedback, no clunky dashboards.
          </p>

          <a
            href={buildAdminWaLink("Hi Anobyt! I'd like updates on slots & prep tips.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/6 p-3.5 hover:bg-emerald-500/10 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <MessageCircle className="h-4.5 w-4.5 text-(--color-accent-emerald)" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-(--color-fg)">
                Chat with us on WhatsApp
                <span className="h-1.5 w-1.5 rounded-full bg-(--color-accent-emerald)" />
              </span>
              <span className="flex items-center gap-1 text-xs text-(--color-accent-emerald)">
                Slot openings & prep tips <ArrowRight className="h-3 w-3" />
              </span>
            </span>
          </a>

          <Link
            to="/compiler"
            className="mt-3 flex items-center gap-3 rounded-xl border border-(--color-accent)/25 bg-(--color-accent)/6 p-3.5 hover:bg-(--color-accent)/10 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-accent)/15">
              <Terminal className="h-4.5 w-4.5 text-(--color-accent)" />
            </span>
            <span className="min-w-0">
              <span className="text-sm font-semibold text-(--color-fg)">Try the Online Compiler</span>
              <span className="flex items-center gap-1 text-xs text-(--color-accent)">
                Python, Java, C++ &amp; more — free <ArrowRight className="h-3 w-3" />
              </span>
            </span>
          </Link>
        </div>

        <div>
          <ColumnHeading>Prep by Domain</ColumnHeading>
          <ul className="mt-3 space-y-2.5 text-sm text-(--color-fg-muted)">
            {DOMAINS.filter((d) => d.id !== "other").map((d) => (
              <li key={d.id}>
                <Link
                  to={`/book?domain=${encodeURIComponent(d.label)}`}
                  className="inline-flex items-center gap-2 hover:text-(--color-fg) transition-colors"
                >
                  <d.icon className="h-3.5 w-3.5 shrink-0 text-(--color-fg-faint)" />
                  {d.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnHeading>Company-Wise Prep</ColumnHeading>
          <ul className="mt-3 space-y-2.5 text-sm text-(--color-fg-muted)">
            {COMPANIES.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/book?company=${encodeURIComponent(c.name)}`}
                  className="inline-flex items-center gap-2 hover:text-(--color-fg) transition-colors"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.from }} />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnHeading>Online Compilers</ColumnHeading>
          <ul className="mt-3 space-y-2.5 text-sm text-(--color-fg-muted)">
            {LANGUAGES.map((l) => (
              <li key={l.id}>
                <Link to={`/compiler?lang=${l.id}`} className="hover:text-(--color-fg) transition-colors">
                  Online {l.label} Compiler
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnHeading>Company</ColumnHeading>
          <ul className="mt-3 space-y-2.5 text-sm text-(--color-fg-muted)">
            {COMPANY_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="hover:text-(--color-fg) transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-1">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 hover:text-(--color-fg) transition-colors"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-(--color-fg-faint)" />
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-(--color-border) py-5">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-3 px-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-(--color-fg-faint)">© {new Date().getFullYear()} Anobyt. All rights reserved.</p>
          <Link to="/admin" className="text-xs text-(--color-fg-faint) hover:text-(--color-fg-muted) transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
