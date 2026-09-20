import { motion } from "motion/react";

/**
 * Central "planet" is the Anobyt brand mark instead of a generic Earth —
 * same orbiting-planets/atmosphere staging as before, just with the sphere
 * itself replaced by the logo so this centerpiece doubles as brand real
 * estate. Fixed dark/space-colored regardless of the site's light/dark
 * toggle, same as the orbiting planets around it.
 */
export default function EarthGlobe({ className = "", size = 460 }) {
  const dim = `min(90vw, ${size}px)`;
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: dim, height: dim }}>
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

      {/* The planet itself — the Anobyt mark, on a dark sphere-like disc */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 32% 28%, #1e3a5f 0%, #0f2340 45%, #050b14 85%)",
          boxShadow:
            "inset -30px -30px 70px rgba(0,0,0,0.6), inset 12px 12px 40px rgba(56,189,248,0.08), 0 0 60px rgba(45,212,191,0.3)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      >
        <img src="/anobyt-icon.svg" alt="" className="w-[70%] h-[70%] object-contain drop-shadow-[0_0_20px_rgba(45,212,191,0.45)]" />
      </motion.div>
    </div>
  );
}
