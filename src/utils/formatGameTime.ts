const WITH_ZONE = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

const WITHOUT_ZONE = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * Formats an ESPN event's UTC `date` string in the device's own locale and
 * timezone (no explicit timeZone passed, so it resolves to whatever the
 * device is set to) rather than the fixed-timezone string ESPN sends back.
 */
export function formatLocalKickoff(dateIso: string): string {
  const date = new Date(dateIso);
  try {
    return WITH_ZONE.format(date);
  } catch {
    // Some engines don't support timeZoneName in every locale; degrade gracefully.
    return WITHOUT_ZONE.format(date);
  }
}

const TIME_ONLY = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const WEEKDAY_DATE = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: '2-digit', day: '2-digit' });

/** Just the kickoff time in the device's own timezone, e.g. "6:30 PM". */
export function formatKickoffTime(dateIso: string): string {
  return TIME_ONLY.format(new Date(dateIso));
}

/** Just the kickoff date in the device's own timezone, e.g. "Fri, 08/28". */
export function formatKickoffDate(dateIso: string): string {
  return WEEKDAY_DATE.format(new Date(dateIso));
}

const WEEKDAY_MONTH_DAY = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/** A longer, more readable date than formatKickoffDate's numeric form, e.g.
 * "Sun, Sep 13" — for contexts with more room (ScoreBug) than a compact
 * list card (GameCard). */
export function formatKickoffDateLong(dateIso: string): string {
  return WEEKDAY_MONTH_DAY.format(new Date(dateIso));
}

/** Just the device's timezone abbreviation for this instant, e.g. "GMT+10" —
 * null if the engine doesn't support timeZoneName in formatToParts. */
export function formatKickoffZone(dateIso: string): string | null {
  try {
    return WITH_ZONE.formatToParts(new Date(dateIso)).find((p) => p.type === 'timeZoneName')?.value ?? null;
  } catch {
    return null;
  }
}

/** YYYYMMDD in local calendar terms, for ESPN's scoreboard `dates` param. */
export function toEspnDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** Local-midnight Date for a given day offset from today (0 = today). */
export function dateWithOffset(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

/** A new Date offset by `days` from the given date (negative goes backward). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Built from separate weekday/month formatters rather than one combined
// Intl.DateTimeFormat — a combined `{ weekday: 'long', month: 'long', day:
// 'numeric' }` formatter inserts a locale-dependent comma after the weekday
// ("Friday, September 11") that this label is deliberately meant not to have.
const AGENDA_WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const AGENDA_MONTH = new Intl.DateTimeFormat(undefined, { month: 'long' });

// 11th/12th/13th are the exception to the last-digit rule (they'd otherwise
// read as "11st"/"12nd"/"13rd" going purely off the final digit).
function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/** Section-header label for an "Upcoming" agenda list — "Tomorrow" for the
 * very next day, otherwise a full weekday + date (e.g. "Friday 11th September"). */
export function formatAgendaSectionLabel(date: Date, today: Date): string {
  if (isSameLocalDay(date, addDays(today, 1))) return 'Tomorrow';
  return `${AGENDA_WEEKDAY.format(date)} ${ordinal(date.getDate())} ${AGENDA_MONTH.format(date)}`;
}
