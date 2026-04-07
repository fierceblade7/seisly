"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import Footer from "../components/Footer";
import Nav from "../components/Nav";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://seisly.com'}/auth/callback`,
        },
      });
      if (authError) throw authError;
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Nav variant="minimal" />

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-2xl mx-auto mb-6">
                &#10003;
              </div>
              <h1 className="font-serif text-3xl tracking-tight mb-3">
                Check your email
              </h1>
              <p className="text-sm text-[#666] leading-relaxed mb-6">
                We have sent a sign-in link to <strong>{email}</strong>.
                Click the link to access your application.
                The link expires in 1 hour.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs text-[#0d7a5f] hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl tracking-tight mb-2">
                Sign in to Seisly
              </h1>
              <p className="text-sm text-[#666] mb-8 leading-relaxed">
                Enter your email address to continue. We&apos;ll send you a sign-in link, no password needed.
              </p>

              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="your@email.com"
                  className="w-full border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d7a5f] bg-white"
                />
                {error && (
                  <p className="text-xs text-[#c0392b]">{error}</p>
                )}
                <button
                  onClick={handleLogin}
                  disabled={loading || !email}
                  className="w-full bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending link..." : "Send me a sign-in link"}
                </button>
              </div>

              <p className="text-xs text-center text-[#aaa] mt-6">
                Not sure if you qualify?{" "}
                <Link href="/eligibility" className="text-[#0d7a5f] hover:underline">
                  Check your eligibility &rarr;
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
