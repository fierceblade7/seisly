import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Seisly",
  description: "Built by the founder of the UK's first SEIS fund. Over two decades of EIS and SEIS experience.",
};

const Logo = () => (
  <svg width="140" height="37" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
    <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
    <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
    <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
  </svg>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center justify-between bg-white">
        <Link href="/"><Logo /></Link>
        <Link href="/eligibility">
          <button className="bg-[#0d7a5f] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-[#0a5c47] transition-colors">
            Check eligibility
          </button>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl">
          <h1 className="font-serif text-[clamp(28px,3.5vw,40px)] leading-tight tracking-tight mb-8">
            Built by someone who&apos;s been doing this since before SEIS existed
          </h1>

          <div className="space-y-5 text-sm text-[#444] leading-relaxed">
            <p>
              I&apos;m Sanjay. I started my career in corporate tax at Arthur Andersen, where my clients included startups and venture capital firms. Back then there was no SEIS &ndash; only EIS &ndash; and I spent my time helping clients structure their businesses, making successful EIS applications and fundraises, and putting in place new structures for clients making investments and leveraged buyouts.
            </p>
            <p>
              After a decade in corporate finance and ventures in the media and entertainment sector, I set up on my own. When SEIS launched in 2012, I founded the UK&apos;s first SEIS fund. Since then, I&apos;ve sat on every side of the table: as the fund deploying investment, as the adviser helping founders get investor-ready, and as a founder raising myself.
            </p>
            <p className="font-medium text-[#1a1a18]">
              In all that time, I&apos;ve never had an advance assurance application I made not sail through first time.
            </p>
            <p>
              I built Seisly because asking startup founders to pay £2,000 or more never made sense to me. Most founders raising pre-seed or seed rounds don&apos;t have that kind of money to spend on pre-raise admin. They shouldn&apos;t have to.
            </p>
            <p>
              Seisly takes everything I&apos;ve learned from over two decades of EIS and SEIS applications and puts it into an AI that I and my expert colleagues have trained. The AI drafts your application. I &ndash; or one of my expert colleagues &ndash; review it before it goes to HMRC. If we think anything needs more work, we&apos;ll tell you exactly what to fix. You get the same quality that used to cost thousands, for a fraction of the price.
            </p>
            <p>
              If you have questions, find me on{" "}
              <a href="https://www.linkedin.com/in/sanjaywadhwani/" target="_blank" rel="noopener noreferrer" className="text-[#0d7a5f] hover:underline">
                LinkedIn
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
