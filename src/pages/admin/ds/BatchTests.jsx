import { useState } from "react";
import { ArrowLeft, BarChart3, Copy, Download, Eye, Lock, Pencil, Plus, Rocket, Trash2, Trophy } from "lucide-react";
import { QUESTION_TYPES, TEST_STATUS, adminApi, fmtWhen, fromLocalInput, pct, testLink, toLocalInput } from "../../../lib/dataService";
import { Field } from "../shared";
import { Empty, FilePick, Loading, Modal, Pager, RowErrors, act, tagFor, useDs } from "./common";
import { QuestionPicker, answerText } from "./QuestionBank";

export default function BatchTests({ batch }) {
  const [page, setPage] = useState(0);
  const state = useDs(() => adminApi.tests({ templateId: batch.id, page, size: 20 }), [batch.id, page]);
  const [open, setOpen] = useState(null);
  const [create, setCreate] = useState(false);

  if (open)
    return (
      <TestDetail
        id={open}
        onBack={() => {
          setOpen(null);
          state.reload();
        }}
      />
    );

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p className="note" style={{ margin: 0 }}>MCQ and numeric tests for this batch. Publish to open them on students' dashboards, or share the link.</p>
        <button type="button" className="btn" onClick={() => setCreate(true)}>
          <Plus className="h-4 w-4" /> New test
        </button>
      </div>
      <Loading state={state}>
        {(p) =>
          !p.items?.length ? (
            <Empty>No tests in this batch yet.</Empty>
          ) : (
            <>
              <div className="tablewrap">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Status</th>
                      <th>Questions</th>
                      <th>Duration</th>
                      <th>Window</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <button type="button" className="linkish" onClick={() => setOpen(t.id)} style={{ fontWeight: 600 }}>
                            {t.title}
                          </button>
                        </td>
                        <td>
                          <span className={`tag ${tagFor(t.status)}`}>{TEST_STATUS[t.status]}</span>
                        </td>
                        <td>
                          {t.questionCount} · {t.totalMarks} marks
                        </td>
                        <td>{t.durationMinutes} min</td>
                        <td style={{ fontSize: 13 }}>
                          {t.startsAt || t.endsAt ? `${t.startsAt ? fmtWhen(t.startsAt) : "now"} → ${t.endsAt ? fmtWhen(t.endsAt) : "open"}` : "Any time"}
                        </td>
                        <td>
                          <button type="button" className="btn ghost" style={{ padding: "6px 12px" }} onClick={() => setOpen(t.id)}>
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={p} onPage={setPage} />
            </>
          )
        }
      </Loading>
      {create && (
        <Modal title="New test" onClose={() => setCreate(false)} wide>
          <TestForm
            batch={batch}
            onSaved={(d) => {
              setCreate(false);
              setOpen(d.summary.id);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

const defaults = {
  title: "",
  description: "",
  instructions: "",
  durationMinutes: 30,
  maxAttempts: 1,
  startsAt: "",
  endsAt: "",
  access: "ENROLLED",
  shuffleQuestions: true,
  revealAnswers: true,
  rules: { questionsPerAttempt: "", shuffleOptions: true, passPercentage: 40, showLeaderboard: true, proctoring: false, maxViolations: 5 },
};

function TestForm({ batch, initial, onSaved }) {
  const editing = !!initial;
  const [f, setF] = useState(() =>
    initial
      ? {
          title: initial.summary.title,
          description: initial.description || "",
          instructions: initial.instructions || "",
          durationMinutes: initial.summary.durationMinutes,
          maxAttempts: initial.summary.maxAttempts,
          startsAt: toLocalInput(initial.summary.startsAt),
          endsAt: toLocalInput(initial.summary.endsAt),
          access: initial.summary.access,
          shuffleQuestions: initial.shuffleQuestions,
          revealAnswers: initial.revealAnswers,
          rules: {
            ...defaults.rules,
            ...Object.fromEntries(Object.entries(initial.rules || {}).map(([k, v]) => [k, v ?? ""])),
          },
        }
      : defaults,
  );
  const [picked, setPicked] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const setR = (k) => (e) => setF({ ...f, rules: { ...f.rules, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value } });
  const n = (v) => (v === "" || v === null || v === undefined ? undefined : Number(v));

  async function save(e) {
    e.preventDefault();
    const body = {
      title: f.title.trim(),
      description: f.description.trim() || undefined,
      instructions: f.instructions.trim() || undefined,
      durationMinutes: n(f.durationMinutes),
      maxAttempts: n(f.maxAttempts),
      startsAt: fromLocalInput(f.startsAt),
      endsAt: fromLocalInput(f.endsAt),
      access: f.access,
      shuffleQuestions: f.shuffleQuestions,
      revealAnswers: f.revealAnswers,
      rules: {
        questionsPerAttempt: n(f.rules.questionsPerAttempt),
        shuffleOptions: f.rules.shuffleOptions,
        passPercentage: n(f.rules.passPercentage),
        showLeaderboard: f.rules.showLeaderboard,
        proctoring: f.rules.proctoring,
        maxViolations: f.rules.proctoring ? n(f.rules.maxViolations) : undefined,
      },
    };
    if (body.startsAt && body.endsAt && body.endsAt <= body.startsAt) return setErr("The end time must be after the start time.");
    setBusy(true);
    const r = await act(setErr, () => (editing ? adminApi.updateTest(initial.summary.id, body) : adminApi.createTest({ ...body, templateId: batch.id, questionIds: picked.map((q) => q.id) })));
    setBusy(false);
    if (r) onSaved(r);
  }

  return (
    <form onSubmit={save}>
      <div className="two">
        <Field label="Title">
          <input className="inp" value={f.title} onChange={set("title")} required maxLength={200} placeholder="Aptitude Test 1" />
        </Field>
        <div className="two">
          <Field label="Minutes">
            <input className="inp" type="number" min="1" max="600" value={f.durationMinutes} onChange={set("durationMinutes")} required />
          </Field>
          <Field label="Attempts">
            <input className="inp" type="number" min="1" max="100" value={f.maxAttempts} onChange={set("maxAttempts")} required />
          </Field>
        </div>
        <Field label="Opens (optional)">
          <input className="inp" type="datetime-local" value={f.startsAt} onChange={set("startsAt")} />
        </Field>
        <Field label="Closes (optional)">
          <input className="inp" type="datetime-local" value={f.endsAt} onChange={set("endsAt")} />
        </Field>
      </div>
      <Field label="Who can take it">
        <select className="inp" value={f.access} onChange={set("access")}>
          <option value="ENROLLED">Only students in this batch</option>
          <option value="PUBLIC">Any signed-in student with the link</option>
        </select>
      </Field>
      <Field label="Description (optional)">
        <input className="inp" value={f.description} onChange={set("description")} maxLength={5000} />
      </Field>
      <Field label="Instructions shown before starting (optional)">
        <textarea className="inp" rows={2} value={f.instructions} onChange={set("instructions")} maxLength={10000} placeholder="Do not switch tabs." />
      </Field>

      <h4 style={{ margin: "20px 0 6px" }}>Rules</h4>
      <div className="three">
        <Field label="Pass mark %">
          <input className="inp" type="number" min="0" max="100" step="any" value={f.rules.passPercentage} onChange={setR("passPercentage")} />
        </Field>
        <Field label="Questions per attempt" hint="Random subset; empty = all">
          <input className="inp" type="number" min="1" max="500" value={f.rules.questionsPerAttempt} onChange={setR("questionsPerAttempt")} />
        </Field>
        {f.rules.proctoring && (
          <Field label="Warnings before auto-submit">
            <input className="inp" type="number" min="1" max="100" value={f.rules.maxViolations} onChange={setR("maxViolations")} />
          </Field>
        )}
      </div>
      <div className="row" style={{ gap: 18, marginTop: 12, flexWrap: "wrap", fontSize: 14 }}>
        {[
          ["shuffleQuestions", "Shuffle questions", f.shuffleQuestions, set],
          ["shuffleOptions", "Shuffle options", f.rules.shuffleOptions, setR],
          ["revealAnswers", "Show answers after submit", f.revealAnswers, set],
          ["showLeaderboard", "Leaderboard", f.rules.showLeaderboard, setR],
          ["proctoring", "Proctoring (full screen, tab-switch warnings)", f.rules.proctoring, setR],
        ].map(([k, label, v, h]) => (
          <label key={k} className="row" style={{ gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={!!v} onChange={h(k)} /> {label}
          </label>
        ))}
      </div>

      {!editing && (
        <>
          <h4 style={{ margin: "22px 0 8px" }}>Questions {picked.length ? `(${picked.length} picked, ${picked.reduce((s, q) => s + q.marks, 0)} marks)` : ""}</h4>
          <p className="note" style={{ marginTop: 0, fontSize: 13 }}>Pick from the question bank now, or add them (or bulk upload into this test) after creating it.</p>
          <QuestionPicker chosen={picked.map((q) => q.id)} onToggle={(q) => setPicked((p) => (p.some((x) => x.id === q.id) ? p.filter((x) => x.id !== q.id) : [...p, q]))} />
        </>
      )}
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 18 }} disabled={busy}>
        {busy ? "Saving…" : editing ? "Save settings" : "Create test as draft"}
      </button>
    </form>
  );
}

function TestDetail({ id, onBack }) {
  const state = useDs(() => adminApi.test(id), [id]);
  const [view, setView] = useState("questions");
  const [modal, setModal] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [bulk, setBulk] = useState(null);
  const [busy, setBusy] = useState(false);
  const d = state.data;
  const s = d?.summary;
  const run = async (fn, text) => (await act(setErr, fn, text)) !== undefined && state.reload();

  async function upload(file) {
    setBusy(true);
    const r = await act(setErr, () => adminApi.bulkQuestions(file, id));
    setBusy(false);
    if (r) {
      setBulk(r);
      state.reload();
    }
  }

  return (
    <div>
      <button type="button" className="linkish" onClick={onBack} style={{ display: "inline-flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
        <ArrowLeft className="h-4 w-4" /> All tests in this batch
      </button>
      <Loading state={state}>
        {() => (
          <>
            <div className="admin-top" style={{ marginTop: 0 }}>
              <div>
                <span className={`tag ${tagFor(s.status)}`}>{TEST_STATUS[s.status]}</span>
                <h3 style={{ fontSize: 22, marginTop: 6 }}>{s.title}</h3>
                <p className="note" style={{ marginTop: 4 }}>
                  {s.questionCount} questions · {s.totalMarks} marks · {s.durationMinutes} min · {s.maxAttempts} attempt{s.maxAttempts === 1 ? "" : "s"}
                  {d.rules?.proctoring ? " · proctored" : ""}
                  {d.rules?.passPercentage != null ? ` · pass ${pct(d.rules.passPercentage)}` : ""}
                </p>
              </div>
              <div className="row">
                {s.slug && (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => navigator.clipboard?.writeText(testLink(s.slug)).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
                  >
                    <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
                  </button>
                )}
                <button type="button" className="btn ghost" onClick={() => setModal("preview")}>
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <button type="button" className="btn ghost" onClick={() => setModal("edit")}>
                  <Pencil className="h-4 w-4" /> Edit test
                </button>
                {s.status === "DRAFT" && (
                  <button type="button" className="btn" onClick={() => run(() => adminApi.publishTest(id), "Publish this test? Students will see it on their dashboard.")}>
                    <Rocket className="h-4 w-4" /> Publish
                  </button>
                )}
                {s.status === "PUBLISHED" && (
                  <button type="button" className="btn ghost" onClick={() => run(() => adminApi.closeTest(id), "Close this test? No new attempts; results stay.")}>
                    <Lock className="h-4 w-4" /> Close
                  </button>
                )}
                <button
                  type="button"
                  className="ib"
                  title="Delete test"
                  onClick={async () => (await act(setErr, () => adminApi.deleteTest(id), "Delete this test? Only possible while nobody has attempted it.")) !== undefined && onBack()}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {s.slug && <p className="note" style={{ fontSize: 13, marginTop: 0 }}>Share link: {testLink(s.slug)}</p>}
            {err && <p className="note bad">{err}</p>}

            <div className="seg tabs" style={{ marginBottom: 14 }}>
              {[
                ["questions", "Questions"],
                ["results", "Results"],
                ["leaderboard", "Leaderboard"],
                ["analytics", "Question analytics"],
              ].map(([k, l]) => (
                <button key={k} type="button" className={view === k ? "on" : ""} onClick={() => setView(k)}>
                  {l}
                </button>
              ))}
            </div>

            {view === "questions" && (
              <>
                <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                  <button type="button" className="btn" onClick={() => setModal("add")}>
                    <Plus className="h-4 w-4" /> Add from bank
                  </button>
                  <FilePick onFile={upload} busy={busy} label="Bulk upload into this test" />
                </div>
                {bulk && (
                  <div className="panel" style={{ marginBottom: 12 }}>
                    <b>
                      Added {bulk.created} of {bulk.totalRows} questions to this test.
                    </b>
                    <RowErrors rows={bulk.failed} />
                  </div>
                )}
                {!d.questions.length ? (
                  <Empty>No questions yet. Add some before publishing.</Empty>
                ) : (
                  d.questions.map((q, i) => (
                    <div className="q" key={q.id}>
                      <div className="qmeta">
                        <b>Q{i + 1}</b>
                        <span className="tag">{QUESTION_TYPES[q.type]}</span>
                        <span className="tag free">+{q.marks}</span>
                        {q.negativeMarks > 0 && <span className="tag adv">−{q.negativeMarks}</span>}
                        <span style={{ flex: 1 }} />
                        <button type="button" className="ib" title="Remove from test" onClick={() => run(() => adminApi.removeTestQuestion(id, q.id), "Remove this question from the test? It stays in the bank.")}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="qtext small" style={{ whiteSpace: "pre-wrap" }}>{q.text}</div>
                      {q.options?.length > 0 && (
                        <ol type="A" style={{ margin: "6px 0 0 18px", fontSize: 14 }}>
                          {q.options.map((o, j) => (
                            <li key={j} className={q.correctOptions.includes(j) ? "ok" : ""}>
                              {o}
                            </li>
                          ))}
                        </ol>
                      )}
                      {q.type === "NUMERIC" && <div className="note ok">Answer: {answerText(q)}</div>}
                    </div>
                  ))
                )}
              </>
            )}
            {view === "results" && <Results id={id} />}
            {view === "leaderboard" && <AdminLeaderboard id={id} />}
            {view === "analytics" && <Analytics id={id} />}

            {modal === "edit" && (
              <Modal title="Test settings" onClose={() => setModal(null)} wide={760}>
                <p className="note" style={{ marginTop: 0, fontSize: 13 }}>Saving replaces all the rules with what's below.</p>
                <TestForm
                  initial={d}
                  onSaved={() => {
                    setModal(null);
                    state.reload();
                  }}
                />
              </Modal>
            )}
            {modal === "add" && (
              <AddQuestions
                existing={d.questions.map((q) => q.id)}
                onClose={() => setModal(null)}
                onAdd={async (ids) => {
                  const ok = (await act(setErr, () => adminApi.addTestQuestions(id, ids))) !== undefined;
                  setModal(null);
                  if (ok) state.reload();
                }}
              />
            )}
            {modal === "preview" && <Preview id={id} onClose={() => setModal(null)} />}
          </>
        )}
      </Loading>
    </div>
  );
}

function AddQuestions({ existing, onClose, onAdd }) {
  const [ids, setIds] = useState([]);
  return (
    <Modal title="Add questions from the bank" onClose={onClose} wide>
      <QuestionPicker chosen={ids} exclude={existing} onToggle={(q) => setIds((p) => (p.includes(q.id) ? p.filter((x) => x !== q.id) : [...p, q.id]))} />
      <button type="button" className="btn" style={{ marginTop: 14 }} disabled={!ids.length} onClick={() => onAdd(ids)}>
        Add {ids.length || ""} question{ids.length === 1 ? "" : "s"}
      </button>
    </Modal>
  );
}

function Preview({ id, onClose }) {
  const state = useDs(() => adminApi.previewTest(id), [id]);
  return (
    <Modal title="Preview: what students see" onClose={onClose} wide>
      <Loading state={state}>
        {(p) => (
          <>
            <p className="note" style={{ marginTop: 0 }}>
              {p.durationMinutes} min · {p.totalMarks} marks
            </p>
            {p.instructions && <div className="explain" style={{ whiteSpace: "pre-wrap" }}>{p.instructions}</div>}
            {p.questions.map((q, i) => (
              <div className="q" key={q.id}>
                <div className="qmeta">
                  <b>Q{i + 1}</b>
                  <span className="tag">{QUESTION_TYPES[q.type]}</span>
                </div>
                <div className="qtext small">{q.text}</div>
                {q.options?.length > 0 && (
                  <ol type="A" style={{ margin: "6px 0 0 18px", fontSize: 14 }}>
                    {q.options.map((o, j) => (
                      <li key={j}>{o}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </>
        )}
      </Loading>
    </Modal>
  );
}

function Results({ id }) {
  const state = useDs(() => adminApi.results(id), [id]);
  const [attempt, setAttempt] = useState(null);
  const [err, setErr] = useState("");
  return (
    <Loading state={state}>
      {(r) => (
        <>
          <div className="kpis" style={{ marginTop: 0 }}>
            <div><b>{r.submitted}</b><span>Submitted ({r.attempts} attempts)</span></div>
            <div><b>{pct(r.averagePercentage)}</b><span>Average</span></div>
            <div><b>{pct(r.passRate)}</b><span>Pass rate</span></div>
            <div><b>{r.highestScore ?? "—"} / {r.lowestScore ?? "—"}</b><span>Highest / lowest marks</span></div>
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <button type="button" className="btn ghost" disabled={!r.rows.length} onClick={() => act(setErr, () => adminApi.exportResults(id))}>
              <Download className="h-4 w-4" /> Export to Excel
            </button>
          </div>
          {err && <p className="note bad">{err}</p>}
          {!r.rows.length ? (
            <Empty>No attempts yet.</Empty>
          ) : (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Reg no</th>
                    <th>#</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Result</th>
                    <th>Warnings</th>
                    <th>Submitted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((row) => (
                    <tr key={row.attemptId}>
                      <td>{row.studentName}</td>
                      <td>{row.regNo || "—"}</td>
                      <td>{row.attemptNumber}</td>
                      <td>{row.status === "SUBMITTED" ? `${row.score} / ${row.maxScore}` : "In progress"}</td>
                      <td>{pct(row.percentage)}</td>
                      <td>{row.passed == null ? "—" : row.passed ? <span className="ok">Pass</span> : <span className="bad">Fail</span>}</td>
                      <td>
                        {row.violationCount || 0}
                        {row.autoSubmitReason && <small className="bad" style={{ display: "block" }}>auto-submitted</small>}
                      </td>
                      <td style={{ fontSize: 13 }}>{fmtWhen(row.submittedAt)}</td>
                      <td>
                        <button type="button" className="linkish" onClick={() => setAttempt(row.attemptId)}>
                          Answers
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {attempt && <AttemptDetail id={attempt} onClose={() => setAttempt(null)} />}
        </>
      )}
    </Loading>
  );
}

function AttemptDetail({ id, onClose }) {
  const state = useDs(() => adminApi.attempt(id), [id]);
  const letter = (j) => String.fromCharCode(65 + j);
  return (
    <Modal title="Attempt" onClose={onClose} wide>
      <Loading state={state}>
        {(a) => (
          <>
            <p className="note" style={{ marginTop: 0 }}>
              {a.studentName} · attempt {a.attemptNumber} · {a.score ?? 0}/{a.maxScore ?? "—"} ({pct(a.percentage)}) · {a.violationCount} warnings
              {a.autoSubmitReason ? ` · auto-submitted: ${a.autoSubmitReason}` : ""}
            </p>
            {(a.questions || []).map((q, i) => (
              <div className={`q review ${q.correct ? "good" : q.selected?.length || q.numericValue != null ? "wrong" : ""}`} key={q.questionId}>
                <div className="qmeta">
                  <b>Q{i + 1}</b>
                  <span style={{ flex: 1 }} />
                  <b>{q.marksAwarded ?? 0}</b>
                </div>
                <div className="qtext small">{q.text}</div>
                <div className="note">
                  Answer: {q.type === "NUMERIC" ? (q.numericValue ?? "—") : q.selected?.length ? q.selected.map(letter).join(", ") : "—"}
                  {" · correct: "}
                  {q.type === "NUMERIC" ? q.numericAnswer : (q.correctOptions || []).map(letter).join(", ")}
                </div>
              </div>
            ))}
          </>
        )}
      </Loading>
    </Modal>
  );
}

function AdminLeaderboard({ id }) {
  const state = useDs(() => adminApi.leaderboard(id, 100), [id]);
  return (
    <Loading state={state}>
      {(b) =>
        !b.top?.length ? (
          <Empty>No submitted attempts yet.</Empty>
        ) : (
          <div className="tablewrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>
                    <Trophy className="h-4 w-4" />
                  </th>
                  <th>Student</th>
                  <th>Reg no</th>
                  <th>Score</th>
                  <th>%</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {b.top.map((e) => (
                  <tr key={e.studentId}>
                    <td>#{e.rank}</td>
                    <td>{e.studentName}</td>
                    <td>{e.regNo || "—"}</td>
                    <td>
                      {e.score} / {e.maxScore}
                    </td>
                    <td>{pct(e.percentage)}</td>
                    <td>{e.timeTakenSeconds != null ? `${Math.floor(e.timeTakenSeconds / 60)}m ${e.timeTakenSeconds % 60}s` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </Loading>
  );
}

function Analytics({ id }) {
  const state = useDs(() => adminApi.analytics(id), [id]);
  const letter = (j) => String.fromCharCode(65 + j);
  return (
    <Loading state={state}>
      {(a) => (
        <>
          <div className="kpis" style={{ marginTop: 0 }}>
            <div><b>{a.candidates}</b><span>Candidates</span></div>
            <div><b>{pct(a.averagePercentage)} / {pct(a.medianPercentage)}</b><span>Average / median</span></div>
            <div><b>{a.averageTimeMinutes != null ? `${Math.round(a.averageTimeMinutes)} min` : "—"}</b><span>Average time</span></div>
            <div><b>{a.averageViolations ?? "—"}</b><span>Average warnings</span></div>
          </div>
          {a.distribution?.length > 0 && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <b style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <BarChart3 className="h-4 w-4" /> Score distribution
              </b>
              {(() => {
                const max = Math.max(1, ...a.distribution.map((x) => x.count));
                return a.distribution.map((x) => (
                  <div key={x.range} style={{ display: "grid", gridTemplateColumns: "80px 1fr 36px", gap: 10, alignItems: "center", marginTop: 8, fontSize: 13 }}>
                    <span>{x.range}</span>
                    <div className="bar2" style={{ margin: 0 }}>
                      <b style={{ width: `${(x.count / max) * 100}%` }} />
                    </div>
                    <span style={{ textAlign: "right" }}>{x.count}</span>
                  </div>
                ));
              })()}
            </div>
          )}
          {!a.questions?.length ? (
            <Empty>Analytics appear once students submit.</Empty>
          ) : (
            a.questions.map((q, i) => (
              <div className="q" key={q.questionId}>
                <div className="qmeta">
                  <b>Q{i + 1}</b>
                  <span className="tag">{QUESTION_TYPES[q.type]}</span>
                  <span style={{ flex: 1 }} />
                  <b className={q.correctRate >= 60 ? "ok" : q.correctRate < 30 ? "bad" : ""}>{pct(q.correctRate)} correct</b>
                </div>
                <div className="qtext small">{q.text}</div>
                <p className="note" style={{ fontSize: 13 }}>
                  Shown {q.timesShown} · attempted {q.attempted} · skipped {q.skipped}
                  {q.mostPickedWrongOption != null && <span className="bad"> · misleading option: {letter(q.mostPickedWrongOption)}</span>}
                </p>
                {q.options?.length > 0 && (
                  <div style={{ display: "grid", gap: 4 }}>
                    {q.options.map((o, j) => {
                      const picks = q.optionPicks?.[j] || 0;
                      const share = q.attempted ? (picks / q.attempted) * 100 : 0;
                      return (
                        <div key={j} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px 40px", gap: 10, alignItems: "center", fontSize: 13 }}>
                          <span className={q.correctOptions?.includes(j) ? "ok" : ""}>
                            {letter(j)}. {o}
                          </span>
                          <div className="bar2" style={{ margin: 0 }}>
                            <b style={{ width: `${share}%` }} />
                          </div>
                          <span style={{ textAlign: "right" }}>{picks}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </Loading>
  );
}
