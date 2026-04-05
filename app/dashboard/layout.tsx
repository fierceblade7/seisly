import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Seisly",
  description: "View and manage your SEIS and EIS advance assurance application.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
