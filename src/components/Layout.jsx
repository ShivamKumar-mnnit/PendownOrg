import { lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import PlacementAssist from "./PlacementAssist";
import InterviewPopup from "./InterviewPopup";
import { useReveal } from "../lib/useReveal";

const SpaceBackground = lazy(() => import("./SpaceBackground"));

// Tool pages where the floating promo/chat buttons would sit on top of the
// editor and its output.
const NO_FLOATERS = ["/compiler", "/problem"];

export default function Layout() {
  const { pathname } = useLocation();
  const showFloaters = !NO_FLOATERS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  useReveal(pathname);

  return (
    <div className="min-h-screen flex flex-col text-(--color-fg)">
      <Suspense fallback={null}>
        <SpaceBackground />
      </Suspense>

      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {showFloaters && <PlacementAssist />}
      {showFloaters && <WhatsAppButton />}
      <InterviewPopup />
    </div>
  );
}
