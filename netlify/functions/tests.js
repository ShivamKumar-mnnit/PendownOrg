import { getStore } from "@netlify/blobs";
import { handleTestsApi } from "../../src/lib/server/testsApi.js";

// Admin-created tests and student submissions live in Netlify Blobs (no
// separate database needed). Strong consistency so an admin's edit is
// visible to the next request straight away.
function blobStore() {
  const store = getStore({ name: "anobyt-tests", consistency: "strong" });
  return {
    get: (k) => store.get(k, { type: "json" }),
    set: (k, v) => store.setJSON(k, v),
    delete: (k) => store.delete(k),
    async list(prefix) {
      const { blobs } = await store.list({ prefix });
      return blobs.map((b) => b.key);
    },
  };
}

export default async function handler(request) {
  return handleTestsApi(request, blobStore(), { ADMIN_PASSWORD: process.env.ADMIN_PASSWORD });
}

export const config = {
  path: ["/api/tests", "/api/tests/*", "/api/admin/login"],
};
