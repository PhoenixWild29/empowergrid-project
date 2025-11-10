export const relativeTimeFromNow = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';

  const diff = date.getTime() - Date.now();
  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
    { unit: 'day', ms: 86_400_000 },
    { unit: 'hour', ms: 3_600_000 },
    { unit: 'minute', ms: 60_000 },
  ];

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const { unit, ms } of units) {
    const value = diff / ms;
    if (Math.abs(value) >= 1 || unit === 'minute') {
      return formatter.format(Math.round(value), unit);
    }
  }

  return formatter.format(Math.round(diff / 1000), 'second');
};
