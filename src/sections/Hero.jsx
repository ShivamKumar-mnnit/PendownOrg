import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import HeroBackground from "../components/HeroBackground";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// Honest stand-in for "architected with minds from Google/Meta/..." —
// InoByt has no verified company affiliations to claim, so the same
// large-ghost-text treatment shows the real domains we prep for instead.
const DOMAIN_WORDS = ["SDE", "DATA / AI", "PRODUCT", "CONSULTING"];

export default function Hero() {
  return (
    <HeroBackground>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:py-28 lg:grid-cols-[1fr_auto] lg:items-center"
      >
        <div>
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300"
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            Partnered with NIT Allahabad
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-white"
          >
            Ace Your Next
            <br />
            <span className="brand-gradient">Mock Interview</span>
            <br />
            <span className="text-slate-400">With Real Mentors.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-base sm:text-lg text-slate-400">
            InoByt connects college students with industry mentors for 1:1 mock
            interviews and mentorship — booked in minutes, confirmed over WhatsApp.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              to="/book"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.03] active:scale-[0.97] transition-[box-shadow,transform]"
            >
              Book a Mock Interview
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/colleges"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5 hover:scale-[1.03] active:scale-[0.97] transition-[background-color,transform]"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              For Colleges &amp; Placement Cells
            </Link>
          </motion.div>
        </div>

        {/* Ghost-text domain stack — desktop only, mirrors the reference's
            "architected with minds from ..." column but with honest content. */}
        <motion.div variants={item} className="hidden lg:flex flex-col items-end gap-1 pr-2">
          <span className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Domains We Prep For
          </span>
          {DOMAIN_WORDS.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif italic text-3xl xl:text-4xl font-bold text-white/10 hover:text-white/25 transition-colors"
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </HeroBackground>
  );
}
