"use client";
import styles from "./Sidebar.module.scss";
import data from "../../../samplecode/categories.json";

type CategoryNode = { name: string; subcategories: { name: string; topics: string[] }[] };

type CategoriesJson = { categories: CategoryNode[] };

function getDomains(): string[] {
  const src = data as CategoriesJson;
  return src.categories
    .map((c) => c.name)
    .filter((n) => n && n !== "Other");
}

export type NavId = "feed" | "mine" | "voted" | "watchlist";

export interface SidebarProps {
  activeNav: NavId;
  onChangeNav: (id: NavId) => void;
  selectedDomain?: string | null;
  onSelectDomain?: (domain: string | null) => void;
}

export default function Sidebar({ activeNav, onChangeNav, selectedDomain, onSelectDomain }: SidebarProps) {
  const domains = getDomains();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionLabel}>Navigation</div>
      <nav className={styles.navList}>
        <button className={`${styles.navItem} ${activeNav === "feed" ? styles.active : ""}`} onClick={() => onChangeNav("feed")}>⊞ Feed</button>
        <button className={`${styles.navItem} ${activeNav === "mine" ? styles.active : ""}`} onClick={() => onChangeNav("mine")}>◎ My Predictions</button>
        <button className={`${styles.navItem} ${activeNav === "voted" ? styles.active : ""}`} onClick={() => onChangeNav("voted")}>✓ Voted On</button>
        <button className={`${styles.navItem} ${activeNav === "watchlist" ? styles.active : ""}`} onClick={() => onChangeNav("watchlist")}>◈ Watchlist</button>
      </nav>

      <div className={styles.divider} />

      <div className={styles.sectionLabel}>Domains</div>
      <ul className={styles.domainList}>
        <li>
          <button className={`${styles.domainItem} ${!selectedDomain ? styles.active : ""}`} onClick={() => onSelectDomain && onSelectDomain(null)}>All</button>
        </li>
        {domains.map((d) => (
          <li key={d}>
            <button className={`${styles.domainItem} ${selectedDomain === d ? styles.active : ""}`} onClick={() => onSelectDomain && onSelectDomain(d)}>
              <span className={styles.domainDot} />
              {d}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
