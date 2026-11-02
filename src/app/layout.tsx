import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollectIQ — AI-Powered Field Collections Management Platform",
  description:
    "AI-assisted field collections management platform for NBFCs that helps field collection officers prioritise overdue borrowers, record collection outcomes, track promises to pay, and enables branch managers to monitor collection performance without relying on Excel and WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F8F8F5] text-[#171918] font-sans">
        {children}
      </body>
    </html>
  );
}
