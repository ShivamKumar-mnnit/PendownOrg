// Generated. Original CodeVita-style problem written for Anobyt (not official TCS material).
// Server-only: the hidden test cases live here.

export default {
  ...JSON.parse(`{
 "id": "autocorrect",
 "title": "Autocorrect Distance",
 "difficulty": "Hard",
 "topics": [
  "Dynamic Programming",
  "Strings"
 ],
 "patterns": [
  "Edit distance (Levenshtein)",
  "2D DP with rolling rows"
 ],
 "companies": [
  "TCS CodeVita",
  "Microsoft",
  "Infosys"
 ],
 "season": "",
 "source": "original",
 "summary": "Find the fewest single-letter edits that turn a typed word into the intended one.",
 "timeLimit": 1.5,
 "memoryLimit": 256,
 "samples": [
  {
   "input": "horse\\nros\\n",
   "output": "3\\n",
   "explanation": "horse -> rorse (replace h with r) -> rose (delete r) -> ros (delete e)."
  },
  {
   "input": "intention\\nexecution\\n",
   "output": "5\\n",
   "explanation": ""
  }
 ],
 "hints": [
  "Look only at the last letter of each prefix. What could the final edit have been?",
  "You only ever need the previous row of the table."
 ],
 "editorial": {
  "idea": "Let D[i][j] be the fewest edits that turn the first i letters of A into the first j letters of B. If A[i] = B[j] the last letters match for free: D[i][j] = D[i-1][j-1]. Otherwise the last s` +
`tep was a replace, a delete or an insert: D[i][j] = 1 + min(D[i-1][j-1], D[i-1][j], D[i][j-1]).",
  "brute": "Recursively try all three edits at every mismatch. Exponential: about 3^(|A|+|B|) calls.",
  "better": "The same recursion with memoisation is O(|A| * |B|) but needs a 2001 x 2001 table and deep recursion.",
  "optimal": "Fill the table bottom-up, keeping only the previous row and the current row. O(|A| * |B|) time and O(|B|) memory. Base cases: D[0][j] = j (insert j letters) and D[i][0] = i (delete i let` +
`ters).",
  "dryRun": "A = ab, B = b.\\nRow 0: [0, 1].\\nRow 1 (a): D[1][0]=1, D[1][1]= a!=b so 1+min(0,1,1)=1.\\nRow 2 (b): D[2][0]=2, D[2][1]= b==b so D[1][0]=1.\\nAnswer 1 (delete a).",
  "mistakes": "- Forgetting the base row and column: turning a word into an empty string needs one delete per letter.\\n- Overwriting the diagonal value while rolling rows. Save D[i-1][j-1] before you ` +
`overwrite it.\\n- Using a recursive solution without memoisation.",
  "edgeCases": "- A equals B: answer 0.\\n- No letters in common: answer max(|A|, |B|).\\n- One string has length 1."
 },
 "complexity": {
  "time": "O(|A| * |B|)",
  "space": "O(|B|)"
 },
 "solutions": {
  "python": "import sys\\ndef main():\\n    d = sys.stdin.read().split()\\n    a, b = d[0], d[1]\\n    m = len(b)\\n    prev = list(range(m + 1))\\n    for i, ca in enumerate(a, 1):\\n        cur = [i] + [0]` +
` * m\\n        for j in range(1, m + 1):\\n            if ca == b[j - 1]:\\n                cur[j] = prev[j - 1]\\n            else:\\n                x = prev[j - 1]\\n                if prev[j] < x: x = p` +
`rev[j]\\n                if cur[j - 1] < x: x = cur[j - 1]\\n                cur[j] = x + 1\\n        prev = cur\\n    print(prev[m])\\nmain()\\n",
  "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\nint main() {\\n    string a, b;\\n    cin >> a >> b;\\n    int m = b.size();\\n    vector<int> prev(m + 1), cur(m + 1);\\n    for (int j = 0; j <= ` +
`m; j++) prev[j] = j;\\n    for (size_t i = 1; i <= a.size(); i++) {\\n        cur[0] = i;\\n        for (int j = 1; j <= m; j++) {\\n            if (a[i - 1] == b[j - 1]) cur[j] = prev[j - 1];\\n          ` +
`  else cur[j] = 1 + min({prev[j - 1], prev[j], cur[j - 1]});\\n        }\\n        swap(prev, cur);\\n    }\\n    printf(\\"%d\\\\n\\", prev[m]);\\n    return 0;\\n}\\n",
  "java": "import java.io.*;\\nimport java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) throws IOException {\\n        BufferedReader br = new BufferedReader(new InputStrea` +
`mReader(System.in));\\n        String a = br.readLine().trim(), b = br.readLine().trim();\\n        int m = b.length();\\n        int[] prev = new int[m + 1], cur = new int[m + 1];\\n        for (int j = ` +
`0; j <= m; j++) prev[j] = j;\\n        for (int i = 1; i <= a.length(); i++) {\\n            cur[0] = i;\\n            char ca = a.charAt(i - 1);\\n            for (int j = 1; j <= m; j++) {\\n            ` +
`    if (ca == b.charAt(j - 1)) cur[j] = prev[j - 1];\\n                else cur[j] = 1 + Math.min(prev[j - 1], Math.min(prev[j], cur[j - 1]));\\n            }\\n            int[] t = prev; prev = cur; cu` +
`r = t;\\n        }\\n        System.out.println(prev[m]);\\n    }\\n}\\n"
 },
 "statement": "A phone keyboard's autocorrect compares what you typed, string A, with a dictionary word, string B. One **edit** is inserting one letter, deleting one letter, or replacing one letter wi` +
`th another.\\n\\nPrint the minimum number of edits that turn A into B.",
 "inputFormat": "The first line contains A.\\nThe second line contains B.\\nBoth contain lowercase English letters only.",
 "outputFormat": "Print the minimum number of edits.",
 "constraints": "1 <= |A|, |B| <= 2000"
}`),
  cases: [
    { input: `a
a
`,
      output: `0
` },
    { input: `a
b
`,
      output: `1
` },
    { input: `abc
xyz
`,
      output: `3
` },
    { input: `kitten
sitting
`,
      output: `3
` },
    { input: `a
aaaaaaaaaa
`,
      output: `9
` },
    { input: `tgoqwpwqlxoxabflxeixbfblhogheelqyukqvmbkieczvrnmohvyeybouphlshecbyvdbypmrkihbmnefgrkulvgphqplfpgtjdxuncmmcjeumhothjhgytppnhfgrkeyfiokxndahscxurymligwzistpzvktffrxlcburmnyayvnropevvumvgtzlbhinryaqtkaki` +
`cmwssbubbqmryxubvpxqelqdmynvzaysbnrngqurzbmijgeyrmjgpdtphwnzbqvxmjegmujolwxhoneshtupfrdlqwphefuikckf
tgoqwpewqlxoxabflxccixafblogheeldyukqvlmbkiecjvrnmzocyeyboupllshcecbyvdbymrkimbmnefgrkulgphqpfpgtjdxuncmcjeumhothjhggtpnhfgrkieyfiokxndahscurymligwzitpzvktffrxlcurmnayvnrodpevvuzmvgazlbhinryaqtkakicws` +
`subbqmryxubvxqelqdmymzaysbnrngquyzbmijgeyrmjgptphwnzbvmjegmujolwxhoneshstupfrdlqwphefuikckf
`,
      output: `38
` },
    { input: `ababbaabbabaaabbbbabbbbaabbaabaaaabaabbaabaaabbbaabbabaaabbbbbbbbbabbababbbbabaababababbabaaabbaabaabaaaabaaababbaaaabaababbbaaabbbbbaabaaaababaababababbababbabbbabaabbabaabbaabbabaabaaaaaabbaabbaaaba` +
`aaabbbaaababbbabbaabbbababaaabbbabaaaaabbaabaaabbbbabaaaabaaaaababaaaaababbbaaaaabaaabaabaabbbabaaababbbbbaaabbbaabaabaaaaabbaabbbaaababbaaabbaaaabababbbaaabababbbaaaabbabbbabbaaaabbaababbabbaabababaa` +
`babbbbabaaaababbbbbbaaabbaaabbaababbaababaaaabbaabbabaaabaaabbbabbaaaaaaaabbbbbabaabbbabbbaaaabababbbabbaaaaabbbaabbababbababbbbbaabababbbbaaaaabaaaabaabbbbaabbbaababbbaaaababbaaaaabbbababbbbbabbaaaaa` +
`ababbaaabaabbbaaaaababbbbabbabaabbabaaaaaabbbbbababaaabaabbabaabbbabbbbabbbbbbbbabaaabbabbaabaabbabbbbbaaabaaabbbbbbbaabbbaababababbbbabbabbbaabbbbaaaabbbbbbbaabbbaaababbbababaabababaabbaaabbababababb` +
`abbbbabababbaaabbabaaabbabbbabbbbbbbabbabbaabbbabbababbaaaabaababbbbbbaabaaabbabbababaaaabbaaababaabbbbabababaabbbaabaababaabbabababbababbaabbababaaaabbaaabbaaaabbbbbbbaaaaabaaaaabbabbaaabbabababbabba` +
`bababbabbabbabbabaaabbabbbbbbbabbbbaaababaabaaabababbbabbbbaabaaabbbbbbabbabbbaabababaaaaaabbaabbbbbabaabbabaaabbabbababbbababaaaabaaababbbababbabaaabbbabbbbaaaaaabbbbbbaabbabbbaabbbbbbaaabbaaaaaabbbb` +
`bbbbabbabbaabaaaabbaaabbbbbabbbababaabbbaaabbbababaababbbbaabbbbabbababbababbababbbababaabbababbbbabbbaabbbbabaabbaaabaabbbaababbabbaabbbbaabbbbbbabbabbabaaaaabbabaaaabaabbbabaabbbabaaaaabbbabaaabbbaa` +
`abbbbbaabababbbbaababbaabaabababaababaabaaaabbaaaababbbbbaaabbabaaabbbbaaaabababbbaabbbababbbbaaabab
rbabbdabbabaabbbabbbaabbaabaaavbaabbakbaaabbbaabbabaaabbvbbbbbbbabtabzabbbbabaababababbabaabaabaabaaaabaaabubzvaaaabaababbbaadbbbbbaabaaaababaabagibababbababbabnbabaabbabaacbeabbabaabaaaaaabbaabbaabaa` +
`aabbbaaababbebabbabbbababaaabbbabaaaaabbaabaaabbbbabaaaabalaaababaaaaabdabbbaaaaabaaabaabaabbabaababbbwbaabbaabhiabaaaaabbaabbbkaabbbabbaaaabababbaaaaabbbaaabbabbbabbaaaabbaababbabbabababtafababbbabaa` +
`akuababgbzbbgaabbaaalbbaaabbaababaaaabbaabbaaaabaaabbbabbamqaaaaabbbbbabgaabrbbabbyaaaabababbbakbaaaaabzbbabbababbababbbbaababbbbbaaaaqabaaaabaabbbaabababbbaaababbaaaalbbbabambbbbabbaaaaaarabbataubaab` +
`bbaaaaababbbbabbababbabaaaaakbbbbbaababbaaabaabbdabaabxbbabbrbbabbbbbshbbbabaaabbabbaabaabbabbbbbaaabayabbbbbbabbbadjpahbabmbpbabbabnbaabbbbaaaabbbbqbbjaabbaaabpabbbabababababaabbaaabbababaobabbbbbbab` +
`ababbavabbabafaabaabbabbbbbbbavbbabbaabbabbababbaaabaacabbbaabaaabbadbabpabaaaabbaaabababbebbaabacanabbbaagaabaabbabababbabaaabbababaaabbaabbyaaabbbbbbbaaaaabaaaaabbabbaaabbabbabbabbabababbabbabbabbab` +
`aaybbabbbbbbabbkbbaaababaabaaabababbbabbbbaabamabbbsbbbababbaabababaaaaaabbaabbbbbabaabbvtabaaabbabbababbbebabaaaabaaababebbababbabaaaxbblbbbbaaaaaabmbbbbbaagbbwarbbaabbbbbbaabbaaaaaabbbbbbbbabbabbaab` +
`aaaabuaabbbbbabbsbabababbbaaabbbababafbabbbbaabbbblabbabablabafbababbbababaabbfbabbbbabbbaabbybnbaabbxaabaabbbaababbabbaabbbbaabbbbbbabeabbabaaaaabbabaaaabaabbbzbaabbbabaaaaybbbabaaabbaaabbbbbaabababb` +
`bbaababbaabaabababaaabaaboiaarabbaaaababbbbbaaabbataaabgbbhaaaabwbfbbbaabbdbabbnbbaaabab
`,
      output: `174
` },
    { input: `cynbxgchpaxusjcujfjzxkhjbymxrqhpwmpgcyvedcvrfibanovxguhdkydmfvokanscywmuierqcellpyjvfizecwctpnmmclvmgssvncuvvnnnsahtrckqbrrmmwinussrarvyjutroikanetjlfpowdinwsvlpwxmqcojhmluuqnuhyrccrenwkkryinvzhhzrqvm` +
`lcaxlvcxhlhrouuvpgumdasclbrywghfwryvvrxqepvwstqsatcgxdsuuopunyhffcsushfvsnzmcjgdoxxspagojrjnjcxnzhfscmykjdhhltrsrnlsbvaqqhljepanebitomweuasalqildrihkljohrcjebjsxyfgnlvomqxihqiwrymzvlxgfgervajopooxyoho` +
`ypktysfzrnfukkdbpsrynjahbafxonxfxwgzirocbnancitslnntjtabcuwfrtmlnwrmeszjbpjtvtawcxlvxyyldlbmnxeentlvotvftrtodihfawbyyvgmxmrlwpaazztdoqmqodqfletrsqgvyfzjoqgzbrxtkfvlgdcqxtataoaihbaxoigqrwidahzgjebdanyf` +
`xmwaxyjmohjhrhzdggmdnnhcqxxvzshttonikgcdckvwxirgdlpmejpdbrxhpktjfknfdtmnldsfqiyzogiugkarpeakqkzomptwngntxcakicqdkqqlsczgrlsexqkaljuelfxaefzumsysgctkoutwdzcejvromttpnmzkdmbirgkpqnxlctmsnjuoupuksyptdptw` +
`hptdvdpxuujtwypiuszdsxgyfmcugnqouehqygukowiseynwqrswslvksndspqakoegiepjmbntmbpaygiahhupiqitoafsiaatcqilgpfemgjpnskfylqtvdiuyhpzhbjauzvhtpnliohbbikeggxfwnxstiihxzrczidcmoplgozghvanzeflzltuxexxcmhpypnaf` +
`woqrzreducmkvmwvyranhamnhdjlcehoqwmagofpbxfmfybnietxobzomciomdoftyhdketgsqdxovjyiphezxttokkkveoqsxdoqnjygsctsdobnervpcvsrkjkmzbvrzfribniwhadtojcqaskmtknoidttwkcigcbatutyriytfzjysbsnlhysgciicfujupqrtwn` +
`gaosobywgacdevwonpahelqbiruggwgctlzfcudfgvquqakxqiczjwkblwwaabjpicvdteslsywyeugmuttacppvyafywmmvugevhysvhfnngvnnhzkqtadhvpwasknbqurvohyyblmqujymhqebupylivadyfigsidcnzrtdnaifguzhfrhwrtmqwwvubnkzjisumge` +
`qvmjqetxnnyaywczefihzfvqwoejjlmrstoxpqebioehujxkyfqclkdkxtxtblkkaykayheibrbvhuidhdfwwwlymgrmekxypafolnkpzxmqkaprobinswrpmdjgwutdydboqmsfpeenqfonpwncttzwhhvxvhpzjsrhjlxwycnlgxktwoiacwnorfcteawbgwrjxpqs` +
`osiiqlgynrvracypcqbbzizmqxjznddvedcvvshsmfhgmrwmmlovstwhkwrgnpjejcxsljexmnvdqioplyqqzodixnwwabqiaidxlxaenoueqpjoehvjoewktuvodffothzqkniyfgxanrdbqrrtipgnhpxtinulnhtxxudcrashhsszmmqyakgkyktrwwuydlhzwxzj` +
`ctsmstxedxcqnhvgwmdhweuhfpdewxedsehpktpmmgzctnofcuohhnjxhyigrizoxzywkoegurikfjzdzoaubzztdxrypeprcqhfaisgaelxmguffgyeplkplszxrgjpyvmkalqeszwnfulntwzgniqcrdocqzxyrnvdtobqbykevffcynzarfvfxcdmyihajcznszpz` +
`
hrdxugcgnanuwqgpaktjopszoucerpcyzicjnvpypnakwiqfmtgcpxmdguvzztxtieklzdcvttdfwrlichhswdjbponaaibidgoeuvynudqusqcpoisvkuogrhegrvwybraypyeosidhbirlrtvjvtdufinalkzhusuityiohdahaddywazmtriizhqmhqfwehlzwmnj` +
`ozssbbewyaxutlxfgoinsauzsltasnoaywdmgrxbvfmyclcdqpeywhikegglbjhyjjhmqchztbafigoyffncslijjhidhkyzzrxxvscmuhuavfyqmrwwosvogyvjrgbxnnkzhpicmrycyvtdjddusfkxumargdjauzfefpcwsjnzfnvfrzkureobvvxkklqcwwivqplx` +
`spfzvfizhjxigsqfjvrhspcjvdeghfaccaltkoygiuianzchjtxsxudytexslqeaxfxjhivsvubhswyusmfpabrhrxgaslihyvsmadgxclggyetdyhqgcblmsybnfncmynouiufxblhdjsworeyzezzgkrlypdsglhrldilldbnnxcrxdghpxfkkdoevtqgmpsucfdwd` +
`igwnhkhxadmwzgocnrhiemapxxlxckgvttltikvzuqxrggaldfpvqauldnuhvkayposrfrdfvtkvaetsbcbshrmtqdxkzcjmetykcwceacztcbruobnxxvheuyuyjhigflswyouurdqdaxukvelfzjublqlpotyelmftcdtiwmgzrfqsiyasyydnzrdlsgtxvbmkuzvf` +
`iaqkmuwmgwrgbxgxrvfddwdpkzsvmxckrpadvlfrucorrqvngmhbdtccjqfnjxfhuybftxsubkexcwwhhnekasuabuefxmjubtqlfnypluvvloddplyeojhdfyxgxfbaoopwvpstgzymprlfdcgrsinfngjwiibkurpuvzelrmcfcrsydznahmouvsqvvqoxmmrutvye` +
`xioskgpdrvnzkqzirmnuwsdxzlnbkxxgegamtrknfllczshxfftbptlcwxlhlcefmyzmtdnanpqfjmepgtxfubiwtgaffmstjtozzzyqigatmkouyqalfdfsjnffxgvyfmmlpfwihityqrbzfwcpzorxpypdrbghdxeeccstwakaeesntxbmbexamirlcftbikolqxad` +
`oiwpvxrblsxnahbdktpuqeawxhvgxgzdjnbunyxlavfgaxnpkuvngpbdppndnqrmydbuuneqmrifwcwhbukroyklueokityvnjwritjznvzwhhfhmhphrrojmjgvzbdlgtmjarngnthynwnareyrrkoulovxgfeqrgbexobkssvelfvjpunlxxiexmufwbnyjwmeravw` +
`ncrcorrishyfrmexxqlobkjgyupjfddjrkmyfdesnipvwqtxpvqedavzzxktfckenymhbboqxlicabqlbmbycbcvxlodgfbwcuwthgdtkxjgbgxdqnvtonsghstsspfxuvxcurlujyxyisaedlsbwipliqeywheozplibaalutftjotyyjcxtpgtqbxrfiepirevgsuo` +
`oobsotnrohqnbpfhfqermgsmeqbyqtbyzfvocdngwpuxaxhhyqdqdfvnktfyviyqreafgkvaneoqythkoabexnpyzgsmcjsiibwjvkwtnztxueugbudgyvxudcscdksmrbalrzaegdatpzsevybyqjvoofgxhmmqaladrfzbmuhrbqkqdkdldlvrvedhrnanrlivtqya` +
`gxhqcxdhjgbqeyjfzrkugjwknmintxedvsfepcrkypffagakxfuekupqdjnjlbmvafcbuvvklrpxnxowtlmtkoczzpcajsmlmsvtmgsleeaorshwwdmfjzdmnysojmbwvpxghzjkprvnpvntbgsetrpledwzmtyoenxqnuxqrtbbkdabywaxtslpowubfkaelitkplbz` +
`
`,
      output: `1773
` },
    { input: `lovemqnnctqafxlmbozugptnjefnuojogdephvvzbqldbiroeqcspeoqeigzotdwvzwrrsxnfqetjekauhhtfywakzdhnqacbdtavzywdvqonbnqrgtzipoocqgvvlkgjxwvtylnzskdgtcxqcpqtglfjgcbevjpgrdpraztpxyckgfudqdwalccxelamijptpdpdxsi` +
`omtsjggcrnnvbyfrovibwepyfmhbvsgnusppdnuthwywwktaurojynwdljxhmfzmldrlpnamzfuraqzrhbuzxkydzdlztcnnacoxqdccxwakassjtxmixvgamfmcvhezeelsrjpdglnazneijavxyyumyrczoqtxriihcgxgyvhkygavsxoycoyuxvjurkijljlkffad` +
`clkugvcqezycymruvjumownzedfdajvkmiedormcpjpvxijqlsjriwwdsrtuptaqsvfhvqjgveycsbhohdlabavqekefpbnubrvmcgxadkuckgmrkxiwyjpbhcviozlimjnetijeytwiokihstytzyaxzbhgkxlakakmpejenqjtzxatcuefscfsegispiymcrdosjqd` +
`xcgliragjgsnpirrqoekkpyrtvesbtmxenegtpjcshybxdvowtbklxdhtfqdfwglxxugnupghgtbzyxnhxwdqgvruvjygqfrfgwzxxmfhecwttedczmdtscbonzacgfodusuhgqxoasemiquxrmgasqusbtvmczqaeaggvcoerxbzwxakyrjlcndpuvfvcynpcexzzsr` +
`hlczafsbguvsplzskqjzjjnkemnbkdmbxurwfvvbpbltgognghhrlchxrqduxwbrcbzzksbwryvurkgeducrkkccyqrehqjufibrtksrcxmodnxpaarisvqmflsiphqqplgfuypsfdhlhzvuivfekxcosyxhwvuonbytjnmdeovukzupymklnkfeenvcakmliscvzbbg` +
`lfzpfomxqfquhyxwbtlyfsnsqoxczejidblhziyzlqxsyjhjqnmefbjfzaildroxfyjfwacwjqssugekdfcxtglmwfjlbpycohynjcngifpoezvensivosrdwnuvbpovcwosdxrelfenxypltqawqrtgwjstdmdhmtymgykixhdgahwbffaydwtgdgqxbukgbemggqwg` +
`miiwfldvbhyxoknfvszxyjuovcgxdzgcxsokvtfqoewpuuudjcenpqgqhbhnrrtbfbjdavzrapjhsveonhabmllkslyhasobbnrsznlujdxusaotvbskwfgdqzjshbesjbxfjoivjiaauojvinphieodaqjdxanlikrdkqjzastkqzfvtttogkvdinwdhlkrlutzfuav` +
`zempppcugpfnvhyqmvywtiznevwpgmtzasmvwzqitawnzxrpjtuibfjxvtckclfqesbrcwcltwosbgopjgemjxmgcaoaocwoswbcvveyweqrpnmjvsrbhipalaokkkshamlakpkkxfazmzinxypknargmdgchbenhlyxxzasyrmlklfyydwymsmscnflmtnwvthbqnln` +
`cegznbbtiwzcateofzwvinynrprnfgktqkqotmmbxiiscczbxycxouinvcquaznzyuwawjxuzswlzifrsbnmypymctvgdhjsfgzisoiiqupsxamgkxxhebvlfpchtlpmdtzwguuvaurajsanxgmgqhhijztvaqjeukishymdlbqazsdyjnchinoxryweyyvooguvhqmt` +
`bsjaibjmbnnpgnuzplsvbxkwdkvjxdjrujyhycmsrpoypanmzdrtfynyyligisfxbrxrbkyesuwujxoclkzohsighutmlvaiwoklkbulengmuuvqfpmjrkjsxorzjiowokuvtnzzmxeuudnbxfpzueccmxjrimakkxntfpkelchsmhrcuwlkmxhibaagdeqoncrhejxp` +
`
lovemqnnctqafxlmbozugptnjefnuojogdephvvzbqldbiroeqcspeoqeigzotdwvzwrrsxnfqetjekauhhtfywakzdhnqacbdtavzywdvqonbnqrgtzipoocqgvvlkgjxwvtylnzskdgtcxqcpqtglfjgcbevjpgrdpraztpxyckgfudqdwalccxelamijptpdpdxsi` +
`omtsjggcrnnvbyfrovibwepyfmhbvsgnusppdnuthwywwktaurojynwdljxhmfzmldrlpnamzfuraqzrhbuzxkydzdlztcnnacoxqdccxwakassjtxmixvgamfmcvhezeelsrjpdglnazneijavxyyumyrczoqtxriihcgxgyvhkygavsxoycoyuxvjurkijljlkffad` +
`clkugvcqezycymruvjumownzedfdajvkmiedormcpjpvxijqlsjriwwdsrtuptaqsvfhvqjgveycsbhohdlabavqekefpbnubrvmcgxadkuckgmrkxiwyjpbhcviozlimjnetijeytwiokihstytzyaxzbhgkxlakakmpejenqjtzxatcuefscfsegispiymcrdosjqd` +
`xcgliragjgsnpirrqoekkpyrtvesbtmxenegtpjcshybxdvowtbklxdhtfqdfwglxxugnupghgtbzyxnhxwdqgvruvjygqfrfgwzxxmfhecwttedczmdtscbonzacgfodusuhgqxoasemiquxrmgasqusbtvmczqaeaggvcoerxbzwxakyrjlcndpuvfvcynpcexzzsr` +
`hlczafsbguvsplzskqjzjjnkemnbkdmbxurwfvvbpbltgognghhrlchxrqduxwbrcbzzksbwryvurkgeducrkkccyqrehqjufibrtksrcxmodnxpaarisvqmflsiphqqplgfuypsfdhlhzvuivfekxcosyxhwvuonbytjnmdeovukzupymklnkfeenvcakmliscvzbbg` +
`lfzpfomxqfquhyxwbtlyfsnsqoxczejidblhziyzlqxsyjhjqnmefbjfzaildroxfyjfwacwjqssugekdfcxtglmwfjlbpycohynjcngifpoezvensivosrdwnuvbpovcwosdxrelfenxypltqawqrtgwjstdmdhmtymgykixhdgahwbffaydwtgdgqxbukgbemggqwg` +
`miiwfldvbhyxoknfvszxyjuovcgxdzgcxsokvtfqoewpuuudjcenpqgqhbhnrrtbfbjdavzrapjhsveonhabmllkslyhasobbnrsznlujdxusaotvbskwfgdqzjshbesjbxfjoivjiaauojvinphieodaqjdxanlikrdkqjzastkqzfvtttogkvdinwdhlkrlutzfuav` +
`zempppcugpfnvhyqmvywtiznevwpgmtzasmvwzqitawnzxrpjtuibfjxvtckclfqesbrcwcltwosbgopjgemjxmgcaoaocwoswbcvveyweqrpnmjvsrbhipalaokkkshamlakpkkxfazmzinxypknargmdgchbenhlyxxzasyrmlklfyydwymsmscnflmtnwvthbqnln` +
`cegznbbtiwzcateofzwvinynrprnfgktqkqotmmbxiiscczbxycxouinvcquaznzyuwawjxuzswlzifrsbnmypymctvgdhjsfgzisoiiqupsxamgkxxhebvlfpchtlpmdtzwguuvaurajsanxgmgqhhijztvaqjeukishymdlbqazsdyjnchinoxryweyyvooguvhqmt` +
`bsjaibjmbnnpgnuzplsvbxkwdkvjxdjrujyhycmsrpoypanmzdrtfynyyligisfxbrxrbkyesuwujxoclkzohsighutmlvaiwoklkbulengmuuvqfpmjrkjsxorzjiowokuvtnzzmxeuudnbxfpzueccmxjrimakkxntfpkelchsmhrcuwlkmxhibaagdeqoncrhejxp` +
`
`,
      output: `0
` },
  ],
};
