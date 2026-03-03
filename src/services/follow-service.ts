import { db, auth } from "../lib/firebase-client";
import { collection, collectionGroup, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, deleteDoc, where } from "firebase/firestore";

export type FollowDoc = {
  followedId: string;
  createdAt: any;
};

export async function followUser(targetUid: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  if (!targetUid || targetUid === user.uid) throw new Error("Invalid target");
  const ref = doc(db, `users/${user.uid}/following/${targetUid}`);
  await setDoc(ref, { followedId: targetUid, createdAt: serverTimestamp() } as FollowDoc, { merge: false });
}

export async function unfollowUser(targetUid: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  if (!targetUid || targetUid === user.uid) throw new Error("Invalid target");
  const ref = doc(db, `users/${user.uid}/following/${targetUid}`);
  await deleteDoc(ref);
}

export async function isFollowing(targetUid: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  if (!targetUid || targetUid === user.uid) return false;
  const ref = doc(db, `users/${user.uid}/following/${targetUid}`);
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function listFollowers(targetUid: string, max: number = 20): Promise<string[]> {
  if (!targetUid) return [];
  const q = query(
    collectionGroup(db, "following"),
    where("followedId", "==", targetUid),
    orderBy("createdAt", "desc"),
    limit(Math.max(1, Math.min(100, max)))
  );
  const snaps = await getDocs(q);
  const ids: string[] = [];
  snaps.forEach((d) => {
    const parentUser = d.ref.parent.parent; // users/{uid}
    if (parentUser) ids.push(parentUser.id);
  });
  return ids;
}

export async function listFollowing(uid: string, max: number = 20): Promise<string[]> {
  if (!uid) return [];
  const q = query(
    collection(db, `users/${uid}/following`),
    orderBy("createdAt", "desc"),
    limit(Math.max(1, Math.min(100, max)))
  );
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => (d.data() as FollowDoc).followedId).filter(Boolean);
}
