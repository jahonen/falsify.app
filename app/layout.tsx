import "../src/styles/main.scss";
import type { ReactNode } from "react";
import { Suspense } from "react";
import Footer from "../src/components/Footer/Footer";
import CookieBanner from "../src/components/CookieBanner/CookieBanner";
import Header from "../src/components/Header/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Falsify.app",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutralBg text-neutralText flex flex-col">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
