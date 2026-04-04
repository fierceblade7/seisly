import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Seisly - SEIS and EIS Advance Assurance, Done for You",
  description: "AI-powered SEIS and EIS advance assurance for UK startups. Seisly prepares and submits your application to HMRC as your authorised agent. From £149.",
  metadataBase: new URL("https://seisly.com"),
  openGraph: {
    title: "Seisly - SEIS and EIS Advance Assurance, Done for You",
    description: "AI-powered SEIS and EIS advance assurance for UK startups. From £149.",
    url: "https://seisly.com",
    siteName: "Seisly",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Seisly - SEIS and EIS Advance Assurance, Done for You",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seisly - SEIS and EIS Advance Assurance, Done for You",
    description: "AI-powered SEIS and EIS advance assurance for UK startups. From £149.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Seisly",
              "url": "https://seisly.com",
              "logo": "https://seisly.com/icon.svg",
              "description": "AI-powered SEIS and EIS advance assurance for UK startups. Prepared and submitted to HMRC on your behalf.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "71-75 Shelton Street",
                "addressLocality": "London",
                "addressRegion": "Covent Garden",
                "postalCode": "WC2H 9JQ",
                "addressCountry": "GB"
              }
            })
          }}
        />
      </head>
      <body className={`${instrumentSerif.variable} ${dmSans.variable} antialiased`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
