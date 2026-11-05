// Generated. Original CodeVita-style problem written for Anobyt (not official TCS material).
// Server-only: the hidden test cases live here.

export default {
  ...JSON.parse(`{
 "id": "ribbon-cuts",
 "title": "Palindrome Ribbon",
 "difficulty": "Hard",
 "topics": [
  "Dynamic Programming",
  "Strings"
 ],
 "patterns": [
  "Palindrome partitioning",
  "Expand around centre"
 ],
 "companies": [
  "TCS CodeVita",
  "Amazon"
 ],
 "season": "",
 "source": "original",
 "summary": "Cut a lettered ribbon into palindromes using as few cuts as possible.",
 "timeLimit": 1.5,
 "memoryLimit": 256,
 "samples": [
  {
   "input": "aab\\n",
   "output": "1\\n",
   "explanation": "Cut once: aa | b."
  },
  {
   "input": "racecar\\n",
   "output": "0\\n",
   "explanation": "The whole ribbon is already a palindrome."
  }
 ],
 "hints": [
  "Every piece ends somewhere. What is the best answer for the prefix before it?",
  "Grow palindromes from their middle instead of testing every substring."
 ],
 "editorial": {
  "idea": "Let cuts[i] be the fewest cuts for the first i letters, with cuts[0] = -1. If S[j..i-1] is a palindrome, then cuts[i] can be cuts[j] + 1. Instead of testing every (j, i) pair separately, gr` +
`ow each palindrome from its centre and update cuts at its right end.",
  "brute": "Try all 2^(n-1) ways to place cuts and keep the best one whose pieces are all palindromes.",
  "better": "Precompute a table pal[j][i] (O(n^2) memory), then cuts[i] = min(cuts[j] + 1) over palindromic S[j..i-1]. O(n^2) time but 4 million booleans.",
  "optimal": "Expand around every centre c (odd and even lengths). While S[c-k..c+k] is a palindrome, set cuts[c+k+1] = min(cuts[c+k+1], cuts[c-k] + 1). Every palindrome is visited once, so this is O(` +
`n^2) time and O(n) memory.",
  "dryRun": "S = aab, cuts = [-1, 0, 1, 2] to start.\\nCentre 0 (a): cuts[1] = min(0, -1+1) = 0.\\nCentre between 0 and 1 (aa): cuts[2] = min(1, -1+1) = 0.\\nCentre 1 (a): cuts[2] = min(0, 0+1) = 0.\\nCen` +
`tre 2 (b): cuts[3] = min(2, 0+1) = 1.\\nAnswer 1.",
  "mistakes": "- Forgetting even-length palindromes like \\"aa\\".\\n- Counting pieces instead of cuts. Pieces = cuts + 1.\\n- Rechecking each substring from scratch, which makes the solution O(n^3).",
  "edgeCases": "- A single letter: 0 cuts.\\n- All letters different: n - 1 cuts.\\n- All letters equal: 0 cuts."
 },
 "complexity": {
  "time": "O(n^2)",
  "space": "O(n)"
 },
 "solutions": {
  "python": "import sys\\ndef main():\\n    s = sys.stdin.read().split()[0]\\n    n = len(s)\\n    cuts = list(range(-1, n))\\n    for c in range(n):\\n        for lo, hi in ((c, c), (c, c + 1)):\\n         ` +
`   while lo >= 0 and hi < n and s[lo] == s[hi]:\\n                v = cuts[lo] + 1\\n                if v < cuts[hi + 1]: cuts[hi + 1] = v\\n                lo -= 1; hi += 1\\n    print(cuts[n])\\nmain()\\n` +
`",
  "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\nint main() {\\n    string s;\\n    cin >> s;\\n    int n = s.size();\\n    vector<int> cuts(n + 1);\\n    for (int i = 0; i <= n; i++) cuts[i] = i ` +
`- 1;\\n    for (int c = 0; c < n; c++) {\\n        for (int odd = 0; odd < 2; odd++) {\\n            int lo = c, hi = c + odd;\\n            while (lo >= 0 && hi < n && s[lo] == s[hi]) {\\n                ` +
`cuts[hi + 1] = min(cuts[hi + 1], cuts[lo] + 1);\\n                lo--; hi++;\\n            }\\n        }\\n    }\\n    printf(\\"%d\\\\n\\", cuts[n]);\\n    return 0;\\n}\\n",
  "java": "import java.io.*;\\nimport java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) throws IOException {\\n        BufferedReader br = new BufferedReader(new InputStrea` +
`mReader(System.in));\\n        char[] s = br.readLine().trim().toCharArray();\\n        int n = s.length;\\n        int[] cuts = new int[n + 1];\\n        for (int i = 0; i <= n; i++) cuts[i] = i - 1;\\n  ` +
`      for (int c = 0; c < n; c++) {\\n            for (int odd = 0; odd < 2; odd++) {\\n                int lo = c, hi = c + odd;\\n                while (lo >= 0 && hi < n && s[lo] == s[hi]) {\\n        ` +
`            cuts[hi + 1] = Math.min(cuts[hi + 1], cuts[lo] + 1);\\n                    lo--; hi++;\\n                }\\n            }\\n        }\\n        System.out.println(cuts[n]);\\n    }\\n}\\n"
 },
 "statement": "A gift shop prints a word on a long ribbon. The owner wants to cut the ribbon into pieces so that the letters on every piece read the same forwards and backwards (a palindrome). Each pi` +
`ece must be at least one letter long.\\n\\nPrint the minimum number of cuts needed.",
 "inputFormat": "A single line with the string S of lowercase letters.",
 "outputFormat": "Print the minimum number of cuts.",
 "constraints": "1 <= |S| <= 2000"
}`),
  cases: [
    { input: `a
`,
      output: `0
` },
    { input: `ab
`,
      output: `1
` },
    { input: `aaaa
`,
      output: `0
` },
    { input: `abcdef
`,
      output: `5
` },
    { input: `abacaba
`,
      output: `0
` },
    { input: `banana
`,
      output: `1
` },
    { input: `aabaabaabbbbabaaababbaaaaabbaababaabbabb
`,
      output: `5
` },
    { input: `cbccaaccbcbcbcccbbacabcaacbaccbacccbcababcbcbcaacbaacbabbabcbcbbccababbccabaaabcaacbbcbaaabaacabcbbbbaccccaaaaababcaaaaacacccccbacaacbcccacabccbcabbaaaacbacabbccbbacaccccaacbacbbabcacabcabcacbabcbaabb` +
`bcbaacbbabaccacbacbccababaacabcbcacaccccbabbbabcccbbcabccbcabcbacbcaaaaaacccccaabbbcccacababacbbcbabcbaabbbbbcccaacccbbbaaacbaabaabcbabacbcabbabccbccccccaacaccacbbbccacabcacabcccabbaaaabcbabbbbaccbcba` +
`bcbbcaccaaabbbbbbaccaabccbacbababbaabbbaacacaaabbcaaabccacbabaacaccacbcabbccabaabbbabcabbcbbccbacbab
`,
      output: `159
` },
    { input: `bbbbbabbaaaaaabaaaaaabaababaabbabbabbbbbbbabbabbbabaaaabbaabababbbbbbaabbbaaaabbabbbabaaaabbbaababbbabaaabbbbabbbbbbbaaabbaabaabbabbbaabaababbbaaabaabbbbbbbababaababaaaaabbabaabbbbabbbabaabaabaabbbaab` +
`abbaaababbababaabbbaaaaabbaaaabaababbaaaaabaaabaaaabaaabaababaabbbbabaaabbbbbababbbbaaaaabaaaabaabbabaaabaabbbbaabbaabbbabbbbaaaaabbaaabbbaaaaabababaababbbbbbabbaabbbabbabbabbbaaabaaababbbababbabbbbbb` +
`aaaaabaabbbababbaabbbabaaaaaaabaabbababaaaabaaabbabbbaaaaabbbbbabbbbaaabbabbaaabbaabbbbaaaabbaabbaabbaababbbaaabbaaaabbbabaaabbbbaabbbaabbbbaabbbaaaaaabbaaaababaabaaaaababaaaabaabaaaaababbbabbabababab` +
`aaaabaaaaaabaabaaabaabbbabbaaabbaababaaaabbaabbbabbbaabaaaababbbaaababbbbbbbbbaabaaabbbbaabaaaaaabbabbbbabababababbbaababbbabaaababaaaabbbaaababbbbbbbaababaaababaabaaaaababbaaaababbbaaabaabbbbaaaaabba` +
`baaaaababbbbaaabbabbababbbababbbaababaaababbbbaabaababaaaababbbbbabaabbbbbaaabaaabaabbbbbbabbaabbaabbabaaabbbbabaabbabaabbaabaabaaababababbbabbaaabbbbabaabbbbaababaabaaaaabbababbbbaaababaaabbaaabaaaba` +
`babababbbabbabababaabbababaabbabaabaaaabbbbbbaaabbabbbaabbaabbbbbaaaabbbaabbbbaabaaaaabababbbaabbaababbbaababbbbbabbbabbaaaaaaababbabbabbabbbabaabbbbbababbabbbabbbaaabaabaababbbbaaabbabaaabbabbbbbbaaa` +
`bbaabababbbbaaababbabbbabaaabbababbaabbaaaaabbabaaababaabbbbaabbbaabbbbbbbbbaabbbbabbaaabaababbbbabbbaabababaaabababaabbbaaaaababababbabbabaaababbbbbabaababbabbbbbababbaabbababbaabbbbaabbbbbbbbbabaaaa` +
`baababbaababaaabaaabaaaaabbbbbbbabbbaaaabababababbbabbaaabaababbbbabbaababbabbaababbbbbaaaabbbbaaaaabbababbbbbbbaaabbabaaaaabbabbaaabbaabbbaaaabaababaabbbabbabbabbabbbbbbbaababaaaabbaabbabbababbaabbba` +
`bbbbaababbbabbaabaabbbbbaaaaabbbabbaaaaaabaaabbbbaaaabaaaabaaabbababbabbaabbabaabbabbabaabbabbabbbaabbaababbaaaababaaababbbbbbbaaabbbaabbabbbbabaabbaababbbbabbaaaabaabbbababbbbaababbaabaababbababaaaba` +
`bbabaabaaabbaabbbabbbabbaaabbababbaaababbbabbbbaabaabaaaaabbbabbaaabaaaaabbbabaaababaabbbaabbabbbbbabbaaaaaababbaaaaaabbaaaaaabbbbabbbabbaabbabbababbabaabbaaaabbababbbabababbbbaaaabaaaaabbbaabbabbbbbb` +
`
`,
      output: `316
` },
    { input: `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` +
`
`,
      output: `0
` },
    { input: `hlwavwzgibxkhywkfvyykgjigndfbhhwdlkfcbhblwhmwbreyfqzppqyemqznksqzvhhevfxfcatfpwsqgdxpuizjvjrbemhpqxpknjmvxbnwcqhmnxvfwuinikwgirprjhmpijvorlffxuyuzcqloixlhadnaxhuktfugbxcgwbuczzznwznvzwmxmypsbqocroeqre` +
`dicsudksnclbhgwgnjxmuxtylrslecninrpsxnkephybwbmrhbjewfwmmhmyhrykvcbllzlkgrspnrpjmsxjalswrwwwgoudvvhokxyiogwinskwdqfdshtiesisyoqfkoakhzxlzqvqpixaqqgvyfksqbzugwiifvqrrqcbylwphovfvpqrfsqlilouwpbnwkspaxws` +
`cxaofyeokznlnmqeoofnftepdxxzbrunimpraeceedkacysgehquzzfdkshjszkfbbbugbrvmybmgahhlicyuojfsxwyhlwzibimjjjfxpslxvapnnqehhyueculvhkeznahfuhhxznapyrzjzywzkqwqgwbreigsaqwtesobjlguxropfdjboofhbbutkpfibcffntn` +
`zhvqnfhhdmbgwjllhfwsqzambboghmxsfdlbtwalwujikbfzagkxqlzvlkrzmbbbwupslaridlcvxkkcfanmrxfwwxncuilmavxeiztscofecraprjizrolnqvpripatqtoyktktopyludmszsvjcaluiuvfhmbfheozsjepdxafcgbbocizkdbqwkvxdwqxhzbfmgch` +
`cgnpzmxtgsxihkxyzgjpniqeidrybymcsfstnludilnrhvbjcuwxynkvgqrkqepneutdgbjjqmpjkmufbljnfofbbaobahiocqicdmgrggtnzuidqfluublgpxtplaaayadgiiaklxrfefygqjtmcnwohsdcsjiznzlrwzclttlcktfzoqktocjcbimnpjvfvmfdzzqn` +
`szknluddyyztyaeygcbwbexcgwvfcewdjydtjckznsprqaqiosmtmelfeerknpcgpjnxqszuponjdusqmedfrtpsujoaowddgfhxvaadrygbukiglpeqwamudnneriyxbsdjdosshsolbwhasfgxfliqthzveebynhjmnbzehufqqnlchgdvgshvoppntwlvzedahcrk` +
`lbmghvfngmsbgnzbyzmqyyuzgjocvkzokapkkgyjkgewdjpjykqsudzqfykhgjvyconxfvgvjsswpybdotnvlyaahopwfrppqmviyovnxcuikjaaybztssutupnsfzqdadjylimhuxrdnpcxgiwmedqdfaxuaulqmjvdheqmjgwhiegrzzmqxvirehoepuzqydqtmmnj` +
`ntwlnvtpbjbshzoksagizcruykviixokabnfixgjfwekjlvljxknhgipgvpyvhnrqkjmtyluoqmcaupsulibknbvogfjfbzhqyvewxhpzpiqzhufkyddibykgyovkaqrsohicanvueimkbshujouyrpwkhpxdlbzcxbuifawdsxjmxubqtyqstscjzvysfpdotvihczo` +
`pirrhynagsxnwwqpgrmjdpuzfatvgbkmwsmmaqpyviauqgvkalxdymbbhfdqptuluxjnpjtswitzxpentfaawnwunubyllxemgotpffkmobakplhgvjvhkdcaykxexhapoqomabsoooziamojjijrkcisesmrjmzfhhhjpupceolcfoukmveznyrbrwliscyqijscfqf` +
`obbzhnmzdhksmwysgjclcnezdcgdbhzikbvllepxllwtnffvwdfqhtotsnlnowcmgysbqlisagndumrbibuirmtxkfybwibgabrvmvgseoadnptbiqxaezyhxsxlrhhfbllnldfalapsjtxhqkzemnhpbrsmpgbtdygzcuobutohrwjxhtyexlvwpjbzxfsgvrucbozr` +
`
`,
      output: `1760
` },
    { input: `babbbaaaabaabaabbbbaaaabbbbaaababbaabababaabbabaabbbaaaaaaaabaabaababbbabababbbaabbabaabaaaababbbbabbbaaabaaababbaabbabbaabbbbbbbbbbbbbaaabbbbbababbabbabbbbaababaaababaabbbbbbbaabaaaaabbaaaaaaabaabbba` +
`babbbbbaababaabaaaaabaabbbabbbaabaabbabbabaaabbabbbaabbababbaaababbbbababaabbababbbababababaaaaabbaabbaabbabbbaaabbbabbaaaaabbbabbababbabaaabbaababbbabbaababaaaabbaabababbaaababaababbbabbbbabbbaabaaba` +
`abbbaababbbbaaaabbbbbbaaabababbbbaababbbbababaabaabbabbbbbbaabbbbbbbabaababaabbaaaabbbbaabbabbbaaabbabbaaabbbaaaaaaababbbabbaaabbbbaabbaabaabbbaabaabbabbabaabbbbabbaababaaaabbaaabbbabaabbabbaabaaaabaa` +
`baaaabaabaaabbaabaaabaababbababbbbaaabaabbabbabaaabbabaabaaabbabbabaabbabaabbbbaaaabababaabbaaaabbaabaabbaaababbababbbbabaaabbbbabbababbbbaabbbbbbbbaaababaaaababbbabaabbaabbbabaabbbaaabbaaaabbbaaabbba` +
`abbaaababbbbbbbbbbaaaabababaaaaaaaaabbabaaabbbaaabbbbaabbabbbabbaaabaabbaaabbaaababbabbbbbabbababbababaabaababaabbabaabaaaabbbbabbaabaaaabbbbbbbbbbabbaaabababbbaababbbbbbbabbbbaabaabaababbbbbbabbbbabc` +
`babbbbabbbbbbabaabaabaabbbbabbbbbbbabaabbbababaaabbabbbbbbbbbbaaaabaabbabbbbaaaabaababbaababaabaabababbababbabbbbbabbabaaabbaaabbaabaaabbabbbabbaabbbbaaabbbaaababbaaaaaaaaabababaaaabbbbbbbbbbabaaabbaa` +
`bbbaaabbbaaaabbaaabbbaababbbaabbaababbbabaaaababaaabbbbbbbbaabbbbababbabbbbaaababbbbababbabaaabbaabaabbaaaabbaabababaaaabbbbaababbaababbabbaaabaababbaaababbabbaabaaabbbbababbabaabaaabaabbaaabaabaaaaba` +
`abaaaabaabbabbaababbbaaabbaaaababaabbabbbbaababbabbaabaabbbaabaabbaabbbbaaabbabbbabaaaaaaabbbaaabbabbaaabbbabbaabbbbaaaabbaababaababbbbbbbaabbbbbbabbaabaabababbbbabaabbbbababaaabbbbbbaaaabbbbabaabbbaa` +
`baabaabbbabbbbabbbabaababaaabbababaabbaaaababaabbabbbabaabbaaababbababbabbbaaaaabbabbbaaabbbabbaabbaabbaaaaabababababbbababbaabababbbbabaaabbababbaabbbabbaaababbabbaabaabbbabbbaabaaaaabaababaabbbbbaba` +
`bbbaabaaaaaaabbaaaaabaabbbbbbbaababaaababaabbbbabbabbababbbbbaaabbbbbbbbbbbbbaabbabbaabbabaaabaaabbbabbbbabaaaabaababbaabbbabababbbabaabaabaaaaaaaabbbaababbaabababaabbabaaabbbbaaaabbbbaabaabaaaabbbab
`,
      output: `0
` },
  ],
};
