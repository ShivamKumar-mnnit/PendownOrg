import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 sm:p-14 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to prep with PenDown?</h2>
        <p className="mx-auto mt-3 max-w-md text-zinc-400">
          Book your mock interview or mentorship session — we'll take it from there.
        </p>
        <Link
          to="/book"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
        >
          Book Your Session
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
