import styles from "./AIBadge.module.scss";

export interface AIBadgeProps {
  score: number;
}

export default function AIBadge({ score }: AIBadgeProps) {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  return (
    <span className={`${styles.aiBadge} inline-flex items-center px-2 py-1 rounded-full text-xs font-medium`}>
      <span className="w-2 h-2 rounded-full bg-ai mr-2" />
      <span>{clamped}/10</span>
    </span>
  );
}
