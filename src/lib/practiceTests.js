// Ready-made practice tests (/practice), plus encoding for trainer-made
// tests, which travel entirely inside the share link (no server).

export const SAMPLES = {c1:{t:'C programming: operators and if-else',m:15,qs:[
{q:'What is the output of: int a = 7, b = 2; printf("%d", a / b);',o:['3','3.5','4','2'],a:0},
{q:'What is the value of 17 % 5 in C?',o:['3','2','4','1'],a:1},
{q:'Which operator checks whether two values are equal?',o:['=','==','!=','==='],a:1},
{q:'If int x = 5, what is x after x += 3?',o:['5','3','8','15'],a:2},
{q:'What is the result of (5 > 3) && (2 > 4)?',o:['1','0','5','Compile error'],a:1},
{q:'What does !0 evaluate to in C?',o:['0','1','-1','Undefined'],a:1},
{q:'What is printed? int a = 4; if (a % 2 == 0) printf("Even"); else printf("Odd");',o:['Odd','Even','EvenOdd','Nothing'],a:1},
{q:'What is printed? int x = 10; if (x > 20) printf("Big"); printf("End");',o:['Big','BigEnd','End','Nothing'],a:2},
{q:'Which statement about if-else in C is true?',o:['else needs its own condition','else runs when the if condition is false','if cannot run without else','if and else always both run'],a:1},
{q:'What is the output of: int a = 5; printf("%d", a++ + 2);',o:['8','7','6','5'],a:1}]},
apt:{t:'Aptitude starter test',m:10,qs:[
{q:'What is 20% of 250?',o:['40','45','50','60'],a:2},
{q:'A train travels at 60 km/h. How long does it take to cover 150 km?',o:['2 hours','2.5 hours','3 hours','3.5 hours'],a:1},
{q:'What comes next in the series: 2, 6, 12, 20, ?',o:['28','30','32','36'],a:1},
{q:'What is the simple interest on 1000 at 10% per year for 2 years?',o:['100','150','200','250'],a:2},
{q:'What is the average of 10, 20, 30 and 40?',o:['20','25','30','35'],a:1}]}};

/** Packs a test into a URL-safe string for /take?d=... */
export function encodeTest(test) {
  const bytes = new TextEncoder().encode(JSON.stringify(test));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/** Reverses encodeTest. Returns null for a broken or incomplete link. */
export function decodeTest(data) {
  try {
    const bin = atob(data);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const test = JSON.parse(new TextDecoder().decode(bytes));
    if (!test || !test.t || !Array.isArray(test.qs) || !test.qs.length) return null;
    return test;
  } catch {
    return null;
  }
}
