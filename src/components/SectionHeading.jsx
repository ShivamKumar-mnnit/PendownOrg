export default function SectionHeading({ eyebrow, title, subtitle, center = true }) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-(--color-accent)">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-(--color-fg)">{title}</h2>
      {subtitle && <p className="mt-3 text-(--color-fg-muted)">{subtitle}</p>}
    </div>
  );
}
