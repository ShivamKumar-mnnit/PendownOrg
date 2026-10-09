/**
 * Renders admin-written text with a few simple conventions, without
 * allowing any HTML: blank lines separate paragraphs, "# " / "## " start
 * headings, "- " starts a bullet, and ``` fences a code block. Links
 * written as plain https:// URLs become clickable.
 */
function Inline({ text }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={i} href={p} target="_blank" rel="noopener noreferrer">
        {p}
      </a>
    ) : (
      p
    ),
  );
}

export default function RichText({ text, className = "" }) {
  if (!text) return null;
  const blocks = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code = [];
      while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
      blocks.push(<pre key={i}>{code.join("\n")}</pre>);
    } else if (/^#{1,3} /.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const H = level === 1 ? "h3" : "h4";
      blocks.push(<H key={i}><Inline text={line.replace(/^#+ /, "")} /></H>);
    } else if (/^[-*] /.test(line)) {
      const items = [line];
      while (i + 1 < lines.length && /^[-*] /.test(lines[i + 1])) items.push(lines[++i]);
      blocks.push(
        <ul key={i}>
          {items.map((x, j) => (
            <li key={j}>
              <Inline text={x.slice(2)} />
            </li>
          ))}
        </ul>,
      );
    } else if (line.trim()) {
      const para = [line];
      while (i + 1 < lines.length && lines[i + 1].trim() && !/^([-*] |#{1,3} |```)/.test(lines[i + 1])) para.push(lines[++i]);
      blocks.push(
        <p key={i}>
          <Inline text={para.join("\n")} />
        </p>,
      );
    }
  }
  return <div className={`rich ${className}`}>{blocks}</div>;
}
