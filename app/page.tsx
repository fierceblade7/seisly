"use client";

import { useState } from "react";
import Link from "next/link";

const Logo = () => (
  <svg width="160" height="42" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
    <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
    <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
    <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
  </svg>
);

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Is Seisly providing legal or tax advice?",
      a: "No. Seisly is a document preparation and guidance tool, not a law firm or accountancy practice. We help you prepare and submit your application correctly. That said, as part of GoLitigo we have access to experienced professionals and lawyers through our Expert Adviser Network, who work on more affordable rates and fixed fees than most high street and city firms. If you need specialist advice, we can put you in touch.",
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
    { label: "SEIS advance assurance", a: "£2,000+ + VAT", b: "£390 + VAT + subscription", c: "£149 + VAT" },
    { label: "EIS advance assurance", a: "£2,500+ + VAT", b: "£390 + VAT + subscription", c: "£149 + VAT" },
    { label: "SEIS and EIS together", a: "£3,000+ + VAT", b: "£780 + VAT + subscription", c: "£199 + VAT" },
    { label: "Compliance statement (SEIS/EIS)", a: "£1,500+ + VAT", b: "£490+ + VAT", c: "£399 + VAT (coming soon)" },
    { label: "Investor finder (Boost equivalent)", a: "Not offered", b: "£590 + VAT", c: "£49/mo (Novar)" },
    { label: "Investor certificates included", a: "✗", b: "✓", c: "✓" },
    { label: "No monthly subscription", a: "✗", b: "✗", c: "✓" },
    { label: "Instant eligibility check", a: "✗", b: "✓", c: "✓" },
    { label: "Complex cases handled", a: "✓", b: "✗", c: "✓" },
    { label: "HMRC query support included", a: "✗ billed extra", b: "✗", c: "✓" },
    { label: "Built by SEIS fund founders", a: "✗", b: "✗", c: "✓" },
    { label: "Money-back guarantee", a: "✗", b: "✗", c: "✓" },
  ];

  const plans = [
    {
      name: "SEIS only", price: "149", featured: false,
      features: ["Eligibility check", "Advance assurance application", "HMRC covering letter", "SEIS1 form completion", "Investor certificates (SEIS3)", "Compliance tracking (3 years)", "HMRC query support", "Money-back guarantee"],
    },
    {
      name: "SEIS and EIS", price: "199", featured: true,
      features: ["Everything in SEIS", "EIS advance assurance", "EIS1 form completion", "Investor certificates (EIS3)", "HMRC query support (both)", "Compliance tracking (3 years)", "Complex cases handled", "Money-back guarantee"],
    },
    {
      name: "EIS only", price: "149", featured: false,
      features: ["Eligibility check", "Advance assurance application", "HMRC covering letter", "EIS1 form completion", "Investor certificates (EIS3)", "Compliance tracking (3 years)", "HMRC query support", "Money-back guarantee"],
    },
  ];

  const steps = [
    { n: 1, title: "Check your eligibility", desc: "Answer a few questions about your company and we check you against all HMRC qualifying conditions for SEIS and EIS. Free, instant, and no account needed.", tag: "Takes 2 minutes" },
    { n: 2, title: "Tell us about your raise", desc: "How much are you raising, from how many investors, and on what terms. We use this to complete your application correctly first time.", tag: "No jargon, plain English throughout" },
    { n: 3, title: "We draft your application", desc: "Our AI generates your full advance assurance submission, including the covering letter HMRC expects, built from over a decade of real applications.", tag: "AI-powered, expert-trained" },
    { n: 4, title: "Review, approve, submit", desc: "Read through your application, make any tweaks, and submit directly to HMRC's SEIS and EIS team. We track the status and alert you to any updates.", tag: "HMRC turnaround: 4 to 8 weeks" },
    { n: 5, title: "Issue investor certificates", desc: "Once approved and shares are issued, generate SEIS3 or EIS3 certificates for every investor in one click. Ready to send straight away.", tag: "Included in your one-off fee" },
  ];

  const features = [
    { icon: "⚡", title: "Instant eligibility check", desc: "Know in 2 minutes whether you qualify, before you spend a penny." },
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
        <Link href="/">
          <Logo />
        </Link>
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
          &pound;149. Not &pound;2,000.
        </p>
        <p className="text-lg text-[#555] max-w-[520px] mx-auto mb-10 leading-relaxed font-light">
          HMRC-ready in under an hour.{" "}
          <strong className="text-[#1a1a18] font-medium">No lawyers. No accountants. No monthly plans.</strong>{" "}
          Built by the founder of the UK&apos;s first SEIS fund.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-3">
          <Link href="/eligibility">
            <button className="bg-[#0d7a5f] text-white font-medium px-8 py-4 rounded-lg text-sm hover:bg-[#0a5c47] transition-all hover:-translate-y-px">
              Check my eligibility, it&apos;s free &rarr;
            </button>
          </Link>
          <a href="#how">
            <button className="bg-transparent text-[#1a1a18] border border-[#ccc] px-8 py-4 rounded-lg text-sm hover:border-[#888] transition-colors">
              See how it works
            </button>
          </a>
        </div>
        <p className="text-xs text-[#aaa]">Takes 2 minutes. No account needed.</p>
      </section>

      {/* PRICE COMPARISON — BAND 1 */}
      <section className="px-6 pb-8 max-w-3xl mx-auto">
        <p className="text-[11px] text-[#aaa] uppercase tracking-widest text-center mb-6">
          SEIS advance assurance — what you actually pay
        </p>
        <div className="grid grid-cols-3 gap-px bg-[#e8e8e4] rounded-xl overflow-hidden border border-[#e8e8e4]">
          <div className="bg-white p-5 text-center">
            <div className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">Solicitor</div>
            <div className="text-sm font-medium text-[#555] mb-3">Avg. professional fee</div>
            <div className="font-serif text-[28px] text-[#1a1a18] leading-none">&pound;2,000+</div>
            <div className="text-[11px] text-[#aaa] mt-1">+ VAT</div>
          </div>
          <div className="bg-white p-5 text-center">
            <div className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">SeedLegals</div>
            <div className="text-sm font-medium text-[#555] mb-3">AA + subscription</div>
            <div className="font-serif text-[28px] text-[#1a1a18] leading-none">&pound;390+</div>
            <div className="text-[11px] text-[#aaa] mt-1">+ VAT + £75/mo subscription</div>
          </div>
          <div className="bg-[#f0faf6] p-5 text-center">
            <div className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">&#10022; Seisly</div>
            <div className="text-sm font-medium text-[#0d7a5f] mb-3">All-in, no subscription</div>
            <div className="font-serif text-[28px] text-[#0d7a5f] leading-none">&pound;149</div>
            <div className="text-[11px] text-[#aaa] mt-1">+ VAT. One-time. Done.</div>
          </div>
        </div>
        <p className="text-center text-sm text-[#0a5c47] font-medium mt-4">
          Save over &pound;300 vs SeedLegals advance assurance alone. Save over &pound;1,800 vs a solicitor.
        </p>
      </section>

      {/* PRICE COMPARISON — BAND 2 */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <p className="text-[11px] text-[#aaa] uppercase tracking-widest text-center mb-2">
          Want to find investors too?
        </p>
        <h3 className="font-serif text-2xl text-center tracking-tight mb-6">The full investor-ready package</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#e8e8e4] rounded-xl p-6">
            <div className="text-sm font-medium text-[#555] mb-4">SeedLegals equivalent</div>
            <ul className="space-y-2 mb-6">
              {[
                ["SEIS advance assurance", "£390 + VAT"],
                ["Access subscription (6 months)", "£450 + VAT"],
                ["Boost — find investors", "£590 + VAT"],
              ].map(([label, price]) => (
                <li key={label} className="flex justify-between text-sm">
                  <span className="text-[#666]">{label}</span>
                  <span className="font-medium text-[#1a1a18]">{price}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#f0f0ec] pt-4 flex justify-between items-baseline">
              <span className="text-sm font-medium">Total</span>
              <span className="font-serif text-2xl text-[#1a1a18]">&pound;1,430 <span className="text-sm font-sans text-[#aaa]">+ VAT</span></span>
            </div>
          </div>
          <div className="bg-[#f0faf6] border border-[#0d7a5f] rounded-xl p-6">
            <div className="text-sm font-medium text-[#0d7a5f] mb-4">Seisly + Novar for Startups</div>
            <ul className="space-y-2 mb-6">
              {[
                ["SEIS advance assurance", "£149 + VAT"],
                ["Novar for Startups", "£49/mo + VAT"],
                ["(usual price £59/mo — Seisly discount)", ""],
              ].map(([label, price]) => (
                <li key={label} className="flex justify-between text-sm">
                  <span className={label.startsWith("(") ? "text-[#0d7a5f] text-xs italic" : "text-[#666]"}>{label}</span>
                  <span className="font-medium text-[#0d7a5f]">{price}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#c0e8db] pt-4 flex justify-between items-baseline">
              <span className="text-sm font-medium text-[#0a5c47]">Total</span>
              <div className="text-right">
                <span className="font-serif text-2xl text-[#0d7a5f]">&pound;149 <span className="text-sm font-sans text-[#aaa]">+ VAT</span></span>
                <p className="text-xs text-[#0d7a5f] mt-0.5">then £49/mo + VAT</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-[#0a5c47] font-medium mt-4">
          Get investor-ready AND start finding investors. Save over £1,280 vs SeedLegals.
        </p>
        <p className="text-center text-xs text-[#aaa] mt-2">
          Novar for Startups finds investors and customers — the best non-dilutive finance there is.
        </p>
      </section>

      {/* FOUNDER STRIP */}
      <section className="bg-[#1a1a18] px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] text-[#5DCAA5] uppercase tracking-widest mb-5">Why trust us</p>
          <p className="font-serif text-[clamp(20px,2.5vw,28px)] text-white leading-relaxed italic mb-6">
            Built by the founder of the first SEIS fund on the market in 2012. Someone who has sat on all sides of the table: as the fund deploying investment, as the adviser helping founders get investor ready, and as a founder raising himself. Someone who has never, not even once, had an application not sail through first time.
          </p>
          <p className="text-sm text-[#888] leading-relaxed">
            <strong className="text-[#ccc] font-medium">We have been in this world since 2012.</strong> We know what HMRC looks for, what trips founders up, and why paying thousands of pounds for a form-filling exercise never made sense. Seisly fixes that. And as part of GoLitigo, when you need a specialist, we have one.
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
                <div className="text-xs text-[#aaa] mb-6">+ VAT. One-time payment.</div>
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
        <p className="font-serif text-[clamp(28px,3vw,42px)] text-[#5DCAA5] italic mb-6">Seisly done. &pound;149.</p>
        <p className="text-base text-[#9FE1CB] mb-8 font-light">
          Join the founders who skipped the lawyers and accountants,<br className="hidden sm:block" /> saved thousands, and got investor-ready faster.
        </p>
        <Link href="/eligibility">
          <button className="bg-white text-[#0a5c47] font-medium px-10 py-4 rounded-lg text-base hover:-translate-y-0.5 transition-transform">
            Check my eligibility, it&apos;s free &rarr;
          </button>
        </Link>
        <p className="text-xs text-[#5DCAA5] mt-4">Takes 2 minutes. No credit card needed to check eligibility.</p>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1a1a18] px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div className="max-w-sm">
              <div className="font-serif text-xl text-white mb-3">
                Seis<span className="text-[#5DCAA5]">ly</span>
              </div>
              <p className="text-xs text-[#666] leading-relaxed">
                Seisly is a product of Litigo Limited, a technology company. We are not a law firm or tax adviser and nothing on this site constitutes legal or tax advice. For advice specific to your circumstances, consult a qualified solicitor or accountant.
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
    </div>
  );
}
