"use client";
import { useEffect, useState } from "react";
import { upsertOwnProfile, getUserProfile, UserProfile } from "../../services/profile-service";
import AvatarUploader from "../AvatarUploader/AvatarUploader";
import { getAuth } from "firebase/auth";
import { toast } from "react-hot-toast";

export default function EditProfileModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [profile, setProfile] = useState<UserProfile>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;
    getUserProfile(user.uid).then((p) => p && setProfile(p));
  }, []);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await upsertOwnProfile(profile);
      toast.success("Profile saved");
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || String(e));
      toast.error(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Edit profile</h3>
          <button onClick={onClose} className="text-sm">✕</button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Display name</span>
            <input className="border rounded px-2 py-1" value={profile.displayName || ""} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Bio</span>
            <textarea className="border rounded px-2 py-1" rows={3} value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
          </label>
          <div className="grid gap-1 text-sm">
            <span>Avatar</span>
            <AvatarUploader onUploaded={(url) => setProfile({ ...profile, photoURL: url })} />
            {profile.photoURL && <img src={profile.photoURL} alt="avatar" className="w-14 h-14 rounded-full" />}
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center justify-end gap-2">
            <button className="text-sm px-3 py-1 rounded-md border" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="text-sm px-3 py-1 rounded-md border bg-neutralBg" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
