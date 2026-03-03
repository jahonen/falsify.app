"use client";
import { useEffect, useState } from "react";
import { getUserProfile, UserProfile } from "../../services/profile-service";
import EditProfileModal from "../EditProfileModal/EditProfileModal";
import { getAuth } from "firebase/auth";
import { listUserPredictions, listUserVotes, listUserComments, type UserPredictionActivity, type UserVoteActivity, type UserCommentActivity } from "../../services/activity-service";
import UserProfileModal from "../UserProfileModal/UserProfileModal";
import FollowButton from "../FollowButton/FollowButton";

export default function ProfilePage({ uid }: { uid: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [self, setSelf] = useState<string | null>(null);
  const [preds, setPreds] = useState<UserPredictionActivity[]>([]);
  const [votes, setVotes] = useState<UserVoteActivity[]>([]);
  const [comments, setComments] = useState<UserCommentActivity[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((u) => setSelf(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getUserProfile(uid)
      .then((p) => setProfile(p))
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
    // Load activity (predictions and votes)
    listUserPredictions(uid, 10).then(setPreds).catch(() => {});
    listUserVotes(uid, 10).then(setVotes).catch(() => {});
    listUserComments(uid, 10).then(setComments).catch(() => {});
  }, [uid]);

  return (
    <main className="mx-auto max-w-3xl p-4 grid gap-4">
      {loading && <div className="text-sm text-neutral-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {profile && (
        <section className="bg-white rounded-lg shadow-subtle p-4 grid gap-3">
          <div className="flex items-center gap-3">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="avatar" className="w-16 h-16 rounded-full border object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full border bg-neutral-100 grid place-items-center text-neutral-600 text-lg font-medium">
                {(profile.displayName || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold">{profile.displayName || "Anonymous"}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-neutral-600">
                <span><strong className="text-neutral-900">{profile.followersCount ?? 0}</strong> followers</span>
                <span><strong className="text-neutral-900">{profile.followingCount ?? 0}</strong> following</span>
              </div>
              {profile.bio && <p className="text-sm text-neutral-600 mt-1">{profile.bio}</p>}
            </div>
            {self === uid ? (
              <div className="ml-auto flex items-center gap-2">
                <button className="text-sm px-3 py-1 rounded-md border" onClick={() => setEditOpen(true)}>Edit profile</button>
              </div>
            ) : (
              <div className="ml-auto flex items-center gap-2">
                <FollowButton targetUid={uid} />
                <button className="text-sm px-3 py-1 rounded-md border" onClick={() => setUserModalOpen(true)}>Message</button>
              </div>
            )}
          </div>
        </section>
      )}
      <section className="bg-white rounded-lg shadow-subtle p-4 grid gap-3">
        <h2 className="text-base font-semibold">Activity</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-neutral-700">Predictions</h3>
            <ul className="mt-2 grid gap-2">
              {preds.length === 0 && <li className="text-sm text-neutral-500">No predictions yet.</li>}
              {preds.map((p) => (
                <li key={p.id} className="text-sm text-neutral-800 truncate">{p.summary}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-700">Votes</h3>
            <ul className="mt-2 grid gap-2">
              {votes.length === 0 && <li className="text-sm text-neutral-500">No votes yet.</li>}
              {votes.map((v, i) => (
                <li key={i} className="text-sm text-neutral-800">Voted {v.type} on #{v.predictionId}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-700">Comments</h3>
            <ul className="mt-2 grid gap-2">
              {comments.length === 0 && <li className="text-sm text-neutral-500">No comments yet.</li>}
              {comments.map((c, i) => (
                <li key={i} className="text-sm text-neutral-800 truncate">Commented on #{c.predictionId}: {c.text}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* Comments activity omitted for now: current schema stores comments as an array on prediction docs without author metadata */}
      </section>
      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} onSaved={() => getUserProfile(uid).then(setProfile)} />}
      {userModalOpen && <UserProfileModal uid={uid} open={userModalOpen} onClose={() => setUserModalOpen(false)} />}
    </main>
  );
}
