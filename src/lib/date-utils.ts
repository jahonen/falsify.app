type DateLike = Date | string | number;

const DAY_MS = 86_400_000;

function toDate(input: DateLike): Date {
  return input instanceof Date ? new Date(input.getTime()) : new Date(input);
}

function toUtcDateOnly(input: DateLike): Date {
  const d = toDate(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function nowUtcDateOnly(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function diffDaysFloor(from: DateLike, to: DateLike): number {
  const a = toUtcDateOnly(from).getTime();
  const b = toUtcDateOnly(to).getTime();
  return Math.floor((b - a) / DAY_MS);
}

export function daysSince(input: DateLike): number {
  return diffDaysFloor(input, new Date());
}

export function daysUntil(input: DateLike): number {
  const now = nowUtcDateOnly().getTime();
  const tgt = toUtcDateOnly(input).getTime();
  return Math.ceil((tgt - now) / DAY_MS);
}

export function daysBetween(from: DateLike, to: DateLike): number {
  return diffDaysFloor(from, to);
}

export function formatDaysHuman(days: number): string {
  const abs = Math.abs(Math.trunc(days));
  const years = Math.floor(abs / 365);
  const remDays = abs % 365;
  if (years > 0) {
    if (remDays > 0) {
      return `${years} ${years === 1 ? "year" : "years"} and ${remDays} ${remDays === 1 ? "day" : "days"}`;
    }
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  return `${abs} ${abs === 1 ? "day" : "days"}`;
}
