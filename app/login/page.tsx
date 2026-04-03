"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

const Logo = () => (
  <svg width="140" height="37" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
    <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
    <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
    <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
  </svg>
);

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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center bg-white">
        <Link href="/"><Logo /></Link>
      </nav>

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
                Enter the email address you used when you applied.
                We will send you a sign-in link, no password needed.
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
                Do not have an account yet?{" "}
                <Link href="/eligibility" className="text-[#0d7a5f] hover:underline">
                  Check your eligibility
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
