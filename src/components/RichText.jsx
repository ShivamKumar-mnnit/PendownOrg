import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Renders admin-written text with a few simple conventions, without
 * allowing any HTML: blank lines separate paragraphs, "# " / "## " start
 * headings, "- " starts a bullet, "1. " a numbered item, "> " a tip box,
 * and ``` fences a code block (```python adds a label). Inline `code` and
 * **bold** work inside text, and plain https:// URLs become links.
 */
function Inline({ text }) {
  const parts = text.split(/(https?:\/\/[^\s)]+|`[^`\n]+`|\*\*[^*\n]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^https?:\/\//.test(p))
      return (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer">
          {p}
        </a>
      );
    if (/^`[^`]+`$/.test(p)) return <code key={i}>{p.slice(1, -1)}</code>;
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
    return p;
  });
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="codeblock">
      <div className="cb-bar">
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            })
          }
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}

const BLOCK_START = /^([-*] |\d+[.)] |#{1,3} |> |```)/;

export default function RichText({ text, className = "" }) {
  if (!text) return null;
  const blocks = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code = [];
      while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
      blocks.push(<CodeBlock key={i} lang={lang} code={code.join("\n")} />);
    } else if (/^#{1,3} /.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const H = level === 1 ? "h3" : "h4";
      blocks.push(
        <H key={i}>
          <Inline text={line.replace(/^#+ /, "")} />
        </H>,
      );
    } else if (/^[-*] /.test(line) || /^\d+[.)] /.test(line)) {
      const ordered = /^\d/.test(line);
      const re = ordered ? /^\d+[.)] / : /^[-*] /;
      const items = [line];
      while (i + 1 < lines.length && re.test(lines[i + 1])) items.push(lines[++i]);
      const L = ordered ? "ol" : "ul";
      blocks.push(
        <L key={i}>
          {items.map((x, j) => (
            <li key={j}>
              <Inline text={x.replace(re, "")} />
            </li>
          ))}
        </L>,
      );
    } else if (line.startsWith("> ")) {
      const quote = [line.slice(2)];
      while (i + 1 < lines.length && lines[i + 1].startsWith("> ")) quote.push(lines[++i].slice(2));
      blocks.push(
        <aside className="tip" key={i}>
          <Inline text={quote.join("\n")} />
        </aside>,
      );
    } else if (line.trim()) {
      const para = [line];
      while (i + 1 < lines.length && lines[i + 1].trim() && !BLOCK_START.test(lines[i + 1])) para.push(lines[++i]);
      blocks.push(
        <p key={i}>
          <Inline text={para.join("\n")} />
        </p>,
      );
    }
  }
  return <div className={`rich ${className}`}>{blocks}</div>;
}
