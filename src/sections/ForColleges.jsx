import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, GraduationCap } from "lucide-react";

const POINTS = [
  "Bulk-upload your student list as an Excel sheet — no manual entry.",
  "We assign mentors and interview slots for the whole batch.",
  "Every student gets their slot confirmed directly on WhatsApp.",
];

export default function ForColleges() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-400/10 p-8 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
              For Placement Cells &amp; Coordinators
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              Onboard your whole batch at once
            </h2>
            <p className="mt-3 text-zinc-400">
              Already how we work with NIT Allahabad — send us your student list, and
              we handle mentor matching, scheduling, and WhatsApp confirmations.
            </p>
            <Link
              to="/colleges"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
            >
              Bulk Onboard Students
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <span className="text-sm text-zinc-300">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
