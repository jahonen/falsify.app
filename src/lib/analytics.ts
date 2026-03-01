export async function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    const { getConsent } = await import("./consent");
    const consent = getConsent();
    if (!consent || consent.analytics !== true) return;
    const { getAnalytics, logEvent, isSupported } = await import("firebase/analytics");
    const supported = await isSupported();
    if (!supported) return;
    const { app } = await import("./firebase-client");
    const analytics = getAnalytics((app as any));
    logEvent(analytics as any, eventName, params);
  } catch {
    
  }
}
