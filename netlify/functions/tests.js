import { blobStore } from "../../src/lib/server/blobStore.js";
import { handleTestsApi } from "../../src/lib/server/testsApi.js";

// Admin-created tests and student submissions live in Netlify Blobs (no
// separate database needed).
export default async function handler(request) {
  return handleTestsApi(request, blobStore("anobyt-tests"), { ADMIN_PASSWORD: process.env.ADMIN_PASSWORD });
}

export const config = {
  path: ["/api/tests", "/api/tests/*", "/api/admin/login"],
};
