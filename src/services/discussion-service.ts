import { arrayUnion, doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function addComment(predictionId: string, text: string): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in to comment");
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  const db = getFirestore();
  const predRef = doc(db, "predictions", predictionId);
  await updateDoc(predRef, {
    comments: arrayUnion(trimmed),
    updatedAt: serverTimestamp(),
  });
}
