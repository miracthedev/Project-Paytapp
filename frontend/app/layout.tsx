import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// ESKİ: import { Toaster } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/sonner"; // YENİ EKLENEN

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PaytApp",
  description: "Your trusty paying app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* YENİ SONNER TOASTER: Yukarıdan gelir ve duration verebilirsin */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}