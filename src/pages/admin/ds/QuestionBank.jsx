import { useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { DIFFICULTIES, QUESTION_TYPES, adminApi, downloadSheetTemplate } from "../../../lib/dataService";
import { Field, SectionTop } from "../shared";
import { Empty, FilePick, Loading, Modal, Pager, RowErrors, act, useDs } from "./common";

const letter = (j) => String.fromCharCode(65 + j);
const blank = { type: "SINGLE", text: "", options: ["", "", "", ""], correctOptions: [], numericAnswer: "", tolerance: "", marks: 1, negativeMarks: 0, difficulty: "EASY", tags: "", explanation: "" };

/** Short one-line answer summary for lists. */
export function answerText(q) {
  if (q.type === "NUMERIC") return `${q.numericAnswer}${q.tolerance ? ` ± ${q.tolerance}` : ""}`;
  return (q.correctOptions || []).map(letter).join(", ");
}

export default function QuestionBank() {
  const [filters, setFilters] = useState({ type: "", difficulty: "", tag: "", q: "", page: 0 });
  const state = useDs(() => adminApi.questions({ ...filters, size: 20 }), [filters]);
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState("");
  const [bulk, setBulk] = useState(null);
  const [busy, setBusy] = useState(false);
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value, page: 0 });

  async function upload(file) {
    setBusy(true);
    const r = await act(setErr, () => adminApi.bulkQuestions(file));
    setBusy(false);
    if (r) {
      setBulk(r);
      state.reload();
    }
  }

  return (
    <div>
      <SectionTop title="Question bank" text="Single correct, multiple correct and numeric questions. Add them to any test; questions that students already answered are locked.">
        <button type="button" className="btn" onClick={() => setEdit(blank)}>
          <Plus className="h-4 w-4" /> New question
        </button>
        <FilePick onFile={upload} busy={busy} label="Bulk upload" />
        <button type="button" className="btn ghost" onClick={() => act(setErr, () => downloadSheetTemplate("questions"))}>
          <Download className="h-4 w-4" /> Template
        </button>
      </SectionTop>
      {err && <p className="note bad">{err}</p>}
      {bulk && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <b>
            Added {bulk.created} of {bulk.totalRows} question{bulk.totalRows === 1 ? "" : "s"}.
          </b>
          <RowErrors rows={bulk.failed} />
          <button type="button" className="linkish" style={{ marginTop: 8 }} onClick={() => setBulk(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input className="inp" style={{ flex: "2 1 220px" }} placeholder="Search question text" value={filters.q} onChange={setF("q")} />
        <select className="inp" style={{ flex: "1 1 150px" }} value={filters.type} onChange={setF("type")} aria-label="Type">
          <option value="">All types</option>
          {Object.entries(QUESTION_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="inp" style={{ flex: "1 1 130px" }} value={filters.difficulty} onChange={setF("difficulty")} aria-label="Difficulty">
          <option value="">Any difficulty</option>
          {Object.entries(DIFFICULTIES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input className="inp" style={{ flex: "1 1 130px" }} placeholder="Tag" value={filters.tag} onChange={setF("tag")} />
      </div>

      <Loading state={state}>
        {(page) =>
          !page.items?.length ? (
            <Empty>No questions match. Create one or bulk upload the Excel template.</Empty>
          ) : (
            <>
              <div className="tablewrap">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Type</th>
                      <th>Answer</th>
                      <th>Marks</th>
                      <th>Level</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((q) => (
                      <tr key={q.id}>
                        <td style={{ maxWidth: 420 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{q.text}</div>
                          {q.tags?.length > 0 && <small className="note" style={{ margin: 0 }}>{q.tags.join(", ")}</small>}
                        </td>
                        <td>{QUESTION_TYPES[q.type]}</td>
                        <td>{answerText(q)}</td>
                        <td>
                          +{q.marks}
                          {q.negativeMarks ? ` / −${q.negativeMarks}` : ""}
                        </td>
                        <td>{DIFFICULTIES[q.difficulty] || "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button type="button" className="ib" title="Edit" onClick={() => setEdit(q)}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="ib"
                            title="Delete"
                            onClick={async () => (await act(setErr, () => adminApi.deleteQuestion(q.id), "Delete this question? Questions used in a test can't be deleted.")) !== undefined && state.reload()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={page} onPage={(p) => setFilters({ ...filters, page: p })} />
            </>
          )
        }
      </Loading>

      {edit && (
        <Modal title={edit.id ? "Edit question" : "New question"} onClose={() => setEdit(null)} wide={720}>
          <QuestionForm
            initial={edit}
            onSaved={() => {
              setEdit(null);
              state.reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export function QuestionForm({ initial, onSaved }) {
  const [f, setF] = useState(() => ({
    ...blank,
    ...initial,
    options: initial.options?.length ? [...initial.options] : blank.options,
    correctOptions: initial.correctOptions || [],
    numericAnswer: initial.numericAnswer ?? "",
    tolerance: initial.tolerance ?? "",
    tags: Array.isArray(initial.tags) ? initial.tags.join(", ") : initial.tags || "",
    explanation: initial.explanation || "",
  }));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const mcq = f.type !== "NUMERIC";

  function toggleCorrect(j) {
    if (f.type === "SINGLE") return setF({ ...f, correctOptions: [j] });
    const on = f.correctOptions.includes(j);
    setF({ ...f, correctOptions: on ? f.correctOptions.filter((x) => x !== j) : [...f.correctOptions, j].sort((a, b) => a - b) });
  }
  function removeOption(j) {
    setF({
      ...f,
      options: f.options.filter((_, i) => i !== j),
      correctOptions: f.correctOptions.filter((x) => x !== j).map((x) => (x > j ? x - 1 : x)),
    });
  }

  async function save(e) {
    e.preventDefault();
    setErr("");
    const options = f.options.map((o) => o.trim());
    if (mcq && options.some((o) => !o)) return setErr("Fill in every option or remove the empty ones.");
    if (mcq && !f.correctOptions.length) return setErr("Mark the correct option.");
    if (!mcq && f.numericAnswer === "") return setErr("Enter the numeric answer.");
    const body = {
      type: f.type,
      text: f.text.trim(),
      options: mcq ? options : undefined,
      correctOptions: mcq ? (f.type === "SINGLE" ? f.correctOptions.slice(0, 1) : f.correctOptions) : undefined,
      numericAnswer: mcq ? undefined : Number(f.numericAnswer),
      tolerance: mcq || f.tolerance === "" ? undefined : Number(f.tolerance),
      marks: Number(f.marks) || 1,
      negativeMarks: Number(f.negativeMarks) || 0,
      difficulty: f.difficulty || undefined,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      explanation: f.explanation.trim() || undefined,
    };
    setBusy(true);
    const r = await act(setErr, () => (initial.id ? adminApi.updateQuestion(initial.id, body) : adminApi.createQuestion(body)));
    setBusy(false);
    if (r) onSaved(r);
  }

  return (
    <form onSubmit={save}>
      <div className="three">
        <Field label="Type">
          <select className="inp" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, correctOptions: e.target.value === "SINGLE" ? f.correctOptions.slice(0, 1) : f.correctOptions })}>
            {Object.entries(QUESTION_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Marks / negative">
          <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
            <input className="inp" type="number" min="0.25" step="any" value={f.marks} onChange={set("marks")} required aria-label="Marks" />
            <input className="inp" type="number" min="0" step="any" value={f.negativeMarks} onChange={set("negativeMarks")} aria-label="Negative marks" />
          </div>
        </Field>
        <Field label="Difficulty">
          <select className="inp" value={f.difficulty} onChange={set("difficulty")}>
            {Object.entries(DIFFICULTIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Question">
        <textarea className="inp" rows={3} value={f.text} onChange={set("text")} required maxLength={10000} />
      </Field>
      {mcq ? (
        <>
          <label className="l">Options · tick the correct {f.type === "SINGLE" ? "one" : "ones"}</label>
          {f.options.map((o, j) => (
            <div className="row" key={j} style={{ gap: 8, marginBottom: 6, flexWrap: "nowrap", alignItems: "center" }}>
              <input
                type={f.type === "SINGLE" ? "radio" : "checkbox"}
                name="correct"
                checked={f.correctOptions.includes(j)}
                onChange={() => toggleCorrect(j)}
                aria-label={`Option ${letter(j)} is correct`}
              />
              <b style={{ width: 18 }}>{letter(j)}</b>
              <input className="inp" value={o} onChange={(e) => setF({ ...f, options: f.options.map((x, i) => (i === j ? e.target.value : x)) })} maxLength={2000} />
              <button type="button" className="ib" title="Remove option" disabled={f.options.length <= 2} onClick={() => removeOption(j)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {f.options.length < 10 && (
            <button type="button" className="linkish" onClick={() => setF({ ...f, options: [...f.options, ""] })}>
              + Add option
            </button>
          )}
        </>
      ) : (
        <div className="two">
          <Field label="Answer">
            <input className="inp" type="number" step="any" value={f.numericAnswer} onChange={set("numericAnswer")} required />
          </Field>
          <Field label="Tolerance (optional)" hint="Accepts answers within ± this value.">
            <input className="inp" type="number" min="0" step="any" value={f.tolerance} onChange={set("tolerance")} />
          </Field>
        </div>
      )}
      <Field label="Tags (comma separated)">
        <input className="inp" value={f.tags} onChange={set("tags")} placeholder="dsa, arrays" />
      </Field>
      <Field label="Explanation (shown after the test when answers are revealed)">
        <textarea className="inp" rows={2} value={f.explanation} onChange={set("explanation")} maxLength={10000} />
      </Field>
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 16 }} disabled={busy}>
        {busy ? "Saving…" : initial.id ? "Save changes" : "Create question"}
      </button>
    </form>
  );
}

/** Checkbox list over the bank, used when building a test. */
export function QuestionPicker({ chosen, onToggle, exclude = [] }) {
  const [filters, setFilters] = useState({ q: "", type: "", page: 0 });
  const state = useDs(() => adminApi.questions({ ...filters, size: 15 }), [filters]);
  return (
    <div>
      <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input className="inp" style={{ flex: "2 1 200px" }} placeholder="Search the question bank" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 0 })} />
        <select className="inp" style={{ flex: "1 1 140px" }} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 0 })} aria-label="Type">
          <option value="">All types</option>
          {Object.entries(QUESTION_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <Loading state={state}>
        {(page) =>
          !page.items?.length ? (
            <Empty>No questions found. Add some in the Question bank tab first.</Empty>
          ) : (
            <>
              <div style={{ display: "grid", gap: 6 }}>
                {page.items
                  .filter((q) => !exclude.includes(q.id))
                  .map((q) => (
                    <label key={q.id} className={`choice ${chosen.includes(q.id) ? "on" : ""}`} style={{ alignItems: "flex-start" }}>
                      <input type="checkbox" checked={chosen.includes(q.id)} onChange={() => onToggle(q)} />
                      <span className="otext">
                        {q.text}
                        <small className="note" style={{ display: "block", margin: "2px 0 0" }}>
                          {QUESTION_TYPES[q.type]} · +{q.marks} · {DIFFICULTIES[q.difficulty] || "—"} · answer {answerText(q)}
                        </small>
                      </span>
                    </label>
                  ))}
              </div>
              <Pager page={page} onPage={(p) => setFilters({ ...filters, page: p })} />
            </>
          )
        }
      </Loading>
    </div>
  );
}
