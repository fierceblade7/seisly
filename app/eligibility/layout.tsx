import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Your SEIS and EIS Eligibility - Seisly",
  description: "Find out if your startup qualifies for SEIS or EIS in under 2 minutes. Free eligibility check with instant results.",
};

export default function EligibilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
