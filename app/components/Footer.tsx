import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a18] px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div className="max-w-sm">
            <div className="font-serif text-xl text-white mb-3">
              Seis<span className="text-[#5DCAA5]">ly</span>
            </div>
            <p className="text-xs text-[#666] leading-relaxed">
              Seisly is brought to you by GoLitigo, the trading name of Litigo Limited, a technology company. We are not a law firm or tax adviser and nothing on this site constitutes legal or tax advice. For advice specific to your circumstances, consult a qualified solicitor or accountant. GoLitigo has a network of specialist advisers we can refer you to.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/privacy" className="text-xs text-[#555] hover:text-[#aaa] transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-[#555] hover:text-[#aaa] transition-colors">Terms of use</Link>
            <Link href="/cookies" className="text-xs text-[#555] hover:text-[#aaa] transition-colors">Cookies</Link>
            <Link href="/acceptable-use" className="text-xs text-[#555] hover:text-[#aaa] transition-colors">Acceptable use</Link>
          </div>
        </div>
        <div className="border-t border-[#2a2a28] pt-6">
          <p className="text-xs text-[#444]">&copy; 2026 Litigo Limited (GoLitigo). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
