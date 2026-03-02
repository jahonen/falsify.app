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
          <Link href={{ pathname: "/about" }} className="hover:underline">About</Link>
          <Link href={{ pathname: "/privacy" }} className="hover:underline">Privacy</Link>
          <Link href={{ pathname: "/terms" }} className="hover:underline">Terms</Link>
          <button onClick={openConsent} className="hover:underline">Cookie settings</button>
          <a href="https://github.com/jahonen/falsify.app/issues/new" className="hover:underline">Submit an issue</a>
          <a href="https://github.com/jahonen/falsify.app" className="flex items-center gap-1 hover:underline" aria-label="GitHub repository">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.589 2 12.253c0 4.523 2.865 8.357 6.839 9.71.5.095.682-.22.682-.488 0-.241-.009-.879-.014-1.726-2.782.616-3.369-1.37-3.369-1.37-.455-1.174-1.11-1.487-1.11-1.487-.907-.633.069-.62.069-.620 1.003.072 1.53 1.05 1.53 1.05.892 1.566 2.341 1.114 2.91.852.091-.662.35-1.114.636-1.37-2.222-.258-4.555-1.137-4.555-5.061 0-1.118.39-2.032 1.03-2.75-.103-.258-.447-1.298.098-2.706 0 0 .84-.27 2.75 1.05A9.38 9.38 0 0 1 12 6.844c.85.004 1.705.116 2.504.341 1.91-1.32 2.748-1.05 2.748-1.05.547 1.408.203 2.448.1 2.706.64.718 1.028 1.632 1.028 2.75 0 3.935-2.337 4.801-4.565 5.055.36.318.68.94.68 1.895 0 1.366-.012 2.468-.012 2.804 0 .27.18.587.688.487C19.14 20.607 22 16.774 22 12.253 22 6.589 17.523 2 12 2Z" fill="currentColor"/>
            </svg>
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
