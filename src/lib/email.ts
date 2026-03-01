import { getAuth } from "firebase/auth";
import { emulatorMode } from "./firebase-client";

export type EmailCategory = "own" | "news";

export interface SendEmailInput {
  subject: string;
  text?: string;
  html?: string;
  category: EmailCategory;
}

export interface SendEmailResult {
  ok: boolean;
  status: number;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-falsify";
  const region = "us-central1";
  const url = emulatorMode
    ? `http://localhost:5001/${projectId}/${region}/sendEmail`
    : `https://${region}-${projectId}.cloudfunctions.net/sendEmail`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return { ok: res.ok, status: res.status };
}
