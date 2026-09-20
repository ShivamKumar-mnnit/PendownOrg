/**
 * Shared logomark + wordmark, used in the navbar and footer so both stay
 * in sync. The mark is the brand's binary-sphere vector artwork
 * (public/anobyt-icon.svg, pre-cropped tight around just the icon).
 */
export default function Logo({ badgeClassName = "h-8 w-8", iconClassName = "", textClassName = "text-lg", showText = true }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`relative flex items-center justify-center ${badgeClassName}`}>
        <img src="/anobyt-icon.svg" alt="Anobyt" className={`h-full w-full ${iconClassName}`} />
      </span>
      {showText && (
        <span className={`font-bold tracking-tight ${textClassName}`}>
          <span className="text-(--color-accent)">Ano</span>
          <span className="text-(--color-fg)">Byt</span>
        </span>
      )}
    </span>
  );
}
