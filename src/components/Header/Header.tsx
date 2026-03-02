"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./Header.module.scss";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../lib/firebase-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useUser() {
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  useEffect(() => {
    const a = getAuth();
    const unsub = onAuthStateChanged(a, async (u) => {
      if (!u) {
        setUid(null);
        setEmail(null);
        setDisplayName(null);
        setPhotoURL(null);
        return;
      }
      setUid(u.uid);
      setEmail(u.email ?? null);
      setDisplayName(u.displayName ?? null);
      setPhotoURL(u.photoURL ?? null);
      try {
        const db = getFirestore();
        const snap = await getDoc(doc(db, "users", u.uid));
        const d = snap.exists() ? (snap.data() as any) : null;
        if (d?.displayName) setDisplayName(d.displayName);
        if (d?.photoURL) setPhotoURL(d.photoURL);
      } catch {}
    });
    return () => unsub();
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
  const [nameInput, setNameInput] = useState(displayName ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");

  useEffect(() => {
    setNameInput(displayName ?? "");
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

  async function saveProfile() {
    if (!uid) return;
    setSaving(true);
    try {
      let newPhoto = photoURL ?? null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const objectRef = ref(storage, `avatars/${uid}.${ext}`);
        const uploaded = await uploadBytes(objectRef, file, { contentType: file.type || "image/jpeg" });
        newPhoto = await getDownloadURL(uploaded.ref);
      }
      const a = getAuth();
      if (a.currentUser) {
        await updateProfile(a.currentUser, { displayName: nameInput || null, photoURL: newPhoto || undefined });
      }
      const db = getFirestore();
      await setDoc(
        doc(db, "users", uid),
        { displayName: nameInput || null, photoURL: newPhoto || null },
        { merge: true }
      );
      setEditorOpen(false);
    } catch {
    } finally {
      setSaving(false);
    }
  }

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
              <Link href={{ pathname: "/consent" }} className={styles.menuItem}>Email settings</Link>
              <button className={styles.menuItem} onClick={() => { const a = getAuth(); signOut(a); setMenuOpen(false); }}>Sign out</button>
            </div>
          )}
        </div>
      </div>

      {editorOpen && uid && (
        <div className={styles.modalBackdrop} onClick={() => !saving && setEditorOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Edit profile</h2>
            <div className={styles.formRow}>
              <label className={styles.label}>Display name</label>
              <input className={styles.input} value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Your name" />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Avatar image</label>
              <input className={styles.input} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</button>
              <button className={styles.primary} onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
