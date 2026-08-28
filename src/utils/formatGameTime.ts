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
