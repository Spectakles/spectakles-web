import type { Metadata, Viewport } from "next";
import "./globals.css";
import Layout from "@/components/Layout";
import AsciiWavesBackground from "@/components/AsciiWavesBackground";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://spectakles.in"),
  title: "Spectakles — Make every voice count",
  description:
    "Spectakles turns group discussions, practice sessions, and presentations into confident, measurable moments of participation for educational institutions.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://spectakles.in/",
    title: "Spectakles — Make every voice count",
    description:
      "Spectakles turns group discussions, practice sessions, and presentations into confident, measurable moments of participation for educational institutions.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Spectakles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spectakles — Make every voice count",
    description:
      "Spectakles turns group discussions, practice sessions, and presentations into confident, measurable moments of participation for educational institutions.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AnalyticsTracker />
        <AsciiWavesBackground />
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
