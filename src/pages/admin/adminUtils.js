import { useCallback, useEffect, useState } from "react";

export const fmtDate = (ts) => (ts ? new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");

export function downloadCsv(rows, filename) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Loads admin data. `needLogin` is 401 (wrong/missing password) or 503
 * (ADMIN_PASSWORD not set in Netlify), so the tab can show the right screen.
 */
export function useAdminData(load) {
  const [state, setState] = useState({ data: null, error: "", needLogin: 0 });
  const reload = useCallback(
    () =>
      load().then(
        (data) => setState({ data, error: "", needLogin: 0 }),
        (e) => setState({ data: null, error: e.status === 401 || e.status === 503 ? "" : e.message, needLogin: e.status === 401 || e.status === 503 ? e.status : 0 }),
      ),
    [load],
  );
  useEffect(() => {
    reload();
  }, [reload]);
  return { ...state, reload };
}

export const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

