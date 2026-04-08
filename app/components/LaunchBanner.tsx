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
        <strong className="font-medium">Launch offer:</strong> £50 off any application. Click <a href="https://www.linkedin.com/posts/sanjaywadhwani_founders-solofounder-venturecatalyst-share-7446961421273288705-Lcda?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAllo_UB9kUogW0dC5ubS6zWRYXN4_Kcj10" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">here</a> to comment on our LinkedIn post to get the code.{" "}
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
