"use client";
import { useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getFirestore, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { toast } from "react-hot-toast";

type NotificationDoc = {
  type: "comment" | "term" | string;
  predictionId?: string;
  commentId?: string;
  fromUserId?: string | null;
  text?: string;
  createdAt?: any;
  read?: boolean;
};

export default function NotificationsListener() {
  const initialLoaded = useRef(false);
  const unsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      // reset on auth change
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      initialLoaded.current = false;
      if (!u) return;
      const db = getFirestore();
      const q = query(
        collection(db, "users", u.uid, "notifications"),
        where("read", "==", false),
        orderBy("createdAt", "desc")
      );
      unsubRef.current = onSnapshot(q, async (snap) => {
        if (!initialLoaded.current) {
          initialLoaded.current = true;
          return; // skip to avoid spamming on initial load
        }
        for (const change of snap.docChanges()) {
          if (change.type !== "added") continue;
          const d = (change.doc.data() || {}) as NotificationDoc;
          const id = change.doc.id;
          let msg = "";
          if (d.type === "comment") {
            msg = "New comment on your prediction" + (d.text ? `: ${String(d.text).slice(0, 80)}` : "");
          } else if (d.type === "term") {
            msg = "One of your predictions has reached its term";
          } else {
            msg = "You have a new notification";
          }
          toast(msg);
          try {
            await updateDoc(doc(db, "users", u.uid, "notifications", id), { read: true });
          } catch (_) {
            // ignore marking failure
          }
        }
      });
    });
    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubAuth();
    };
  }, []);

  return null;
}
