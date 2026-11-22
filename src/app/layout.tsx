import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Therapist Trainer",
  description:
    "Practice and master therapeutic coaching frameworks with AI-simulated clients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-[#F5F5F7] font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
