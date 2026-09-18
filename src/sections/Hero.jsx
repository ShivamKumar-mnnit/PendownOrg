import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(600px circle at 15% 0%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(600px circle at 85% 20%, rgba(52,211,153,0.18), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300">
          <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
          Now partnered with NIT Allahabad
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-white">
          Practice interviews with{" "}
          <span className="brand-gradient">real mentors</span>, not another app.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-zinc-400">
          PenDown connects college students with industry mentors for 1:1 mock
          interviews and mentorship — booked in minutes, confirmed over WhatsApp.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
          >
            Book a Mock Interview
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/colleges"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            For Colleges &amp; Placement Cells
          </Link>
        </div>
      </div>
    </section>
  );
}
