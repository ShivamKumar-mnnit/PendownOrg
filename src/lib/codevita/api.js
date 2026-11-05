// Browser client for the CodeVita API (netlify/functions/codevita.js).
import { useEffect, useState } from "react";
import { call, getAdminKey } from "../testsApi";
import { useAccount, userHeaders } from "../account";

const enc = encodeURIComponent;
// The admin's key (when the admin unlocked the site-content tabs in this tab) lets them open every problem.
const headers = () => ({ ...userHeaders(), ...(getAdminKey() ? { "x-admin-key": getAdminKey() } : {}) });
const get = (path) => call(path, { headers: headers() });
const post = (path, body) => call(path, { method: "POST", body, headers: headers() });

export const cvRun = (body) => post("/api/cv/run", body);
export const cvSubmit = (body) => post("/api/cv/submit", body);
export const cvJudge = (sid) => post(`/api/cv/submissions/${enc(sid)}/judge`, {});
export const cvSubmission = (sid) => get(`/api/cv/submissions/${enc(sid)}`);
export const cvMine = (pid) => get(`/api/cv/me${pid ? `?problem=${enc(pid)}` : ""}`);

/**
 * Submits and judges batch by batch. `onProgress(submission)` gets every partial result.
 * A failed batch is retried twice before giving up (the submission stays saved).
 */
export async function submitAndJudge(body, onProgress) {
  const start = await cvSubmit(body);
  let sub = null;
  for (let guard = 0; guard < start.batches + 6; guard++) {
    let r = null;
    for (let attempt = 0; attempt < 3 && !r; attempt++) {
      try {
        r = await cvJudge(start.id);
      } catch (e) {
        if (attempt === 2 || e.status === 403 || e.status === 404) throw e;
        await new Promise((z) => setTimeout(z, 1200));
      }
    }
    sub = r.submission;
    onProgress?.(sub);
    if (r.done) return sub;
  }
  return sub;
}

/** Loads an API path again whenever the signed-in account or its premium access changes. */
export function useCv(path, bump = 0) {
  const { user, features, loaded } = useAccount();
  const key = `${path}|${user?.id || ""}|${features?.codevita?.has ? 1 : 0}|${features?.allAccess?.has ? 1 : 0}|${loaded ? 1 : 0}|${bump}`;
  const [state, setState] = useState({ key: "", data: null, error: "" });
  useEffect(() => {
    if (!loaded || !path) return;
    let on = true;
    get(path).then(
      (data) => on && setState({ key, data, error: "" }),
      (e) => on && setState({ key, data: null, error: e.message || "Couldn't load. Please refresh." }),
    );
    return () => {
      on = false;
    };
  }, [key, path, loaded]);
  const fresh = state.key === key;
  return { data: fresh ? state.data : null, error: fresh ? state.error : "", loading: !fresh };
}
