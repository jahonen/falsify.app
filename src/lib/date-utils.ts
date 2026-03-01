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
