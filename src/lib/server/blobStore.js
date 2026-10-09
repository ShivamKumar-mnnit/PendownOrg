import { getStore } from "@netlify/blobs";

// Wraps a Netlify Blobs store in the small get/set/delete/list interface the
// API handlers use. Strong consistency so an admin's edit is visible to the
// next request straight away. Only imported by netlify/functions/*.
export function blobStore(name) {
  const store = getStore({ name, consistency: "strong" });
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
