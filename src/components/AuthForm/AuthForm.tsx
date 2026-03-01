"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, reload } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [consentOwn, setConsentOwn] = useState(false);
  const [consentNews, setConsentNews] = useState(false);
  const router = useRouter();

  async function writeConsents(uid: string) {
    const db = getFirestore();
    await setDoc(
      doc(db, "users", uid),
      { consents: { ownContent: !!consentOwn, news: !!consentNews } },
      { merge: true }
    );
  }

  async function handleEmailAuth() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const auth = getAuth();
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await writeConsents(cred.user.uid);
        setInfo("Verification email sent. Please verify your email to continue.");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await reload(cred.user);
        if (cred.user.emailVerified) {
          router.push("/");
        } else {
          setInfo("Please verify your email before continuing.");
        }
      }
    } catch (e: any) {
      setError(e?.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      if (mode === "signup" && auth.currentUser) {
        await writeConsents(auth.currentUser.uid);
      }
      router.push("/");
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setInfo("Verification email resent.");
      } else {
        setError("No signed-in user");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to resend verification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-subtle border border-neutralBorder p-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{mode === "signup" ? "Create account" : "Sign in"}</h1>
        <button
          className="text-sm text-ai"
          onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
          disabled={loading}
        >
          {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
        </button>
      </div>

      <div className="grid gap-3">
        <input
          type="email"
          className="w-full border border-neutralBorder rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-ai"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          className="w-full border border-neutralBorder rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-ai"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button
          className="w-full bg-neutralText text-white rounded-md px-3 py-2 hover:opacity-90 transition"
          onClick={handleEmailAuth}
          disabled={loading || !email || !password}
        >
          {mode === "signup" ? "Sign up with email" : "Sign in with email"}
        </button>
        <div className="h-px bg-neutralBorder" />
        <button
          className="w-full bg-white border border-neutralBorder rounded-md px-3 py-2 hover:bg-neutralBg transition"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continue with Google
        </button>
        {mode === "signup" && (
          <div className="grid gap-2 text-sm">
            <label className="flex items-start gap-2"><input type="checkbox" checked={consentOwn} onChange={(e) => setConsentOwn(e.target.checked)} /> I agree to get emails about my own content (activity and updates).</label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={consentNews} onChange={(e) => setConsentNews(e.target.checked)} /> I agree to get news and recommended content from Falsify.</label>
          </div>
        )}
        {info && <div className="text-sm text-statusPending">{info} <button className="underline" onClick={resendVerification} disabled={loading}>Resend</button></div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}
