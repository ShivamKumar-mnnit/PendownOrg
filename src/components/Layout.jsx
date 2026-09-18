import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import AIBotButton from "./AIBotButton";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-(--color-surface) text-(--color-fg)">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AIBotButton />
      <WhatsAppButton />
    </div>
  );
}
