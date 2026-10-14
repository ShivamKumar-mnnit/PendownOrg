// The test builder from the admin panel, pointed at the signed-in user's own
// tests. A 401 here means the sign-in expired, which the builder must not
// mistake for a wrong admin password.
import { createMyTest, deleteMyTest, myTest, myTestResults, myTests, updateMyTest } from "./account";

const relabel = (p) =>
  p.catch((e) => {
    if (e.status === 401) e.status = 0;
    throw e;
  });

export const USER_TESTS = {
  list: () => relabel(myTests().then((d) => d.tests)),
  getFull: (id) => relabel(myTest(id)),
  create: (t) => relabel(createMyTest(t)),
  update: (id, t) => relabel(updateMyTest(id, t)),
  remove: (id) => relabel(deleteMyTest(id)),
  results: (id) => relabel(myTestResults(id)),
};
