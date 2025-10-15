import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const serif = EB_Garamond({ variable: "--font-serif", subsets: ["latin"], display: "swap" });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "WaitQ",
    template: "%s - WaitQ",
  },
  description: "WaitQ is a smart waitlist and queue management tool for local businesses.",
  metadataBase: typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  icons: {
    icon: "/waitq-square.svg",
  },
  openGraph: {
    title: "WaitQ",
    description: "Smart waitlist and queue management for local businesses.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WaitQ",
    description: "Smart waitlist and queue management for local businesses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} antialiased`}>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
