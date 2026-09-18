import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";
import { ADMIN_WHATSAPP_DISPLAY, buildAdminWaLink } from "../lib/whatsapp";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-5 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400">
              <PenLine className="h-4 w-4 text-zinc-950" strokeWidth={2.5} />
            </span>
            <span className="text-base font-bold text-white">PenDown</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-zinc-400">
            1:1 mock interviews and mentorship for college students — starting with
            NIT Allahabad. Real mentors, honest feedback, no clunky dashboards.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/book" className="hover:text-white transition-colors">Book a Session</Link></li>
            <li><Link to="/colleges" className="hover:text-white transition-colors">For Colleges</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>
              <a
                href={buildAdminWaLink("Hi PenDown! I have a query.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-white transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                {ADMIN_WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="text-zinc-500">Partnered with NIT Allahabad</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-3 px-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-500">© {new Date().getFullYear()} PenDown. All rights reserved.</p>
          <Link to="/admin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
