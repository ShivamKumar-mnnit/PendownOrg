import { useCallback, useEffect, useState } from "react";
import { Copy, Download, X } from "lucide-react";
import { downloadCsv } from "../adminUtils";

/** Loads data-service data and reloads on demand. `data` is null while loading. */
export function useDs(load, deps = []) {
  const [state, setState] = useState({ data: null, error: "" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(load, deps);
  const reload = useCallback(
    () =>
      fn().then(
        (data) => setState({ data: data ?? [], error: "" }),
        (e) => setState((s) => ({ data: s.data, error: e.message })),
      ),
    [fn],
  );
  useEffect(() => {
    setState({ data: null, error: "" });
    reload();
  }, [reload]);
  return { ...state, reload };
}

/** Runs an action, showing its error with `setErr`; resolves with the result or undefined. */
export async function act(setErr, fn, confirmText) {
  if (confirmText && !confirm(confirmText)) return undefined;
  setErr?.("");
  try {
    return await fn();
  } catch (e) {
    if (setErr) setErr(e.message);
    else alert(e.message);
    return undefined;
  }
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel" style={wide ? { maxWidth: wide === true ? 860 : wide } : undefined}>
        <button type="button" className="ib modal-x" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Loading({ state, children }) {
  if (state.data === null && state.error) return <p className="note bad">{state.error}</p>;
  if (state.data === null) return <p className="note">Loading…</p>;
  return (
    <>
      {state.error && <p className="note bad">{state.error}</p>}
      {children(state.data)}
    </>
  );
}

export function Pager({ page, onPage }) {
  if (!page || page.totalPages <= 1) return page ? <p className="note" style={{ fontSize: 13 }}>{page.total} total</p> : null;
  return (
    <div className="row" style={{ alignItems: "center", marginTop: 12, gap: 10 }}>
      <button type="button" className="btn ghost" disabled={page.page === 0} onClick={() => onPage(page.page - 1)}>
        Previous
      </button>
      <span className="note" style={{ margin: 0 }}>
        Page {page.page + 1} of {page.totalPages} · {page.total} total
      </span>
      <button type="button" className="btn ghost" disabled={page.page + 1 >= page.totalPages} onClick={() => onPage(page.page + 1)}>
        Next
      </button>
    </div>
  );
}

export function Empty({ children }) {
  return (
    <div className="empty">
      <span>{children}</span>
    </div>
  );
}

/** Temporary passwords are shown once by the server: list them with copy + CSV download. */
export function Credentials({ list, title = "Login details", college }) {
  const [copied, setCopied] = useState("");
  if (!list?.length) return null;
  const rows = list.filter((c) => c.temporaryPassword);
  if (!rows.length) return null;
  const copy = (text, key) => navigator.clipboard?.writeText(text).then(() => (setCopied(key), setTimeout(() => setCopied(""), 1500)));
  const loginWith = (c) => (c.regNo && college ? `${college} / ${c.regNo}` : c.email || c.regNo || "");
  return (
    <div className="panel" style={{ marginTop: 14, borderColor: "var(--color-accent)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <b>{title}</b>
        <button
          type="button"
          className="btn ghost"
          onClick={() => downloadCsv([["Name", "Reg No", "Email", "Temporary password"], ...rows.map((c) => [c.name, c.regNo, c.email, c.temporaryPassword])], "login-details.csv")}
        >
          <Download className="h-4 w-4" /> Download CSV
        </button>
      </div>
      <p className="note" style={{ fontSize: 13 }}>
        Shown only once. Share them privately; each person sets their own password at first sign-in
        {college ? ` (students choose "College ID" and enter ${college} with their reg no)` : ""}.
      </p>
      <div className="tablewrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Signs in with</th>
              <th>Temporary password</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i}>
                <td>{c.name}</td>
                <td>{loginWith(c)}</td>
                <td>
                  <code className="mono">{c.temporaryPassword}</code>{" "}
                  <button type="button" className="ib" title="Copy" onClick={() => copy(c.temporaryPassword, i)}>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {copied === i && <small className="ok"> copied</small>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Row-level problems from a bulk upload. */
export function RowErrors({ rows, title = "Rows that were skipped" }) {
  if (!rows?.length) return null;
  return (
    <details className="panel" style={{ marginTop: 12 }} open={rows.length <= 5}>
      <summary>
        <b className="bad">
          {title} ({rows.length})
        </b>
      </summary>
      <ul className="ck" style={{ marginTop: 8 }}>
        {rows.map((r, i) => (
          <li key={i}>
            {r.row ? `Row ${r.row}: ` : ""}
            {r.message || r.error || JSON.stringify(r)}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function FilePick({ onFile, label = "Choose Excel / CSV", busy }) {
  return (
    <label className="btn ghost" style={{ cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
      {busy ? "Uploading…" : label}
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
    </label>
  );
}

export const tagFor = (status) =>
  ({ PUBLISHED: "free", COMPLETED: "free", CLOSED: "adv", CANCELLED: "adv", REJECTED: "adv", NO_SHOW: "adv", DRAFT: "med", NEW: "med", IN_PROGRESS: "" })[status] ?? "";
