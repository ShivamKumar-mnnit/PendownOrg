// Generated. Original CodeVita-style problem written for Anobyt (not official TCS material).
// Server-only: the hidden test cases live here.

export default {
  ...JSON.parse(`{
 "id": "two-fuel-lanes",
 "title": "Two Fuel Lanes",
 "difficulty": "Medium",
 "topics": [
  "Dynamic Programming",
  "Arrays"
 ],
 "patterns": [
  "Subset sum",
  "Balanced partition"
 ],
 "companies": [
  "TCS CodeVita",
  "TCS Digital"
 ],
 "season": "",
 "source": "original",
 "summary": "Split vehicles between two pumps so the last vehicle finishes as early as possible.",
 "timeLimit": 1,
 "memoryLimit": 256,
 "samples": [
  {
   "input": "5\\n3 1 4 2 2\\n",
   "output": "6\\n",
   "explanation": "Pump 1 serves 3 + 2 + 1 = 6 minutes, pump 2 serves 4 + 2 = 6 minutes."
  },
  {
   "input": "3\\n10 1 1\\n",
   "output": "10\\n",
   "explanation": "The 10-minute vehicle alone takes 10 minutes, so nothing can finish earlier."
  }
 ],
 "hints": [
  "Fix the total time of pump 1; what is the finish time then?",
  "This is a subset-sum problem."
 ],
 "editorial": {
  "idea": "If pump 1 gets total time s, pump 2 gets total - s, and the finish time is max(s, total - s). We want the subset sum s closest to total / 2 from below. Find all reachable subset sums with D` +
`P.",
  "brute": "Try all 2^N assignments. N = 100 makes this impossible.",
  "better": "Greedy (give each vehicle to the less busy pump, longest first) is fast but not always optimal: for times 3 3 2 2 2 it gives 7 instead of 6.",
  "optimal": "Boolean DP over sums: reach[0] = true; for each t, for s from total down to t: reach[s] |= reach[s - t]. The answer is total - (largest reachable s <= total / 2). With total <= 10^5 this` +
` is at most 10^7 simple steps (or one shift per vehicle with a bitset).",
  "dryRun": "t = 3 1 4 2 2, total 12, half 6.\\nReachable sums include 0..12 here; 6 is reachable (4 + 2). Answer = 12 - 6 = 6.",
  "mistakes": "- Using the greedy approach (wrong on some inputs).\\n- Iterating s upwards in the 1D DP, which lets one vehicle be used twice.\\n- Printing the subset sum instead of total minus it.",
  "edgeCases": "- N = 1: the answer is t[1].\\n- One vehicle much longer than all others combined.\\n- All times equal."
 },
 "complexity": {
  "time": "O(N * sum(t))",
  "space": "O(sum(t))"
 },
 "solutions": {
  "python": "import sys\\n\\ndef main():\\n    data = sys.stdin.read().split()\\n    n = int(data[0])\\n    t = list(map(int, data[1:1 + n]))\\n    total = sum(t)\\n    reach = 1  # bit s set = sum s is reac` +
`hable\\n    for x in t:\\n        reach |= reach << x\\n    half = total // 2\\n    best = (reach & ((1 << (half + 1)) - 1)).bit_length() - 1\\n    print(total - best)\\n\\nmain()\\n",
  "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\nint main() {\\n    int n;\\n    cin >> n;\\n    vector<int> t(n);\\n    int total = 0;\\n    for (int &x : t) { cin >> x; total += x; }\\n    bits` +
`et<100001> reach;\\n    reach[0] = 1;\\n    for (int x : t) reach |= reach << x;\\n    int best = 0;\\n    for (int s = total / 2; s >= 0; s--) if (reach[s]) { best = s; break; }\\n    cout << total - best` +
` << '\\\\n';\\n    return 0;\\n}\\n",
  "java": "import java.io.*;\\nimport java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) throws IOException {\\n        BufferedReader br = new BufferedReader(new InputStrea` +
`mReader(System.in));\\n        int n = Integer.parseInt(br.readLine().trim());\\n        StringTokenizer st = new StringTokenizer(br.readLine());\\n        int[] t = new int[n];\\n        int total = 0;\\n` +
`        for (int i = 0; i < n; i++) { t[i] = Integer.parseInt(st.nextToken()); total += t[i]; }\\n        boolean[] reach = new boolean[total + 1];\\n        reach[0] = true;\\n        for (int x : t)\\n ` +
`           for (int s = total; s >= x; s--)\\n                if (reach[s - x]) reach[s] = true;\\n        int best = 0;\\n        for (int s = total / 2; s >= 0; s--) if (reach[s]) { best = s; break; }\\` +
`n        System.out.println(total - best);\\n    }\\n}\\n"
 },
 "statement": "A highway fuel station has two pumps. N vehicles are waiting, and vehicle i needs exactly t[i] minutes at a pump. The attendant sends each vehicle to one of the two pumps, and each pump` +
` serves its vehicles one after another without breaks.\\n\\nThe station closes for cleaning once every vehicle has been served. Choose the assignment so that this moment comes as early as possible, and ` +
`print that time in minutes. Both pumps start at minute 0.",
 "inputFormat": "The first line contains N.\\nThe second line contains t[1] … t[N].",
 "outputFormat": "Print the minimum possible time at which the last vehicle finishes.",
 "constraints": "1 <= N <= 100\\n1 <= t[i] <= 1000"
}`),
  cases: [
    { input: `1
1000
`,
      output: `1000
` },
    { input: `5
3 3 2 2 2
`,
      output: `6
` },
    { input: `2
7 7
`,
      output: `7
` },
    { input: `4
1 1 1 1000
`,
      output: `1000
` },
    { input: `10
16 9 17 12 5 13 1 12 16 9
`,
      output: `55
` },
    { input: `40
236 117 286 1 75 226 189 84 174 108 31 296 103 39 263 173 208 45 10 32 261 115 47 217 228 58 217 70 277 161 286 84 27 285 88 260 43 206 215 241
`,
      output: `3041
` },
    { input: `100
489 624 394 555 32 657 744 85 991 197 1000 807 680 268 365 964 372 887 707 395 690 318 117 259 241 344 373 381 524 587 830 784 513 184 29 391 843 880 441 34 532 27 228 692 438 45 398 210 791 622 106 7` +
`72 564 226 183 80 713 281 38 444 284 511 353 617 653 744 54 527 471 378 214 348 289 467 488 714 982 877 493 246 979 172 476 947 563 373 187 194 785 767 226 934 622 7 971 275 938 790 821 350
`,
      output: `24227
` },
    { input: `100
184 248 815 9 514 41 254 634 119 370 560 516 159 25 950 331 904 807 685 852 287 655 121 236 803 540 515 489 502 643 363 269 701 970 456 916 757 167 460 299 632 895 48 285 338 967 883 528 656 713 456 7` +
`22 812 220 752 292 534 262 30 700 4 711 28 135 572 908 273 431 142 248 206 446 484 61 574 584 640 737 943 959 986 265 779 41 428 442 603 96 923 415 809 204 595 571 356 378 654 754 395 577
`,
      output: `24604
` },
    { input: `99
165 18 706 728 160 926 32 817 39 920 75 933 426 548 205 809 950 389 812 101 728 362 194 320 278 957 813 706 704 555 504 638 626 128 218 548 614 718 696 404 595 252 74 417 365 332 85 702 341 146 704 93` +
` 739 320 319 713 185 778 695 676 653 958 447 375 181 31 215 500 638 455 498 184 59 684 609 350 468 245 906 336 100 967 230 8 988 369 376 287 870 207 705 443 304 226 529 941 151 514 925
`,
      output: `23467
` },
    { input: `100
1000 999 1000 1000 999 1000 1000 999 999 1000 1000 1000 999 999 1000 1000 999 1000 1000 1000 1000 999 999 1000 999 999 1000 1000 999 1000 1000 1000 1000 1000 1000 1000 999 999 1000 999 1000 1000 1000 ` +
`1000 1000 1000 1000 1000 1000 1000 999 999 999 1000 999 1000 999 1000 1000 999 1000 999 999 1000 999 999 999 999 999 999 1000 999 999 1000 999 999 1000 1000 999 1000 999 999 999 1000 1000 1000 1000 10` +
`00 1000 1000 999 1000 999 999 1000 1000 999 1000 1000 1000
`,
      output: `49980
` },
  ],
};
