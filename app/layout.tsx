import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "UTANGA\u00c7 KED\u0130 KA\u00c7IYOR",
  description: "Kaboom.js ile yap\u0131lm\u0131\u015f mini HTML5 oyun projesi"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={pressStart.className}>{children}</body>
    </html>
  );
}
