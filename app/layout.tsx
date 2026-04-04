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
  title: "Seisly - SEIS and EIS advance assurance from £149",
  description:
    "Get SEIS or EIS advance assurance from £149. AI-powered, human-reviewed, submitted to HMRC on your behalf. Built by the founder of the UK's first SEIS fund.",
  keywords: "SEIS, EIS, advance assurance, HMRC, startup funding, UK startup",
  openGraph: {
    title: "Seisly - SEIS and EIS advance assurance from £149",
    description: "Get SEIS or EIS advance assurance from £149. AI-powered, human-reviewed, submitted to HMRC on your behalf. Built by the founder of the UK's first SEIS fund.",
    url: "https://seisly.com",
    siteName: "Seisly",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSerif.variable} ${dmSans.variable} antialiased`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
