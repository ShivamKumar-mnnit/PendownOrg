import { handleCompile } from "../../src/lib/compileHandler.js";

export default async function handler(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { statusCode, body: responseBody } = await handleCompile(body);
  return Response.json(responseBody, { status: statusCode });
}

export const config = {
  path: "/api/compile",
};
