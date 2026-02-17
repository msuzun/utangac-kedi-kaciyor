import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utangaç Kedi Kaçıyor",
  description: "Kaboom.js ile yapılmış mini HTML5 oyun projesi"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
