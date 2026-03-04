import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params?.id || "";
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://falsify.app";
  const url = `${base}/p/${encodeURIComponent(id)}`;
  const title = id ? `Prediction • ${id} • Falsify` : "Prediction • Falsify";
  const description = "Open this prediction on Falsify to view the full claim, rationale, AI assessment, and discussion.";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Falsify",
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default function PredictionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
