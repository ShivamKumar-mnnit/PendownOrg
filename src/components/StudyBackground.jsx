/**
 * The site-wide backdrop: graph paper with faint handwritten formulas and
 * sketches around the edges, like the margins of a study notebook. Warm
 * paper in light mode, a navy chalkboard in dark mode (colors come from the
 * --bg-* tokens in index.css). Pure CSS and SVG, so it costs nothing to
 * render and never animates.
 */
export default function StudyBackground() {
  return (
    <div className="study-bg" aria-hidden="true">
      <svg className="study-doodles" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <g className="f">
          <text x="64" y="150" fontSize="30">∫₀^∞ e^(−x²) dx = √π ⁄ 2</text>
          <text x="1110" y="118" fontSize="28">O(n log n)</text>
          <text x="40" y="560" fontSize="26">Σ 1⁄n² = π²⁄6</text>
          <text x="1160" y="520" fontSize="30">a² + b² = c²</text>
          <text x="96" y="840" fontSize="24">P(A|B) = P(B|A)·P(A) ⁄ P(B)</text>
          <text x="1080" y="842" fontSize="26">e^(iπ) + 1 = 0</text>
          <text x="40" y="350" fontSize="22">f′(x) = lim (f(x+h) − f(x)) ⁄ h</text>
        </g>
        <g className="s" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* right triangle */}
          <path d="M1190 600 L1190 690 L1320 690 Z" />
          <path d="M1190 676 h14 v14" />
          {/* binary tree */}
          <circle cx="1290" cy="260" r="14" />
          <circle cx="1240" cy="330" r="14" />
          <circle cx="1340" cy="330" r="14" />
          <circle cx="1210" cy="400" r="14" />
          <circle cx="1270" cy="400" r="14" />
          <path d="M1281 271 L1249 319 M1299 271 L1331 319 M1233 342 L1217 388 M1247 342 L1263 388" />
          {/* sine wave on axes */}
          <path d="M70 690 h300 M90 630 v120" />
          <path d="M90 690 C 120 630, 150 630, 180 690 S 240 750, 270 690 S 330 630, 360 690" />
          {/* array cells */}
          <path d="M120 220 h240 v40 h-240 Z M160 220 v40 M200 220 v40 M240 220 v40 M280 220 v40 M320 220 v40" />
        </g>
      </svg>
    </div>
  );
}
