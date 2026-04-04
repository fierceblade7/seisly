"use client";
import Link from "next/link";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center bg-white">
        <Link href="/" className="font-serif text-xl text-[#1a1a18]">
          Seis<span className="text-[#0d7a5f]">ly</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center text-2xl mx-auto mb-6">!</div>
          <h1 className="font-serif text-3xl tracking-tight mb-3">Something went wrong.</h1>
          <p className="text-sm text-[#666] leading-relaxed mb-8">
            Please try again or contact <a href="mailto:hello@seisly.com" className="text-[#0d7a5f]">hello@seisly.com</a> if the problem persists.
          </p>
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors"
            >
              Try again
            </button>
            <Link href="/">
              <button className="w-full border border-[#e8e8e4] text-[#888] py-3 rounded-lg text-sm font-medium hover:border-[#0d7a5f] hover:text-[#0d7a5f] transition-colors">
                Back to home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
