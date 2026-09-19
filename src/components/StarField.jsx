import { motion } from "motion/react";

// Deterministic scatter, computed once — see Hero's OrbitScene-era pattern.
const STARS = Array.from({ length: 60 }).map((_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53 + (i % 7) * 11) % 100,
  size: 1 + (i % 3),
  delay: (i % 10) * 0.3,
  duration: 2.5 + (i % 4),
}));

const SHOOTING_STARS = [
  { top: "12%", rotate: 22, width: 110, duration: 1.4, delay: 1, repeatDelay: 7 },
  { top: "55%", rotate: 18, width: 90, duration: 1.2, delay: 5, repeatDelay: 9 },
];

/** Twinkling background starfield + a couple of looping shooting stars.
 * Pure CSS/Framer Motion, no assets — drop into any fixed-dark section.
 * Pass a negative z-index via className (e.g. "-z-10") so it stays behind
 * the section's actual content — it has no z-index of its own since it's
 * `position: absolute`, which would otherwise let it paint above
 * non-positioned normal-flow content. */
export default function StarField({ className = "" }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {STARS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {SHOOTING_STARS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute h-px rounded-full"
          style={{
            top: s.top,
            width: s.width,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95))",
            transform: `rotate(${s.rotate}deg)`,
            boxShadow: "0 0 6px 1px rgba(255,255,255,0.6)",
          }}
          initial={{ x: "-15vw", opacity: 0 }}
          animate={{ x: "115vw", opacity: [0, 1, 1, 0] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: s.repeatDelay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}
