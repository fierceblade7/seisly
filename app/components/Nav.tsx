"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const Logo = () => (
  <svg width="140" height="37" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
    <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
    <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
    <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
  </svg>
);

export default function Nav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#fafaf8]/90 backdrop-blur-md border-b border-[#e8e8e4] px-6 h-[60px] flex items-center justify-between">
      <Link href="/">
        <Logo />
      </Link>
      <div className="flex items-center gap-6">
        <a href="/#how" className="text-sm text-[#555] hover:text-[#1a1a18] transition-colors hidden sm:block">How it works</a>
        <a href="/#pricing" className="text-sm text-[#555] hover:text-[#1a1a18] transition-colors hidden sm:block">Pricing</a>
        <a href="/#faq" className="text-sm text-[#555] hover:text-[#1a1a18] transition-colors hidden sm:block">FAQ</a>
        <Link href="/about" className="text-sm text-[#555] hover:text-[#1a1a18] transition-colors hidden sm:block">About</Link>
        <Link href="/login" className="text-sm text-[#555] hover:text-[#1a1a18] transition-colors hidden sm:block">Sign in</Link>
        <Link href="/eligibility" className="hidden sm:block">
          <button className="bg-[#0d7a5f] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-[#0a5c47] transition-colors">
            Start free &rarr;
          </button>
        </Link>

        {/* Mobile hamburger */}
        <div className="sm:hidden relative" ref={menuRef}>
          <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="p-1" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a18" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></>
              ) : (
                <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>
              )}
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-12 bg-white border border-[#e8e8e4] rounded-xl shadow-lg py-2 w-48 z-50">
              <a href="/#how" onClick={close} className="block px-4 py-2.5 text-sm text-[#555] hover:bg-[#fafaf8]">How it works</a>
              <a href="/#pricing" onClick={close} className="block px-4 py-2.5 text-sm text-[#555] hover:bg-[#fafaf8]">Pricing</a>
              <a href="/#faq" onClick={close} className="block px-4 py-2.5 text-sm text-[#555] hover:bg-[#fafaf8]">FAQ</a>
              <Link href="/about" onClick={close} className="block px-4 py-2.5 text-sm text-[#555] hover:bg-[#fafaf8]">About</Link>
              <Link href="/login" onClick={close} className="block px-4 py-2.5 text-sm text-[#555] hover:bg-[#fafaf8]">Sign in</Link>
              <div className="border-t border-[#f0f0ec] mt-1 pt-1 px-4 py-2">
                <Link href="/eligibility" onClick={close}>
                  <button className="w-full bg-[#0d7a5f] text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-[#0a5c47] transition-colors">
                    Start free &rarr;
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
