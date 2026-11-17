import { blobStore } from "../../src/lib/server/blobStore.js";
import { handleCodevitaApi, setBuiltinBank } from "../../src/lib/server/codevita.js";
import { CV_BUILTIN } from "../../src/lib/codevita/bank.js";

// On Netlify the bank is bundled with the function.
setBuiltinBank(async () => CV_BUILTIN);

// CodeVita crash course: question bank, judge, submissions and scorecards.
// Its own store for submissions and progress; accounts, prices and courses
// come from the shared content store.
export default async function handler(request) {
  return handleCodevitaApi(request, blobStore("anobyt-codevita"), blobStore("anobyt-content"), { ADMIN_PASSWORD: process.env.ADMIN_PASSWORD });
}

export const config = {
  path: ["/api/cv/*"],
};
