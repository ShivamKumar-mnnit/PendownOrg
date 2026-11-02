// Code editor languages: CodeMirror syntax support plus the starter code for each language.
// Kept apart from compiler.js because CodeMirror is large; only pages with an editor import this.

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
