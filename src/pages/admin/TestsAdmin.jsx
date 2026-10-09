import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Download, Eye, EyeOff, Link2, Pencil, Plus, Trash2, Users } from "lucide-react";
import {
  KIND_LABELS,
  LANG_LABELS,
  TEST_TYPE_LABELS,
  adminLogin,
  createTest,
  deleteTest,
  getFullTest,
  getResults,
  listAllTests,
  setAdminKey,
  updateTest,
} from "../../lib/testsApi";

const ALL_LANGS = Object.keys(LANG_LABELS);

function blankQuestion(kind, type) {
  const negative = type === "olympiad" ? 1 : 0;
  if (kind === "numeric") return { kind, text: "", marks: 4, negative, answer: 0, tolerance: 0, explanation: "" };
  if (kind === "coding")
    return { kind, text: "", marks: 10, negative: 0, languages: ALL_LANGS, samples: [{ input: "", output: "" }], cases: [{ input: "", output: "" }], explanation: "" };
  return { kind, text: "", marks: type === "olympiad" ? 4 : 1, negative, options: ["", "", "", ""], correct: [], explanation: "" };
}

function blankTest(type) {
  const first = type === "coding" ? "coding" : "single";
  return {
    type,
    title: "",
    description: "",
    durationMin: type === "coding" ? 60 : type === "olympiad" ? 90 : 30,
    published: false,
    shuffle: false,
    showAnswers: true,
    questions: [blankQuestion(first, type)],
  };
}

/** Problems that would make the test unfair or ungradable. */
function validate(t) {
  if (!t.title.trim()) return "Give the test a title.";
  if (!t.questions.length) return "Add at least one question.";
  for (const [i, q] of t.questions.entries()) {
    const n = `Question ${i + 1}`;
    if (!q.text.trim()) return `${n} has no question text.`;
    if (q.kind === "single" || q.kind === "multi") {
      if (q.options.filter((o) => o.trim()).length < 2) return `${n} needs at least two options.`;
      if (q.options.some((o) => !o.trim())) return `${n} has an empty option. Fill it in or remove it.`;
      if (!q.correct.length) return `${n} has no correct answer marked.`;
    }
    if (q.kind === "numeric" && !Number.isFinite(Number(q.answer))) return `${n} needs a numeric answer.`;
    if (q.kind === "coding") {
      if (!q.languages.length) return `${n} must allow at least one language.`;
      if (![...q.samples, ...q.cases].some((c) => c.output.trim())) return `${n} needs at least one test case with an expected output.`;
    }
  }
  return "";
}

const fmtDate = (ts) => new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const fmtDur = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
const testLink = (id) => `${window.location.origin}/assessment/${id}`;

export default function TestsAdmin() {
  const [tests, setTests] = useState(null);
  const [error, setError] = useState("");
  const [needLogin, setNeedLogin] = useState(0); // 0 ok, 401 wrong key, 503 not configured
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [copied, setCopied] = useState("");

  const load = useCallback(
    () =>
      listAllTests().then(
        (list) => {
          setTests(list);
          setNeedLogin(0);
          setError("");
        },
        (e) => {
          if (e.status === 401 || e.status === 503) setNeedLogin(e.status);
          else setError(e.message);
          setTests([]);
        },
      ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function openEditor(t) {
    setError("");
    try {
      setEditing(await getFullTest(t.id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function togglePublish(t) {
    try {
      const full = await getFullTest(t.id);
      await updateTest(t.id, { ...full, published: !full.published });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(t) {
    if (!confirm(`Delete "${t.title}" and all its submissions? This can't be undone.`)) return;
    try {
      await deleteTest(t.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function duplicate(t) {
    try {
      const full = await getFullTest(t.id);
      await createTest({ ...full, title: `${full.title} (copy)`, published: false });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  function copyLink(t) {
    navigator.clipboard?.writeText(testLink(t.id)).then(
      () => {
        setCopied(t.id);
        setTimeout(() => setCopied(""), 1800);
      },
      () => prompt("Copy this link:", testLink(t.id)),
    );
  }

  if (needLogin) return <ServerLogin status={needLogin} onDone={load} />;
  if (editing)
    return (
      <TestEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  if (viewing) return <Results test={viewing} onBack={() => setViewing(null)} />;

  return (
    <div>
      <div className="admin-top" style={{ marginTop: 8 }}>
        <div>
          <h2 style={{ fontSize: 24 }}>Tests and assessments</h2>
          <p className="note" style={{ marginTop: 4 }}>
            Create MCQ tests, coding assessments and Olympiad-style papers. Published tests appear on the Practice page and can be shared by link.
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={() => setEditing(blankTest("mcq"))}>
            <Plus className="h-4 w-4" /> MCQ test
          </button>
          <button type="button" className="btn ghost" onClick={() => setEditing(blankTest("coding"))}>
            <Plus className="h-4 w-4" /> Coding assessment
          </button>
          <button type="button" className="btn ghost" onClick={() => setEditing(blankTest("olympiad"))}>
            <Plus className="h-4 w-4" /> Olympiad
          </button>
        </div>
      </div>

      {error && <p className="note bad">{error}</p>}
      {tests === null && <p className="note">Loading…</p>}
      {tests?.length === 0 && !error && (
        <div className="empty">
          <b>No tests yet</b>
          <span>Pick a test type above to create your first one.</span>
        </div>
      )}

      <div className="tlist">
        {tests?.map((t) => (
          <div className="trow" key={t.id}>
            <div className="tinfo">
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <span className={`tag t-${t.type}`}>{TEST_TYPE_LABELS[t.type]}</span>
                <span className={`tag ${t.published ? "free" : "draft"}`}>{t.published ? "Published" : "Draft"}</span>
              </div>
              <b>{t.title}</b>
              <small>
                {t.questions.length} questions · {t.questions.reduce((n, q) => n + q.marks, 0)} marks · {t.durationMin ? `${t.durationMin} min` : "No time limit"} · Updated{" "}
                {fmtDate(t.updatedAt)}
              </small>
            </div>
            <div className="tact">
              <button type="button" className="ib" title="Edit" onClick={() => openEditor(t)}>
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" className="ib" title={t.published ? "Unpublish" : "Publish"} onClick={() => togglePublish(t)}>
                {t.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button type="button" className="ib" title="Results" onClick={() => setViewing(t)}>
                <Users className="h-4 w-4" />
              </button>
              <button type="button" className="ib" title={copied === t.id ? "Copied" : "Copy student link"} onClick={() => copyLink(t)}>
                <Link2 className="h-4 w-4" />
              </button>
              <button type="button" className="ib" title="Duplicate" onClick={() => duplicate(t)}>
                <Copy className="h-4 w-4" />
              </button>
              <button type="button" className="ib danger" title="Delete" onClick={() => remove(t)}>
                <Trash2 className="h-4 w-4" />
              </button>
              {copied === t.id && <span className="note ok" style={{ margin: 0 }}>Link copied</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServerLogin({ status, onDone }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  if (status === 503)
    return (
      <div className="panel" style={{ maxWidth: 640 }}>
        <h3>One-time setup needed</h3>
        <p className="note">
          Tests are saved on the server, so they need a server-side admin password. In Netlify, open Site configuration → Environment
          variables, add <b>ADMIN_PASSWORD</b> with a strong password, then redeploy. After that, unlock this page with that password.
        </p>
      </div>
    );
  return (
    <form
      className="panel"
      style={{ maxWidth: 440 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await adminLogin(key);
        if (r.ok) {
          setAdminKey(key);
          onDone();
        } else setErr(r.error || "Incorrect password.");
      }}
    >
      <h3>Enter the server admin password</h3>
      <p className="note">Tests use the ADMIN_PASSWORD set in Netlify, which is different from the old sessions passcode.</p>
      <input className="inp" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_PASSWORD" style={{ marginTop: 12 }} />
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 12 }} disabled={!key}>
        Continue
      </button>
    </form>
  );
}

function TestEditor({ initial, onCancel, onSaved }) {
  const [t, setT] = useState(initial);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (patch) => setT((prev) => ({ ...prev, ...patch }));
  const setQ = (i, patch) => setT((prev) => ({ ...prev, questions: prev.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));
  const moveQ = (i, d) =>
    setT((prev) => {
      const qs = [...prev.questions];
      const j = i + d;
      if (j < 0 || j >= qs.length) return prev;
      [qs[i], qs[j]] = [qs[j], qs[i]];
      return { ...prev, questions: qs };
    });
  const removeQ = (i) => setT((prev) => ({ ...prev, questions: prev.questions.filter((_, j) => j !== i) }));
  const addQ = (kind) => setT((prev) => ({ ...prev, questions: [...prev.questions, blankQuestion(kind, prev.type)] }));
  const changeKind = (i, kind) => setQ(i, { ...blankQuestion(kind, t.type), text: t.questions[i].text, marks: t.questions[i].marks });

  async function save(publish) {
    const next = publish === undefined ? t : { ...t, published: publish };
    const problem = validate(next);
    if (problem) return setErr(problem);
    setErr("");
    setSaving(true);
    try {
      if (next.id) await updateTest(next.id, next);
      else await createTest(next);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const total = t.questions.reduce((n, q) => n + (Number(q.marks) || 0), 0);

  return (
    <div className="editor">
      <div className="admin-top" style={{ marginTop: 8 }}>
        <div>
          <button type="button" className="linkish" onClick={onCancel}>
            ← All tests
          </button>
          <h2 style={{ fontSize: 24, marginTop: 6 }}>{t.id ? "Edit test" : "Create a test"}</h2>
        </div>
        <div className="note" style={{ margin: 0 }}>
          {t.questions.length} questions · {total} marks
        </div>
      </div>

      <div className="panel">
        <div className="two">
          <div>
            <label className="l" htmlFor="t-title">Title</label>
            <input id="t-title" className="inp" value={t.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. DSA weekly assessment 1" />
          </div>
          <div>
            <label className="l" htmlFor="t-type">Test type</label>
            <select id="t-type" className="inp" value={t.type} onChange={(e) => set({ type: e.target.value })}>
              {Object.entries(TEST_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="l" htmlFor="t-desc">Instructions for students</label>
        <textarea id="t-desc" className="inp" rows={3} value={t.description} onChange={(e) => set({ description: e.target.value })} placeholder="Syllabus, rules, marking scheme…" />
        <div className="two">
          <div>
            <label className="l" htmlFor="t-dur">Time limit (minutes, 0 for none)</label>
            <input id="t-dur" className="inp" type="number" min={0} max={600} value={t.durationMin} onChange={(e) => set({ durationMin: e.target.value })} />
          </div>
          <div className="checks">
            <label><input type="checkbox" checked={t.shuffle} onChange={(e) => set({ shuffle: e.target.checked })} /> Shuffle question order</label>
            <label><input type="checkbox" checked={t.showAnswers} onChange={(e) => set({ showAnswers: e.target.checked })} /> Show answers and explanations after submitting</label>
            <label><input type="checkbox" checked={t.published} onChange={(e) => set({ published: e.target.checked })} /> Published (visible to students)</label>
          </div>
        </div>
      </div>

      {t.questions.map((q, i) => (
        <QuestionEditor
          key={i}
          q={q}
          i={i}
          count={t.questions.length}
          onChange={(patch) => setQ(i, patch)}
          onKind={(k) => changeKind(i, k)}
          onMove={(d) => moveQ(i, d)}
          onRemove={() => removeQ(i)}
        />
      ))}

      <div className="addq">
        <span>Add a question:</span>
        {Object.entries(KIND_LABELS).map(([k, v]) => (
          <button key={k} type="button" className="chip" onClick={() => addQ(k)}>
            <Plus className="h-3.5 w-3.5" style={{ display: "inline", verticalAlign: -2 }} /> {v}
          </button>
        ))}
      </div>

      <div className="savebar">
        {err && <span className="bad">{err}</span>}
        <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="btn ghost" onClick={() => save(false)} disabled={saving}>
          Save as draft
        </button>
        <button type="button" className="btn" onClick={() => save(true)} disabled={saving}>
          {saving ? "Saving…" : "Save and publish"}
        </button>
      </div>
    </div>
  );
}

function QuestionEditor({ q, i, count, onChange, onKind, onMove, onRemove }) {
  const choice = q.kind === "single" || q.kind === "multi";
  return (
    <div className="panel qed">
      <div className="qhead">
        <b>Question {i + 1}</b>
        <select className="inp" value={q.kind} onChange={(e) => onKind(e.target.value)} aria-label="Question type" style={{ width: "auto" }}>
          {Object.entries(KIND_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="mini">
          Marks <input className="inp" type="number" min={0} value={q.marks} onChange={(e) => onChange({ marks: e.target.value })} />
        </label>
        {q.kind !== "coding" && (
          <label className="mini">
            Negative <input className="inp" type="number" min={0} step="0.25" value={q.negative} onChange={(e) => onChange({ negative: e.target.value })} />
          </label>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" className="ib" title="Move up" disabled={i === 0} onClick={() => onMove(-1)}>
          <ArrowUp className="h-4 w-4" />
        </button>
        <button type="button" className="ib" title="Move down" disabled={i === count - 1} onClick={() => onMove(1)}>
          <ArrowDown className="h-4 w-4" />
        </button>
        <button type="button" className="ib danger" title="Remove question" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <label className="l">{q.kind === "coding" ? "Problem statement (input and output format, constraints)" : "Question"}</label>
      <textarea className="inp" rows={q.kind === "coding" ? 6 : 3} value={q.text} onChange={(e) => onChange({ text: e.target.value })} />

      {choice && (
        <>
          <label className="l">Options ({q.kind === "single" ? "mark the one correct answer" : "mark every correct answer"})</label>
          {q.options.map((o, j) => (
            <div className="optrow" key={j}>
              <input
                type={q.kind === "single" ? "radio" : "checkbox"}
                name={`correct-${i}`}
                checked={q.correct.includes(j)}
                aria-label={`Option ${j + 1} is correct`}
                onChange={(e) =>
                  onChange({
                    correct: q.kind === "single" ? [j] : e.target.checked ? [...q.correct, j].sort() : q.correct.filter((x) => x !== j),
                  })
                }
              />
              <span className="optl">{String.fromCharCode(65 + j)}</span>
              <input className="inp" value={o} placeholder={`Option ${String.fromCharCode(65 + j)}`} onChange={(e) => onChange({ options: q.options.map((x, k) => (k === j ? e.target.value : x)) })} />
              <button
                type="button"
                className="ib"
                title="Remove option"
                disabled={q.options.length <= 2}
                onClick={() =>
                  onChange({
                    options: q.options.filter((_, k) => k !== j),
                    correct: q.correct.filter((x) => x !== j).map((x) => (x > j ? x - 1 : x)),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {q.options.length < 8 && (
            <button type="button" className="linkish" onClick={() => onChange({ options: [...q.options, ""] })}>
              + Add option
            </button>
          )}
        </>
      )}

      {q.kind === "numeric" && (
        <div className="two">
          <div>
            <label className="l">Correct answer</label>
            <input className="inp" type="number" step="any" value={q.answer} onChange={(e) => onChange({ answer: e.target.value })} />
          </div>
          <div>
            <label className="l">Accepted margin (±)</label>
            <input className="inp" type="number" step="any" min={0} value={q.tolerance} onChange={(e) => onChange({ tolerance: e.target.value })} />
          </div>
        </div>
      )}

      {q.kind === "coding" && (
        <>
          <label className="l">Allowed languages</label>
          <div className="checks inline">
            {ALL_LANGS.map((l) => (
              <label key={l}>
                <input
                  type="checkbox"
                  checked={q.languages.includes(l)}
                  onChange={(e) => onChange({ languages: e.target.checked ? [...q.languages, l] : q.languages.filter((x) => x !== l) })}
                />{" "}
                {LANG_LABELS[l]}
              </label>
            ))}
          </div>
          <CaseList
            title="Sample test cases (shown to students)"
            list={q.samples}
            onChange={(samples) => onChange({ samples })}
          />
          <CaseList
            title="Hidden test cases (used for scoring; samples are used if this is empty)"
            list={q.cases}
            onChange={(cases) => onChange({ cases })}
          />
          <p className="note">Output is compared line by line, ignoring trailing spaces. Marks are split across hidden cases, so partial solutions get partial marks.</p>
        </>
      )}

      <label className="l">Explanation (optional, shown after submitting)</label>
      <textarea className="inp" rows={2} value={q.explanation} onChange={(e) => onChange({ explanation: e.target.value })} />
    </div>
  );
}

function CaseList({ title, list, onChange }) {
  return (
    <div style={{ marginTop: 6 }}>
      <label className="l">{title}</label>
      {list.map((c, j) => (
        <div className="caserow" key={j}>
          <span className="optl">{j + 1}</span>
          <textarea className="inp mono" rows={2} placeholder="Input (stdin)" value={c.input} onChange={(e) => onChange(list.map((x, k) => (k === j ? { ...x, input: e.target.value } : x)))} />
          <textarea className="inp mono" rows={2} placeholder="Expected output" value={c.output} onChange={(e) => onChange(list.map((x, k) => (k === j ? { ...x, output: e.target.value } : x)))} />
          <button type="button" className="ib" title="Remove case" onClick={() => onChange(list.filter((_, k) => k !== j))}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {list.length < 15 && (
        <button type="button" className="linkish" onClick={() => onChange([...list, { input: "", output: "" }])}>
          + Add test case
        </button>
      )}
    </div>
  );
}

function Results({ test, onBack }) {
  const [subs, setSubs] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getResults(test.id).then(setSubs, (e) => {
      setErr(e.message);
      setSubs([]);
    });
  }, [test.id]);

  const total = test.questions.reduce((n, q) => n + q.marks, 0);
  const avg = subs?.length ? subs.reduce((n, s) => n + s.score, 0) / subs.length : 0;
  const best = subs?.length ? Math.max(...subs.map((s) => s.score)) : 0;

  function exportCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Name", "Email", "Score", "Total", "Percent", "Time taken", "Submitted"]].concat(
      subs.map((s) => [s.name, s.email, s.score, s.total, s.total ? Math.round((s.score / s.total) * 100) + "%" : "", fmtDur(s.timeTakenSec), fmtDate(s.submittedAt)]),
    );
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${test.title.replace(/\W+/g, "-").toLowerCase()}-results.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="admin-top" style={{ marginTop: 8 }}>
        <div>
          <button type="button" className="linkish" onClick={onBack}>
            ← All tests
          </button>
          <h2 style={{ fontSize: 24, marginTop: 6 }}>Results: {test.title}</h2>
        </div>
        <button type="button" className="btn ghost" onClick={exportCsv} disabled={!subs?.length}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      {err && <p className="note bad">{err}</p>}
      {subs?.length > 0 && (
        <div className="kpis">
          <div><b>{subs.length}</b><span>Submissions</span></div>
          <div><b>{avg.toFixed(1)} / {total}</b><span>Average score</span></div>
          <div><b>{best} / {total}</b><span>Top score</span></div>
        </div>
      )}
      {subs === null && <p className="note">Loading…</p>}
      {subs?.length === 0 && !err && (
        <div className="empty">
          <b>No submissions yet</b>
          <span>Share the student link to start collecting responses.</span>
        </div>
      )}
      {subs?.length > 0 && (
        <div className="tablewrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Score</th>
                <th>Time taken</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {[...subs]
                .sort((a, b) => b.score - a.score || a.timeTakenSec - b.timeTakenSec)
                .map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.email || "—"}</td>
                    <td>
                      <b>{s.score}</b> / {s.total}
                    </td>
                    <td>{fmtDur(s.timeTakenSec)}</td>
                    <td>{fmtDate(s.submittedAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
