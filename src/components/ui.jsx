import { Link } from "react-router-dom";

/** Section heading: an optional small eyebrow label, a title and an optional lead paragraph. */
export function Head({ eyebrow, title, children, style }) {
  return (
    <div className="head" style={style}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Grid of icon cards, each item [icon, title, text]. */
export function Cards({ items }) {
  return (
    <div className="cards">
      {items.map(([icon, title, text]) => (
        <div className="card" key={title}>
          <div className="ic">{icon}</div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}

/** Closing call-to-action band that leads to the booking form. */
export function CTA({ title, text }) {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="cta">
          <h2>{title}</h2>
          <p>{text}</p>
          <Link className="btn" to="/book">
            Book your session
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Top-level wrapper for an inner page (everything except the homepage). */
export function Page({ narrow, children }) {
  return (
    <section className="page">
      <div className="wrap" style={narrow ? { maxWidth: narrow } : undefined}>
        {children}
      </div>
    </section>
  );
}
