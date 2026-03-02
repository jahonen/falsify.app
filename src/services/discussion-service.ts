import { addDoc, arrayUnion, collection, doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function addComment(predictionId: string, text: string): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in to comment");
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  const db = getFirestore();
  const predRef = doc(db, "predictions", predictionId);
  // Write structured comment to subcollection for activity queries
  await addDoc(collection(db, "predictions", predictionId, "comments"), {
    userId: user.uid,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  await updateDoc(predRef, {
    comments: arrayUnion(trimmed),
    updatedAt: serverTimestamp(),
  });
}
