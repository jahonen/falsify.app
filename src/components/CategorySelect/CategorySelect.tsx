"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CategorySelect.module.scss";
import data from "../../../samplecode/categories.json";
import type { Taxonomy } from "../../types/prediction";
import { trackEvent } from "../../lib/analytics";

type CategoryNode = {
  name: string;
  subcategories: { name: string; topics: string[] }[];
};

type CategoriesJson = { categories: CategoryNode[] };

type Item = {
  domain: string;
  subcategory: string;
  topic: string;
  label: string;
};

function flattenCategories(src: CategoriesJson): Item[] {
  const out: Item[] = [];
  for (const c of src.categories) {
    for (const sc of c.subcategories) {
      if (!sc.topics || sc.topics.length === 0) {
        out.push({ domain: c.name, subcategory: sc.name, topic: sc.name, label: `${c.name} › ${sc.name}` });
      } else {
        for (const t of sc.topics) {
          out.push({ domain: c.name, subcategory: sc.name, topic: t, label: `${c.name} › ${sc.name} › ${t}` });
        }
      }
    }
  }
  return out;
}

function scoreQuery(q: string, item: Item): number {
  const query = q.trim().toLowerCase();
  if (!query) return 0;
  const hay = `${item.domain} ${item.subcategory} ${item.topic}`.toLowerCase();
  let score = 0;
  if (hay.includes(query)) score += 3;
  if (item.topic.toLowerCase().startsWith(query)) score += 2;
  if (item.subcategory.toLowerCase().startsWith(query)) score += 1.5;
  if (item.domain.toLowerCase().startsWith(query)) score += 1.25;
  for (const part of query.split(/\s+/)) {
    if (!part) continue;
    if (item.topic.toLowerCase().includes(part)) score += 0.8;
    if (item.subcategory.toLowerCase().includes(part)) score += 0.6;
    if (item.domain.toLowerCase().includes(part)) score += 0.4;
  }
  return score;
}

function search(items: Item[], q: string, max = 10): Item[] {
  const scored = items
    .map((it) => ({ it, s: scoreQuery(q, it) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => (b.s !== a.s ? b.s - a.s : a.it.label.localeCompare(b.it.label)));
  return scored.slice(0, max).map((x) => x.it);
}

export interface CategorySelectProps {
  value?: Taxonomy | null;
  onChange: (t: Taxonomy) => void;
  placeholder?: string;
}

export default function CategorySelect({ value, onChange, placeholder }: CategorySelectProps) {
  const all = useMemo(() => flattenCategories(data as CategoriesJson), []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(() => (query ? search(all, query, 12) : []), [all, query]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(it: Item) {
    onChange({ domain: it.domain, subcategory: it.subcategory, topic: it.topic });
    setQuery(it.label);
    setOpen(false);
    trackEvent("category_select", { domain: it.domain, subcategory: it.subcategory, topic: it.topic });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = results[activeIndex];
      if (it) choose(it);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <input
        type="text"
        className={styles.input}
        placeholder={placeholder ?? "Search categories (e.g., Climate, GDP, AI)"}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        aria-expanded={open}
        aria-controls="category-select-list"
        role="combobox"
      />
      {open && results.length > 0 && (
        <ul className={styles.dropdown} id="category-select-list" role="listbox">
          {results.map((it, idx) => (
            <li
              key={`${it.domain}-${it.subcategory}-${it.topic}`}
              className={`${styles.item} ${idx === activeIndex ? styles.active : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(it)}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <span className={styles.domain}>{it.domain}</span>
              <span className={styles.sep}>›</span>
              <span className={styles.subcat}>{it.subcategory}</span>
              <span className={styles.sep}>›</span>
              <span className={styles.topic}>{it.topic}</span>
            </li>
          ))}
        </ul>
      )}
      {open && results.length === 0 && query && (
        <div className={styles.dropdownEmpty}>No matches</div>
      )}
      {value && (
        <div className={styles.selection}>
          <span className={styles.domain}>{value.domain}</span>
          <span className={styles.sep}>›</span>
          <span className={styles.subcat}>{value.subcategory}</span>
          <span className={styles.sep}>›</span>
          <span className={styles.topic}>{value.topic}</span>
        </div>
      )}
    </div>
  );
}
