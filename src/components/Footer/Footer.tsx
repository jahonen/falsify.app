"use client";
import Link from "next/link";

export default function Footer() {
  function openConsent() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("openconsent"));
    }
  }
  return (
    <footer className="border-t border-neutralBorder bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between text-sm text-neutral-700">
        <div className="flex items-center gap-3">
          <span>© {new Date().getFullYear()} Falsify</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href={{ pathname: "/privacy" }} className="hover:underline">Privacy</Link>
          <Link href={{ pathname: "/terms" }} className="hover:underline">Terms</Link>
          <button onClick={openConsent} className="hover:underline">Cookie settings</button>
        </nav>
      </div>
    </footer>
  );
}
