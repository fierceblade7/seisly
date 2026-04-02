"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem("seisly-cookie-choice");
    if (!choice) setVisible(true);
  }, []);

  const accept = (choice: "essential" | "all") => {
    localStorage.setItem("seisly-cookie-choice", choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-[#1a1a18] border border-[#2a2a28] rounded-xl px-6 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-[#888] leading-relaxed">
            We use essential cookies to make Seisly work. We do not use advertising or tracking cookies.{" "}
            <Link href="/cookies" className="text-[#5DCAA5] hover:underline">Cookie Policy</Link>
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => accept("essential")}
              className="border border-[#444] text-[#aaa] text-xs font-medium px-4 py-2.5 rounded-lg hover:border-[#666] hover:text-white transition-colors whitespace-nowrap"
            >
              Essential only
            </button>
            <button
              onClick={() => accept("all")}
              className="bg-[#0d7a5f] text-white text-xs font-medium px-4 py-2.5 rounded-lg hover:bg-[#0a5c47] transition-colors whitespace-nowrap"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
