import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { explainResult } from "../lib/compiler";

/** Program output with a plain-language verdict (compile error, runtime error, time limit). */
export default function RunOutput({ result, language }) {
  const v = explainResult(result, language);
  const Icon = v.kind === "ok" ? CheckCircle2 : v.kind === "timeout" ? Clock : AlertTriangle;
  return (
    <div className="run-out">
      <div className={`verdict ${v.kind === "ok" ? "good" : "bad"}`}>
        <Icon className="h-5 w-5" />
        <div>
          <b>
            {v.title}
            {v.line ? ` on line ${v.line}` : ""}
          </b>
          {v.detail && v.kind !== "ok" && <span> {v.detail}</span>}
        </div>
        <small>
          {typeof result.exitCode === "number" ? `Exit code ${result.exitCode}` : ""}
          {typeof result.executionTimeMs === "number" ? ` · ${result.executionTimeMs} ms` : ""}
          {result.runner === "browser" ? " · ran in your browser" : result.runner === "backup" ? " · backup runner" : ""}
        </small>
      </div>
      <pre className="out">
        {result.stdout ? <span>{result.stdout}</span> : null}
        {result.stderr ? <span className="text-rose-500">{result.stderr}</span> : null}
        {result.error && !result.stderr ? <span className="text-rose-500">{result.error}</span> : null}
        {!result.stdout && !result.stderr && !result.error ? <span style={{ color: "var(--color-fg-faint)" }}>(no output)</span> : null}
      </pre>
    </div>
  );
}
