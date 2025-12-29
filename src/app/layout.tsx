import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
 

const figtree = Figtree({ variable: "--font-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Restaurant Waitlist App & Queue Management Software - WaitQ",
    template: "%s - WaitQ",
  },
  description: "Modern restaurant waitlist management software with SMS notifications. No app required. Manage queues, reduce wait times, and improve customer experience. Starting at $19/mo.",
  metadataBase: typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  keywords: ["restaurant waitlist app", "queue management software", "restaurant queue system", "waitlist management", "SMS notifications", "table management", "virtual waitlist", "restaurant waitlist software"],
  icons: {
    icon: "/waitq-square.svg",
  },
  openGraph: {
    title: "Restaurant Waitlist App & Queue Management Software - WaitQ",
    description: "Modern restaurant waitlist management software with SMS notifications. No app required. Manage queues, reduce wait times, and improve customer experience.",
    type: "website",
    siteName: "WaitQ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant Waitlist App & Queue Management Software - WaitQ",
    description: "Modern restaurant waitlist management software with SMS notifications. No app required. Manage queues, reduce wait times, and improve customer experience.",
  },
  alternates: {
    canonical: typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "WaitQ",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "19.00",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "19.00",
        "priceCurrency": "USD",
        "unitText": "MONTH"
      }
    },
    "description": "Modern restaurant waitlist management software with SMS notifications. No app required. Manage queues, reduce wait times, and improve customer experience.",
    "operatingSystem": "Web, iOS, Android",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${figtree.variable} antialiased`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
