import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DarkModeProvider from "@/components/DarkModeProvider";

export const metadata: Metadata = {
  title: "BFP Work - Professional Work Management",
  description: "BFP Work: Professional Work Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 pt-16">
        <DarkModeProvider />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
