import { getFirestore, doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export type UserProfile = {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirestore();
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function upsertOwnProfile(partial: Partial<UserProfile>): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in to edit profile");
  const uid = user.uid;
  const db = getFirestore();
  const ref = doc(db, "users", uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      displayName: partial.displayName ?? user.displayName ?? "",
      bio: partial.bio ?? "",
      photoURL: partial.photoURL ?? user.photoURL ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() });
  }
}
