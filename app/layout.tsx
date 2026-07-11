import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-white">
        {children}
      </body>
    </html>
  );
}
