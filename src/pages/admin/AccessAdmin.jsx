import { useCallback, useState } from "react";
import { adminAccess, saveAccess } from "../../lib/account";
import { Gate, SectionTop } from "./shared";
import { useAdminData } from "./adminUtils";

/** Which premium features exist, whether each is free or paid, its price and how long a purchase lasts. */
export default function AccessAdmin() {
  const load = useCallback(() => adminAccess(), []);
  const state = useAdminData(load);
  return (
    <div>
      <SectionTop
        title="Premium features and prices"
        text="Choose what is free and what students or colleges pay for. Course and module prices are set on each course in the Courses tab."
      />
      <Gate state={state}>{state.data && <AccessFields initial={state.data} />}</Gate>
    </div>
  );
}

function AccessFields({ initial }) {
  const [a, setA] = useState(initial.access);
  const [msg, setMsg] = useState("");
  const set = (id, patch) => setA({ ...a, [id]: { ...a[id], ...patch } });

  async function save() {
    setMsg("");
    try {
      setA(await saveAccess(a));
      setMsg("Saved. Prices update on the site straight away.");
    } catch (x) {
      setMsg(x.message);
    }
  }

  return (
    <div>
      <div className="tablewrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Available</th>
              <th>Access</th>
              <th>Price (₹)</th>
              <th>Lasts</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(initial.features).map(([id, f]) => {
              const c = a[id];
              return (
                <tr key={id}>
                  <td style={{ maxWidth: 360 }}>
                    <b>{f.title}</b>
                    <small style={{ display: "block", color: "var(--color-fg-muted)" }}>{f.text}</small>
                    {id === "collegePanel" && <small style={{ display: "block", color: "var(--color-accent)" }}>Includes Create tests and Student records.</small>}
                    {id === "allAccess" && <small style={{ display: "block", color: "var(--color-accent)" }}>Includes Premium practice, All premium courses and Create tests.</small>}
                    {id === "practice" && <small style={{ display: "block", color: "var(--color-accent)" }}>Switch it off to make every practice problem free. Free share and solution rules are in the Problems tab.</small>}
                  </td>
                  <td>
                    <label className="mini">
                      <input type="checkbox" checked={c.enabled} onChange={(e) => set(id, { enabled: e.target.checked })} /> On
                    </label>
                  </td>
                  <td>
                    <select className="inp" value={c.paid ? "paid" : "free"} onChange={(e) => set(id, { paid: e.target.value === "paid" })} disabled={!c.enabled}>
                      <option value="free">Free for signed-in users</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                  <td>
                    <input className="inp" type="number" min={0} value={c.price} onChange={(e) => set(id, { price: e.target.value })} disabled={!c.enabled || !c.paid} style={{ width: 120 }} />
                  </td>
                  <td>
                    <select className="inp" value={c.days} onChange={(e) => set(id, { days: Number(e.target.value) })} disabled={!c.enabled || !c.paid}>
                      {[
                        [30, "1 month"],
                        [90, "3 months"],
                        [180, "6 months"],
                        [365, "1 year"],
                        [730, "2 years"],
                        [0, "Lifetime"],
                      ].map(([d, l]) => (
                        <option key={d} value={d}>
                          {l}
                        </option>
                      ))}
                      {![30, 90, 180, 365, 730, 0].includes(Number(c.days)) && <option value={c.days}>{c.days} days</option>}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ marginTop: 16, alignItems: "center" }}>
        <button type="button" className="btn" onClick={save}>
          Save prices
        </button>
        {msg && <span className="note" style={{ margin: 0 }}>{msg}</span>}
      </div>
      <p className="note" style={{ marginTop: 18 }}>
        To give a feature to someone for free (for example a partner college), open the Users tab and add it to their account.
      </p>
    </div>
  );
}
