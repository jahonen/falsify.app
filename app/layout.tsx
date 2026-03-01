import "../src/styles/main.scss";
import type { ReactNode } from "react";
import Footer from "../src/components/Footer/Footer";
import CookieBanner from "../src/components/CookieBanner/CookieBanner";
import Header from "../src/components/Header/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Falsify.app"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutralBg text-neutralText flex flex-col">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
