import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { AccentProvider } from "@/components/theme/AccentProvider";
 

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${serif.variable} ${sans.variable} antialiased`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AccentProvider />
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
