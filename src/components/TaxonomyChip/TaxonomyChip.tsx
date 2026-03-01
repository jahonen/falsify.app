import styles from "./TaxonomyChip.module.scss";

export interface TaxonomyChipProps {
  label: string;
}

export default function TaxonomyChip({ label }: TaxonomyChipProps) {
  return <span className={`${styles.taxonomyChip} inline-flex items-center px-2 py-1 rounded-full text-xs`}>{label}</span>;
}
