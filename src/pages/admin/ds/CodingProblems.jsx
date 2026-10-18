import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, Download, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { fmtWhen } from "../../../lib/dataService";
import { deleteProblem, downloadServerExport, exportProblems, guessTitle, isLocalOnly, listProblems, localProblems, moveLocalToServer, saveProblem } from "../../../lib/codingProblems";
import { Field, SectionTop } from "../shared";
import { Empty, Loading, Modal, act, useDs } from "./common";

/**
 * Coding problems pasted in by trainers, each opening in the code room (problem | compiler |
 * test cases). Trainers see and export their own; super admins see everyone's.
 */
export default function CodingProblems({ me }) {
  const nav = useNavigate();
  const isSuper = me?.role === "SUPERADMIN";
  const [q, setQ] = useState("");
  const [trainer, setTrainer] = useState("");
  const state = useDs(() => listProblems({ q: q.trim() || undefined }), [q]);
  const [modal, setModal] = useState(null); // null | {} (new) | problem (edit)
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const list = useMemo(() => state.data || [], [state.data]);
  const trainers = useMemo(() => [...new Set(list.map((p) => p.createdByName).filter(Boolean))].sort(), [list]);
  const shown = trainer ? list.filter((p) => p.createdByName === trainer) : list;
  // Problems still in this browser while the server can store them: offer to move them.
  const stranded = !isLocalOnly() && state.data ? localProblems() : [];

  async function move() {
    const n = await act(setErr, moveLocalToServer);
    if (n !== undefined) {
      setMsg(`Moved ${n} problem${n === 1 ? "" : "s"} to your account.`);
      state.reload();
    }
  }

  return (
    <div>
      <SectionTop
        title="Coding problems"
        text={
          isSuper
            ? "Problems trainers pasted in to solve in the compiler. Filter by trainer and export to Excel."
            : "Paste a coding problem to solve it in the compiler, with your own test cases. Export your list to Excel any time."
        }
      >
        <button type="button" className="btn" onClick={() => setModal({})}>
          <Plus className="h-4 w-4" /> Add coding problem
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={!shown.length}
          onClick={() =>
            act(setErr, () =>
              exportProblems(shown, {
                withTrainer: isSuper,
                fileName: `anobyt-coding-problems-${(trainer || (isSuper ? "all" : me?.name || "mine")).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.xlsx`,
              }),
            )
          }
        >
          <Download className="h-4 w-4" /> Export to Excel
        </button>
        {state.data && !isLocalOnly() && (
          <button
            type="button"
            className="btn ghost"
            title={trainer ? `The server's export of ${trainer}'s problems` : "The server's export of every problem you can see"}
            onClick={() => act(setErr, () => downloadServerExport(trainer ? list.find((p) => p.createdByName === trainer)?.createdById : undefined))}
          >
            <Download className="h-4 w-4" /> Server export
          </button>
        )}
      </SectionTop>

      <div className="row" style={{ gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input className="inp" style={{ flex: "1 1 240px" }} placeholder="Search problems" value={q} onChange={(e) => setQ(e.target.value)} />
        {isSuper && trainers.length > 0 && (
          <select className="inp" style={{ width: "auto" }} value={trainer} onChange={(e) => setTrainer(e.target.value)} aria-label="Trainer">
            <option value="">All trainers</option>
            {trainers.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>
      {isLocalOnly() && (
        <p className="note" style={{ fontSize: 13 }}>
          The data service can't store coding problems yet, so these are saved in this browser only. Once it can, you'll get a button here to move them to your account.
        </p>
      )}
      {stranded.length > 0 && (
        <div className="panel" style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ flex: 1, minWidth: 220 }}>
            {stranded.length} problem{stranded.length === 1 ? " is" : "s are"} saved only in this browser.
          </span>
          <button type="button" className="btn" onClick={move}>
            <UploadCloud className="h-4 w-4" /> Move to my account
          </button>
        </div>
      )}
      {err && <p className="note bad">{err}</p>}
      {msg && <p className="note ok">{msg}</p>}

      <Loading state={state}>
        {() =>
          !shown.length ? (
            <Empty>{q || trainer ? "No problems match." : "No coding problems yet. Add one: paste the problem, and it opens next to the compiler."}</Empty>
          ) : (
            <div className="cards">
              {shown.map((p) => (
                <div className="card" key={p.id}>
                  <div className="meta">
                    <span className="tag">
                      {p.tests?.length || 0} test case{p.tests?.length === 1 ? "" : "s"}
                    </span>
                    <small>{fmtWhen(p.updatedAt)}</small>
                  </div>
                  <h3 style={{ marginTop: 10 }}>{p.title}</h3>
                  {isSuper && p.createdByName && <p className="note" style={{ fontSize: 13, margin: "2px 0 0" }}>By {p.createdByName}</p>}
                  <p className="note" style={{ fontSize: 13, margin: "6px 0 12px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.statement}
                  </p>
                  <div className="row" style={{ gap: 8 }}>
                    <button type="button" className="btn" style={{ padding: "6px 12px" }} onClick={() => nav(`/code-room/${p.id}`)}>
                      <Code2 className="h-4 w-4" /> Open
                    </button>
                    <button type="button" className="ib" title="Edit problem" onClick={() => setModal(p)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="ib"
                      title="Delete"
                      onClick={async () => {
                        if ((await act(setErr, () => deleteProblem(p), `Delete "${p.title}" and its test cases?`)) !== undefined || p.local) state.reload();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Loading>

      {modal && (
        <Modal title={modal.id ? "Edit coding problem" : "Add coding problem"} onClose={() => setModal(null)} wide={760}>
          <ProblemForm
            initial={modal}
            onSaved={(p) => {
              setModal(null);
              state.reload();
              if (!modal.id) nav(`/code-room/${p.id}`);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/** Title + pasted statement, plus one optional sample test case for a new problem. */
export function ProblemForm({ initial, onSaved }) {
  const editing = !!initial?.id;
  const [f, setF] = useState({ title: initial?.title || "", statement: initial?.statement || "", input: "", expected: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!f.statement.trim()) return setErr("Paste the problem first.");
    const tests = editing ? initial.tests : f.input.trim() || f.expected.trim() ? [{ input: f.input, expected: f.expected }] : [];
    setBusy(true);
    const r = await act(setErr, () => saveProblem({ ...initial, title: f.title.trim() || guessTitle(f.statement), statement: f.statement.trim(), tests }));
    setBusy(false);
    if (r) onSaved(r);
  }

  return (
    <form onSubmit={submit}>
      <Field label="Title (optional)">
        <input className="inp" value={f.title} onChange={set("title")} maxLength={120} placeholder="Taken from the first line if left empty" />
      </Field>
      <Field label="Problem" hint="Paste the whole problem: statement, input and output format, constraints and examples. Blank lines make paragraphs; ``` fences a code block.">
        <textarea className="inp" rows={14} value={f.statement} onChange={set("statement")} placeholder="Given an array of n integers, print the maximum subarray sum…" autoFocus required maxLength={20000} />
      </Field>
      {!editing && (
        <div className="two">
          <Field label="Sample input (optional)">
            <textarea className="inp code" rows={3} value={f.input} onChange={set("input")} spellCheck={false} />
          </Field>
          <Field label="Expected output (optional)">
            <textarea className="inp code" rows={3} value={f.expected} onChange={set("expected")} spellCheck={false} />
          </Field>
        </div>
      )}
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 16 }} disabled={busy}>
        {busy ? "Saving…" : editing ? "Save" : "Submit and open the compiler"}
      </button>
    </form>
  );
}
