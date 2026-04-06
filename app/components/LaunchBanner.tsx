"use client";
import { useState, useEffect } from "react";

export default function LaunchBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const d = localStorage.getItem("seisly_launch_banner_dismissed");
    if (!d) setDismissed(false);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("seisly_launch_banner_dismissed", "true");
  };

  if (dismissed) return null;

  return (
    <div className="bg-[#1a1a18] text-white px-4 py-2.5 text-center relative">
      <p className="text-xs leading-relaxed">
        <strong className="font-medium">Launch offer:</strong> £50 off any application. We are new - be one of our first customers. Use code <strong className="font-mono">LAUNCH50</strong> at checkout.{" "}
        <span className="text-[#888]">Offer ends Monday 14 April.</span>
      </p>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors text-lg leading-none"
        aria-label="Dismiss banner"
      >
        &times;
      </button>
    </div>
  );
}
