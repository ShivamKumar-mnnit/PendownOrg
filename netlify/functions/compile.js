import { handleCompile } from "../../src/lib/compileHandler.js";
import { blobStore } from "../../src/lib/server/blobStore.js";
import { readRunner } from "../../src/lib/server/auth.js";

export default async function handler(request) {
  if (request.method !== "POST") {
    return Response.json({ error: "Use POST." }, { status: 405 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // The backup runner (admin → Compiler) is optional; a storage hiccup must not stop the main runner.
  const runner = await readRunner(blobStore("anobyt-content")).catch(() => null);
  const { statusCode, body: responseBody } = await handleCompile(body, runner);
  return Response.json(responseBody, { status: statusCode });
}

export const config = {
  path: "/api/compile",
};
