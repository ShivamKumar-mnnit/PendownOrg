import { Briefcase, Target, Calendar, GraduationCap } from "lucide-react";
import SectionHeading from "../components/SectionHeading";

const POINTS = [
  {
    icon: Briefcase,
    title: "Mentors from industry",
    desc: "Get matched with professionals who've actually sat on the other side of the table.",
  },
  {
    icon: Target,
    title: "Feedback you can use",
    desc: "Detailed, honest feedback after every session — not just a pass/fail score.",
  },
  {
    icon: Calendar,
    title: "Slots that work for you",
    desc: "Pick a time, confirm over WhatsApp, and join by Google Meet. No dashboards to learn.",
  },
  {
    icon: GraduationCap,
    title: "Built with campuses in mind",
    desc: "Designed alongside placement cells, starting with NIT Allahabad.",
  },
];

export default function WhyPenDown() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionHeading eyebrow="Why PenDown" title="Interview prep, minus the friction" center={false} />

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {POINTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-sm text-zinc-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
