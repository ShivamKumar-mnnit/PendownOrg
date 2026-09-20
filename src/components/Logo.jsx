/**
 * Shared logomark + wordmark, used in the navbar and footer so both stay
 * in sync. The badge crops the brand mark (binary-sphere artwork) to a
 * rounded square via `overflow-hidden` — the source image is a flat JPG
 * with a plain background around its own baked-in rounded corners, so the
 * container's own rounding is what actually hides that, not the file.
 */
export default function Logo({ badgeClassName = "h-8 w-8", iconClassName = "", textClassName = "text-lg", showText = true }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`relative flex items-center justify-center overflow-hidden rounded-xl shadow-sm shadow-indigo-950/30 ${badgeClassName}`}
      >
        <img src="/logo-mark.jpg" alt="InoByt" className={`h-full w-full object-cover ${iconClassName}`} />
      </span>
      {showText && (
        <span className={`font-bold tracking-tight ${textClassName}`}>
          <span className="text-(--color-accent)">Ino</span>
          <span className="text-(--color-fg)">Byt</span>
        </span>
      )}
    </span>
  );
}
