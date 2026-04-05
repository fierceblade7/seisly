import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in - Seisly",
  description: "Log in to your Seisly account to check your application status.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
