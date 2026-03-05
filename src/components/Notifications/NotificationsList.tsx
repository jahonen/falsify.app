"use client";
import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getFirestore, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";

type Item = {
  id: string;
  type: string;
  text?: string | null;
  predictionId?: string | null;
  createdAt?: any;
  read?: boolean;
};

export default function NotificationsList() {
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const a = getAuth();
    const unsub = onAuthStateChanged(a, (u) => {
      setUid(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) { setItems([]); setLoading(false); return; }
    const db = getFirestore();
    const q = query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows: Item[] = snap.docs.map(d => {
        const v = d.data() as any;
        return {
          id: d.id,
          type: String(v?.type || "notification"),
          text: v?.text || null,
          predictionId: v?.predictionId || null,
          createdAt: v?.createdAt || null,
          read: !!v?.read
        };
      });
      setItems(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const unreadCount = useMemo(() => items.filter(i => !i.read).length, [items]);

  async function markRead(id: string) {
    if (!uid) return;
    try {
      const db = getFirestore();
      await updateDoc(doc(db, "users", uid, "notifications", id), { read: true });
    } catch {}
  }

  async function markAllRead() {
    if (!uid) return;
    const db = getFirestore();
    const updates = items.filter(i => !i.read).slice(0, 100).map(i => updateDoc(doc(db, "users", uid, "notifications", i.id), { read: true }));
    await Promise.allSettled(updates);
  }

  if (!uid) return <div className="text-sm text-neutral-600">Please sign in to view notifications.</div>;
  if (loading) return <div className="text-sm text-neutral-600">Loading…</div>;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600">Unread: <strong>{unreadCount}</strong></div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm px-2 py-1 rounded border border-neutralBorder hover:bg-neutralBg">Mark all as read</button>
        )}
      </div>
      <ul className="divide-y divide-neutralBorder bg-white border border-neutralBorder rounded-md overflow-hidden">
        {items.map(it => {
          const ts = it.createdAt?.toDate ? it.createdAt.toDate() as Date : (it.createdAt ? new Date(it.createdAt) : null);
          const when = ts && !isNaN(ts.getTime()) ? ts.toLocaleString() : "";
          const link = it.predictionId ? `/p/${encodeURIComponent(it.predictionId)}` : null;
          return (
            <li key={it.id} className={`px-3 py-3 flex items-start justify-between ${it.read ? "opacity-75" : ""}`}>
              <div className="pr-3">
                <div className="text-xs uppercase tracking-wide text-neutral-500">{it.type}</div>
                {it.text && <div className="text-sm text-neutral-800 mt-0.5">{it.text}</div>}
                {when && <div className="text-xs text-neutral-500 mt-1">{when}</div>}
                {link && <a href={link} className="text-xs text-blue-600 hover:underline">Open prediction</a>}
              </div>
              {!it.read && (
                <button onClick={() => markRead(it.id)} className="text-xs px-2 py-1 rounded border border-neutralBorder hover:bg-neutralBg whitespace-nowrap">Mark read</button>
              )}
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="px-3 py-6 text-sm text-neutral-600">No notifications yet.</li>
        )}
      </ul>
    </div>
  );
}
