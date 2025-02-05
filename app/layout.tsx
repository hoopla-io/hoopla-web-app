import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import Script from "next/script";
import type React from "react"; // Added import for React

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Coffee Subscription App",
  description: "Get your daily coffee fix with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className}`}>
        <Header />
        <div className="max-w-4xl mx-auto min-h-screen flex flex-col pt-16">
          <main className="flex-grow overflow-y-auto">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
