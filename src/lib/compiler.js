// Central place for everything related to the online code compiler.
// Requests go through our own `/api/compile` (a Netlify function in
// production, a Vite dev-middleware locally — see compileHandler.js) rather
// than the hosted compile service directly: that service doesn't send
// CORS headers, so a browser can't call it cross-origin at all.

import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

export const LANGUAGES = [
  {
    id: "python",
    label: "Python",
    extension: python,
    boilerplate: `print("Hello, world!")\n`,
  },
  {
    id: "javascript",
    label: "JavaScript",
    extension: javascript,
    boilerplate: `console.log("Hello, world!");\n`,
  },
  {
    id: "java",
    label: "Java",
    extension: java,
    boilerplate: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}\n`,
  },
  {
    id: "c",
    label: "C",
    extension: cpp, // C shares C-family highlighting with C++
    boilerplate: `#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}\n`,
  },
  {
    id: "cpp",
    label: "C++",
    extension: cpp,
    boilerplate: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}\n`,
  },
];

export function getLanguage(id) {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
}

/**
 * Run code against the hosted compile service.
 * @returns {Promise<{status: "SUCCESS"|"ERROR", stdout: string, stderr: string, exitCode: number, executionTimeMs: number}>}
 */
export async function runCode({ language, code, stdin }) {
  const res = await fetch("/api/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code, stdin: stdin || "" }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Compile service returned ${res.status}`);
  }

  return data;
}
