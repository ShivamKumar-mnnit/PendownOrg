// Cloudflare D1 version of src/lib/server/blobStore.js: the same small get/set/delete/list
// interface the API handlers use, so they run unchanged on Cloudflare Pages.
//
// Everything lives in one table, one row per (store, key), with the value as JSON text. D1 reads
// after a write see that write, which the handlers rely on (an admin's edit is visible to the next
// request), the same guarantee the Netlify Blobs version asked for with "strong" consistency.
//
// The table is created on first use, so a fresh database needs no setup step.

let ready = null;
function ensureTable(db) {
  if (!ready)
    ready = db
      .prepare("CREATE TABLE IF NOT EXISTS kv (store TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (store, key))")
      .run()
      .catch((e) => {
        ready = null; // try again on the next request
        throw e;
      });
  return ready;
}

/** A store named `name` (e.g. "anobyt-content") in the D1 database bound as `db`. */
export function d1Store(db, name) {
  if (!db) throw new Error("The D1 database isn't bound to this site. Add a D1 binding named DB in Cloudflare Pages settings.");
  return {
    async get(key) {
      await ensureTable(db);
      const row = await db.prepare("SELECT value FROM kv WHERE store = ?1 AND key = ?2").bind(name, key).first();
      return row ? JSON.parse(row.value) : null;
    },
    async set(key, value) {
      await ensureTable(db);
      await db
        .prepare("INSERT INTO kv (store, key, value, updated_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT (store, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
        .bind(name, key, JSON.stringify(value), Date.now())
        .run();
    },
    async delete(key) {
      await ensureTable(db);
      await db.prepare("DELETE FROM kv WHERE store = ?1 AND key = ?2").bind(name, key).run();
    },
    /** Keys that start with `prefix` (all keys when it's empty). */
    async list(prefix = "") {
      await ensureTable(db);
      // substr() instead of LIKE, so "_" and "%" in keys aren't treated as wildcards.
      const { results } = await db
        .prepare("SELECT key FROM kv WHERE store = ?1 AND substr(key, 1, length(?2)) = ?2 ORDER BY key")
        .bind(name, prefix || "")
        .all();
      return results.map((r) => r.key);
    },
  };
}
