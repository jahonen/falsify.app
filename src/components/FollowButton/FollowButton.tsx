"use client";
import { useEffect, useState } from "react";
import { followUser, unfollowUser, isFollowing } from "../../services/follow-service";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";
import { loadAnalytics } from "../../lib/firebase-client";

export default function FollowButton({ targetUid, className }: { targetUid: string; className?: string }) {
  const [following, setFollowing] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [signedIn, setSignedIn] = useState<boolean>(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged(async (u) => {
      setSignedIn(!!u);
      if (u && targetUid && targetUid !== u.uid) {
        try {
          const f = await isFollowing(targetUid);
          setFollowing(f);
        } catch {
          setFollowing(false);
        }
      } else {
        setFollowing(false);
      }
    });
    return () => unsub();
  }, [targetUid]);

  async function log(eventName: string) {
    try {
      const analytics = await loadAnalytics();
      if (!analytics) return;
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics as any, eventName as any, { targetUid });
    } catch {}
  }

  async function onClick() {
    if (!signedIn) {
      toast.error("Please sign in to follow users");
      return;
    }
    setBusy(true);
    try {
      if (!following) {
        await followUser(targetUid);
        setFollowing(true);
        toast.success("Followed");
        await log("follow_user");
      } else {
        await unfollowUser(targetUid);
        setFollowing(false);
        toast("Unfollowed", { icon: "👋" });
        await log("unfollow_user");
      }
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!targetUid) return null;

  return (
    <button
      className={`text-sm px-3 py-1 rounded-md border ${following ? "bg-neutral-800 text-white border-neutral-800" : "bg-white"} ${busy ? "opacity-70 cursor-not-allowed" : ""} ${className || ""}`}
      onClick={onClick}
      disabled={busy}
    >
      {following ? "Unfollow" : "Follow"}
    </button>
  );
}
