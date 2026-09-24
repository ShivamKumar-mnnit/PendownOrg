import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Timer, ArrowRight, CheckCircle2, Circle } from "lucide-react";

// Illustrative only — shows what a timed skill-check round looks like.
// Booking one happens through the same registration flow as everything else.
export default function SkillCheck() {
  return (
    <section className="border-y border-(--color-border)">
      <div className="mx-auto max-w-6xl px-5 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-(--color-accent)">Skill Check</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-(--color-fg)">
            Not sure where you stand? Start with a skill check.
          </h2>
          <p className="mt-3 text-(--color-fg-muted)">
            A short, timed round in your domain — company-style questions, scored
            and reviewed with you, so your first full mock interview starts from
            an honest baseline instead of a guess.
          </p>
          <Link
            to="/book"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-(--color-accent-solid) px-6 py-3 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) hover:scale-[1.03] active:scale-[0.97] transition-[background-color,transform]"
          >
            Book a Skill Check
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Illustrative mock-up of a skill-check round — not a live widget */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl shadow-black/20"
        >
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Software Development — Round 1</span>
            <span className="inline-flex items-center gap-1.5 text-amber-400">
              <Timer className="h-3.5 w-3.5" />
              18:42 left
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "40%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
            />
          </div>

          <p className="mt-6 text-sm text-zinc-200">
            Q4. What's the time complexity of searching a balanced binary search
            tree with <span className="font-mono">n</span> nodes?
          </p>
          <div className="mt-4 space-y-2">
            {["O(1)", "O(log n)", "O(n)", "O(n log n)"].map((opt, i) => (
              <div
                key={opt}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                  i === 1 ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-zinc-400"
                }`}
              >
                {i === 1 ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {opt}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-zinc-600">Sample question shown for illustration.</p>
        </motion.div>
      </div>
    </section>
  );
}
