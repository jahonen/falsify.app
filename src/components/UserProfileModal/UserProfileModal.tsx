"use client";
import { useEffect, useMemo, useState } from "react";
import { getUserProfile, type UserProfile } from "../../services/profile-service";
import { createOrGetThread, sendMessage, type DMMessage } from "../../services/dm-service";
import { getAuth } from "firebase/auth";
import { collection, getFirestore, onSnapshot, orderBy, query } from "firebase/firestore";
import { toast } from "react-hot-toast";

export default function UserProfileModal({ uid, open, onClose }: { uid: string; open: boolean; onClose: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const me = useMemo(() => getAuth().currentUser, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getUserProfile(uid)
      .then((p) => setProfile(p))
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, [open, uid]);

  useEffect(() => {
    if (!open) return;
    // Clear chat state when reopened/different uid
    setThreadId(null);
    setMessages([]);
    setMsgText("");
    setChatOpen(false);
  }, [open, uid]);

  async function ensureThread() {
    if (!me) throw new Error("Not signed in");
    const id = await createOrGetThread(uid);
    setThreadId(id);
    return id;
  }

  async function openChat() {
    setError(null);
    try {
      const id = await ensureThread();
      // Realtime subscribe to messages
      const db = getFirestore();
      const q = query(collection(db, "dms", id, "messages"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        const items: DMMessage[] = snap.docs.map((d) => {
          const x = d.data() as any;
          return { id: d.id, senderId: x.senderId, text: x.text, createdAt: x.createdAt, readBy: x.readBy } as DMMessage;
        });
        setMessages(items);
      });
      setChatOpen(true);
      return () => unsub();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  async function onSend() {
    const text = msgText.trim();
    if (!text || !threadId) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage(threadId, text);
      setMsgText("");
      toast.success("Message sent");
    } catch (e: any) {
      setError(e.message || String(e));
      toast.error(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">User profile</h3>
          <button onClick={onClose} className="text-sm">✕</button>
        </div>
        {loading && <div className="text-sm text-neutral-500">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {profile && (
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="avatar" className="w-12 h-12 rounded-full border object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full border bg-neutral-100 grid place-items-center text-neutral-600 text-base font-medium">
                  {(profile.displayName || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium">{profile.displayName || "Anonymous"}</div>
                {profile.bio && <div className="text-sm text-neutral-600">{profile.bio}</div>}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {me?.uid !== uid && (
                <button className="text-sm px-3 py-1 rounded-md border" onClick={openChat}>Message</button>
              )}
            </div>

            {chatOpen && (
              <div className="grid gap-2">
                <div className="max-h-64 overflow-auto border rounded p-2 bg-neutral-50">
                  {messages.length === 0 && <div className="text-xs text-neutral-500">No messages yet.</div>}
                  <ul className="grid gap-1">
                    {messages.map((m) => (
                      <li key={m.id} className={`text-sm ${m.senderId === me?.uid ? "text-right" : "text-left"}`}>
                        <span className="inline-block px-2 py-1 rounded bg-white border">
                          {m.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <input className="flex-1 border rounded px-2 py-1" value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Type a message" />
                  <button className="text-sm px-3 py-1 rounded-md border bg-neutralBg" onClick={onSend} disabled={sending || !msgText.trim()}>
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
