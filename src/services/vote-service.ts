import { doc, getDoc, getFirestore, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { VoteVariant } from "../components/VoteButton/VoteButton";

export async function castVote(predictionId: string, variant: VoteVariant): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in to vote");
  const uid = user.uid;
  const db = getFirestore();

  const predRef = doc(db, "predictions", predictionId);
  const voteRef = doc(db, "predictions", predictionId, "votes", uid);

  await runTransaction(db, async (tx) => {
    const predSnap = await tx.get(predRef);
    if (!predSnap.exists()) throw new Error("Prediction not found");
    const pred = predSnap.data() as any;

    const votes = pred.humanVotes ?? { outcome: { calledIt: 0, botched: 0, fence: 0 }, quality: { high: 0, low: 0 } };

    const existingSnap = await tx.get(voteRef);
    const existingType = existingSnap.exists() ? (existingSnap.data() as any).type as VoteVariant : null;

    if (existingType === variant) {
      // Idempotent: no change
      return;
    }

    // Adjust counters
    const outcome = { ...votes.outcome } as Record<VoteVariant, number> & { fence: number } as any;
    if (existingType) {
      outcome[existingType] = Math.max(0, (outcome[existingType] ?? 0) - 1);
    }
    outcome[variant] = (outcome[variant] ?? 0) + 1;

    tx.update(predRef, {
      humanVotes: {
        ...votes,
        outcome: {
          calledIt: outcome.calledIt ?? 0,
          botched: outcome.botched ?? 0,
          fence: outcome.fence ?? 0,
        },
      },
      updatedAt: serverTimestamp(),
    });

    if (existingSnap.exists()) {
      tx.update(voteRef, { type: variant, userId: uid, updatedAt: serverTimestamp() });
    } else {
      tx.set(voteRef, { type: variant, userId: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
  });
}
