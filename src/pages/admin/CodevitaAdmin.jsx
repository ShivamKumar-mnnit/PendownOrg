import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, EyeOff, Loader2, Pencil, Play, Plus, RotateCcw, Save, Search, Trash2, Upload, X } from "lucide-react";
import { call } from "../../lib/testsApi";
import { CV_LANGS, CV_LANG_NAMES, DIFFICULTIES, STATUS_TONE, fmtKb, fmtMs } from "../../lib/codevita/common";
import { submitAndJudge } from "../../lib/codevita/api";
import { Field, Gate, SectionTop } from "./shared";
import { downloadCsv, fmtDate, useAdminData } from "./adminUtils";
import { CourseAdmin, LessonsAdmin, MocksAdmin } from "./CodevitaCourseAdmin";
import "../codevita/codevita.css";

const adm = (path, opts = {}) => call(path, { ...opts, admin: true });
const loadBank = () => adm("/api/cv/admin/bank");

/** Admin → CodeVita: the question bank, bulk upload, settings and submissions. */
export default function CodevitaAdmin() {
  const state = useAdminData(loadBank);
  const [view, setView] = useState("problems");
  const [editing, setEditing] = useState(null);

  if (editing)
    return (
      <Editor
        initial={editing}
        topics={state.data?.topics || []}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          state.reload();
        }}
      />
    );

  return (
    <div>
      <SectionTop
        title="CodeVita crash course"
        text="The TCS CodeVita Crash Course at /courses/tcs-codevita: its price, course card and launch popup, the lessons, the question bank and PYQs, mock tests and every student's submissions. Add real PYQs one by one or in bulk with a Season (year) so they appear under PYQs."
      >
        <button type="button" className="btn" onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> New problem
        </button>
      </SectionTop>
      <div className="seg tabs" role="tablist" style={{ marginBottom: 14 }}>
        {[
          ["course", "Course, price and popup"],
          ["learn", "Lessons"],
          ["problems", "Problems and PYQs"],
          ["mocks", "Mock tests"],
          ["bulk", "Bulk upload"],
          ["subs", "Submissions"],
          ["settings", "Judge settings"],
        ].map(([k, l]) => (
          <button key={k} type="button" className={view === k ? "on" : ""} onClick={() => setView(k)}>
            {l}
          </button>
        ))}
      </div>
      {view === "learn" && <LessonsAdmin />}
      <Gate state={state}>
        {state.data && view === "problems" && <Problems data={state.data} reload={state.reload} onEdit={setEditing} />}
        {state.data && view === "bulk" && <Bulk onDone={state.reload} />}
        {state.data && view === "subs" && <Submissions items={state.data.items} />}
        {state.data && view === "settings" && <Settings data={state.data} onSaved={state.reload} />}
        {state.data && view === "course" && <CourseAdmin data={state.data} onSaved={state.reload} />}
        {state.data && view === "mocks" && <MocksAdmin bank={state.data.items.filter((p) => !p.hidden && p.published !== false)} />}
      </Gate>
    </div>
  );
}

// ---- Problem list ----

function Problems({ data, reload, onEdit }) {
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState("");
  const [acc, setAcc] = useState("");
  const [err, setErr] = useState("");
  const rows = data.items.filter(
    (p) =>
      (!q || `${p.title} ${p.id} ${p.topics.join(" ")} ${p.season}`.toLowerCase().includes(q.toLowerCase())) &&
      (!diff || p.difficulty === diff) &&
      (!acc || p.computedAccess === acc),
  );
  const count = (a) => data.items.filter((p) => p.computedAccess === a).length;

  async function act(fn) {
    setErr("");
    try {
      await fn();
      reload();
    } catch (e) {
      setErr(e.message);
    }
  }
  async function full(id) {
    return (await adm(`/api/cv/admin/problems/${encodeURIComponent(id)}`)).item;
  }
  const setAccess = (p, access) => act(async () => adm(`/api/cv/admin/problems/${p.id}`, { method: "PUT", body: { ...(await full(p.id)), access, cases: undefined } }));
  const toggleHidden = (p) =>
    act(async () =>
      p.hidden && p.builtIn
        ? adm(`/api/cv/admin/problems/${p.id}?restore=1`, { method: "DELETE" })
        : p.builtIn
          ? adm(`/api/cv/admin/problems/${p.id}`, { method: "DELETE" })
          : adm(`/api/cv/admin/problems/${p.id}`, { method: "PUT", body: { ...(await full(p.id)), hidden: !p.hidden, cases: undefined } }),
    );
  const remove = (p) => window.confirm(`Delete "${p.title}" and its test cases? This can't be undone.`) && act(() => adm(`/api/cv/admin/problems/${p.id}`, { method: "DELETE" }));

  return (
    <div>
      <p className="note">
        {data.items.length} problems: {count("free")} free, {count("premium")} premium, {count("hidden")} hidden. Free share is {data.settings.freePercent}% (change it in Settings). Problems you mark Free or Premium keep that; the rest are picked automatically, easiest first and spread across topics.
      </p>
      {err && <p className="note bad">{err}</p>}
      <div className="row" style={{ gap: 8, margin: "10px 0", flexWrap: "wrap" }}>
        <label className="cv-search" style={{ maxWidth: 360 }}>
          <Search className="h-4 w-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, topic or year" />
        </label>
        <select className="inp" style={{ width: "auto" }} value={diff} onChange={(e) => setDiff(e.target.value)}>
          <option value="">All levels</option>
          {DIFFICULTIES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select className="inp" style={{ width: "auto" }} value={acc} onChange={(e) => setAcc(e.target.value)}>
          <option value="">Free, premium and hidden</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>
      <div className="tablewrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Problem</th>
              <th>Level</th>
              <th>Tests</th>
              <th>Solutions</th>
              <th>Attempts / solved</th>
              <th>Access</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} style={p.computedAccess === "hidden" ? { opacity: 0.55 } : undefined}>
                <td>
                  <b>{p.title}</b>
                  <small style={{ display: "block", color: "var(--color-fg-faint)" }}>
                    {p.topics.join(", ")}
                    {p.season ? ` · ${p.season}` : ""}
                    {p.source === "pyq" ? " · PYQ" : ""}
                    {p.builtIn ? (p.edited ? " · built-in, edited" : " · built-in") : " · added"}
                  </small>
                </td>
                <td>{p.difficulty}</td>
                <td>
                  {p.samples.length} + {p.caseCount}
                </td>
                <td>{p.solutionLangs.map((l) => CV_LANG_NAMES[l]).join(", ") || "—"}</td>
                <td>{p.stats ? `${p.stats.attempts} / ${p.stats.solvers}` : "0 / 0"}</td>
                <td>
                  {p.computedAccess === "hidden" ? (
                    "Hidden"
                  ) : (
                    <select className="inp" style={{ padding: "4px 8px", width: "auto" }} value={p.access} onChange={(e) => setAccess(p, e.target.value)} title={`Now: ${p.computedAccess}`}>
                      <option value="auto">Auto ({p.computedAccess})</option>
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                    </select>
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="ib" title="Edit" onClick={async () => onEdit(await full(p.id))}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <a className="ib" title="Open in the coding round" href={`/courses/tcs-codevita/solve/${p.id}`} target="_blank" rel="noreferrer">
                    <Play className="h-4 w-4" />
                  </a>
                  <button type="button" className="ib" title={p.hidden ? "Show" : "Hide"} onClick={() => toggleHidden(p)}>
                    {p.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  {!p.builtIn && (
                    <button type="button" className="ib" title="Delete" onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Editor ----

const blank = {
  title: "",
  difficulty: "Medium",
  topics: [],
  patterns: [],
  companies: ["TCS CodeVita"],
  season: "",
  source: "original",
  summary: "",
  statement: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  samples: [{ input: "", output: "", explanation: "" }],
  cases: [],
  timeLimit: 1,
  memoryLimit: 256,
  points: 200,
  access: "auto",
  published: true,
  hints: [],
  editorial: {},
  complexity: {},
  solutions: {},
};

function Editor({ initial, topics, onCancel, onSaved }) {
  const [p, setP] = useState(() => ({ ...blank, ...initial, editorial: { ...(initial.editorial || {}) }, complexity: { ...(initial.complexity || {}) }, solutions: { ...(initial.solutions || {}) }, cases: initial.cases || [] }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [check, setCheck] = useState(null);
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const setIn = (group, k, v) => setP((x) => ({ ...x, [group]: { ...x[group], [k]: v } }));
  const setRow = (key, i, k, v) => setP((x) => ({ ...x, [key]: x[key].map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));
  const csv = (v) => (Array.isArray(v) ? v.join(", ") : v);

  async function save() {
    setErr("");
    setBusy(true);
    try {
      const { stats: _s, computedAccess: _c, caseCount: _n, solutionLangs: _l, edited: _e, seq: _q, ...body } = p;
      const r = p.id ? await adm(`/api/cv/admin/problems/${p.id}`, { method: "PUT", body }) : await adm("/api/cv/admin/problems", { method: "POST", body });
      setBusy(false);
      return r.item;
    } catch (e) {
      setErr(e.message);
      setBusy(false);
      return null;
    }
  }

  async function validate(lang) {
    const item = await save();
    if (!item) return;
    setP((x) => ({ ...x, id: item.id }));
    setCheck({ lang, busy: true });
    try {
      const sub = await submitAndJudge({ id: item.id, language: lang, code: p.solutions[lang], validate: true }, (s) => setCheck({ lang, busy: true, sub: s }));
      setCheck({ lang, sub });
    } catch (e) {
      setCheck({ lang, error: e.message });
    }
  }

  return (
    <div>
      <SectionTop title={p.id ? `Edit: ${p.title}` : "New CodeVita problem"} text="Statements use the same simple formatting as lessons: blank line = paragraph, `code`, **bold**, - bullets and ``` code blocks.">
        <button type="button" className="btn ghost" onClick={onCancel}>
          <X className="h-4 w-4" /> Cancel
        </button>
        <button type="button" className="btn" disabled={busy || !p.title.trim()} onClick={async () => (await save()) && onSaved()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </SectionTop>
      {err && <p className="note bad">{err}</p>}

      <div className="panel" style={{ display: "grid", gap: 12 }}>
        <div className="two">
          <Field label="Title">
            <input className="inp" value={p.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="two">
            <Field label="Difficulty">
              <select className="inp" value={p.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
                {DIFFICULTIES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Points">
              <input className="inp" type="number" value={p.points} onChange={(e) => set("points", e.target.value)} />
            </Field>
          </div>
        </div>
        <div className="two">
          <Field label="Topics (comma separated)" hint={`Common: ${topics.slice(0, 10).join(", ")}…`}>
            <input className="inp" value={csv(p.topics)} onChange={(e) => set("topics", e.target.value)} />
          </Field>
          <Field label="Problem-solving patterns (comma separated)">
            <input className="inp" value={csv(p.patterns)} onChange={(e) => set("patterns", e.target.value)} />
          </Field>
        </div>
        <div className="two">
          <Field label="Company relevance (comma separated)">
            <input className="inp" value={csv(p.companies)} onChange={(e) => set("companies", e.target.value)} />
          </Field>
          <div className="two">
            <Field label="Year of appearance" hint="Only for real PYQs you can verify.">
              <input className="inp" value={p.season} onChange={(e) => set("season", e.target.value)} placeholder="e.g. 2023" />
            </Field>
            <Field label="Source">
              <select className="inp" value={p.source} onChange={(e) => set("source", e.target.value)}>
                <option value="original">Anobyt original (CodeVita-style)</option>
                <option value="pyq">Previous-year question</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="two">
          <div className="two">
            <Field label="Time limit (seconds, C/C++)" hint="Java and Python get the extra time set in Settings.">
              <input className="inp" type="number" step="0.5" value={p.timeLimit} onChange={(e) => set("timeLimit", e.target.value)} />
            </Field>
            <Field label="Memory limit (MB)">
              <input className="inp" type="number" value={p.memoryLimit} onChange={(e) => set("memoryLimit", e.target.value)} />
            </Field>
          </div>
          <div className="two">
            <Field label="Free or premium">
              <select className="inp" value={p.access} onChange={(e) => set("access", e.target.value)}>
                <option value="auto">Automatic (free share)</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </Field>
            <Field label="Published">
              <select className="inp" value={p.published ? "1" : "0"} onChange={(e) => set("published", e.target.value === "1")}>
                <option value="1">Yes, students can see it</option>
                <option value="0">No, draft</option>
              </select>
            </Field>
          </div>
        </div>
        <Field label="One-line summary (shown in the list)">
          <input className="inp" value={p.summary} onChange={(e) => set("summary", e.target.value)} />
        </Field>
        <Field label="Problem statement">
          <textarea className="inp" rows={10} value={p.statement} onChange={(e) => set("statement", e.target.value)} />
        </Field>
        <div className="two">
          <Field label="Input format">
            <textarea className="inp" rows={4} value={p.inputFormat} onChange={(e) => set("inputFormat", e.target.value)} />
          </Field>
          <Field label="Output format">
            <textarea className="inp" rows={4} value={p.outputFormat} onChange={(e) => set("outputFormat", e.target.value)} />
          </Field>
        </div>
        <Field label="Constraints">
          <textarea className="inp code" style={{ minHeight: 70 }} value={p.constraints} onChange={(e) => set("constraints", e.target.value)} />
        </Field>
      </div>

      <h3 style={{ margin: "22px 0 8px" }}>Sample test cases (shown to students)</h3>
      {p.samples.map((s, i) => (
        <div key={i} className="panel" style={{ marginBottom: 10 }}>
          <div className="two">
            <Field label={`Sample ${i + 1} input`}>
              <textarea className="inp code" style={{ minHeight: 80 }} value={s.input} onChange={(e) => setRow("samples", i, "input", e.target.value)} />
            </Field>
            <Field label="Expected output">
              <textarea className="inp code" style={{ minHeight: 80 }} value={s.output} onChange={(e) => setRow("samples", i, "output", e.target.value)} />
            </Field>
          </div>
          <Field label="Explanation">
            <textarea className="inp" rows={2} value={s.explanation || ""} onChange={(e) => setRow("samples", i, "explanation", e.target.value)} />
          </Field>
          <button type="button" className="linkish" onClick={() => set("samples", p.samples.filter((_, j) => j !== i))}>
            Remove sample
          </button>
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={() => set("samples", [...p.samples, { input: "", output: "", explanation: "" }])}>
        <Plus className="h-4 w-4" /> Add sample
      </button>

      <h3 style={{ margin: "22px 0 8px" }}>Hidden test cases ({p.cases.length})</h3>
      <p className="note">Never shown to students. Include the smallest and largest inputs the constraints allow. Up to 60 cases.</p>
      {p.cases.map((c, i) => (
        <div key={i} className="two" style={{ marginBottom: 8, alignItems: "start" }}>
          <Field label={`Hidden ${i + 1} input`}>
            <textarea className="inp code" style={{ minHeight: 60 }} value={c.input.length > 20000 ? c.input.slice(0, 20000) + "\n…" : c.input} readOnly={c.input.length > 20000} onChange={(e) => setRow("cases", i, "input", e.target.value)} />
          </Field>
          <Field label="Expected output">
            <textarea className="inp code" style={{ minHeight: 60 }} value={c.output.length > 20000 ? c.output.slice(0, 20000) + "\n…" : c.output} readOnly={c.output.length > 20000} onChange={(e) => setRow("cases", i, "output", e.target.value)} />
            <button type="button" className="linkish" onClick={() => set("cases", p.cases.filter((_, j) => j !== i))}>
              Remove
            </button>
          </Field>
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={() => set("cases", [...p.cases, { input: "", output: "" }])}>
        <Plus className="h-4 w-4" /> Add hidden test
      </button>

      <h3 style={{ margin: "22px 0 8px" }}>Editorial</h3>
      <div className="panel" style={{ display: "grid", gap: 12 }}>
        {[
          ["idea", "Key idea"],
          ["brute", "Brute-force approach"],
          ["better", "Improved approach"],
          ["optimal", "Optimal approach (step by step)"],
          ["dryRun", "Dry run"],
          ["mistakes", "Common mistakes"],
          ["edgeCases", "Edge cases (one per line)"],
        ].map(([k, l]) => (
          <Field key={k} label={l}>
            <textarea className="inp" rows={k === "optimal" ? 6 : 3} value={p.editorial[k] || ""} onChange={(e) => setIn("editorial", k, e.target.value)} />
          </Field>
        ))}
        <div className="two">
          <Field label="Time complexity">
            <input className="inp" value={p.complexity.time || ""} onChange={(e) => setIn("complexity", "time", e.target.value)} placeholder="O(n log n)" />
          </Field>
          <Field label="Space complexity">
            <input className="inp" value={p.complexity.space || ""} onChange={(e) => setIn("complexity", "space", e.target.value)} placeholder="O(n)" />
          </Field>
        </div>
        <Field label="Hints (one per line)">
          <textarea className="inp" rows={3} value={(p.hints || []).join("\n")} onChange={(e) => set("hints", e.target.value.split("\n"))} />
        </Field>
      </div>

      <h3 style={{ margin: "22px 0 8px" }}>Reference solutions</h3>
      <p className="note">"Check" saves the problem, then judges that solution on every sample and hidden test, so you know the tests and the solution agree.</p>
      {CV_LANGS.map((l) => (
        <div key={l} className="panel" style={{ marginBottom: 10 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <b>{CV_LANG_NAMES[l]}</b>
            <button type="button" className="btn ghost" disabled={!p.solutions[l]?.trim() || check?.busy} onClick={() => validate(l)}>
              <CheckCircle2 className="h-4 w-4" /> Check against the tests
            </button>
          </div>
          <textarea className="inp code" style={{ minHeight: 140 }} value={p.solutions[l] || ""} onChange={(e) => setIn("solutions", l, e.target.value)} />
          {check?.lang === l && <CheckResult c={check} />}
        </div>
      ))}
    </div>
  );
}

function CheckResult({ c }) {
  if (c.error) return <p className="note bad">{c.error}</p>;
  const r = c.sub?.result;
  if (!r)
    return (
      <p className="note">
        <Loader2 className="h-4 w-4 animate-spin" style={{ display: "inline" }} /> Judging {c.sub?.cases ? `${c.sub.cases.filter((x) => !x.pending).length} of ${c.sub.total}` : "…"}
      </p>
    );
  const failed = c.sub.cases.map((x, i) => [x, i]).filter(([x]) => x.verdict !== "AC");
  return (
    <p className={`note tone-${STATUS_TONE[r.status]}`}>
      {r.status}: {r.passed}/{r.total} tests, max {fmtMs(r.timeMs)}, {fmtKb(r.memoryKb)}.
      {failed.length > 0 && ` Failing: ${failed.map(([x, i]) => `#${i + 1} ${x.verdict}`).join(", ")}.`}
    </p>
  );
}

// ---- Bulk upload ----

const TEMPLATE = {
  problems: [
    {
      id: "example-problem-2023",
      title: "Example problem",
      difficulty: "Medium",
      topics: ["Arrays", "Greedy"],
      patterns: ["Prefix sums"],
      companies: ["TCS CodeVita"],
      season: "2023",
      source: "pyq",
      summary: "One line for the list.",
      statement: "Full problem statement.",
      inputFormat: "First line ...",
      outputFormat: "Print ...",
      constraints: "1 <= N <= 10^5",
      timeLimit: 1,
      memoryLimit: 256,
      points: 200,
      access: "auto",
      samples: [{ input: "3\n1 2 3\n", output: "6\n", explanation: "1 + 2 + 3 = 6" }],
      cases: [{ input: "1\n5\n", output: "5\n" }],
      hints: ["First hint"],
      editorial: { idea: "", brute: "", better: "", optimal: "", dryRun: "", mistakes: "", edgeCases: "" },
      complexity: { time: "O(n)", space: "O(1)" },
      solutions: { cpp: "", java: "", python: "", c: "" },
    },
  ],
};

function Bulk({ onDone }) {
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  async function upload(file) {
    setRes(null);
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const problems = Array.isArray(parsed) ? parsed : parsed.problems;
      const r = await adm("/api/cv/admin/bulk", { method: "POST", body: { problems } });
      setRes(r);
      onDone();
    } catch (e) {
      setRes({ error: e instanceof SyntaxError ? "That file isn't valid JSON." : e.message });
    }
    setBusy(false);
  }
  const blobUrl = useMemo(() => URL.createObjectURL(new Blob([JSON.stringify(TEMPLATE, null, 2)], { type: "application/json" })), []);
  return (
    <div className="panel" style={{ maxWidth: 760 }}>
      <h3>Upload PYQs or new problems in bulk</h3>
      <p className="note">
        Upload a JSON file with a list of problems (up to 500 at a time). A problem with an id that already exists is updated, so you can fix and re-upload. Each problem needs a title and a statement; add sample tests, hidden tests
        (<code>cases</code>), the editorial and solutions. Mark real previous-year questions with <code>"source": "pyq"</code> and the year in <code>"season"</code>; students can then filter by year.
      </p>
      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        <a className="btn ghost" href={blobUrl} download="codevita-template.json">
          <Download className="h-4 w-4" /> Download the template
        </a>
        <label className="btn">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload JSON
          <input type="file" accept=".json,application/json" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
        </label>
      </div>
      {res?.error && <p className="note bad">{res.error}</p>}
      {res && !res.error && (
        <div className="note ok" style={{ marginTop: 10 }}>
          {res.created} added, {res.updated} updated.
          {res.errors?.length > 0 && (
            <ul>
              {res.errors.map((e) => (
                <li key={e} className="bad">
                  {e}
                </li>
              ))}
            </ul>
          )}
          <p>Check each new problem's reference solution in the editor ("Check against the tests") before publishing.</p>
        </div>
      )}
    </div>
  );
}

// ---- Submissions ----

function Submissions({ items }) {
  const [pid, setPid] = useState("");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [student, setStudent] = useState(null);
  const load = useCallback(() => {
    setErr("");
    const qs = new URLSearchParams({ ...(pid ? { problem: pid } : {}), ...(q ? { q } : {}) });
    adm(`/api/cv/admin/submissions?${qs}`).then(
      (d) => setData(d.items),
      (e) => setErr(e.message),
    );
  }, [pid, q]);
  useEffect(() => {
    load();
    // Loads once; the filters apply when Refresh is pressed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const openStudent = (uid) =>
    adm(`/api/cv/admin/students/${encodeURIComponent(uid)}`).then(
      (d) => setStudent({ uid, ...d.student }),
      (e) => setErr(e.message),
    );
  const exportCsv = () =>
    downloadCsv(
      [["When", "Student", "Email", "Problem", "Language", "Status", "Score", "Max", "Accuracy %"], ...(data || []).map((s) => [fmtDate(s.at), s.name, s.email, s.title, CV_LANG_NAMES[s.language], s.status, s.score, s.maxScore, s.accuracy])],
      "codevita-submissions.csv",
    );

  return (
    <div>
      <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <select className="inp" style={{ width: "auto", maxWidth: 320 }} value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="">Every problem</option>
          {items.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <input className="inp" style={{ width: 260 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Student name or email" />
        <button type="button" className="btn ghost" onClick={load}>
          <RotateCcw className="h-4 w-4" /> Refresh
        </button>
        <button type="button" className="btn ghost" onClick={exportCsv} disabled={!data?.length}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      {err && <p className="note bad">{err}</p>}
      {student && (
        <div className="panel" style={{ marginBottom: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <b>
              {student.name} · {student.email}
            </b>
            <button type="button" className="ib" onClick={() => setStudent(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="note">
            Solved {Object.values(student.problems || {}).filter((x) => x.solved).length} of {Object.keys(student.problems || {}).length} attempted problems · {student.subs?.length || 0} submissions · total best score{" "}
            {Object.values(student.problems || {}).reduce((n, x) => n + (x.bestScore || 0), 0)}
          </p>
          <p className="note">
            By level:{" "}
            {DIFFICULTIES.map((d) => {
              const ps = Object.values(student.problems || {}).filter((x) => x.difficulty === d);
              return `${d} ${ps.filter((x) => x.solved).length}/${ps.length}`;
            }).join(" · ")}
          </p>
        </div>
      )}
      {!data ? (
        <p className="note">Loading…</p>
      ) : !data.length ? (
        <p className="note">No submissions yet.</p>
      ) : (
        <div className="tablewrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>When</th>
                <th>Student</th>
                <th>Problem</th>
                <th>Language</th>
                <th>Result</th>
                <th>Score</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td>{fmtDate(s.at)}</td>
                  <td>
                    <button type="button" className="linkish" onClick={() => openStudent(s.uid)}>
                      {s.name || s.uid}
                    </button>
                    <small style={{ display: "block", color: "var(--color-fg-faint)" }}>{s.email}</small>
                  </td>
                  <td>{s.title}</td>
                  <td>{CV_LANG_NAMES[s.language]}</td>
                  <td className={`tone-${STATUS_TONE[s.status] || "warn"}`}>{s.status}</td>
                  <td>
                    {s.score}/{s.maxScore}
                  </td>
                  <td>
                    <a className="linkish" href={`/courses/tcs-codevita/report/${s.id}`} target="_blank" rel="noreferrer">
                      Scorecard
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="note" style={{ marginTop: 8 }}>
        Shows the latest 1000 submissions. Payment and premium status for each student is in "Purchases and users".
      </p>
    </div>
  );
}

// ---- Settings ----

function Settings({ data, onSaved }) {
  const [s, setS] = useState(data.settings);
  const [msg, setMsg] = useState("");
  const [check, setCheck] = useState(null);
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  async function save() {
    setMsg("");
    try {
      await adm("/api/cv/admin/settings", { method: "PUT", body: s });
      setMsg("Saved.");
      onSaved();
    } catch (e) {
      setMsg(e.message);
    }
  }
  async function runCheck() {
    setCheck({ busy: true });
    try {
      setCheck(await adm("/api/cv/admin/runner-check", { method: "POST", body: {} }));
    } catch (e) {
      setCheck({ error: e.message });
    }
  }
  return (
    <div className="panel" style={{ maxWidth: 760, display: "grid", gap: 14 }}>
      <Field label="Free share of the question bank (%)" hint="At least one problem is always free. Problems you mark Free or Premium keep that.">
        <input className="inp" type="number" min="0" max="100" value={s.freePercent} onChange={(e) => set("freePercent", e.target.value)} />
      </Field>
      <Field label="Linked course" hint="Students who bought this course also get the crash course. The crash course itself is priced in the Course, price and popup tab.">
        <select className="inp" value={s.courseId} onChange={(e) => set("courseId", e.target.value)}>
          <option value="">No linked course</option>
          {data.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.tier}
              {c.price ? `, ₹${c.price}` : ""})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Time limit multiplier per language" hint="The problem's time limit is multiplied by this, so slower languages get fair time.">
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          {CV_LANGS.map((l) => (
            <label key={l} className="mini">
              {CV_LANG_NAMES[l]}{" "}
              <input className="inp" style={{ width: 80, display: "inline-block" }} type="number" step="0.5" value={s.factors[l]} onChange={(e) => set("factors", { ...s.factors, [l]: e.target.value })} />
            </label>
          ))}
        </div>
      </Field>
      <label className="cv-check">
        <input type="checkbox" checked={s.probe} onChange={(e) => set("probe", e.target.checked)} /> Measure memory and CPU time inside the program (needed for memory figures on the main runner)
      </label>
      <Field label="Intro on the CodeVita page (optional)">
        <textarea className="inp" rows={3} value={s.intro} onChange={(e) => set("intro", e.target.value)} />
      </Field>
      <Field label="Announcement banner (optional)">
        <input className="inp" value={s.announcement} onChange={(e) => set("announcement", e.target.value)} placeholder="e.g. Mock contest this Sunday at 7 pm" />
      </Field>
      <div className="row" style={{ gap: 10 }}>
        <button type="button" className="btn" onClick={save}>
          <Save className="h-4 w-4" /> Save settings
        </button>
        <button type="button" className="btn ghost" onClick={runCheck} disabled={check?.busy}>
          {check?.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Check the code runner
        </button>
        {msg && <span className="note">{msg}</span>}
      </div>
      {check?.error && <p className="note bad">{check.error}</p>}
      {check?.results && (
        <table className="dtable">
          <thead>
            <tr>
              <th>Language</th>
              <th>Result</th>
              <th>Time</th>
              <th>Memory</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {check.results.map((r) => (
              <tr key={r.language}>
                <td>{CV_LANG_NAMES[r.language]}</td>
                <td className={r.verdict === "AC" ? "tone-good" : "tone-bad"}>{r.verdict === "AC" ? "Works" : r.verdict}</td>
                <td>{fmtMs(r.timeMs)}</td>
                <td>{fmtKb(r.memoryKb)}</td>
                <td style={{ maxWidth: 260, overflowWrap: "anywhere" }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
