import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply for SEIS/EIS advance assurance - Seisly",
  description: "Complete your SEIS or EIS advance assurance application. From £149, submitted to HMRC on your behalf.",
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
