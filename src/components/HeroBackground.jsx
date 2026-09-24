import { lazy, Suspense } from "react";

const VortexBackground = lazy(() => import("./VortexBackground"));

/**
 * Fixed-dark, immersive hero backdrop — deliberately ignores the site's
 * light/dark toggle (like a marketing "spotlight" banner), same exception
 * pattern already used for SkillCheck's mockup and IndustryReach's white
 * card. A WebGL starfield + scrolling grid floor + floating wireframe
 * shapes (VortexBackground), lazy-loaded so three.js only ships to
 * whichever page renders the Hero, not the whole site.
 */
export default function HeroBackground({ children }) {
  return (
    <div className="relative isolate overflow-hidden" style={{ backgroundColor: "#050b14" }}>
      <div className="pointer-events-none absolute inset-0 -z-20">
        <Suspense fallback={null}>
          <VortexBackground />
        </Suspense>
      </div>

      {/* Vignette so edges stay dark and text stays legible over the scene */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 85% 65% at 50% 22%, transparent 30%, #050b14 92%)" }}
      />

      {children}
    </div>
  );
}
