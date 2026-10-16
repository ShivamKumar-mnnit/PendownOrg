import { useCallback, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { call } from "../../lib/testsApi";
import { LANG_NAMES, judgeJs } from "../../lib/problemBank";
import { Field, Gate, SectionTop } from "./shared";
import { useAdminData } from "./adminUtils";

const enc = encodeURIComponent;
const listAll = () => call("/api/problems?all=1", { admin: true });
const savePractice = (p) => call("/api/practice/settings", { method: "PUT", body: p, admin: true }).then((d) => d.practice);
const saveOrder = (year, ids) => call("/api/practice/order", { method: "PUT", body: { year, ids }, admin: true });
const putProblem = (id, p) => call(`/api/problems/${enc(id)}`, { method: "PUT", body: p, admin: true });
const postProblem = (p) => call("/api/problems", { method: "POST", body: p, admin: true });
const deleteProblem = (id) => call(`/api/problems/${enc(id)}`, { method: "DELETE", admin: true });
const ALL_LANGS = Object.keys(LANG_NAMES);
const PAGE = 60;

const blank = (kind, year = 1) => ({
  title: "",
  difficulty: "Easy",
  topic: "",
  book: "",
  year,
  kind,
  description: "",
  fn: "solve",
  params: "n",
  tests: [{ args: [1], expected: null }],
  ll: [],
  out: false,
  samples: [{ input: "", output: "" }],
  cases: [{ input: "", output: "" }],
  languages: ALL_LANGS,
  starter: {},
  published: true,
  access: "auto",
  hints: [],
  solution: { code: "", explanation: "" },
  solutionMode: "default",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
});

const SOLUTION_MODES = [
  ["show", "Show full solutions"],
  ["solved", "Show after the student solves it"],
  ["premium", "Premium members only"],
  ["hide", "Hide (students write their own)"],
];
const HINT_MODES = [
  ["show", "Show hints"],
  ["premium", "Premium members only"],
  ["hide", "Hide hints"],
];

/** Free share per year, and who sees solutions and hints. */
function PracticeRules({ initial, counts, onSaved }) {
  const [p, setP] = useState(initial);
  const [msg, setMsg] = useState("");
  const setYear = (y, patch) => setP({ ...p, years: { ...p.years, [y]: { ...p.years[y], ...patch } } });
  async function save() {
    setMsg("");
    try {
      setP(await savePractice(p));
      setMsg("Saved. The site uses the new rules straight away.");
      onSaved();
    } catch (e) {
      setMsg(e.message);
    }
  }
  return (
    <details className="panel" style={{ marginBottom: 18 }} open>
      <summary style={{ cursor: "pointer" }}>
        <b style={{ fontSize: 18 }}>Free and premium rules</b>
        <span className="note" style={{ margin: "0 0 0 10px" }}>
          {p.freePercent}% of each year is free
        </span>
      </summary>
      <p className="note">
        Problems set to <b>Auto</b> are free up to this share, spread over every topic (the first problems of each topic are free). You can still force a problem to Free or Premium in its row. Premium problems open for students who buy Premium practice or Premium membership (prices are in the Prices and features tab).
      </p>
      <Field label="Free share of each year (%)">
        <input className="inp" type="number" min={0} max={100} value={p.freePercent} onChange={(e) => setP({ ...p, freePercent: e.target.value })} style={{ maxWidth: 140 }} />
      </Field>
      <div className="tablewrap" style={{ marginTop: 10 }}>
        <table className="dtable">
          <thead>
            <tr>
              <th>Year</th>
              <th>Free problems</th>
              <th>Solutions</th>
              <th>Hints</th>
              <th>Description on the Practice page</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((y) => {
              const c = p.years[y];
              return (
                <tr key={y}>
                  <td>
                    <b>Year {y}</b>
                    <small style={{ display: "block", color: "var(--color-fg-muted)" }}>
                      {counts[y]?.free || 0} free of {counts[y]?.total || 0}
                    </small>
                  </td>
                  <td>
                    <input className="inp" type="number" min={0} placeholder={`${p.freePercent}%`} value={c.freeCount ?? ""} onChange={(e) => setYear(y, { freeCount: e.target.value === "" ? null : e.target.value })} style={{ width: 110 }} title="Leave empty to use the percentage" />
                  </td>
                  <td>
                    <select className="inp" value={c.solutions} onChange={(e) => setYear(y, { solutions: e.target.value })}>
                      {SOLUTION_MODES.map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select className="inp" value={c.hints} onChange={(e) => setYear(y, { hints: e.target.value })}>
                      {HINT_MODES.map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="inp" value={c.blurb} onChange={(e) => setYear(y, { blurb: e.target.value })} placeholder="Default description" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="note">Free problems: leave empty to use the percentage, or type an exact number for that year.</p>
      <div className="row" style={{ marginTop: 10, alignItems: "center" }}>
        <button type="button" className="btn" onClick={save}>
          Save rules
        </button>
        {msg && <span className="note" style={{ margin: 0 }}>{msg}</span>}
      </div>
    </details>
  );
}

/** Practice problems: the built-in ones plus any you add. Edit a built-in problem to replace it; hide any problem to take it off the site. */
export default function ProblemsAdmin() {
  const load = useCallback(() => listAll(), []);
  const state = useAdminData(load);
  const [year, setYear] = useState(1);
  const [q, setQ] = useState("");
  const [show, setShow] = useState("all");
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");

  const rows = useMemo(
    () =>
      (state.data?.items || []).map((p) => ({
        ...p,
        status: p.hidden || p.published === false ? "hidden" : !p.builtIn ? "added" : p.edited ? "edited" : "builtin",
      })),
    [state.data],
  );
  const books = state.data?.books || [];
  const counts = useMemo(() => {
    const c = {};
    for (const p of rows) {
      if (p.status === "hidden") continue;
      c[p.year] = c[p.year] || { total: 0, free: 0 };
      c[p.year].total++;
      if (p.computedAccess === "free") c[p.year].free++;
    }
    return c;
  }, [rows]);

  const s = q.trim().toLowerCase();
  const yearRows = rows.filter((p) => p.year === year);
  const shown = yearRows.filter((p) => (show === "all" || p.status === show || p.computedAccess === show) && (!s || `${p.title} ${p.topic} ${p.id}`.toLowerCase().includes(s)));

  async function act(fn) {
    setErr("");
    try {
      await fn();
      state.reload();
    } catch (e) {
      setErr(e.message);
    }
  }
  const strip = ({ status: _s, computedAccess: _c, edited: _e, seq: _q, ...rest }) => rest;
  // Showing an unedited built-in problem again just removes the saved copy.
  const toggleHidden = (p) => act(() => (p.status === "hidden" && p.builtIn && !p.edited ? deleteProblem(p.id) : putProblem(p.id, { ...strip(p), hidden: p.status !== "hidden", builtIn: Boolean(p.builtIn) })));
  const setAccess = (p, access) => act(() => putProblem(p.id, { ...strip(p), access, builtIn: Boolean(p.builtIn) }));
  // Moving a problem saves the whole year's order.
  function move(p, dir) {
    const ids = yearRows.map((x) => x.id);
    const i = ids.indexOf(p.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    act(() => saveOrder(year, ids));
  }

  if (editing)
    return (
      <ProblemEditor
        initial={editing}
        books={books}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          state.reload();
        }}
      />
    );

  return (
    <div>
      <SectionTop title="Practice problems" text="Every problem on the Practice pages. Set what is free or premium, change the order, edit statements, hints and solutions, hide problems, or add your own: function problems (JavaScript, Python, Java, C and C++) or input/output problems in any language.">
        <button type="button" className="btn" onClick={() => setEditing(blank("function", year))}>
          <Plus className="h-4 w-4" /> Function problem
        </button>
        <button type="button" className="btn ghost" onClick={() => setEditing(blank("stdio", year))}>
          <Plus className="h-4 w-4" /> Input/output problem
        </button>
      </SectionTop>
      {err && <p className="note bad">{err}</p>}
      <Gate state={state}>
        {state.data && <PracticeRules initial={state.data.practice} counts={counts} onSaved={state.reload} />}
        <div className="year-tabs">
          {[1, 2, 3, 4].map((y) => (
            <button
              key={y}
              type="button"
              className={`linkish${y === year ? " on" : ""}`}
              onClick={() => {
                setYear(y);
                setLimit(PAGE);
              }}
              style={{ padding: "10px 16px" }}
            >
              Year {y} ({counts[y]?.total || 0})
            </button>
          ))}
        </div>
        <div className="row" style={{ marginBottom: 12, alignItems: "center" }}>
          <input className="inp" placeholder="Search problems" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 300 }} />
          {[
            ["all", "All"],
            ["free", "Free"],
            ["premium", "Premium"],
            ["added", "Added by you"],
            ["edited", "Edited"],
            ["hidden", "Hidden"],
          ].map(([k, l]) => (
            <button key={k} type="button" className={`chip${show === k ? " on" : ""}`} onClick={() => setShow(k)}>
              {l}
            </button>
          ))}
          <span className="note" style={{ margin: 0 }}>{shown.length} problems</span>
        </div>
        <div className="tlist">
          {shown.slice(0, limit).map((p) => (
            <div className="trow" key={p.id}>
              <div className="tinfo">
                <div className="row" style={{ gap: 8 }}>
                  {p.computedAccess === "free" && <span className="badge free">FREE</span>}
                  {p.computedAccess === "premium" && <span className="badge prem">PREMIUM</span>}
                  <span className="tag">{p.topic}</span>
                  <span className={`tag ${p.difficulty === "Easy" ? "free" : "t-olympiad"}`}>{p.difficulty}</span>
                  {p.kind === "stdio" && <span className="tag t-mcq">Any language</span>}
                  {p.status === "added" && <span className="tag t-mcq">Added</span>}
                  {p.status === "edited" && <span className="tag t-mcq">Edited</span>}
                  {p.status === "hidden" && <span className="tag draft">Hidden</span>}
                </div>
                <b style={{ fontSize: 16 }}>{p.title}</b>
                <small>
                  {p.kind === "function" ? `${p.fn}(${p.params}) · ${p.tests?.length || 0} tests` : `${p.samples?.length || 0} sample + ${p.cases?.length || 0} hidden tests`}
                  {p.solution?.code ? " · has solution" : ""}
                  {p.hints?.length ? ` · ${p.hints.length} hint${p.hints.length > 1 ? "s" : ""}` : ""}
                </small>
              </div>
              <div className="tact">
                <select className="inp" value={p.access || "auto"} onChange={(e) => setAccess(p, e.target.value)} title="Free or premium" style={{ width: 120, padding: "6px 8px" }}>
                  <option value="auto">Auto</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
                <button type="button" className="ib" title="Move up" onClick={() => move(p, -1)} disabled={Boolean(s) || show !== "all"}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" className="ib" title="Move down" onClick={() => move(p, 1)} disabled={Boolean(s) || show !== "all"}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" className="ib" title="Edit" onClick={() => setEditing(p)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" className="ib" title={p.status === "hidden" ? "Show on the site" : "Hide from the site"} onClick={() => toggleHidden(p)}>
                  {p.status === "hidden" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <a className="ib" title="Open on the site" href={`/problem/${p.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
                {p.builtIn && p.status !== "builtin" && (
                  <button type="button" className="ib" title="Restore the original" onClick={() => confirm("Undo your changes and show the original problem?") && act(() => deleteProblem(p.id))}>
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                {!p.builtIn && (
                  <button type="button" className="ib danger" title="Delete" onClick={() => confirm(`Delete "${p.title}"?`) && act(() => deleteProblem(p.id))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {shown.length > limit && (
          <button type="button" className="btn ghost" style={{ marginTop: 14 }} onClick={() => setLimit(limit + PAGE)}>
            Show more
          </button>
        )}
      </Gate>
    </div>
  );
}

const json = (v) => (v === undefined ? "" : JSON.stringify(v));
function parse(text, what) {
  try {
    return { v: JSON.parse(text) };
  } catch {
    return { err: `${what} isn't valid JSON: ${text}` };
  }
}

function ProblemEditor({ initial, books: allBooks, onCancel, onSaved }) {
  const [p, setP] = useState(() => {
    const { status: _s, computedAccess: _c, edited: _e, seq: _q, ...rest } = initial;
    return { ...blank(initial.kind, initial.year), ...rest, solution: { code: "", explanation: "", ...(initial.solution || {}) } };
  });
  // Function tests are edited as JSON text so admins can type arrays and strings freely.
  const [rows, setRows] = useState(() => (initial.tests || []).map((t) => ({ args: t.args.map(json).join(", "), expected: json(t.expected) })));
  const [ref, setRef] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const books = allBooks.filter((b) => b[1] === Number(p.year));

  function buildTests() {
    const out = [];
    for (const [i, r] of rows.entries()) {
      const a = parse(`[${r.args}]`, `Test ${i + 1} input`);
      if (a.err) return { err: a.err };
      const e = r.expected.trim() === "" ? { v: null } : parse(r.expected, `Test ${i + 1} expected output`);
      if (e.err) return { err: e.err };
      out.push({ args: a.v, expected: e.v });
    }
    return { tests: out };
  }

  function fillExpected() {
    setErr("");
    const t = buildTests();
    if (t.err) return setErr(t.err);
    const r = judgeJs({ ...p, tests: t.tests.map((x) => ({ ...x, expected: null })) }, ref);
    if (r.err) return setErr("Reference solution: " + r.err);
    const bad = r.res.find((x) => x.err);
    if (bad) return setErr(`Reference solution failed on input ${JSON.stringify(bad.a)}: ${bad.err}`);
    setRows(rows.map((row, i) => ({ ...row, expected: json(r.res[i].got) })));
  }

  async function save() {
    setErr("");
    if (!p.title.trim()) return setErr("Give the problem a title.");
    if (!p.description.trim()) return setErr("Describe the problem.");
    let body = { ...p, year: Number(p.year), topic: p.topic || allBooks.find((b) => b[0] === p.book)?.[2] || "General", hints: (p.hints || []).map((h) => h.trim()).filter(Boolean) };
    if (p.kind === "function") {
      const t = buildTests();
      if (t.err) return setErr(t.err);
      if (!t.tests.length) return setErr("Add at least one test.");
      if (!/^[A-Za-z_$][\w$]*$/.test(p.fn)) return setErr("The function name can use letters, digits and _ only.");
      body = { ...body, tests: t.tests };
    } else {
      if (![...p.samples, ...p.cases].some((c) => c.output.trim())) return setErr("Add at least one test case with an expected output.");
      if (!p.languages.length) return setErr("Allow at least one language.");
    }
    setSaving(true);
    try {
      if (p.id) await putProblem(p.id, { ...body, hidden: false });
      else await postProblem(body);
      onSaved();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  }

  const caseList = (key, title) => (
    <div style={{ marginTop: 14 }}>
      <label className="l">{title}</label>
      {p[key].map((c, i) => (
        <div className="two" key={i} style={{ gap: 8, marginBottom: 8, alignItems: "start" }}>
          <textarea className="inp code" rows={2} placeholder="Input" value={c.input} onChange={(e) => set({ [key]: p[key].map((x, j) => (j === i ? { ...x, input: e.target.value } : x)) })} />
          <div style={{ display: "flex", gap: 6 }}>
            <textarea className="inp code" rows={2} placeholder="Expected output" value={c.output} onChange={(e) => set({ [key]: p[key].map((x, j) => (j === i ? { ...x, output: e.target.value } : x)) })} />
            <button type="button" className="ib danger" title="Remove" onClick={() => set({ [key]: p[key].filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="linkish" onClick={() => set({ [key]: [...p[key], { input: "", output: "" }] })}>
        + Add test case
      </button>
    </div>
  );

  return (
    <div className="editor">
      <button type="button" className="linkish" onClick={onCancel}>
        ← All problems
      </button>
      <h2 style={{ fontSize: 24, margin: "6px 0 16px" }}>
        {p.id ? (p.builtIn ? "Edit built-in problem" : "Edit problem") : p.kind === "function" ? "New function problem" : "New input/output problem"}
      </h2>
      {p.builtIn && <p className="note">Saving replaces the built-in version on the site. You can restore the original from the list.</p>}
      <div className="panel">
        <div className="two">
          <Field label="Title">
            <input className="inp" value={p.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <div className="three" style={{ gap: 10 }}>
            <Field label="Year">
              <select className="inp" value={p.year} onChange={(e) => set({ year: Number(e.target.value), book: "" })}>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Difficulty">
              <select className="inp" value={p.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
                {["Easy", "Medium", "Advanced", "Hard"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Book / topic">
              <select className="inp" value={p.book || "custom"} onChange={(e) => set(e.target.value === "custom" ? { book: "" } : { book: e.target.value, topic: allBooks.find((b) => b[0] === e.target.value)[2] })}>
                {books.map((b) => (
                  <option key={b[0]} value={b[0]}>
                    {b[2]}
                  </option>
                ))}
                <option value="custom">Other topic…</option>
              </select>
            </Field>
          </div>
        </div>
        {!p.book && (
          <Field label="Topic name" hint="Problems with the same topic are grouped together on the Year page.">
            <input className="inp" value={p.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="e.g. Bit manipulation" style={{ maxWidth: 360 }} />
          </Field>
        )}
        <Field label="Problem statement" hint='Blank line = new paragraph. "# " heading, "- " bullet, `code` and ``` code blocks work.'>
          <textarea className="inp" rows={6} value={p.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
      </div>

      {p.kind === "function" ? (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 19 }}>Function and tests</h3>
          <p className="note">Students write this function in JavaScript or Python, and also Java, C and C++ when every test uses whole numbers, true/false, text, lists of these or lists of number lists (the typed signature is worked out from the tests). Inputs are a comma-separated list of JSON values, one per parameter, e.g. <span className="mono">[3, 1, 2], 5</span> or <span className="mono">"hello"</span>.</p>
          <div className="two">
            <Field label="Function name">
              <input className="inp mono" value={p.fn} onChange={(e) => set({ fn: e.target.value.trim() })} />
            </Field>
            <Field label="Parameters">
              <input className="inp mono" value={p.params} onChange={(e) => set({ params: e.target.value })} placeholder="e.g. arr, target" />
            </Field>
          </div>
          <label className="l">Tests</label>
          {rows.map((r, i) => (
            <div key={i} className="two" style={{ gap: 8, marginBottom: 8 }}>
              <input className="inp mono" value={r.args} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, args: e.target.value } : x)))} placeholder="Inputs, e.g. [1, 2, 3], 4" />
              <div style={{ display: "flex", gap: 6 }}>
                <input className="inp mono" value={r.expected} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, expected: e.target.value } : x)))} placeholder='Expected return, e.g. 6 or "Yes"' />
                <button type="button" className="ib danger" title="Remove" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="linkish" onClick={() => setRows([...rows, { args: "", expected: "" }])}>
            + Add test
          </button>
          <details style={{ marginTop: 16 }}>
            <summary className="linkish">Fill the expected outputs from a reference solution</summary>
            <textarea className="inp code" rows={6} value={ref} onChange={(e) => setRef(e.target.value)} placeholder={`function ${p.fn}(${p.params}) {\n  // your correct solution (JavaScript)\n}`} style={{ marginTop: 8 }} />
            <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={fillExpected} disabled={!ref.trim()}>
              Run it and fill expected outputs
            </button>
          </details>
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 19 }}>Input, output and test cases</h3>
          <p className="note">Students read from standard input and print the answer. Output is compared line by line, ignoring trailing spaces.</p>
          <label className="l">Languages allowed</label>
          <div className="checks inline">
            {ALL_LANGS.map((l) => (
              <label key={l}>
                <input type="checkbox" checked={p.languages.includes(l)} onChange={(e) => set({ languages: e.target.checked ? [...p.languages, l] : p.languages.filter((x) => x !== l) })} /> {LANG_NAMES[l]}
              </label>
            ))}
          </div>
          {caseList("samples", "Sample tests (shown to students)")}
          {caseList("cases", "Hidden tests (only pass / fail is shown)")}
          <details style={{ marginTop: 16 }}>
            <summary className="linkish">Starter code (optional)</summary>
            {p.languages.map((l) => (
              <Field key={l} label={LANG_NAMES[l]}>
                <textarea className="inp code" rows={4} value={p.starter?.[l] || ""} onChange={(e) => set({ starter: { ...p.starter, [l]: e.target.value } })} />
              </Field>
            ))}
          </details>
        </div>
      )}

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 19 }}>Format and constraints</h3>
        <p className="note">Shown under the statement. For function problems, leave these empty to use the automatic text (function name, parameters and what to return).</p>
        <div className="three">
          <Field label="Input format">
            <textarea className="inp" rows={3} value={p.inputFormat} onChange={(e) => set({ inputFormat: e.target.value })} />
          </Field>
          <Field label="Output format">
            <textarea className="inp" rows={3} value={p.outputFormat} onChange={(e) => set({ outputFormat: e.target.value })} />
          </Field>
          <Field label="Constraints">
            <textarea className="inp" rows={3} value={p.constraints} onChange={(e) => set({ constraints: e.target.value })} placeholder="e.g. 1 <= n <= 10^5" />
          </Field>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 19 }}>Access, hints and solution</h3>
        <div className="two">
          <Field label="Free or premium">
            <select className="inp" value={p.access || "auto"} onChange={(e) => set({ access: e.target.value })}>
              <option value="auto">Auto (follow the year's free share)</option>
              <option value="free">Always free</option>
              <option value="premium">Always premium</option>
            </select>
          </Field>
          <Field label="Who sees the solution">
            <select className="inp" value={p.solutionMode || "default"} onChange={(e) => set({ solutionMode: e.target.value })}>
              <option value="default">Same as the year's rule</option>
              {SOLUTION_MODES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="l">Hints (shown one at a time)</label>
        {(p.hints || []).map((h, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input className="inp" value={h} onChange={(e) => set({ hints: p.hints.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`Hint ${i + 1}`} />
            <button type="button" className="ib danger" title="Remove" onClick={() => set({ hints: p.hints.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" className="linkish" onClick={() => set({ hints: [...(p.hints || []), ""] })}>
          + Add hint
        </button>
        <Field label="Solution code">
          <textarea className="inp code" rows={8} value={p.solution.code} onChange={(e) => set({ solution: { ...p.solution, code: e.target.value } })} placeholder="The full solution students see when the rule allows it" />
        </Field>
        <Field label="Explanation">
          <textarea className="inp" rows={4} value={p.solution.explanation} onChange={(e) => set({ solution: { ...p.solution, explanation: e.target.value } })} placeholder="Explain the idea in simple words" />
        </Field>
      </div>

      <div className="savebar">
        {err && <span className="bad">{err}</span>}
        <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save problem"}
        </button>
      </div>
    </div>
  );
}
