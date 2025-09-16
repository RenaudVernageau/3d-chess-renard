// frontend/src/utils/dates.js

// Retourne "Aujourd’hui", "Hier", "Lun", "Mar", ..., ou "12 mars 2025"
export function formatDayLabel(date, { withYear = true } = {}) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const dY = d.getFullYear(), dM = d.getMonth(), dD = d.getDate();
  const nY = now.getFullYear(), nM = now.getMonth(), nD = now.getDate();

  const isToday = dY === nY && dM === nM && dD === nD;
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  const isYesterday = dY === yest.getFullYear() && dM === yest.getMonth() && dD === yest.getDate();

  if (isToday) return "Aujourd’hui";
  if (isYesterday) return "Hier";

  // Même année ? on peut omettre l'année si on veut
  const opts = { weekday: "long", day: "numeric", month: "long" };
  if (withYear && dY !== nY) opts.year = "numeric";

  return new Intl.DateTimeFormat("fr-FR", opts).format(d);
}

export function formatTimeHHmm(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

// Pour la **liste des conversations** (colonne gauche) :
// -> "Aujourd’hui 23:09", "Hier 19:43", "Lun 11:03" (si même semaine), sinon "12/03/2025 08:10"
export function formatListTimestamp(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = (startOfDay(now) - startOfDay(d)) / 86400000; // jours

  if (diff === 0) return `Aujourd’hui ${formatTimeHHmm(d)}`;
  if (diff === 1) return `Hier ${formatTimeHHmm(d)}`;

  // même semaine ?
  const wd = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d); // "lun.", "mar."
  const sameWeek = inSameWeek(d, now);
  if (sameWeek) return `${capitalize(wd.replace(".", ""))} ${formatTimeHHmm(d)}`;

  return `${new Intl.DateTimeFormat("fr-FR").format(d)} ${formatTimeHHmm(d)}`;
}

// Regroupe une liste de messages par jour (clé = ISO yyyy-mm-dd)
export function groupMessagesByDay(messages, getDate = (m) => m.createdAt || m.date) {
  const map = new Map();
  for (const m of messages) {
    const d = new Date(getDate(m));
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  // tri par jour croissant
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, arr]) => ({ key, date: new Date(key), items: arr.sort((a,b)=>new Date(getDate(a))-new Date(getDate(b))) }));
}

/* helpers */
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function inSameWeek(a, b) {
  const onejan = (y) => new Date(y, 0, 1);
  const week = (d) => {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(),0,1));
    return Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
  };
  return a.getFullYear() === b.getFullYear() && week(a) === week(b);
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
