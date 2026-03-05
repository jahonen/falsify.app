"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./Header.module.scss";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getFirestore, onSnapshot } from "firebase/firestore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import EditProfileModal from "../EditProfileModal/EditProfileModal";
import { Toaster } from "react-hot-toast";
import NotificationsListener from "../NotificationsListener/NotificationsListener";

function useUser() {
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  useEffect(() => {
    const a = getAuth();
    let unsubDoc: (() => void) | null = null;
    const unsub = onAuthStateChanged(a, async (u) => {
      if (!u) {
        setUid(null);
        setEmail(null);
        setDisplayName(null);
        setPhotoURL(null);
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = null;
        }
        return;
      }
      setUid(u.uid);
      setEmail(u.email ?? null);
      setDisplayName(u.displayName ?? null);
      setPhotoURL(u.photoURL ?? null);
      try {
        const db = getFirestore();
        if (unsubDoc) unsubDoc();
        unsubDoc = onSnapshot(doc(db, "users", u.uid), (snap) => {
          const d = snap.exists() ? (snap.data() as any) : null;
          if (d?.displayName !== undefined) setDisplayName(d.displayName || null);
          if (d?.photoURL !== undefined) setPhotoURL(d.photoURL || null);
        });
      } catch {}
    });
    return () => {
      if (unsubDoc) unsubDoc();
      unsub();
    };
  }, []);
  return { uid, email, displayName, photoURL } as const;
}

function Avatar({ name, src }: { name?: string | null; src?: string | null }) {
  if (src) {
    return <img src={src} alt={name ?? ""} className={styles.avatar} />;
  }
  const fallback = (name?.trim()?.[0] ?? "?").toUpperCase();
  return <div className={`${styles.avatar} ${styles.avatarFallback}`}>{fallback}</div>;
}

export default function Header() {
  const { uid, email, displayName, photoURL } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");

  useEffect(() => {
    // no-op: EditProfileModal manages its own state
  }, [displayName]);

  useEffect(() => {
    setSearch(params.get("q") || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.get("q")]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // EditProfileModal handles profile persistence

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={{ pathname: "/" }} className={styles.brand}>
          <img src="/android-chrome-192x192.png" className={styles.brandIcon} alt="Falsify icon" />
          Falsify
        </Link>
        <div className={styles.searchWrap}>
          <form className={styles.searchForm} onSubmit={(e) => {
            e.preventDefault();
            const url = new URL(window.location.href);
            if (search.trim()) url.searchParams.set("q", search.trim()); else url.searchParams.delete("q");
            const href = `${pathname}${url.search}`;
            (router.push as (href: string) => void)(href);
          }}>
            <input
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search predictions, topics, users…"
              aria-label="Search"
            />
          </form>
        </div>
        <nav className={styles.nav}>
          <Link href={{ pathname: "/privacy" }} className={styles.link}>Privacy</Link>
          <Link href={{ pathname: "/terms" }} className={styles.link}>Terms</Link>
        </nav>
        <div className={styles.user} ref={menuRef}>
          {!uid && (
            <Link href={{ pathname: "/auth" }} className={styles.signin}>Sign in</Link>
          )}
          {uid && (
            <button className={styles.userButton} onClick={() => setMenuOpen((v) => !v)}>
              <Avatar name={displayName || email} src={photoURL || null} />
              <span className={styles.userName}>{displayName || email}</span>
            </button>
          )}
          {menuOpen && uid && (
            <div className={styles.menu}>
              <button className={styles.menuItem} onClick={() => { setEditorOpen(true); setMenuOpen(false); }}>Profile</button>
              <Link href={{ pathname: "/notifications" }} className={styles.menuItem}>Notifications</Link>
              <Link href={{ pathname: "/u/" + uid }} className={styles.menuItem}>View profile</Link>
              <Link href={{ pathname: "/consent" }} className={styles.menuItem}>Email settings</Link>
              <button className={styles.menuItem} onClick={() => { const a = getAuth(); signOut(a); setMenuOpen(false); }}>Sign out</button>
            </div>
          )}
        </div>
      </div>

      {editorOpen && uid && (
        <EditProfileModal onClose={() => setEditorOpen(false)} onSaved={() => { /* optionally refresh header state */ }} />
      )}
      <Toaster position="top-right" />
      <NotificationsListener />
    </header>
  );
}
