// Generated. Original CodeVita-style problem written for Anobyt (not official TCS material).
// Server-only: the hidden test cases live here.

export default {
  ...JSON.parse(`{
 "id": "royal-guards",
 "title": "Royal Guards",
 "difficulty": "Hard",
 "topics": [
  "Backtracking",
  "Bit Manipulation"
 ],
 "patterns": [
  "N-Queens with bitmasks",
  "Backtracking with pruning"
 ],
 "companies": [
  "TCS CodeVita",
  "TCS Digital"
 ],
 "season": "",
 "source": "original",
 "summary": "Count the ways to post N guards on a palace grid with broken tiles so no two can see each other.",
 "timeLimit": 1.5,
 "memoryLimit": 256,
 "samples": [
  {
   "input": "4\\n....\\n....\\n....\\n....\\n",
   "output": "2\\n",
   "explanation": "This is the classic 4-queens puzzle, which has two solutions."
  },
  {
   "input": "4\\n.#..\\n....\\n....\\n....\\n",
   "output": "1\\n",
   "explanation": "One of the two solutions uses the tile at row 1, column 2, which is broken."
  }
 ],
 "hints": [
  "Each row gets exactly one guard, so place them row by row.",
  "Three bitmasks are enough to remember everything the rows above have blocked."
 ],
 "editorial": {
  "idea": "Place guards row by row. A guard in the current row must avoid every column and both diagonals already used. Keep three bitmasks: used columns, used \\"\\\\\\" diagonals and used \\"/\\" diagonal` +
`s, shifted by one each row. The allowed columns in a row are the free bits minus the broken tiles in that row.",
  "brute": "Try every way to pick one tile per row (N^N, about 2.8 * 10^11 for N = 11) and check each arrangement.",
  "better": "Backtracking with a boolean array per column and diagonal. Correct and fast enough in C++, slower in Python.",
  "optimal": "Bitmask backtracking. free = full & ~(cols | d1 | d2) & ~broken[row]. Take the lowest set bit with free & -free, then recurse with cols | bit, (d1 | bit) << 1, (d2 | bit) >> 1. Each step` +
` costs O(1), and the search only visits partial boards that are still valid.",
  "dryRun": "N = 4, empty board.\\nRow 1 col 2: rows below block cols 2, and diagonals col 1 and col 3 in row 2, so row 2 must use col 4.\\nRow 3 then has only col 1 free, and row 4 has only col 3 free.` +
` One solution: 2 4 1 3.\\nBy symmetry 3 1 4 2 is the other.",
  "mistakes": "- Letting broken tiles block a guard's view. They only stop a guard from standing there.\\n- Forgetting to mask the shifted diagonal to N bits.\\n- Counting arrangements of guards without` +
` requiring one per row.",
  "edgeCases": "- N = 1 with a usable tile: 1. With a broken tile: 0.\\n- N = 2 and N = 3: always 0.\\n- A whole row of broken tiles: 0."
 },
 "complexity": {
  "time": "O(number of valid partial boards), well under 10^6 for N = 11",
  "space": "O(N)"
 },
 "solutions": {
  "python": "import sys\\ndef main():\\n    d = sys.stdin.read().split()\\n    n = int(d[0]); rows = d[1:1 + n]\\n    full = (1 << n) - 1\\n    broken = [sum(1 << j for j, ch in enumerate(r) if ch == '#') ` +
`for r in rows]\\n    def go(r, cols, d1, d2):\\n        if r == n: return 1\\n        free = full & ~(cols | d1 | d2) & ~broken[r]\\n        total = 0\\n        while free:\\n            bit = free & -free;` +
` free ^= bit\\n            total += go(r + 1, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1)\\n        return total\\n    print(go(0, 0, 0, 0))\\nmain()\\n",
  "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\nint n, full_mask;\\nvector<int> broken;\\nlong long go(int r, int cols, int d1, int d2) {\\n    if (r == n) return 1;\\n    int fr = full_mask & ~` +
`(cols | d1 | d2) & ~broken[r];\\n    long long total = 0;\\n    while (fr) {\\n        int bit = fr & -fr; fr ^= bit;\\n        total += go(r + 1, cols | bit, ((d1 | bit) << 1) & full_mask, (d2 | bit) >> ` +
`1);\\n    }\\n    return total;\\n}\\nint main() {\\n    cin >> n;\\n    full_mask = (1 << n) - 1;\\n    broken.assign(n, 0);\\n    for (int i = 0; i < n; i++) {\\n        string s; cin >> s;\\n        for (int` +
` j = 0; j < n; j++) if (s[j] == '#') broken[i] |= 1 << j;\\n    }\\n    printf(\\"%lld\\\\n\\", go(0, 0, 0, 0));\\n    return 0;\\n}\\n",
  "java": "import java.io.*;\\nimport java.util.*;\\n\\npublic class Main {\\n    static int n, full;\\n    static int[] broken;\\n    static long go(int r, int cols, int d1, int d2) {\\n        if (r == n) ` +
`return 1;\\n        int fr = full & ~(cols | d1 | d2) & ~broken[r];\\n        long total = 0;\\n        while (fr != 0) {\\n            int bit = fr & -fr; fr ^= bit;\\n            total += go(r + 1, cols ` +
`| bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1);\\n        }\\n        return total;\\n    }\\n    public static void main(String[] args) throws IOException {\\n        BufferedReader br = new BufferedRe` +
`ader(new InputStreamReader(System.in));\\n        n = Integer.parseInt(br.readLine().trim());\\n        full = (1 << n) - 1;\\n        broken = new int[n];\\n        for (int i = 0; i < n; i++) {\\n       ` +
`     String s = br.readLine().trim();\\n            for (int j = 0; j < n; j++) if (s.charAt(j) == '#') broken[i] |= 1 << j;\\n        }\\n        System.out.println(go(0, 0, 0, 0));\\n    }\\n}\\n"
 },
 "statement": "A palace hall is an N x N grid of tiles. The queen wants to post exactly N guards, one on each row. Guards can see along their row, their column and both diagonals, any distance away, a` +
`nd no two guards may be able to see each other. Some tiles are broken (\`#\`) and nobody can stand on them, but a broken tile does **not** block a guard's view.\\n\\nCount the number of valid ways to post` +
` the guards.",
 "inputFormat": "The first line contains N.\\nEach of the next N lines contains N characters: \`.\` for a usable tile and \`#\` for a broken one.",
 "outputFormat": "Print the number of valid arrangements.",
 "constraints": "1 <= N <= 11"
}`),
  cases: [
    { input: `1
.
`,
      output: `1
` },
    { input: `1
#
`,
      output: `0
` },
    { input: `2
..
..
`,
      output: `0
` },
    { input: `3
...
...
...
`,
      output: `0
` },
    { input: `5
.....
.....
#####
.....
.....
`,
      output: `0
` },
    { input: `6
......
......
......
......
......
......
`,
      output: `4
` },
    { input: `8
........
........
........
........
........
........
........
........
`,
      output: `92
` },
    { input: `8
..###...
.#..#...
......#.
........
..#.....
#.......
....#...
#.......
`,
      output: `18
` },
    { input: `10
.......#..
.......##.
..........
#.....##..
.#........
...#......
...##..#..
......#...
..........
.....#....
`,
      output: `155
` },
    { input: `11
...........
...........
...........
...........
...........
...........
...........
...........
...........
...........
...........
`,
      output: `2680
` },
    { input: `11
....##.#...
#.##.....#.
.....##..##
.#..#......
..#....##..
.##...#....
...#....#..
...........
##....#....
.#.#.......
#......##..
`,
      output: `155
` },
    { input: `9
.........
.........
.........
.........
.........
...#.....
.........
.........
.........
`,
      output: `316
` },
  ],
};
