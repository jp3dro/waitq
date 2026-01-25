import type { Metadata } from "next";
import type { Viewport } from "next";
import { Figtree } from "next/font/google";
import Script from "next/script";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MFJPX5PWKJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MFJPX5PWKJ');
          `}
        </Script>
      </body>
    </html>
  );
}
