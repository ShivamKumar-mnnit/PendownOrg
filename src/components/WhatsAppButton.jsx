import WhatsAppIcon from "./WhatsAppIcon";
import { buildAdminWaLink } from "../lib/whatsapp";

const DEFAULT_MESSAGE = "Hi PenDown! I have a question about mock interviews / mentorship.";

/** Floating chat button, fixed to the bottom-right corner on every page. */
export default function WhatsAppButton() {
  return (
    <a
      href={buildAdminWaLink(DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with PenDown on WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/40 hover:scale-105 active:scale-95 transition-transform"
    >
      <WhatsAppIcon className="w-7 h-7" />
      <span className="sr-only">Chat on WhatsApp</span>
    </a>
  );
}
