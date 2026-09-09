// Two representative colors per national flag, keyed by the exact country
// name strings produced by api.ts's GP_COUNTRY table (the same F1 race-name
// lookup that derives MotorsportEvent.locationName) — flag colors are public,
// standardized national symbols, not something that needs live API
// verification the way schedule/roster data does.
export const FLAG_COLORS: Record<string, [string, string]> = {
  Australia: ['#00247D', '#E4002B'],
  China: ['#DE2910', '#FFDE00'],
  Japan: ['#BC002D', '#FFFFFF'],
  Bahrain: ['#CE1126', '#FFFFFF'],
  'Saudi Arabia': ['#006C35', '#FFFFFF'],
  'United States': ['#3C3B6E', '#B22234'],
  Canada: ['#FF0000', '#FFFFFF'],
  Monaco: ['#CE1126', '#FFFFFF'],
  Spain: ['#AA151B', '#F1BF00'],
  Austria: ['#ED2939', '#FFFFFF'],
  'Great Britain': ['#00247D', '#CF142B'],
  Belgium: ['#FDDA24', '#EF3340'],
  Hungary: ['#CE2939', '#477050'],
  Netherlands: ['#AE1C28', '#21468B'],
  Italy: ['#008C45', '#CD212A'],
  Azerbaijan: ['#00B5E2', '#EF3340'],
  Malaysia: ['#CC0001', '#010066'],
  Singapore: ['#EF3340', '#FFFFFF'],
  Mexico: ['#006847', '#CE1126'],
  Brazil: ['#009B3A', '#FEDF00'],
  Qatar: ['#8D1B3D', '#FFFFFF'],
  'United Arab Emirates': ['#00732F', '#FF0000'],
};

// Two representative colors per US state flag, keyed the same way — but
// only for the states that actually appear in NASCAR's own event names
// (live-checked against the full 2026 Cup Series calendar: "NASCAR Cup
// Series at Kansas", "... at Texas", "... at Michigan", "... at Iowa", "...
// at New Hampshire"). NASCAR names most other races after the host city or
// track ("at Bristol", "at Charlotte"), not a state, and this deliberately
// doesn't guess which state a city belongs to — extend this list if a
// future season's calendar adds another state-named race.
export const US_STATE_FLAG_COLORS: Record<string, [string, string]> = {
  Kansas: ['#002664', '#FFC72C'],
  Texas: ['#002868', '#BF0A30'],
  Michigan: ['#002D72', '#FFCB05'],
  Iowa: ['#002868', '#BF0A30'],
  'New Hampshire': ['#002868', '#FFC72C'],
};
