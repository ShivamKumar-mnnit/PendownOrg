import { Braces } from "lucide-react";

/**
 * Shared logomark + wordmark, used in the navbar and footer so both stay
 * in sync. Braces ({}) as the mark since it reads instantly as "code" —
 * the "Algo" half of the name — paired with a two-tone wordmark so the
 * text itself carries some of the brand identity too, not just the badge.
 */
export default function Logo({ badgeClassName = "h-8 w-8", iconClassName = "h-4.5 w-4.5", textClassName = "text-lg", showText = true }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 shadow-sm shadow-indigo-950/30 ${badgeClassName}`}
      >
        <span className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-transparent" />
        <Braces className={`relative text-zinc-900 ${iconClassName}`} strokeWidth={2.5} />
      </span>
      {showText && (
        <span className={`font-bold tracking-tight ${textClassName}`}>
          <span className="text-(--color-accent)">Algo</span>
          <span className="text-(--color-fg)">Mate</span>
        </span>
      )}
    </span>
  );
}
