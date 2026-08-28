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
