// Java, C and C++ for "function" practice problems. The problem bank is
// written as untyped JavaScript functions, so each problem's signature is
// worked out from its test cases (every value is an int, a boolean, a string,
// an int / string array, an int grid or a linked list). From that we build a
// LeetCode-style starter for each language, and a harness that wraps the
// student's code, calls it once per test with the inputs written as literals,
// and prints each result as a "@@R <json>" line (or "@@E <error>"), the same
// protocol as the Python harness. The harness runs on our code runner
// (/api/compile -> api.anobyt.in).

export const TYPED_LANGS = ["java", "cpp", "c"];

const typeOf = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return "bool";
  if (typeof v === "number") return "int";
  if (typeof v === "string") return "str";
  if (Array.isArray(v)) {
    const inner = v.map(typeOf).find(Boolean);
    if (!inner) return "int[]?"; // empty: decided by the other tests
    if (inner === "int") return "int[]";
    if (inner === "str") return "str[]";
    if (inner === "int[]" || inner === "int[]?") return "int[][]";
  }
  return "unknown";
};

function merge(types) {
  const known = types.filter((t) => t && t !== "int[]?");
  if (!known.length) return types.includes("int[]?") ? "int[]" : "int";
  const uniq = [...new Set(known)];
  return uniq.length === 1 ? uniq[0] : "unknown";
}

/** { params: [{name, type}], ret } or null when the problem can't be typed. */
export function signatureOf(p) {
  const tests = p.tests || [];
  if (!tests.length) return null;
  const names = String(p.params || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const n = tests[0].args.length;
  const ll = new Set(p.ll || []);
  const params = [];
  for (let i = 0; i < n; i++) {
    const type = ll.has(i) ? "list" : merge(tests.map((t) => typeOf(t.args[i])));
    params.push({ name: safeName(names[i] || `arg${i + 1}`), type });
  }
  const ret = p.out ? "list" : merge(tests.map((t) => typeOf(t.expected)));
  if (ret === "unknown" || params.some((x) => x.type === "unknown")) return null;
  return { params, ret };
}

const RESERVED = new Set(["new", "char", "int", "long", "class", "default", "case", "do", "for", "if", "else", "return", "this", "string", "vector", "list", "main", "bool", "auto", "register", "union", "template", "operator", "delete", "short", "float", "double", "signed", "unsigned", "static", "final", "public", "private"]);
const safeName = (n) => (RESERVED.has(n) ? n + "_" : n);

// ---- Type names per language ----

const JAVA = { int: "int", bool: "boolean", str: "String", "int[]": "int[]", "str[]": "String[]", "int[][]": "int[][]", list: "ListNode" };
const CPP_RET = { int: "int", bool: "bool", str: "string", "int[]": "vector<int>", "str[]": "vector<string>", "int[][]": "vector<vector<int>>", list: "ListNode*" };
const CPP_ARG = { int: "int", bool: "bool", str: "string", "int[]": "vector<int>&", "str[]": "vector<string>&", "int[][]": "vector<vector<int>>&", list: "ListNode*" };

function cParams(params) {
  return params.flatMap(({ name, type }) => {
    if (type === "int") return [`int ${name}`];
    if (type === "bool") return [`bool ${name}`];
    if (type === "str") return [`char* ${name}`];
    if (type === "int[]") return [`int* ${name}`, `int ${name}Size`];
    if (type === "str[]") return [`char** ${name}`, `int ${name}Size`];
    if (type === "int[][]") return [`int** ${name}`, `int ${name}Size`, `int* ${name}ColSize`];
    return [`struct ListNode* ${name}`];
  });
}
const C_RET = { int: "int", bool: "bool", str: "char*", "int[]": "int*", "str[]": "char**", "int[][]": "int**", list: "struct ListNode*" };
const cExtra = (ret) => (ret === "int[]" || ret === "str[]" ? ["int* returnSize"] : ret === "int[][]" ? ["int* returnSize", "int** returnColumnSizes"] : []);

const LIST_NOTE = {
  java: "// class ListNode { int val; ListNode next; ListNode(int val) { this.val = val; } }",
  cpp: "// struct ListNode { int val; ListNode* next; ListNode(int x) : val(x), next(nullptr) {} };",
  c: "// struct ListNode { int val; struct ListNode* next; };",
};

/** Starter code with the right signature, or "" when the problem can't be typed. */
export function typedStarter(p, lang) {
  const sig = signatureOf(p);
  if (!sig) return "";
  const usesList = sig.ret === "list" || sig.params.some((x) => x.type === "list");
  const note = usesList ? LIST_NOTE[lang] + "\n" : "";
  if (lang === "java") {
    const ps = sig.params.map((x) => `${JAVA[x.type]} ${x.name}`).join(", ");
    return `${note}class Solution {\n    public ${JAVA[sig.ret]} ${p.fn}(${ps}) {\n        // write your solution here\n        \n    }\n}\n`;
  }
  if (lang === "cpp") {
    const ps = sig.params.map((x) => `${CPP_ARG[x.type]} ${x.name}`).join(", ");
    return `${note}class Solution {\npublic:\n    ${CPP_RET[sig.ret]} ${p.fn}(${ps}) {\n        // write your solution here\n        \n    }\n};\n`;
  }
  const ps = [...cParams(sig.params), ...cExtra(sig.ret)].join(", ");
  const retNote =
    sig.ret === "int[]" || sig.ret === "str[]"
      ? "// Return a malloc'ed array and set *returnSize to its length.\n"
      : sig.ret === "int[][]"
        ? "// Return a malloc'ed array of rows; set *returnSize to the row count and\n// *returnColumnSizes to a malloc'ed array of row lengths.\n"
        : sig.ret === "str"
          ? "// Return a malloc'ed, null-terminated string.\n"
          : "";
  return `${note}${retNote}${C_RET[sig.ret]} ${p.fn}(${ps}) {\n    // write your solution here\n    \n}\n`;
}

// ---- Literals ----

const str = (s) => JSON.stringify(String(s)); // ASCII only in the bank: valid in Java, C and C++

function javaLit(v, type) {
  if (type === "int") return String(v);
  if (type === "bool") return String(v);
  if (type === "str") return str(v);
  if (type === "int[]") return `new int[]{${v.join(",")}}`;
  if (type === "str[]") return `new String[]{${v.map(str).join(",")}}`;
  if (type === "int[][]") return `new int[][]{${v.map((r) => `{${r.join(",")}}`).join(",")}}`;
  return `_L(new int[]{${v.join(",")}})`;
}

function cppLit(v, type) {
  if (type === "int" || type === "bool") return String(v);
  if (type === "str") return `string(${str(v)})`;
  if (type === "int[]") return `vector<int>{${v.join(",")}}`;
  if (type === "str[]") return `vector<string>{${v.map(str).join(",")}}`;
  if (type === "int[][]") return `vector<vector<int>>{${v.map((r) => `{${r.join(",")}}`).join(",")}}`;
  return `_L(vector<int>{${v.join(",")}})`;
}

/** C declarations for one argument; returns { decl, args } (args = what is passed to the function). */
function cArg(v, type, id) {
  if (type === "int" || type === "bool") return { decl: "", args: [String(v)] };
  if (type === "str") return { decl: `char ${id}[] = ${str(v)};`, args: [id] };
  if (type === "int[]") return { decl: `int ${id}[] = {${v.length ? v.join(",") : "0"}};`, args: [id, String(v.length)] };
  if (type === "str[]") {
    const rows = v.map((s, i) => `char ${id}_${i}[] = ${str(s)};`).join(" ");
    return { decl: `${rows} char* ${id}[] = {${v.length ? v.map((_, i) => `${id}_${i}`).join(",") : "0"}};`, args: [id, String(v.length)] };
  }
  if (type === "int[][]") {
    const rows = v.map((r, i) => `int ${id}_${i}[] = {${r.length ? r.join(",") : "0"}};`).join(" ");
    return {
      decl: `${rows} int* ${id}[] = {${v.length ? v.map((_, i) => `${id}_${i}`).join(",") : "0"}}; int ${id}c[] = {${v.length ? v.map((r) => r.length).join(",") : "0"}};`,
      args: [id, String(v.length), `${id}c`],
    };
  }
  return { decl: `int ${id}v[] = {${v.length ? v.join(",") : "0"}};`, args: [`_L(${id}v, ${v.length})`] };
}

// ---- Harnesses ----

const JAVA_HEAD = `import java.util.*;
`;
const JAVA_TAIL = (sig, fn, tests) => `
class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } }

public class Main {
    static ListNode _L(int[] a) { ListNode h = null; for (int i = a.length - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; }
    static String _j(int v) { return String.valueOf(v); }
    static String _j(boolean v) { return String.valueOf(v); }
    static String _j(String v) {
        if (v == null) return "null";
        StringBuilder b = new StringBuilder("\\"");
        for (char c : v.toCharArray()) { if (c == '"' || c == '\\\\') b.append('\\\\'); if (c == '\\n') { b.append("\\\\n"); continue; } b.append(c); }
        return b.append('"').toString();
    }
    static String _j(int[] a) { if (a == null) return "null"; StringJoiner s = new StringJoiner(",", "[", "]"); for (int x : a) s.add(_j(x)); return s.toString(); }
    static String _j(String[] a) { if (a == null) return "null"; StringJoiner s = new StringJoiner(",", "[", "]"); for (String x : a) s.add(_j(x)); return s.toString(); }
    static String _j(int[][] a) { if (a == null) return "null"; StringJoiner s = new StringJoiner(",", "[", "]"); for (int[] x : a) s.add(_j(x)); return s.toString(); }
    static String _j(ListNode h) { StringJoiner s = new StringJoiner(",", "[", "]"); int n = 0; while (h != null && n++ < 100000) { s.add(_j(h.val)); h = h.next; } return s.toString(); }
    public static void main(String[] args) {
${tests
  .map(
    (t) => `        try { System.out.println("@@R " + _j(new Solution().${fn}(${t.args.map((a, i) => javaLit(a, sig.params[i].type)).join(", ")}))); }
        catch (Throwable e) { System.out.println("@@E " + e.getClass().getSimpleName() + ": " + e.getMessage()); }`,
  )
  .join("\n")}
    }
}
`;

const CPP_HEAD = `#include <bits/stdc++.h>
using namespace std;
struct ListNode { int val; ListNode* next; ListNode() : val(0), next(nullptr) {} ListNode(int x) : val(x), next(nullptr) {} ListNode(int x, ListNode* n) : val(x), next(n) {} };
`;
const CPP_TAIL = (sig, fn, tests) => `
static ListNode* _L(vector<int> a) { ListNode* h = nullptr; for (int i = (int)a.size() - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; }
static string _j(int v) { return to_string(v); }
static string _j(bool v) { return v ? "true" : "false"; }
static string _j(const string& v) { string b = "\\""; for (char c : v) { if (c == '"' || c == '\\\\') b += '\\\\'; if (c == '\\n') { b += "\\\\n"; continue; } b += c; } return b + "\\""; }
static string _j(const char* v) { return v ? _j(string(v)) : "null"; }
template <class T> static string _j(const vector<T>& a) { string s = "["; for (size_t i = 0; i < a.size(); i++) { if (i) s += ","; s += _j(a[i]); } return s + "]"; }
static string _j(ListNode* h) { string s = "["; int n = 0; while (h && n < 100000) { if (n++) s += ","; s += _j(h->val); h = h->next; } return s + "]"; }
int main() {
${tests
  .map(
    (t) => `    try { ${t.args.map((a, i) => `auto _a${i} = ${cppLit(a, sig.params[i].type)};`).join(" ")} Solution _s; auto _r = _s.${fn}(${t.args.map((_, i) => `_a${i}`).join(", ")}); cout << "@@R " << _j(_r) << endl; }
    catch (const exception& e) { cout << "@@E " << e.what() << endl; } catch (...) { cout << "@@E error" << endl; }`,
  )
  .join("\n")}
    return 0;
}
`;

const C_HEAD = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <limits.h>
#include <math.h>
struct ListNode { int val; struct ListNode* next; };
`;
function cPrint(ret) {
  if (ret === "int") return `printf("@@R %d\\n", _r);`;
  if (ret === "bool") return `printf("@@R %s\\n", _r ? "true" : "false");`;
  if (ret === "str") return `printf("@@R "); _ps(_r); printf("\\n");`;
  if (ret === "int[]") return `printf("@@R ["); for (int i = 0; _r && i < _n; i++) printf(i ? ",%d" : "%d", _r[i]); printf("]\\n");`;
  if (ret === "str[]") return `printf("@@R ["); for (int i = 0; _r && i < _n; i++) { if (i) printf(","); _ps(_r[i]); } printf("]\\n");`;
  if (ret === "int[][]")
    return `printf("@@R ["); for (int i = 0; _r && i < _n; i++) { if (i) printf(","); printf("["); for (int j = 0; _cs && j < _cs[i]; j++) printf(j ? ",%d" : "%d", _r[i][j]); printf("]"); } printf("]\\n");`;
  return `printf("@@R ["); int _k = 0; while (_r && _k < 100000) { printf(_k++ ? ",%d" : "%d", _r->val); _r = _r->next; } printf("]\\n");`;
}
const C_TAIL = (sig, fn, tests) => `
static struct ListNode* _L(int* a, int n) { struct ListNode* h = NULL; for (int i = n - 1; i >= 0; i--) { struct ListNode* x = malloc(sizeof *x); x->val = a[i]; x->next = h; h = x; } return h; }
static void _ps(const char* s) { if (!s) { printf("null"); return; } putchar('"'); for (; *s; s++) { if (*s == '"' || *s == '\\\\') putchar('\\\\'); if (*s == '\\n') { printf("\\\\n"); continue; } putchar(*s); } putchar('"'); }
int main(void) {
${tests
  .map((t) => {
    const parts = t.args.map((a, i) => cArg(a, sig.params[i].type, `_a${i}`));
    const extra = sig.ret === "int[]" || sig.ret === "str[]" ? ["&_n"] : sig.ret === "int[][]" ? ["&_n", "&_cs"] : [];
    return `    { ${parts.map((x) => x.decl).join(" ")} int _n = 0; int* _cs = NULL; (void)_n; (void)_cs; ${C_RET[sig.ret]} _r = ${fn}(${[...parts.flatMap((x) => x.args), ...extra].join(", ")}); ${cPrint(sig.ret)} fflush(stdout); }`;
  })
  .join("\n")}
    return 0;
}
`;

/** The full program to run for `lang`, or null when the problem can't be typed. */
export function typedHarness(p, lang, code) {
  const sig = signatureOf(p);
  if (!sig) return null;
  const tests = p.tests || [];
  if (lang === "java") return JAVA_HEAD + code + "\n" + JAVA_TAIL(sig, p.fn, tests);
  if (lang === "cpp") return CPP_HEAD + code + "\n" + CPP_TAIL(sig, p.fn, tests);
  if (lang === "c") return C_HEAD + code + "\n" + C_TAIL(sig, p.fn, tests);
  return null;
}
