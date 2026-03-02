import { daysSince, daysUntil, formatDaysHuman } from "../../lib/date-utils";

type DateLike = Date | string | number;

type Props = {
  date: DateLike;
  variant: "since" | "deadline";
  label?: string;
  pastLabel?: string;
  fallback?: string;
  className?: string;
};

export default function RelativeDaysText({ date, variant, label, pastLabel, fallback = "TBA", className }: Props) {
  if (variant === "since") {
    const d = daysSince(date);
    if (!Number.isFinite(d)) return <span className={className}>{fallback}</span>;
    const prefix = label ? `${label} ` : "";
    return <span className={className}>{`${prefix}${formatDaysHuman(d)} ago`}</span>;
  }
  const d = daysUntil(date);
  if (!Number.isFinite(d)) return <span className={className}>{fallback}</span>;
  if (d >= 0) {
    const base = label ?? "Closes";
    return <span className={className}>{`${base} in ${formatDaysHuman(d)}`}</span>;
  }
  const closed = pastLabel ?? "Closed";
  return <span className={className}>{`${closed} ${formatDaysHuman(d)} ago`}</span>;
}
