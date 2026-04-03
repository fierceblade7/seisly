"use client";

import { useState } from "react";
import Link from "next/link";

type Answer = "yes" | "no" | null;

interface Question {
  id: string;
  question: string;
  hint?: string;
  disqualifies?: "seis" | "eis" | "both";
  disqualifyOn: "yes" | "no";
  disqualifyMessage?: string;
}

interface Answers {
  [key: string]: Answer;
}

const seisQuestions: Question[] = [
  {
    id: "uk_incorporated",
    question: "Is your company incorporated in the UK?",
    hint: "Your company must be registered with Companies House.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "Your company must be incorporated in the UK to qualify for SEIS or EIS.",
  },
  {
    id: "not_listed",
    question: "Is your company unquoted and not listed on any recognised stock exchange?",
    hint: "AIM and similar markets count as recognised exchanges.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "Listed companies do not qualify for SEIS or EIS.",
  },
  {
    id: "not_controlled",
    question: "Is your company independent and not a subsidiary or controlled by another company?",
    hint: "Another company must not own more than 50% of your shares.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "Subsidiaries and companies controlled by another company do not qualify.",
  },
  {
    id: "qualifying_trade",
    question: "Does your company carry on a qualifying trade?",
    hint: "Most trades qualify. Excluded activities include property development, financial services, leasing, legal and accountancy services, farming, and running hotels or nursing homes.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "Your trade must be a qualifying trade under HMRC rules. Certain activities like property development, financial services, and leasing are excluded.",
  },
  {
    id: "uk_establishment",
    question: "Does your company have a permanent establishment in the UK?",
    hint: "This means a fixed place of business in the UK such as an office or premises.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "Your company must have a permanent establishment in the UK.",
  },
  {
    id: "seis_age",
    question: "Was your company incorporated less than 3 years ago?",
    hint: "The date of your first SEIS investment must be within 3 years of your company starting to trade.",
    disqualifies: "seis",
    disqualifyOn: "no",
    disqualifyMessage: "SEIS requires your company to have been trading for less than 3 years at the time of the first investment.",
  },
  {
    id: "seis_employees",
    question: "Does your company have fewer than 25 full-time equivalent employees?",
    hint: "Count part-time employees proportionally. Include all group employees if you have subsidiaries.",
    disqualifies: "seis",
    disqualifyOn: "no",
    disqualifyMessage: "SEIS requires fewer than 25 full-time equivalent employees.",
  },
  {
    id: "seis_assets",
    question: "Are your company's gross assets worth less than £350,000 before this investment?",
    hint: "Gross assets means the total value of everything your company owns, before deducting liabilities.",
    disqualifies: "seis",
    disqualifyOn: "no",
    disqualifyMessage: "SEIS requires gross assets of less than £350,000 before the investment.",
  },
  {
    id: "seis_amount",
    question: "Are you raising £250,000 or less in total under SEIS?",
    hint: "This is the lifetime SEIS limit per company. If you have raised any SEIS funding before, count that too.",
    disqualifies: "seis",
    disqualifyOn: "no",
    disqualifyMessage: "The maximum amount a company can raise under SEIS is £250,000 in total.",
  },
  {
    id: "seis_no_prior",
    question: "Have you not previously raised investment under EIS or a VCT before carrying on any trade?",
    hint: "If you raised EIS or VCT funding before your company started trading, you cannot then use SEIS.",
    disqualifies: "seis",
    disqualifyOn: "no",
    disqualifyMessage: "Companies that received EIS or VCT investment before starting to trade cannot use SEIS.",
  },
  {
    id: "money_use",
    question: "Will the money raised be used for a qualifying business activity within 3 years?",
    hint: "Qualifying uses include growing and preparing to carry on a trade, or research and development. The money cannot be used to buy shares, repay loans, or pay dividends.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "SEIS and EIS funds must be used for a qualifying business activity within 3 years of investment.",
  },
];

const eisOnlyQuestions: Question[] = [
  {
    id: "eis_age",
    question: "Was your company incorporated less than 7 years ago?",
    hint: "For knowledge-intensive companies this extends to 10 years. Most standard companies must be within 7 years of first commercial sale.",
    disqualifies: "eis",
    disqualifyOn: "no",
    disqualifyMessage: "EIS requires your company to be within 7 years of its first commercial sale (10 years for knowledge-intensive companies).",
  },
  {
    id: "eis_employees",
    question: "Does your company have fewer than 250 full-time equivalent employees?",
    hint: "Knowledge-intensive companies can have up to 500 employees.",
    disqualifies: "eis",
    disqualifyOn: "no",
    disqualifyMessage: "EIS requires fewer than 250 full-time equivalent employees (500 for knowledge-intensive companies).",
  },
  {
    id: "eis_assets",
    question: "Are your company's gross assets worth less than £15 million before this investment?",
    hint: "And no more than £16 million immediately after the investment.",
    disqualifies: "eis",
    disqualifyOn: "no",
    disqualifyMessage: "EIS requires gross assets of less than £15 million before the investment.",
  },
  {
    id: "eis_amount",
    question: "Are you raising no more than £5 million under EIS in the next 12 months?",
    hint: "This includes all risk finance received in a 12-month period, including SEIS, EIS, and VCT investment.",
    disqualifies: "eis",
    disqualifyOn: "no",
    disqualifyMessage: "The maximum amount a company can raise under EIS is £5 million in any 12-month period.",
  },
];

type Scheme = "seis" | "eis" | "both";

const PRICES: Record<Scheme, string> = { seis: "149", eis: "149", both: "199" };

export default function EligibilityPage() {
  const [step, setStep] = useState<"scheme" | "questions" | "result">("scheme");
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [disqualified, setDisqualified] = useState<{ message: string; scheme: string } | null>(null);
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");

  const getQuestions = (): Question[] => {
    if (scheme === "seis") return seisQuestions;
    if (scheme === "eis") return [...seisQuestions.slice(0, 5), ...eisOnlyQuestions, seisQuestions[seisQuestions.length - 1]];
    return [...seisQuestions, ...eisOnlyQuestions];
  };

  const questions = getQuestions();
  const progress = step === "scheme" ? 0 : step === "result" ? 100 : Math.round((currentQ / questions.length) * 100);

  const handleAnswer = (answer: Answer) => {
    const q = questions[currentQ];
    setAnswers({ ...answers, [q.id]: answer });

    if (answer === q.disqualifyOn && q.disqualifies) {
      const schemeName =
        q.disqualifies === "both"
          ? scheme === "seis" ? "SEIS" : scheme === "eis" ? "EIS" : "SEIS and EIS"
          : q.disqualifies.toUpperCase();
      setDisqualified({ message: q.disqualifyMessage || "", scheme: schemeName });
      setStep("result");
      return;
    }

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep("result");
    }
  };

  const handleEmailSubmit = async (source: string) => {
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setEmailSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scheme: scheme || undefined, source }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSubmitted(true);
      } else {
        setEmailError("Something went wrong. Please try again.");
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const restart = () => {
    setStep("scheme");
    setScheme(null);
    setCurrentQ(0);
    setAnswers({});
    setDisqualified(null);
    setEmail("");
    setEmailSubmitted(false);
    setEmailError("");
  };

  const qualified = !disqualified;
  const schemeLabel = scheme === "seis" ? "SEIS" : scheme === "eis" ? "EIS" : "SEIS and EIS";
  const schemeTitle = scheme === "seis" ? "SEIS advance assurance" : scheme === "eis" ? "EIS advance assurance" : "SEIS and EIS advance assurance";

  const EmailCapture = ({ source }: { source: string }) => (
    <div>
      {!emailSubmitted ? (
        <div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit(source)}
              className="flex-1 border border-[#e8e8e4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0d7a5f] bg-white"
            />
            <button
              onClick={() => handleEmailSubmit(source)}
              disabled={emailSubmitting}
              className="bg-[#0d7a5f] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50"
            >
              {emailSubmitting ? "..." : "Notify me"}
            </button>
          </div>
          {emailError && <p className="text-xs text-[#e55] mt-2">{emailError}</p>}
        </div>
      ) : (
        <div className="bg-[#f0faf6] border border-[#c0e8db] rounded-lg px-4 py-3 text-sm text-[#0a5c47] font-medium">
          You are on the list. We will be in touch very soon.
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* NAV */}
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center justify-between bg-[#fafaf8]">
        <Link href="/">
          <svg width="160" height="42" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
            <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
            <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
            <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
          </svg>
        </Link>
        <div className="text-xs text-[#aaa]">Free eligibility check</div>
      </nav>

      {/* PROGRESS BAR */}
      <div className="h-1 bg-[#e8e8e4]">
        <div className="h-1 bg-[#0d7a5f] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-xl mx-auto px-6 py-16">

        {/* STEP 1: SCHEME SELECTION */}
        {step === "scheme" && (
          <div>
            <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-4">Step 1 of 2</p>
            <h1 className="font-serif text-4xl tracking-tight mb-3">
              Which scheme are<br />you applying for?
            </h1>
            <p className="text-sm text-[#666] mb-10 leading-relaxed">
              Not sure? Most early-stage startups apply for SEIS first, then EIS once they have used their SEIS allowance.
            </p>
            <div className="space-y-3">
              {[
                { value: "seis" as Scheme, title: "SEIS only", price: "£149 + VAT", desc: "Seed Enterprise Investment Scheme. For very early stage companies raising up to £250,000.", tag: "Most common for pre-seed" },
                { value: "eis" as Scheme, title: "EIS only", price: "£149 + VAT", desc: "Enterprise Investment Scheme. For more established companies raising up to £5 million.", tag: "Series A and beyond" },
                { value: "both" as Scheme, title: "SEIS and EIS", price: "£199 + VAT", desc: "Apply for both at the same time. Common when you plan to top up a SEIS round with EIS investment.", tag: "Best value" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setScheme(option.value); setStep("questions"); }}
                  className="w-full text-left border border-[#e8e8e4] rounded-xl p-5 bg-white hover:border-[#0d7a5f] hover:shadow-sm transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-[#1a1a18] group-hover:text-[#0d7a5f] transition-colors">{option.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="font-serif text-lg text-[#0d7a5f]">{option.price}</span>
                      <span className="text-[11px] bg-[#f5f5f2] text-[#888] px-2 py-0.5 rounded">{option.tag}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#666] leading-relaxed">{option.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#aaa] mt-8 text-center">No account needed. Takes about 2 minutes.</p>
          </div>
        )}

        {/* STEP 2: QUESTIONS */}
        {step === "questions" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium">
                Question {currentQ + 1} of {questions.length}
              </p>
              <button
                onClick={() => { if (currentQ === 0) { setStep("scheme"); } else { setCurrentQ(currentQ - 1); } }}
                className="text-xs text-[#aaa] hover:text-[#1a1a18] transition-colors"
              >
                Back
              </button>
            </div>
            <h2 className="font-serif text-[clamp(24px,3vw,36px)] leading-tight tracking-tight mb-3">
              {questions[currentQ].question}
            </h2>
            {questions[currentQ].hint && (
              <div className="bg-[#f5f5f2] border border-[#e8e8e4] rounded-lg p-4 mb-10">
                <p className="text-xs text-[#666] leading-relaxed">
                  <strong className="text-[#444] font-medium">What this means: </strong>
                  {questions[currentQ].hint}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleAnswer("yes")} className="border border-[#e8e8e4] bg-white rounded-xl py-5 text-sm font-medium text-[#1a1a18] hover:border-[#0d7a5f] hover:bg-[#f0faf6] transition-all">
                Yes
              </button>
              <button onClick={() => handleAnswer("no")} className="border border-[#e8e8e4] bg-white rounded-xl py-5 text-sm font-medium text-[#1a1a18] hover:border-[#e55] hover:bg-[#fff5f5] transition-all">
                No
              </button>
            </div>
            <p className="text-xs text-[#aaa] mt-6 text-center">
              Answer based on your current situation. You can always come back and re-run the check.
            </p>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === "result" && (
          <div>
            {qualified ? (
              <div>
                <div className="w-12 h-12 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-xl mb-6">&#10003;</div>
                <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-3">Good news</p>
                <h2 className="font-serif text-4xl tracking-tight mb-4">
                  You look eligible<br />
                  <em className="text-[#0d7a5f]">for {schemeLabel}.</em>
                </h2>
                <p className="text-sm text-[#666] leading-relaxed mb-8">
                  Based on your answers, your company appears to meet the qualifying conditions for {schemeLabel} advance assurance. The full application is coming very soon. Leave your email and you will be first to know when it is ready.
                </p>

                <div className="border border-[#e8e8e4] rounded-xl p-6 bg-white mb-6">
                  <p className="text-sm font-medium mb-1">{schemeTitle}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-serif text-4xl">&pound;{scheme ? PRICES[scheme] : "79"}</span>
                    <span className="text-sm text-[#aaa]">one-time payment</span>
                  </div>
                  <p className="text-xs text-[#aaa] mb-5">No subscription. No hidden fees. Money-back guarantee if rejected due to our error.</p>
                  <p className="text-sm font-medium text-[#1a1a18] mb-3">Get early access</p>
                  <EmailCapture source="eligibility_qualified" />
                </div>

                <div className="bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-5 mb-6">
                  <p className="text-sm font-medium text-[#0a5c47] mb-1">What happens next</p>
                  <p className="text-sm text-[#555] leading-relaxed">
                    We will prepare your full advance assurance application, including the HMRC covering letter and all supporting forms. Once you submit, HMRC typically responds within 4 to 8 weeks.
                  </p>
                </div>

                <p className="text-xs text-center text-[#aaa] mt-4 leading-relaxed px-4">
                  Eligibility is assessed against published HMRC qualifying conditions. Passing this check does not guarantee that HMRC will approve your advance assurance application. HMRC&apos;s decision is discretionary and final.
                </p>

                <button onClick={restart} className="w-full text-center text-sm text-[#aaa] hover:text-[#1a1a18] transition-colors py-2 mt-2">
                  Start again
                </button>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-full bg-[#fff5f5] border border-[#fcc] flex items-center justify-center text-xl mb-6">&#10007;</div>
                <p className="text-[11px] text-[#e55] uppercase tracking-widest font-medium mb-3">Potential issue found</p>
                <h2 className="font-serif text-4xl tracking-tight mb-4">
                  You may not qualify<br />
                  <em className="text-[#e55]">for {disqualified?.scheme}.</em>
                </h2>
                <div className="bg-[#fff5f5] border border-[#fcc] rounded-xl p-5 mb-6">
                  <p className="text-sm text-[#c44] leading-relaxed">{disqualified?.message}</p>
                </div>
                <p className="text-sm text-[#666] leading-relaxed mb-8">
                  This does not necessarily mean you cannot apply. HMRC rules have nuances and some situations have exceptions. Our founder has spent over a decade working through situations exactly like this. Leave your email and we will review your situation personally.
                </p>
                <div className="border border-[#e8e8e4] rounded-xl p-6 bg-white mb-6">
                  <p className="text-sm font-medium mb-1">Get personalised advice</p>
                  <p className="text-sm text-[#666] mb-4 leading-relaxed">
                    Leave your email and our founder will review your situation personally and let you know if there is a path forward.
                  </p>
                  <EmailCapture source="eligibility_disqualified" />
                </div>
                <button onClick={restart} className="w-full text-center text-sm text-[#aaa] hover:text-[#1a1a18] transition-colors py-2">
                  Start again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
