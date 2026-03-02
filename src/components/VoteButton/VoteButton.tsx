import "./VoteButton.scss";
import { trackEvent } from "../../lib/analytics";
import type React from "react";

export type VoteVariant = "calledIt" | "botched" | "fence";

export interface VoteButtonProps {
  variant: VoteVariant;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function VoteButton({ variant, label, onClick, disabled }: VoteButtonProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    trackEvent("vote_click", { variant });
    if (onClick) onClick();
  }
  return (
    <button className={`vote-button ${variant}`} onClick={handleClick} disabled={disabled}>
      <span className="label">{label}</span>
    </button>
  );
}
