import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useSettings } from "../lib/contentApi";

// Top-level entries are either a direct link [path, label] or a dropdown
// [label, [[path, title, description], ...]].
const MENU = [
  ["/", "Home"],
  [
    "Prepare",
    [
      ["/placement", "Placement guide", "Stages, resume and HR prep"],
      ["/companies", "Companies", "Hiring rounds by company"],
      ["/mentors", "Mentors", "Industry mentors by domain"],
      ["/courses", "Courses", "Free and premium tracks"],
    ],
  ],
  [
    "Practice",
    [
      ["/problems", "Practice problems", "Easy to advanced, auto-checked"],
      ["/practice", "Practice tests", "Ready-made tests for students"],
      ["/tests", "Create tests", "Build a test for your class"],
      ["/compiler", "Online compiler", "Run code in the browser"],
    ],
  ],
  ["/dashboard", "Dashboard"],
  [
    "Colleges",
    [
      ["/colleges", "For colleges", "Onboard a whole batch"],
      ["/talks", "Tech talks and events", "Mock sessions for campuses"],
      ["/faq", "FAQ", "Common questions"],
    ],
  ],
];

// Detail pages light up the dropdown their list page lives in.
const SECTION_OF = { "/companies": "Prepare", "/take": "Practice", "/problems": "Practice", "/problem": "Practice" };

function sectionFor(pathname) {
  const root = "/" + (pathname.split("/")[1] || "");
  return SECTION_OF[root];
}

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (!navRef.current?.contains(e.target)) setOpen(null);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const section = sectionFor(pathname);
  const settings = useSettings();
  const ann = settings.announcement;

  return (
    <>
      {ann?.active && ann.text && (
        <div className="announce">
          <div className="wrap">
            <span>{ann.text}</span>
            {ann.link &&
              (ann.link.startsWith("/") ? (
                <Link to={ann.link}>{ann.linkLabel || "Learn more"} →</Link>
              ) : (
                <a href={ann.link} target="_blank" rel="noopener noreferrer">
                  {ann.linkLabel || "Learn more"} →
                </a>
              ))}
          </div>
        </div>
      )}
      <div className="topbar">
        <div className="wrap">
          <span>{settings.topbar}</span>
          {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}
        </div>
      </div>
      <header className="site-header">
        <div className="wrap bar">
          <Link className="brand" to="/">
            <img src="/anobyt-icon.svg" alt="" />
            Anobyt
          </Link>
          <nav className="site-nav" ref={navRef}>
            {MENU.map(([key, value]) => {
              if (typeof value === "string") {
                return (
                  <NavLink key={key} to={key} end className={({ isActive }) => (isActive ? "on" : "")}>
                    {value}
                  </NavLink>
                );
              }
              const active = value.some(([path]) => path === pathname) || section === key;
              return (
                <div key={key} className={`dd${open === key ? " open" : ""}`}>
                  <button
                    type="button"
                    className={`ddb${active ? " on" : ""}`}
                    aria-haspopup="true"
                    aria-expanded={open === key}
                    onClick={() => setOpen((o) => (o === key ? null : key))}
                  >
                    {key}
                  </button>
                  <div className="menu">
                    <div className="mb">
                      {value.map(([path, title, desc]) => (
                        <NavLink
                          key={path}
                          to={path}
                          end
                          className={({ isActive }) => (isActive ? "on" : "")}
                          onClick={() => setOpen(null)}
                        >
                          <b>{title}</b>
                          <span>{desc}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
          <ThemeToggle className="tog" />
          <Link className="btn" to="/book">
            Book a session
          </Link>
        </div>
      </header>
    </>
  );
}
