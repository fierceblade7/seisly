"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Is Seisly providing legal or tax advice?",
      a: "No. Seisly is a document preparation and guidance tool, not a law firm or accountancy practice. We help you prepare and submit your application correctly. If you have complex tax or legal questions, we will tell you when you need a specialist.",
    },
    {
      q: "What if HMRC rejects my application?",
      a: "If HMRC rejects your advance assurance application due to an error on our part, we will refund you in full. If the rejection is because your company does not qualify (which our eligibility check should catch), we will help you understand why and what to do next.",
    },
    {
      q: "How long does HMRC take to respond?",
      a: "HMRC typically responds to SEIS and EIS advance assurance applications within 4 to 8 weeks. We track your submission and notify you the moment there is an update.",
    },
    {
      q: "Do I need advance assurance before raising?",
      a: "Strictly speaking, no. Advance assurance is optional. But almost every investor expects it before writing a cheque. It de-risks the investment for them and signals you have done your homework. We strongly recommend getting it first.",
    },
    {
      q: "My company structure is complicated. Can Seisly still help?",
      a: "Yes. Unlike some services that refer complex cases elsewhere, we handle them. Our founder has spent over a decade working with HMRC on SEIS and EIS applications across all kinds of structures. Run the eligibility check and we will tell you exactly where you stand.",
    },
    {
      q: "Is there a monthly subscription?",
      a: "Never. You pay once per application. That is it. Optional add-ons like ongoing compliance monitoring will always be exactly that, optional.",
    },
  ];

  const vsRows = [
    { label: "SEIS advance assurance", a: "£2,000+", b: "£399 + plan", c: "£79" },
    { label: "EIS advance assurance", a: "£2,500+", b: "£799 + plan", c: "£129" },
    { label: "SEIS and EIS together", a: "£3,000+", b: "£999 + plan", c: "£149" },
    { label: "Investor certificates included", a: "✗", b: "✓", c: "✓" },
    { label: "No monthly subscription", a: "✗", b: "✗", c: "✓" },
    { label: "Instant eligibility check", a: "✗", b: "✓", c: "✓" },
    { label: "Complex cases handled", a: "✓", b: "✗", c: "✓" },
    { label: "HMRC query support included", a: "✗ billed extra", b: "✗", c: "✓" },
    { label: "Compliance tracking included", a: "✗", b: "✗", c: "✓" },
    { label: "Built by SEIS fund founders", a: "✗", b: "✗", c: "✓" },
    { label: "Money-back guarantee", a: "✗", b: "✗", c: "✓" },
  ];

  const plans = [
    {
      name: "SEIS only", price: "79", featured: false,
      features: ["Eligibility check", "Advance assurance application", "HMRC covering letter", "SEIS1 form completion", "Investor certificates (SEIS3)", "Compliance tracking (3 years)", "HMRC query support", "Money-back guarantee"],
    },
    {
      name: "SEIS and EIS", price: "149", featured: true,
      features: ["Everything in SEIS", "EIS advance assurance", "EIS1 form completion", "Investor certificates (EIS3)", "HMRC query support (both)", "Compliance tracking (3 years)", "Complex cases handled", "Money-back guarantee"],
    },
    {
      name: "EIS only", price: "129", featured: false,
      features: ["Eligibility check", "Advance assurance application", "HMRC covering letter", "EIS1 form completion", "Investor certificates (EIS3)", "Compliance tracking (3 years)", "HMRC query support", "Money-back guarantee"],
    },
  ];

  const steps = [
    { n: 1, title: "Check your eligibility", desc: "Answer a few questions about your company and we check you against all HMRC qualifying conditions for SEIS and EIS. Free, instant, and no account needed.", tag: "Takes 5 minutes" },
    { n: 2, title: "Tell us about your raise", desc: "How much are you raising, from how many investors, and on what terms. We use this to complete your application correctly first time.", tag: "No jargon, plain English throughout" },
    { n: 3, title: "We draft your application", desc: "Our AI generates your full advance assurance submission, including the covering letter HMRC expects, built from over a decade of real applications.", tag: "AI-powered, expert-trained" },
    { n: 4, title: "Review, approve, submit", desc: "Read through your application, make any tweaks, and submit directly to HMRC's SEIS and EIS team. We track the status and alert you to any updates.", tag: "HMRC turnaround: 4 to 8 weeks" },
    { n: 5, title: "Issue investor certificates", desc: "Once approved and shares are issued, generate SEIS3 or EIS3 certificates for every investor in one click. Ready to send straight away.", tag: "Included in your one-off fee" },
  ];

  const features = [
    { icon: "⚡", title: "Instant eligibility check", desc: "Know in 5 minutes whether you qualify, before you spend a penny." },
    { icon: "✍️", title: "AI advance assurance letter", desc: "A proper covering letter drafted to HMRC's expectations, trained on a decade of real applications." },
    { icon: "📋", title: "SEIS1 and EIS1 forms", desc: "All required HMRC forms completed and formatted correctly. Nothing left blank." },
    { icon: "📄", title: "Investor certificates", desc: "SEIS3 and EIS3 certificates generated automatically once HMRC approves and shares are issued." },
    { icon: "🔔", title: "Compliance reminders", desc: "We track your 3-year compliance window and alert you when action is needed." },
    { icon: "💬", title: "HMRC query support", desc: "If HMRC writes back with questions, we help you respond. Included, not billed by the hour." },
  ];

  return (
    <div className="bg-[#fafaf8] text-[#1a1a18] font-sans">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#fafaf8]/90 backdrop-blur-md border-b border-[#e8e8e4] px-6 h-[60px] flex items-center justify-between">
        <div>
          <div className="font-serif text-2xl tracking-tight">Seis<span className="text-[#0d7a5f]">ly</span></div>
          <div className="text-[11px] text-[#aaa] tracking-wide -mt-0.5">Seisly done.</div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#how" className="text-sm text-[#555] hover:text-[#1a1a18] transition-colors hidden sm:block">How it works</a>
          <a href="#pricing" className="text-sm text-[#555] hover:text-[#1a1a18] transition-colors hidden sm:block">Pricing</a>
          <a href="#faq" className="text-sm text-[#555] hover:text-[#1a1a18] transition-colors hidden sm:block">FAQ</a>
          <Link href="/eligibility">
            <button className="bg-[#0d7a5f] text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-[#0a5c47] transition-colors">
              Start free &rarr;
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-24 pb-12 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#e8f5f1] border border-[#a8ddd0] text-[#0a5c47] text-xs font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-[#0d7a5f] rounded-full animate-pulse" />
          Now in early access
        </div>
        <h1 className="font-serif text-[clamp(42px,6vw,72px)] leading-[1.0] tracking-[-2px] mb-4">
          Need SEIS or EIS<br />advance assurance?<br />
          <em className="text-[#0d7a5f] not-italic font-serif">Seisly done.</em>
        </h1>
        <p className="font-serif text-[clamp(24px,3vw,36px)] text-[#1a1a18] mb-6 tracking-tight">
          &pound;79. Not &pound;2,000.
        </p>
        <p className="text-lg text-[#555] max-w-[520px] mx-auto mb-10 leading-relaxed font-light">
          HMRC-ready in under an hour.{" "}
          <strong className="text-[#1a1a18] font-medium">No lawyers. No accountants. No monthly plans.</strong>{" "}
          Built by the founder of the UK&apos;s first SEIS fund.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-3">
          <Link href="/eligibility">
            <button className="bg-[#0d7a5f] text-white font-medium px-8 py-4 rounded-lg text-sm hover:bg-[#0a5c47] transition-all hover:-translate-y-px">
              Check my eligibility &mdash; it&apos;s free &rarr;
            </button>
          </Link>
          <a href="#how">
            <button className="bg-transparent text-[#1a1a18] border border-[#ccc] px-8 py-4 rounded-lg text-sm hover:border-[#888] transition-colors">
              See how it works
            </button>
          </a>
        </div>
        <p className="text-xs text-[#aaa]">Takes 5 minutes. No account needed.</p>
      </section>

      {/* PRICE COMPARISON */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <div className="bg-white border border-[#e8e8e4] rounded-2xl p-8">
          <p className="text-[11px] text-[#aaa] uppercase tracking-widest text-center mb-6">
            SEIS advance assurance &mdash; what others charge
          </p>
          <div className="grid grid-cols-3 gap-px bg-[#e8e8e4] rounded-xl overflow-hidden">
            <div className="bg-white p-5 text-center">
              <div className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">Professional fees</div>
              <div className="text-sm font-medium text-[#555] mb-3">Lawyers and accountants</div>
              <div className="font-serif text-[34px] text-[#1a1a18] leading-none">&pound;2,000+</div>
              <div className="text-[11px] text-[#aaa] mt-1">avg. professional fee</div>
            </div>
            <div className="bg-white p-5 text-center">
              <div className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">Platform</div>
              <div className="text-sm font-medium text-[#555] mb-3">SeedLegals</div>
              <div className="font-serif text-[34px] text-[#1a1a18] leading-none">&pound;399+</div>
              <div className="text-[11px] text-[#aaa] mt-1">+ monthly subscription</div>
            </div>
            <div className="bg-[#f0faf6] p-5 text-center">
              <div className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">&#10022; This is us</div>
              <div className="text-sm font-medium text-[#0d7a5f] mb-3">Seisly</div>
              <div className="font-serif text-[34px] text-[#0d7a5f] leading-none">&pound;79</div>
              <div className="text-[11px] text-[#aaa] mt-1">one-time. all-in. done.</div>
            </div>
          </div>
          <p className="text-center text-sm text-[#0a5c47] font-medium mt-5">
            Save over &pound;300 vs SeedLegals. Save &pound;1,900 vs a professional.
          </p>
        </div>
      </section>

      {/* FOUNDER STRIP */}
      <section className="bg-[#1a1a18] px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] text-[#5DCAA5] uppercase tracking-widest mb-5">Why trust us</p>
          <blockquote className="font-serif text-[clamp(20px,2.5vw,28px)] text-white leading-relaxed italic mb-6">
            &ldquo;Built by the founder of the UK&apos;s first SEIS fund in 2012. Not an AI consultancy that built this as a side project. Someone who has sat on both sides of the table: as the fund writing the cheques, and as the person helping founders get ready to receive them.&rdquo;
          </blockquote>
          <p className="text-sm text-[#888] leading-relaxed">
            <strong className="text-[#ccc] font-medium">We have been in this world since 2012.</strong> We know what HMRC looks for, what trips founders up, and why paying thousands of pounds for a form-filling exercise never made sense. Seisly fixes that. And because we have spent over a decade doing this for real, we handle the complex cases that other tools cannot.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-[#fafaf8] px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-3">How it works</p>
          <h2 className="font-serif text-[clamp(30px,3.5vw,46px)] leading-tight tracking-tight mb-2">
            From zero to HMRC-ready<br />in under an hour
          </h2>
          <p className="text-base text-[#666] mb-12 font-light">We handle the complexity. You focus on building.</p>
          <div className="divide-y divide-[#f0f0ec]">
            {steps.map((step) => (
              <div key={step.n} className="grid grid-cols-[48px_1fr] gap-6 py-7 items-start">
                <div className="w-9 h-9 rounded-full bg-[#e8f5f1] border border-[#c0e8db] text-[#0a5c47] text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.n}
                </div>
                <div>
                  <h4 className="text-base font-medium mb-1">{step.title}</h4>
                  <p className="text-sm text-[#666] leading-relaxed">{step.desc}</p>
                  <span className="inline-block mt-2 bg-[#f5f5f2] text-[#888] text-[11px] px-2 py-0.5 rounded">{step.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#1a1a18] px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] text-[#5DCAA5] uppercase tracking-widest font-medium mb-3">What is included</p>
          <h2 className="font-serif text-[clamp(30px,3.5vw,46px)] leading-tight tracking-tight text-white mb-2">
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
          <p className="text-base text-[#888] mb-10 font-light">One flat fee covers the entire SEIS or EIS journey, start to finish.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2a2a28] rounded-xl overflow-hidden">
            {features.map((f) => (
              <div key={f.title} className="bg-[#1a1a18] p-7 hover:bg-[#222220] transition-colors">
                <div className="text-xl mb-4">{f.icon}</div>
                <h4 className="text-sm font-medium text-white mb-2">{f.title}</h4>
                <p className="text-sm text-[#888] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VS TABLE */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-3">The honest comparison</p>
          <h2 className="font-serif text-[clamp(30px,3.5vw,46px)] leading-tight tracking-tight mb-2">Seisly vs everyone else</h2>
          <p className="text-base text-[#666] mb-10 font-light">We are not the only option. We are just the best one.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-[#f0f0ec]">
                  <th className="text-left py-3 px-4 text-[11px] text-[#aaa] uppercase tracking-wide font-medium"></th>
                  <th className="text-center py-3 px-4 text-[13px] text-[#1a1a18] font-medium">Lawyers and accountants</th>
                  <th className="text-center py-3 px-4 text-[13px] text-[#1a1a18] font-medium">SeedLegals</th>
                  <th className="text-center py-3 px-4 text-[13px] text-[#0d7a5f] font-medium">Seisly &#10022;</th>
                </tr>
              </thead>
              <tbody>
                {vsRows.map((row) => (
                  <tr key={row.label} className="border-b border-[#f5f5f2]">
                    <td className="py-4 px-4 text-[#444]">{row.label}</td>
                    <td className={`py-4 px-4 text-center font-medium ${row.a.includes("✗") ? "text-[#ddd]" : "text-[#ccc]"}`}>{row.a}</td>
                    <td className={`py-4 px-4 text-center font-medium ${row.b === "✓" ? "text-[#0d7a5f]" : "text-[#ddd]"}`}>{row.b}</td>
                    <td className="py-4 px-4 text-center font-medium text-[#0d7a5f]">{row.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-[#fafaf8] px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-3">Pricing</p>
          <h2 className="font-serif text-[clamp(30px,3.5vw,46px)] leading-tight tracking-tight mb-2">Simple. Flat. No surprises.</h2>
          <p className="text-base text-[#666] mb-10 font-light">Pay once per application. No subscriptions, ever.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-xl p-7 relative ${plan.featured ? "border-2 border-[#0d7a5f]" : "border border-[#e8e8e4]"}`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d7a5f] text-white text-[11px] font-medium px-4 py-1 rounded-full whitespace-nowrap">
                    Best value
                  </div>
                )}
                <div className="text-sm font-medium text-[#555] mb-2">{plan.name}</div>
                <div className="font-serif text-[42px] leading-none mb-1">
                  <sup className="text-xl font-sans align-super">&pound;</sup>{plan.price}
                </div>
                <div className="text-xs text-[#aaa] mb-6">one-time payment</div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 items-start text-sm text-[#555]">
                      <span className="text-[#0d7a5f] font-semibold flex-shrink-0 mt-0.5">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/eligibility">
                  <button className={`w-full py-3 rounded-lg text-sm font-medium transition-colors border border-[#0d7a5f] ${plan.featured ? "bg-[#0d7a5f] text-white hover:bg-[#0a5c47]" : "text-[#0d7a5f] hover:bg-[#0d7a5f] hover:text-white"}`}>
                    Get started &rarr;
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-3">FAQ</p>
          <h2 className="font-serif text-[clamp(30px,3.5vw,46px)] leading-tight tracking-tight mb-8">Questions we get asked</h2>
          <div className="divide-y divide-[#f0f0ec]">
            {faqs.map((faq, i) => (
              <div key={i} className="border-t border-[#f0f0ec] first:border-t">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex justify-between items-center py-5 text-left">
                  <span className="text-sm font-medium text-[#1a1a18] pr-4">{faq.q}</span>
                  <span className={`text-[#aaa] text-xl flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && <div className="pb-5 text-sm text-[#666] leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#0a5c47] px-6 py-24 text-center">
        <h2 className="font-serif text-[clamp(36px,5vw,60px)] text-white leading-tight tracking-tight mb-2">
          Need SEIS or EIS<br />advance assurance?
        </h2>
        <p className="font-serif text-[clamp(28px,3vw,42px)] text-[#5DCAA5] italic mb-6">Seisly done. &pound;79.</p>
        <p className="text-base text-[#9FE1CB] mb-8 font-light">
          Join the founders who skipped the lawyers and accountants,<br className="hidden sm:block" /> saved thousands, and got investor-ready faster.
        </p>
        <Link href="/eligibility">
          <button className="bg-white text-[#0a5c47] font-medium px-10 py-4 rounded-lg text-base hover:-translate-y-0.5 transition-transform">
            Check my eligibility &mdash; it&apos;s free &rarr;
          </button>
        </Link>
        <p className="text-xs text-[#5DCAA5] mt-4">Takes 5 minutes. No credit card needed to check eligibility.</p>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111] px-6 py-10 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="font-serif text-xl text-white">Seis<span className="text-[#5DCAA5]">ly</span></div>
          <div className="text-[11px] text-[#444] mt-0.5">Seisly done.</div>
        </div>
        <p className="text-xs text-[#555]">Not a law firm or accountancy practice. Not affiliated with HMRC or SeedLegals.</p>
        <p className="text-xs text-[#555]">&copy; 2026 Seisly Ltd &middot; London, UK</p>
      </footer>
    </div>
  );
}
