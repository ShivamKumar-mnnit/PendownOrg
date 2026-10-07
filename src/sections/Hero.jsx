import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Code2, BrainCircuit, LineChart, Briefcase, CheckCircle2, Rocket, TrendingUp } from "lucide-react";
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

function FloatCard({ className, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute rounded-2xl border border-white/10 bg-white/4 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto hidden h-110 w-full max-w-md lg:block">
      <FloatCard className="left-0 top-6 w-56" delay={0.3}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">Step 2 · DSA</p>
        <p className="mt-1 text-sm font-semibold text-white">Trees &amp; Graphs</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300" />
        </div>
      </FloatCard>

      <FloatCard className="right-0 top-0 w-60" delay={0.5}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Mock interview cleared</p>
            <p className="mt-0.5 text-xs text-slate-400">Feedback: strong on DSA</p>
          </div>
        </div>
      </FloatCard>

      <FloatCard className="bottom-16 left-4 w-52" delay={0.7}>
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="url(#readinessGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - 0.68)}`}
              />
              <defs>
                <linearGradient id="readinessGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <TrendingUp className="absolute inset-0 m-auto h-4 w-4 text-cyan-300" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Readiness</p>
            <p className="text-lg font-extrabold text-white">68%</p>
            <p className="text-[10px] font-semibold text-emerald-400">+12% this month</p>
          </div>
        </div>
      </FloatCard>

      <FloatCard className="bottom-0 right-2 w-56" delay={0.9}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-400/15">
            <Rocket className="h-4.5 w-4.5 text-indigo-300" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Company prep</p>
            <p className="mt-0.5 text-xs text-slate-400">Dream tier unlocked</p>
          </div>
        </div>
      </FloatCard>
    </div>
  );
}

export default function Hero() {
  return (
    <HeroBackground>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
      >
        <div className="text-center lg:text-left">
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300"
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-cyan-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            Now Open for Registrations
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

          <motion.p variants={item} className="mx-auto mt-6 max-w-xl text-base text-slate-400 sm:text-lg lg:mx-0">
            Anobyt connects college students with industry mentors for 1:1 mock
            interviews and mentorship — booked in minutes, confirmed over WhatsApp.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
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
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
        </div>

        <HeroVisual />
      </motion.div>
    </HeroBackground>
  );
}
