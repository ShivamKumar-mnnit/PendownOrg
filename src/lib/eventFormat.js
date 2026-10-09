import { eventDate } from "./contentApi";

export function fmtDay(s) {
  const d = eventDate(s);
  return d ? { day: d.getDate(), month: d.toLocaleString("en-IN", { month: "short" }), weekday: d.toLocaleString("en-IN", { weekday: "short" }) } : null;
}

export function fmtWhen(e) {
  const d = eventDate(e.start);
  if (!d) return "Date to be announced";
  const date = d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleString("en-IN", { hour: "numeric", minute: "2-digit" });
  const end = eventDate(e.end);
  const endTime = end ? end.toLocaleString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";
  return `${date} · ${time}${endTime ? ` – ${endTime}` : ""}`;
}

/** Google Calendar "add event" link. */
export function calendarLink(e) {
  const start = eventDate(e.start);
  if (!start) return "";
  const end = eventDate(e.end) || new Date(start.getTime() + 60 * 60 * 1000);
  const z = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${z(start)}/${z(end)}`,
    details: `${e.summary || ""}\n\n${window.location.origin}/talks/${e.id}`,
    location: e.mode === "online" ? "Online" : e.venue || "",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function countdown(ms) {
  if (ms <= 0) return "";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}
