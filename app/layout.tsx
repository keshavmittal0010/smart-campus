import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SmartCampus — Unified University Platform",
    template: "%s | SmartCampus"
  },
  description: "A comprehensive digital ecosystem for modern educational institutions. Manage attendance, assignments, timetables, and campus life — all in one place.",
  keywords: ["campus", "ERP", "university", "attendance", "assignments", "education"],
  authors: [{ name: "SmartCampus Team" }],
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "SmartCampus — Unified University Platform",
    description: "ERP-grade campus management for students, faculty and admins.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
