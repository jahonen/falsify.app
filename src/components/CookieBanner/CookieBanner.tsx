"use client";
import { useEffect, useState } from "react";
import { getConsent, setConsent } from "../../lib/consent";
import { loadAnalytics } from "../../lib/firebase-client";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) setVisible(true);
    function onOpen() { setVisible(true); }
    window.addEventListener("openconsent", onOpen as any);
    return () => window.removeEventListener("openconsent", onOpen as any);
  }, []);

  async function accept() {
    setConsent({ analytics: true });
    await loadAnalytics();
    setVisible(false);
  }

  function reject() {
    setConsent({ analytics: false });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-3xl m-4 p-4 rounded-lg bg-white border border-neutralBorder shadow-subtle grid gap-3">
        <div className="text-sm text-neutral-800">
          We use cookies for sign-in and to measure usage. Do you allow analytics cookies?
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button className="px-3 py-2 rounded-md border border-neutralBorder hover:bg-neutralBg" onClick={reject}>Reject</button>
          <button className="px-3 py-2 rounded-md bg-ai text-white hover:opacity-90" onClick={accept}>Allow</button>
        </div>
      </div>
    </div>
  );
}
