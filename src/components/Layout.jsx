import { lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import PlacementAssist from "./PlacementAssist";
import InterviewPopup from "./InterviewPopup";

const SpaceBackground = lazy(() => import("./SpaceBackground"));

// The compiler is a full-height tool, not a scrolling marketing page — the
// footer and floating buttons would just add dead space / overlap below it.
const CHROME_FREE_ROUTES = ["/compiler"];

export default function Layout() {
  const { pathname } = useLocation();
  const isChromeFree = CHROME_FREE_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen flex flex-col text-(--color-fg)">
      <Suspense fallback={null}>
        <SpaceBackground />
      </Suspense>

      <Navbar />
      <main className={isChromeFree ? "flex-1 min-h-0 flex flex-col" : "flex-1"}>
        <Outlet />
      </main>
      {!isChromeFree && <Footer />}
      {!isChromeFree && <PlacementAssist />}
      {!isChromeFree && <WhatsAppButton />}
      <InterviewPopup />
    </div>
  );
}
