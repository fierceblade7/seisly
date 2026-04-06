import Link from "next/link";
import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "About - Seisly",
  description: "Built by the founder of the UK's first SEIS fund. Over two decades of EIS and SEIS experience.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <Nav />

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
              In all that time, I&apos;ve never had an advance assurance application I submitted not sail through first time.
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

      <Footer />
    </div>
  );
}
