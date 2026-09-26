import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, GraduationCap } from "lucide-react";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const POINTS = [
  "Bulk-upload your student list as an Excel sheet — no manual entry.",
  "We assign mentors and interview slots for the whole batch.",
  "Every student gets their slot confirmed directly on WhatsApp.",
];

export default function ForColleges() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal
        as="div"
        className="rounded-3xl border border-(--color-border) bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-400/10 p-8 sm:p-12"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-input) px-3 py-1 text-xs font-medium text-(--color-fg-muted)">
              <GraduationCap className="h-3.5 w-3.5 text-(--color-accent-emerald)" />
              For Placement Cells &amp; Coordinators
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-(--color-fg)">
              Onboard your whole batch at once
            </h2>
            <p className="mt-3 text-(--color-fg-muted)">
              Send us your student list, and we handle mentor matching,
              scheduling, and WhatsApp confirmations for the whole batch.
            </p>
            <Link
              to="/colleges"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-(--color-accent-solid) px-6 py-3 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) hover:scale-[1.03] active:scale-[0.97] transition-[background-color,transform]"
            >
              Bulk Onboard Students
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <StaggerGrid className="space-y-4">
            {POINTS.map((point) => (
              <StaggerItem key={point} hover={false} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-(--color-accent-emerald)" />
                <span className="text-sm text-(--color-fg-muted)">{point}</span>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </Reveal>
    </section>
  );
}
