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
  title: "Seisly: Need SEIS or EIS advance assurance? Seisly done.",
  description:
    "Go from idea to HMRC-ready SEIS or EIS advance assurance application in under an hour. No lawyers. No accountants. No monthly plans. Just £99.",
  keywords: "SEIS, EIS, advance assurance, HMRC, startup funding, UK startup",
  openGraph: {
    title: "Seisly: Seisly done.",
    description: "SEIS or EIS advance assurance from £99. Built by the founder of the UK's first SEIS fund.",
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
