import { collection, collectionGroup, getDocs, getFirestore, limit as fsLimit, orderBy, query, where } from "firebase/firestore";

export type UserPredictionActivity = {
  id: string;
  summary: string;
  createdAt: Date | null;
  status?: string;
};

export type UserVoteActivity = {
  predictionId: string;
  type: string;
  createdAt: Date | null;
};

export type UserCommentActivity = {
  predictionId: string;
  text: string;
  createdAt: Date | null;
};

export async function listUserPredictions(uid: string, limit: number = 10): Promise<UserPredictionActivity[]> {
  const db = getFirestore();
  const q = query(
    collection(db, "predictions"),
    where("authorId", "==", uid),
    orderBy("createdAt", "desc"),
    fsLimit(limit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      summary: data.summary ?? "",
      createdAt: (data.createdAt?.toDate?.() ?? null) as Date | null,
      status: data.status ?? undefined,
    } as UserPredictionActivity;
  });
}

export async function listUserComments(uid: string, limit: number = 10): Promise<UserCommentActivity[]> {
  const db = getFirestore();
  const q = query(
    collectionGroup(db, "comments"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    fsLimit(limit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    const parentPred = d.ref.parent.parent; // predictions/{predictionId}
    return {
      predictionId: parentPred?.id ?? "",
      text: data.text ?? "",
      createdAt: (data.createdAt?.toDate?.() ?? null) as Date | null,
    } as UserCommentActivity;
  });
}

export async function listUserVotes(uid: string, limit: number = 10): Promise<UserVoteActivity[]> {
  const db = getFirestore();
  const q = query(
    collectionGroup(db, "votes"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    fsLimit(limit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    const parentPred = d.ref.parent.parent; // predictions/{predictionId}
    return {
      predictionId: parentPred?.id ?? "",
      type: data.type ?? "",
      createdAt: (data.createdAt?.toDate?.() ?? null) as Date | null,
    } as UserVoteActivity;
  });
}
