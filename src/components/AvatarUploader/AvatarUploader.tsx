"use client";
import { useState } from "react";
import { storage } from "../../lib/firebase-client";
import { getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AvatarUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "jpg";
      const objectRef = ref(storage, `avatars/${user.uid}.${ext}`);
      await uploadBytes(objectRef, file, { contentType: file.type });
      const url = await getDownloadURL(objectRef);
      onUploaded(url);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <input type="file" accept="image/*" onChange={onFileChange} disabled={uploading} />
      {uploading && <div className="text-xs text-neutral-500">Uploading…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
