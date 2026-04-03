"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const Logo = () => (
  <svg width="140" height="37" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
    <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
    <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
    <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
  </svg>
);

function SuccessPageContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [verified, setVerified] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionId) setVerified(true);
  }, [sessionId]);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? sessionStorage.getItem('seisly_email') : null;
    if (!email) {
      setPromoLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const fetchPromo = async () => {
      try {
        const res = await fetch(`/api/promo-code?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.promoCode) {
          setPromoCode(data.promoCode);
          setPromoLoading(false);
          return;
        }
      } catch {
        // ignore fetch errors, will retry
      }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(fetchPromo, 2000);
      } else {
        setPromoLoading(false);
      }
    };

    // Delay first attempt to give the webhook time to fire
    setTimeout(fetchPromo, 3000);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center bg-white">
        <Link href="/"><Logo /></Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-2xl mx-auto mb-8">
          ✓
        </div>
        <h1 className="font-serif text-4xl tracking-tight mb-4">Payment confirmed.</h1>
        <p className="text-sm text-[#666] leading-relaxed mb-10">
          Your application has been saved. The next step is to upload your supporting documents so we can prepare your complete HMRC submission.
        </p>

        <div className="bg-white border border-[#e8e8e4] rounded-xl p-6 text-left mb-8">
          <p className="text-sm font-medium mb-4">You will need to upload:</p>
          <ul className="space-y-3">
            {[
              "Business plan including financial forecasts",
              "Latest accounts or management accounts",
              "Memorandum and Articles of Association",
              "Current shareholder list",
              "Draft investor documents or information memorandum",
              "Subscription agreement or side agreements with investors (if available)",
            ].map((doc) => (
              <li key={doc} className="flex gap-3 items-start text-sm text-[#555]">
                <span className="text-[#0d7a5f] flex-shrink-0 mt-0.5">→</span>
                {doc}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#1a1a18] rounded-xl p-6 mb-6 text-left">
          <p className="text-[11px] text-[#5DCAA5] uppercase tracking-widest mb-3">
            Seisly customer perk
          </p>
          <h3 className="font-serif text-xl text-white mb-2">
            Find investors free for 3 months with{" "}
            <a href="https://www.usenovar.ai" target="_blank"
            rel="noopener noreferrer" className="text-[#5DCAA5] hover:underline">
            Novar for Startups
            </a>
          </h3>
          <p className="text-sm text-[#888] leading-relaxed mb-4">
            A limited number of qualifying Seisly founders get 3 months of free
            access to Novar for Startups, an AI tool that finds and
            reaches out to investors on your behalf. Subject to a quick
            approval review.
          </p>
          <div className="bg-[#2a2a28] rounded-lg p-4 mb-4 space-y-2">
            <p className="text-xs text-[#5DCAA5] font-medium uppercase tracking-wide">
              Free tier includes
            </p>
            <p className="text-xs text-[#888]">AI investor research and outreach on up to 75 prospects</p>
            <p className="text-xs text-[#888]">Personalised investor email sequences</p>
            <p className="text-xs text-[#888]">3 months free, no credit card required</p>
          </div>
          <div className="bg-[#2a2a28] rounded-lg p-4 mb-4 space-y-2">
            <p className="text-xs text-[#5DCAA5] font-medium uppercase tracking-wide">
              Upgrade anytime to Novar Starter at £49/mo
            </p>
            <p className="text-xs text-[#888]">Everything in the free tier, plus customer outreach</p>
            <p className="text-xs text-[#888]">Higher prospect limits, voice calls, autopilot and more</p>
            <p className="text-xs text-[#888]">Usually £59/mo, Seisly customers pay £49/mo</p>
          </div>
          <a
            href="https://www.usenovar.ai/startups"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors"
          >
            Apply for 3 months free access
          </a>
          <p className="text-xs text-[#555] text-center mt-3">
            Limited places available for qualifying founders actively
            raising SEIS/EIS investment. Subject to approval.
          </p>
        </div>

        <Link href="/apply/upload">
          <button className="w-full bg-[#0d7a5f] text-white py-4 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors">
            Upload my documents →
          </button>
        </Link>
        <p className="text-xs text-[#aaa] mt-4">
          You can also email them to <a href="mailto:support@seisly.com" className="text-[#0d7a5f]">support@seisly.com</a> if you prefer.
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <p className="text-sm text-[#888]">Loading...</p>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
