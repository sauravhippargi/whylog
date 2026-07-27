import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Display / chrome face — "the log's voice" (IDs, timestamps, labels, nav).
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

// Body / reading face — the human reasoning being preserved.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhyLog",
  description: "A searchable record of the decisions you've made — and why.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
