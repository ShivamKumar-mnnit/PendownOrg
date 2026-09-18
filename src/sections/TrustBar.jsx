import { GraduationCap } from "lucide-react";

export default function TrustBar() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Trusted by students at
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <GraduationCap className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">NIT Allahabad</span>
        </div>
        <span className="text-sm text-zinc-500">+ more colleges joining soon</span>
      </div>
    </section>
  );
}
