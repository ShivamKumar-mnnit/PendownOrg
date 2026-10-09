import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import PlacementAssist from "./PlacementAssist";
import InterviewPopup from "./InterviewPopup";
import StudyBackground from "./StudyBackground";
import { useReveal } from "../lib/useReveal";

// Tool pages where the floating promo/chat buttons would sit on top of the
// editor and its output.
const NO_FLOATERS = ["/compiler", "/problem", "/assessment", "/admin"];

export default function Layout() {
  const { pathname } = useLocation();
  const showFloaters = !NO_FLOATERS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  useReveal(pathname);

  return (
    <div className="min-h-screen flex flex-col text-(--color-fg)">
      <StudyBackground />

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
