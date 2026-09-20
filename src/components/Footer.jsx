import { Link } from "react-router-dom";
import WhatsAppIcon from "./WhatsAppIcon";
import Logo from "./Logo";
import { ADMIN_WHATSAPP_DISPLAY, buildAdminWaLink } from "../lib/whatsapp";

export default function Footer() {
  return (
    <footer className="border-t border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto max-w-6xl px-5 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo badgeClassName="h-7 w-7" textClassName="text-base" />
          <p className="mt-3 max-w-sm text-sm text-(--color-fg-muted)">
            1:1 mock interviews and mentorship for college students — starting with
            NIT Allahabad. Real mentors, honest feedback, no clunky dashboards.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-(--color-fg)">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm text-(--color-fg-muted)">
            <li><Link to="/" className="hover:text-(--color-fg) transition-colors">Home</Link></li>
            <li><Link to="/book" className="hover:text-(--color-fg) transition-colors">Book a Session</Link></li>
            <li><Link to="/colleges" className="hover:text-(--color-fg) transition-colors">For Colleges</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-(--color-fg)">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-(--color-fg-muted)">
            <li>
              <a
                href={buildAdminWaLink("Hi InoByt! I have a query.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-(--color-fg) transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                {ADMIN_WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="text-(--color-fg-faint)">Partnered with NIT Allahabad</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-(--color-border) py-5">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-3 px-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-(--color-fg-faint)">© {new Date().getFullYear()} InoByt. All rights reserved.</p>
          <Link to="/admin" className="text-xs text-(--color-fg-faint) hover:text-(--color-fg-muted) transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
