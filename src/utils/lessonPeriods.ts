import { latinDigits } from './moroccanClasses.js';

/** Normalize only explicit, unambiguous same-day clock intervals. */
export function normalizePeriod(value: string): string | undefined {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?$/.exec(latinDigits(value).trim());
  if (!match) return undefined;
  const [, fromHour, fromMinute = '00', toHour, toMinute = '00'] = match;
  const start = Number(fromHour) * 60 + Number(fromMinute), end = Number(toHour) * 60 + Number(toMinute);
  if (+fromHour > 23 || +toHour > 23 || +fromMinute > 59 || +toMinute > 59 || end <= start) return undefined;
  return `${fromHour.padStart(2, '0')}:${fromMinute}-${toHour.padStart(2, '0')}:${toMinute}`;
}

export function periodLabels(periods?: string[]) {
  return periods?.map(period => period.replace('-', '–')).join(', ') || '';
}
