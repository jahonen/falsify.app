"use client";
import ProfilePage from "../../../src/components/ProfilePage/ProfilePage";

export default function UserProfilePage({ params }: { params: { uid: string } }) {
  return <ProfilePage uid={params.uid} />;
}
