import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, CornerDownLeft, Menu, Search, UserRound, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useSettings } from "../lib/contentApi";
import { useAccount } from "../lib/account";
import { AFTER, BEFORE, MENUS, SEARCH_INDEX } from "./navMenu";

function rootOf(pathname) {
  return "/" + (pathname.split("/")[1] || "");
}

// Which menu lights up for the current page.
function menuFor(pathname) {
  const root = rootOf(pathname);
  return MENUS.find((m) => m.match.includes(root))?.label;
}

function CardIcon({ item }) {
  if (item.company) {
    return (
      <span className="mm-logo" style={{ background: `linear-gradient(135deg, ${item.company.from}, ${item.company.to})` }}>
        {item.company.initials}
      </span>
    );
  }
  const Icon = item.icon;
  return (
    <span className="mm-ic">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function Card({ item, onPick }) {
  return (
    <NavLink to={item.to} end className={({ isActive }) => `mm-card${isActive ? " on" : ""}`} onClick={onPick}>
      <CardIcon item={item} />
      <span className="mm-txt">
        <b>{item.title}</b>
        <small>{item.desc}</small>
        {item.tags && (
          <span className="mm-tags">
            {item.tags.map((t) => (
              <i key={t}>{t}</i>
            ))}
          </span>
        )}
      </span>
    </NavLink>
  );
}

function Section({ section, onPick }) {
  if (section.promo) {
    const p = section.promo;
    return (
      <Link to={p.to} className="mm-promo" onClick={onPick}>
        <b>{p.title}</b>
        <span>{p.desc}</span>
        <em>
          {p.cta} <ArrowRight className="h-3.5 w-3.5" />
        </em>
      </Link>
    );
  }
  return (
    <div className="mm-sec">
      <div className="mm-h">
        <span>{section.title}</span>
        {section.more && (
          <Link to={section.more.to} onClick={onPick}>
            {section.more.label} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="mm-grid">
        {section.items.map((it) => (
          <Card key={it.to} item={it} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

// Desktop dropdown. Opens on hover (with a short close delay so the pointer
// can travel to the panel) and on click for touch and keyboard users.
function MegaMenu({ menu, open, active, onOpen, onClose, onToggle }) {
  const panelRef = useRef(null);
  const timer = useRef(null);
  const [shift, setShift] = useState(0);

  // Keep the panel inside the window when the trigger sits near an edge.
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    const el = panelRef.current;
    el.style.transform = "none";
    const r = el.getBoundingClientRect();
    const gutter = 12;
    let dx = 0;
    if (r.right > window.innerWidth - gutter) dx = window.innerWidth - gutter - r.right;
    if (r.left + dx < gutter) dx = gutter - r.left;
    el.style.transform = "";
    setShift(dx);
  }, [open]);

  const hoverable = () => window.matchMedia("(hover: hover)").matches;
  const openedAt = useRef(0);
  const enter = () => {
    clearTimeout(timer.current);
    if (hoverable() && !open) {
      openedAt.current = Date.now();
      onOpen();
    }
  };
  // A click right after hover opened the menu should not close it again.
  const click = () => {
    if (Date.now() - openedAt.current < 500) return onOpen();
    onToggle();
  };
  const leave = () => {
    clearTimeout(timer.current);
    if (hoverable()) timer.current = setTimeout(onClose, 160);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className={`dd${open ? " open" : ""}`} onMouseEnter={enter} onMouseLeave={leave}>
      <button type="button" className={`ddb${active ? " on" : ""}`} aria-haspopup="true" aria-expanded={open} onClick={click}>
        {menu.label}
        <ChevronDown className="chev h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="mega" ref={panelRef} style={{ transform: shift ? `translateX(${shift}px)` : undefined }}>
          <div className={`mega-in cols-${menu.columns.length}`}>
            {menu.columns.map((col, i) => (
              <div key={i} className="mega-col">
                {col.map((s, j) => (
                  <Section key={j} section={s} onPick={onClose} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Quick page finder, opened by the search icon, "/" or Ctrl/Cmd+K.
function SearchDialog({ onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return SEARCH_INDEX;
    return SEARCH_INDEX.filter((r) => {
      const hay = `${r.title} ${r.desc} ${r.section} ${r.company?.fullName || ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [q]);

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    listRef.current?.querySelector(".on")?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function go(r) {
    if (!r) return;
    onClose();
    navigate(r.to);
  }

  function onKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[sel]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className="srch-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="srch" role="dialog" aria-modal="true" aria-label="Search Anobyt">
        <div className="srch-in">
          <Search className="h-4 w-4" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKey}
            placeholder="Search pages, companies, years…"
            aria-label="Search"
          />
          <button type="button" className="srch-x" onClick={onClose} aria-label="Close search">
            Esc
          </button>
        </div>
        <ul className="srch-list" ref={listRef}>
          {results.map((r, i) => (
            <li key={r.to + r.title}>
              <button type="button" className={i === sel ? "on" : ""} onMouseMove={() => setSel(i)} onClick={() => go(r)}>
                <CardIcon item={r} />
                <span className="mm-txt">
                  <b>{r.title}</b>
                  <small>{r.desc}</small>
                </span>
                <span className="srch-sec">{r.section}</span>
                <CornerDownLeft className="srch-enter h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {!results.length && <li className="srch-none">Nothing matches “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}

// Phone and tablet menu: a panel that slides in from the right, with each
// dropdown as an accordion.
function MobileMenu({ pathname, current, user, onClose }) {
  const [openSec, setOpenSec] = useState(current || null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const plain = (l) => {
    const Icon = l.icon;
    return (
      <NavLink key={l.to} to={l.to} end className={({ isActive }) => `mob-link${isActive ? " on" : ""}`} onClick={onClose}>
        <span className="mm-ic">
          <Icon className="h-4 w-4" />
        </span>
        {l.title}
      </NavLink>
    );
  };

  return (
    <div className="mob-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <nav className="mob" id="mobile-nav" aria-label="Main menu">
        <div className="mob-top">
          <Link className="brand" to="/" onClick={onClose}>
            <img src="/anobyt-icon.svg" alt="Anobyt" />
            Anobyt
          </Link>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mob-body">
          {BEFORE.map(plain)}
          {MENUS.map((m) => {
            const open = openSec === m.label;
            return (
              <div key={m.label} className={`mob-sec${open ? " open" : ""}`}>
                <button
                  type="button"
                  className={`mob-acc${current === m.label ? " on" : ""}`}
                  aria-expanded={open}
                  onClick={() => setOpenSec(open ? null : m.label)}
                >
                  {m.label}
                  <ChevronDown className="chev h-4 w-4" />
                </button>
                {open && (
                  <div className="mob-panel">
                    {m.columns.flat().map((s, i) =>
                      s.promo ? null : (
                        <div key={i} className="mob-group">
                          <div className="mm-h">
                            <span>{s.title}</span>
                            {s.more && (
                              <Link to={s.more.to} onClick={onClose}>
                                {s.more.label} <ArrowRight className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                          <div className={`mob-grid${s.items.some((it) => it.company) ? " logos" : ""}`}>
                            {s.items.map((it) => (
                              <Card key={it.to} item={it} onPick={onClose} />
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {AFTER.map(plain)}
        </div>
        <div className="mob-foot">
          <Link className={`mob-acct${pathname === "/account" ? " on" : ""}`} to={user ? "/account" : "/login"} onClick={onClose}>
            <UserRound className="h-4 w-4" />
            {user ? user.name : "Sign in"}
          </Link>
          <ThemeToggle className="icon-btn" />
          <Link className="btn" to="/book" onClick={onClose}>
            Book a session
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navRef = useRef(null);

  // Close everything whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
    setOpen(null);
  }

  useEffect(() => {
    function onClick(e) {
      if (!e.composedPath().includes(navRef.current)) setOpen(null);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
        setSearchOpen(false);
        return;
      }
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(null);
        setSearchOpen(true);
      }
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const current = menuFor(pathname);
  const settings = useSettings();
  const ann = settings.announcement;
  const { user } = useAccount();
  const initial = user?.name?.trim()?.[0]?.toUpperCase();

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
      <header className={`site-header${open ? " menu-open" : ""}`}>
        <div className="wrap bar">
          <Link className="brand" to="/">
            <img src="/anobyt-icon.svg" alt="Anobyt" />
            Anobyt
          </Link>
          <nav id="site-nav" className="site-nav" ref={navRef} aria-label="Main">
            {BEFORE.map((l) => (
              <NavLink key={l.to} to={l.to} end className={({ isActive }) => (isActive ? "on" : "")}>
                {l.title}
              </NavLink>
            ))}
            {MENUS.map((m) => (
              <MegaMenu
                key={m.label}
                menu={m}
                open={open === m.label}
                active={current === m.label}
                onOpen={() => setOpen(m.label)}
                onClose={() => setOpen((o) => (o === m.label ? null : o))}
                onToggle={() => setOpen((o) => (o === m.label ? null : m.label))}
              />
            ))}
            {AFTER.map((l) => (
              <NavLink key={l.to} to={l.to} end className={({ isActive }) => (isActive ? "on" : "")}>
                {l.title}
              </NavLink>
            ))}
          </nav>
          <div className="bar-actions">
            <button type="button" className="icon-btn srch-btn" onClick={() => setSearchOpen(true)} aria-label="Search (Ctrl+K)" title="Search (Ctrl+K)">
              <Search className="h-4 w-4" />
            </button>
            <ThemeToggle className="icon-btn hide-mob" />
            <Link
              className={`icon-btn acct${pathname === "/account" || pathname === "/login" ? " on" : ""}`}
              to={user ? "/account" : "/login"}
              title={user ? `Your account (${user.name})` : "Sign in"}
              aria-label={user ? "Your account" : "Sign in"}
            >
              {initial ? <span className="acct-av">{initial}</span> : <UserRound className="h-4 w-4" />}
            </Link>
            <button
              type="button"
              className="icon-btn nav-toggle"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      {mobileOpen && <MobileMenu pathname={pathname} current={current} user={user} onClose={() => setMobileOpen(false)} />}
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </>
  );
}
