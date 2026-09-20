import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import AIBotButton from "./AIBotButton";

// The compiler is a full-height tool, not a scrolling marketing page — the
// footer and floating buttons would just add dead space / overlap below it.
const CHROME_FREE_ROUTES = ["/compiler"];

export default function Layout() {
  const { pathname } = useLocation();
  const isChromeFree = CHROME_FREE_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen flex flex-col bg-(--color-surface) text-(--color-fg)">
      <Navbar />
      <main className={isChromeFree ? "flex-1 min-h-0 flex flex-col" : "flex-1"}>
        <Outlet />
      </main>
      {!isChromeFree && <Footer />}
      {!isChromeFree && <AIBotButton />}
      {!isChromeFree && <WhatsAppButton />}
    </div>
  );
}
