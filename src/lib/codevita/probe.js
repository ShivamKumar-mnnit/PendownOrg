// Measures peak memory (and CPU time for C, C++ and Python) inside the student's
// program, because the main code runner only reports wall time. A few lines are
// added AFTER the student's code (or on the same line as `public class Main {`
// in Java), so compiler and runtime error line numbers stay the same. At exit
// the program prints "@@CVSTAT <peak KB> <cpu ms>" to stderr, which the judge
// reads and removes before anyone sees the output.
//
// Server-only (src/lib/server/codevita.js). Admin → CodeVita → Settings can
// switch it off if a runner ever treats stderr output as a failure.

const C_PROBE = `
#include <stdio.h>
#include <time.h>
__attribute__((destructor)) static void cv_probe__(void) {
  FILE *cv_f__ = fopen("/proc/self/status", "r"); long cv_kb__ = -1; char cv_l__[256];
  if (cv_f__) { while (fgets(cv_l__, sizeof cv_l__, cv_f__)) if (sscanf(cv_l__, "VmHWM: %ld", &cv_kb__) == 1) break; fclose(cv_f__); }
  fprintf(stderr, "\\n@@CVSTAT %ld %ld\\n", cv_kb__, (long)(clock() * 1000.0 / CLOCKS_PER_SEC));
}
`;

const PY_PROBE = `

import atexit as _cv_atexit
def _cv_probe():
    import sys as _cv_sys, time as _cv_time
    _cv_kb = -1
    try:
        with open("/proc/self/status") as _cv_f:
            for _cv_l in _cv_f:
                if _cv_l.startswith("VmHWM:"):
                    _cv_kb = int(_cv_l.split()[1])
                    break
    except Exception:
        pass
    _cv_sys.stderr.write("\\n@@CVSTAT %d %d\\n" % (_cv_kb, int(_cv_time.process_time() * 1000)))
_cv_atexit.register(_cv_probe)
`;

const JAVA_PROBE = `
class CvProbe__ {
  static void install() {
    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      long kb = -1;
      try (java.io.BufferedReader r = new java.io.BufferedReader(new java.io.FileReader("/proc/self/status"))) {
        String l;
        while ((l = r.readLine()) != null) if (l.startsWith("VmHWM:")) { kb = Long.parseLong(l.replaceAll("[^0-9]", "")); break; }
      } catch (Exception e) { }
      System.err.println();
      System.err.println("@@CVSTAT " + kb + " -1");
    }));
  }
}
`;

/** The code with the probe added, or the code unchanged when it can't be added safely. */
export function withProbe(language, code) {
  if (language === "c" || language === "cpp") return code + "\n" + C_PROBE;
  if (language === "python") return code + PY_PROBE;
  if (language === "java") {
    const re = /(public\s+(?:final\s+)?class\s+Main\b[^{]*\{)/;
    if (!re.test(code)) return code;
    return code.replace(re, "$1 static { CvProbe__.install(); }") + "\n" + JAVA_PROBE;
  }
  return code;
}

/** Pulls the probe line out of stderr: { stderr, memoryKb, cpuMs }. */
export function readProbe(stderr) {
  const s = String(stderr || "");
  const m = s.match(/\n?@@CVSTAT (-?\d+) (-?\d+)\n?/);
  if (!m) return { stderr: s, memoryKb: undefined, cpuMs: undefined };
  const kb = Number(m[1]);
  const cpu = Number(m[2]);
  return { stderr: s.replace(m[0], "").replace(/\s+$/, ""), memoryKb: kb > 0 ? kb : undefined, cpuMs: cpu >= 0 ? cpu : undefined };
}
