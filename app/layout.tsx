import "../src/styles/main.scss";
import type { ReactNode } from "react";
import Footer from "../src/components/Footer/Footer";
import CookieBanner from "../src/components/CookieBanner/CookieBanner";
import Header from "../src/components/Header/Header";

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
