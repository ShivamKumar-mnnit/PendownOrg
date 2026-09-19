import { GraduationCap } from "lucide-react";
import Reveal from "../components/Reveal";

export default function TrustBar() {
  return (
    <section className="border-y border-(--color-border) bg-(--color-surface-alt)">
      <Reveal
        as="div"
        className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-(--color-fg-faint)">
          Trusted by students at
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-input) px-4 py-2">
          <GraduationCap className="h-4 w-4 text-(--color-accent)" />
          <span className="text-sm font-semibold text-(--color-fg)">NIT Allahabad</span>
        </div>
        <span className="text-sm text-(--color-fg-faint)">+ more colleges joining soon</span>
      </Reveal>
    </section>
  );
}
