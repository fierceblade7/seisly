import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check SEIS/EIS eligibility - Seisly",
  description: "Check if your company qualifies for SEIS or EIS advance assurance in 2 minutes. Free, instant, no account needed.",
};

export default function EligibilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
