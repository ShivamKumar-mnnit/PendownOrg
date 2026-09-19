import { motion } from "motion/react";

// Deterministic scatter of "city light" dots within the sphere's circle —
// polar coordinates so they stay inside the visible disc, no image asset.
const CITY_LIGHTS = Array.from({ length: 34 }).map((_, i) => {
  const angle = (i * 47) % 360;
  const radius = 10 + ((i * 13) % 38); // percent from center, stays inside the disc
  const rad = (angle * Math.PI) / 180;
  return {
    x: 50 + radius * Math.cos(rad),
    y: 50 + radius * Math.sin(rad) * 0.9,
    size: 1 + (i % 3),
  };
});

const MERIDIANS = [98, 80, 55, 25]; // rx of vertical (longitude) ellipses, ry is constant 98
const PARALLELS = [
  { cy: 45, rx: 80 },
  { cy: 72, rx: 93 },
  { cy: 100, rx: 98 },
  { cy: 128, rx: 93 },
  { cy: 155, rx: 80 },
];

/**
 * Big rotating "Earth" — CSS/SVG only (dark sphere with scattered amber
 * "city light" dots + a wireframe lat/long grid + atmospheric glow), plus
 * one or two large orbiting planets. No image asset, so it stays fixed
 * dark/space-colored regardless of the site's light/dark toggle — same
 * as a photo would.
 */
export default function EarthGlobe({ className = "" }) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: "min(90vw, 460px)", height: "min(90vw, 460px)" }}>
      {/* Outer atmospheric glow */}
      <div
        className="pointer-events-none absolute inset-[-12%] rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(45,212,191,0.35), transparent 70%)" }}
      />

      {/* Orbiting planets — big, only one or two */}
      <motion.div
        className="pointer-events-none absolute inset-[-18%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute rounded-full"
          style={{
            top: "4%",
            left: "50%",
            width: 46,
            height: 46,
            marginLeft: -23,
            background: "radial-gradient(circle at 35% 30%, #fca5a5 0%, #dc2626 55%, #7f1d1d 100%)",
            boxShadow: "0 0 24px rgba(220,38,38,0.5)",
          }}
        />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-[-26%]"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute flex items-center justify-center"
          style={{ bottom: "6%", right: "8%", width: 38, height: 38 }}
        >
          {/* ring */}
          <span
            className="absolute rounded-full border-2 border-amber-200/40"
            style={{ width: 58, height: 22, transform: "rotate(-20deg)" }}
          />
          <span
            className="relative rounded-full"
            style={{
              width: 30,
              height: 30,
              background: "radial-gradient(circle at 35% 30%, #fde68a 0%, #d97706 60%, #78350f 100%)",
              boxShadow: "0 0 18px rgba(217,119,6,0.45)",
            }}
          />
        </span>
      </motion.div>

      {/* Two more, trailing in behind the first pair */}
      <motion.div
        className="pointer-events-none absolute inset-[-34%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute rounded-full"
          style={{
            top: "50%",
            left: "2%",
            width: 34,
            height: 34,
            marginTop: -17,
            background: "radial-gradient(circle at 35% 30%, #a5f3fc 0%, #0891b2 55%, #164e63 100%)",
            boxShadow: "0 0 20px rgba(8,145,178,0.5)",
          }}
        />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-[-9%]"
        animate={{ rotate: -360 }}
        transition={{ duration: 19, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute rounded-full"
          style={{
            top: "8%",
            right: "2%",
            width: 22,
            height: 22,
            background: "radial-gradient(circle at 35% 30%, #e4e4e7 0%, #71717a 55%, #3f3f46 100%)",
            boxShadow: "0 0 14px rgba(161,161,170,0.4)",
          }}
        />
      </motion.div>

      {/* The Earth itself */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{
          background: "radial-gradient(circle at 32% 28%, #1e3a5f 0%, #0f2340 45%, #050b14 85%)",
          boxShadow:
            "inset -30px -30px 70px rgba(0,0,0,0.6), inset 12px 12px 40px rgba(56,189,248,0.08), 0 0 60px rgba(45,212,191,0.3)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      >
        {/* City lights */}
        {CITY_LIGHTS.map((c, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-amber-300"
            style={{ left: `${c.x}%`, top: `${c.y}%`, width: c.size, height: c.size }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3 + (i % 3), delay: (i % 5) * 0.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Wireframe grid */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(94,234,212,0.25)" strokeWidth="0.6" />
          {MERIDIANS.map((rx) => (
            <ellipse key={rx} cx="100" cy="100" rx={rx} ry="98" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.5" />
          ))}
          {PARALLELS.map((p) => (
            <ellipse key={p.cy} cx="100" cy={p.cy} rx={p.rx} ry="9" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.5" />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}
