"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

export default function ConsentPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [own, setOwn] = useState(false);
  const [news, setNews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUid(u ? u.uid : null);
      setError(null);
      setInfo(null);
      if (!u) {
        setLoading(false);
        return;
      }
      try {
        const db = getFirestore();
        const snap = await getDoc(doc(db, "users", u.uid));
        const consents = (snap.exists() ? (snap.data() as any).consents : null) || {};
        setOwn(!!consents.ownContent);
        setNews(!!consents.news);
      } catch (e: any) {
        setError("Failed to load your settings");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function save() {
    if (!uid) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const db = getFirestore();
      await setDoc(
        doc(db, "users", uid),
        { consents: { ownContent: !!own, news: !!news } },
        { merge: true }
      );
      setInfo("Saved");
    } catch (e: any) {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6 grid gap-6">
        <div className="bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">Loading…</div>
      </main>
    );
  }

  if (!uid) {
    return (
      <main className="mx-auto max-w-3xl p-6 grid gap-6">
        <div className="bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
          <p className="text-sm">Please <Link className="text-ai underline" href={{ pathname: "/auth" }}>sign in</Link> to manage your email settings.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 grid gap-6">
      <h1 className="text-2xl font-semibold">Email settings</h1>
      <section className="grid gap-3 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />
          Receive emails about your own content (activity and updates)
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} />
          Receive news and recommended content from Falsify
        </label>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-md bg-neutralText text-white hover:opacity-90" onClick={save} disabled={saving}>
            Save
          </button>
          {info && <span className="text-sm text-statusResolved">{info}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </section>
    </main>
  );
}
