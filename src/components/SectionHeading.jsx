export default function SectionHeading({ eyebrow, title, subtitle, center = true }) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">{title}</h2>
      {subtitle && <p className="mt-3 text-zinc-400">{subtitle}</p>}
    </div>
  );
}
