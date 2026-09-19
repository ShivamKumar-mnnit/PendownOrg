import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * Fixed-dark, immersive hero backdrop — deliberately ignores the site's
 * light/dark toggle (like a marketing "spotlight" banner), same exception
 * pattern already used for SkillCheck's mockup and IndustryReach's white
 * card. Dot-grid + glowing orbs, drifting continuously and nudged further
 * by pointer position for a bit of real interactivity, not just ambient
 * motion.
 */
export default function HeroBackground({ children }) {
  const ref = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  const orb1X = useTransform(sx, [0, 1], ["-4%", "4%"]);
  const orb1Y = useTransform(sy, [0, 1], ["-4%", "4%"]);
  const orb2X = useTransform(sx, [0, 1], ["4%", "-4%"]);
  const orb2Y = useTransform(sy, [0, 1], ["4%", "-4%"]);

  function handleMouseMove(e) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative isolate overflow-hidden"
      style={{ backgroundColor: "#050b14" }}
    >
      {/* Dot-grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-30"
        style={{
          backgroundImage: "radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 90%)",
        }}
      />

      {/* Drifting glow orbs, nudged by pointer position */}
      <motion.div
        className="pointer-events-none absolute -left-32 -top-32 -z-20 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(45,212,191,0.35), transparent 70%)", x: orb1X, y: orb1Y }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 top-1/3 -z-20 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.3), transparent 70%)", x: orb2X, y: orb2Y }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/3 -z-20 h-[300px] w-[300px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.2), transparent 70%)", x: orb1X, y: orb2Y }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Vignette so edges stay dark and text stays legible everywhere */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 90% 70% at 50% 20%, transparent 40%, #050b14 95%)" }}
      />

      {children}
    </div>
  );
}
