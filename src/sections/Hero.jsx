import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Code2, BrainCircuit, LineChart, Briefcase } from "lucide-react";
import HeroBackground from "../components/HeroBackground";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const DOMAINS = [
  { label: "SDE", icon: Code2 },
  { label: "Data / AI", icon: BrainCircuit },
  { label: "Product", icon: LineChart },
  { label: "Consulting", icon: Briefcase },
];

export default function Hero() {
  return (
    <HeroBackground>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative mx-auto max-w-6xl px-5 py-24 sm:py-28 text-center"
      >
        <motion.div
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300"
        >
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-cyan-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          Partnered with NIT Allahabad
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.15] tracking-tight text-white"
        >
          Ace Your Next{" "}
          <span className="relative inline-block text-cyan-300">
            Mock Interview
            <svg
              className="absolute -bottom-2 left-0 h-3 w-full sm:-bottom-3 sm:h-4"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M0,7 Q8,1 16,7 T32,7 T48,7 T64,7 T80,7 T96,7 T112,7 T128,7 T144,7 T160,7 T176,7 T192,7 T208,7"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="text-cyan-400/70"
              />
            </svg>
          </span>
          <br />
          With Real Mentors.
        </motion.h1>

        <motion.p variants={item} className="mt-6 mx-auto max-w-xl text-base sm:text-lg text-slate-400">
          Anobyt connects college students with industry mentors for 1:1 mock
          interviews and mentorship — booked in minutes, confirmed over WhatsApp.
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/book"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.03] active:scale-[0.97] transition-[box-shadow,transform]"
          >
            Book a Mock Interview
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/colleges"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5 hover:scale-[1.03] active:scale-[0.97] transition-[background-color,transform]"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            For Colleges &amp; Placement Cells
          </Link>
        </motion.div>

        <motion.div variants={item} className="mt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Domains We Prep For
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {DOMAINS.map(({ label, icon: Icon }, i) => (
              <motion.span
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200"
              >
                <Icon className="h-3.5 w-3.5 text-cyan-400" />
                {label}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </HeroBackground>
  );
}
