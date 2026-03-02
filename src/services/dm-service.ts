import { addDoc, collection, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, setDoc, where, limit as fsLimit } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export type DMThread = {
  id: string;
  participants: string[]; // [uidA, uidB]
  createdAt?: any;
  lastMessageAt?: any;
};

export type DMMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt?: any;
  readBy?: string[];
};

function threadIdFor(u1: string, u2: string): string {
  return [u1, u2].sort().join("_");
}

export async function createOrGetThread(otherUid: string): Promise<string> {
  const auth = getAuth();
  const me = auth.currentUser;
  if (!me) throw new Error("Must be signed in to start a DM");
  if (!otherUid) throw new Error("Missing target user");
  const db = getFirestore();
  const id = threadIdFor(me.uid, otherUid);
  const ref = doc(db, "dms", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { participants: [me.uid, otherUid], createdAt: serverTimestamp(), lastMessageAt: serverTimestamp() });
  }
  return id;
}

export async function sendMessage(threadId: string, text: string): Promise<void> {
  const auth = getAuth();
  const me = auth.currentUser;
  if (!me) throw new Error("Must be signed in to send a DM");
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Message cannot be empty");
  const db = getFirestore();
  const msgs = collection(db, "dms", threadId, "messages");
  await addDoc(msgs, { senderId: me.uid, text: trimmed, createdAt: serverTimestamp(), readBy: [me.uid] });
  await setDoc(doc(db, "dms", threadId), { lastMessageAt: serverTimestamp() }, { merge: true });
}

export async function listMessages(threadId: string, max: number = 20): Promise<DMMessage[]> {
  const db = getFirestore();
  const q = query(collection(db, "dms", threadId, "messages"), orderBy("createdAt", "desc"), fsLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data() as any;
    return { id: d.id, senderId: x.senderId, text: x.text, createdAt: x.createdAt, readBy: x.readBy } as DMMessage;
  });
}

export async function listThreadsForSelf(max: number = 10): Promise<DMThread[]> {
  const auth = getAuth();
  const me = auth.currentUser;
  if (!me) throw new Error("Not signed in");
  const db = getFirestore();
  const q = query(collection(db, "dms"), where("participants", "array-contains", me.uid), orderBy("lastMessageAt", "desc"), fsLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data() as any;
    return { id: d.id, participants: x.participants, createdAt: x.createdAt, lastMessageAt: x.lastMessageAt } as DMThread;
  });
}
