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
    disqualifyOn: "no", // does not disqualify — triggers follow-up instead
  },
  {
    id: "not_listed",
    question: "Is your company unquoted and not listed on any recognised stock exchange?",
    hint: "Main market (LSE), NYSE, NASDAQ and similar major exchanges count as recognised. AIM and AQSE are not recognised exchanges for SEIS/EIS purposes, so AIM companies can still qualify.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "Listed companies do not qualify for SEIS or EIS.",
  },
  {
    id: "not_controlled",
    question: "Is your company independent and not a subsidiary or controlled by another company?",
    hint: "You can be in a group and still qualify, as long as your company is not controlled by a non-qualifying company. If there is a group, the SEIS/EIS issuer is usually the top UK holding company. Any subsidiaries below it must be qualifying subsidiaries - more than 50% owned by the parent and carrying on qualifying trading activities. Employee numbers and gross assets are counted across the whole group.",
    disqualifyOn: "no", // does not disqualify directly — triggers follow-up
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
    id: "seis_age",
    question: "Was your company's first day of trading less than 3 years ago?",
    hint: "Trading starts when you first make your goods or services genuinely available for sale, even if no one buys on that day. This date is on or before your first invoice or revenue, never after. It is not the same as your date of incorporation.",
    disqualifies: "seis",
    disqualifyOn: "no",
    disqualifyMessage: "SEIS requires your company to have been trading for less than 3 years at the time of the first investment.",
  },
  {
    id: "seis_employees",
    question: "Does your company have fewer than 25 full-time equivalent employees?",
    hint: "Include directors as employees. Count part-time staff proportionally based on hours worked. If your company is in a group, count all employees across the group.",
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
    question: "Has the company previously raised investment under EIS or a VCT before carrying on any trade?",
    hint: "If you raised EIS or VCT funding before your company started trading, you cannot then use SEIS.",
    disqualifies: "seis",
    disqualifyOn: "yes",
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

// Data-gathering question (not a complexity flag, carried forward silently)
const dataQuestions: Question[] = [
  {
    id: "has_previous_vcs",
    question: "Has the company previously received any SEIS, EIS, VCT, or SITR investment?",
    hint: "This includes any venture capital scheme investment or risk finance State aid the company has received before. This does not affect your eligibility but helps us prepare your application correctly.",
    disqualifyOn: "no", // never disqualifies
  },
];

// Non-disqualifying questions that flag complexity
const complexityQuestions: Question[] = [
  {
    id: "claims_kic",
    question: "Is the company applying as a Knowledge Intensive Company (KIC)?",
    hint: "KICs can use extended age limits (10 years instead of 7) and higher funding limits. Most companies are not KICs.",
    disqualifyOn: "no",
  },
  {
    id: "non_uk_operations",
    question: "Does the company have significant operations, subsidiaries, or investors outside the UK?",
    hint: "For example, overseas subsidiaries, non-UK resident directors, or the majority of investors based outside the UK.",
    disqualifyOn: "no",
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
  const [softDisqualified, setSoftDisqualified] = useState<{ message: string } | null>(null);
  const [seisAmountInterstitial, setSeisAmountInterstitial] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [complexSubmitting, setComplexSubmitting] = useState(false);
  const [complexSubmitted, setComplexSubmitted] = useState(false);

  const ukEstablishmentQuestion: Question = {
    id: "uk_establishment",
    question: "Does your company have a permanent establishment in the UK?",
    hint: "A permanent establishment is a fixed place of business in the UK through which the company carries out its trade, such as an office, branch or factory.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "Your company must be incorporated in the UK or have a permanent establishment in the UK to qualify for SEIS or EIS.",
  };

  const qualifyingSubsidiaryQuestion: Question = {
    id: "qualifying_subsidiary",
    question: "Is your company a qualifying subsidiary within a group structure?",
    hint: "A qualifying subsidiary is more than 50% owned by the parent company, not controlled by any outside party, and carries on qualifying trading activities with no more than 20% excluded activities.",
    disqualifies: "both",
    disqualifyOn: "no",
    disqualifyMessage: "Your company must not be controlled by a non-qualifying company to be eligible for SEIS or EIS.",
  };

  const getQuestions = (): Question[] => {
    let qs: Question[];
    if (scheme === "seis") qs = [...seisQuestions];
    else if (scheme === "eis") qs = [...seisQuestions.slice(0, 4), ...eisOnlyQuestions, seisQuestions[seisQuestions.length - 1]];
    else {
      // Combined track: include EIS questions but skip any whose SEIS equivalent
      // was already answered "yes" (lower threshold automatically satisfies higher)
      const eisToSeisMap: Record<string, string> = {
        eis_age: "seis_age",
        eis_employees: "seis_employees",
        eis_assets: "seis_assets",
        eis_amount: "seis_amount",
      };
      const filteredEis = eisOnlyQuestions.filter(q => {
        const seisEquiv = eisToSeisMap[q.id];
        if (seisEquiv && answers[seisEquiv] === "yes") return false;
        return true;
      });
      qs = [...seisQuestions, ...filteredEis];
    }

    // Insert uk_establishment follow-up after uk_incorporated if answered "no"
    if (answers.uk_incorporated === "no") {
      const ukIncIdx = qs.findIndex(q => q.id === "uk_incorporated");
      if (ukIncIdx !== -1) {
        qs.splice(ukIncIdx + 1, 0, ukEstablishmentQuestion);
      }
    }

    // Insert qualifying_subsidiary follow-up after not_controlled if answered "no"
    if (answers.not_controlled === "no") {
      const ctrlIdx = qs.findIndex(q => q.id === "not_controlled");
      if (ctrlIdx !== -1) {
        qs.splice(ctrlIdx + 1, 0, qualifyingSubsidiaryQuestion);
      }
    }

    // Add data-gathering and complexity detection questions at the end
    return [...qs, ...dataQuestions, ...complexityQuestions];
  };

  const getComplexityFlags = (): string[] => {
    const flags: string[] = [];
    if (answers.claims_kic === "yes") flags.push("Knowledge Intensive Company (KIC)");
    if (answers.non_uk_operations === "yes") flags.push("Non-UK operations or investors");
    return flags;
  };

  const isComplex = getComplexityFlags().length > 0;

  const questions = getQuestions();
  const progress = step === "scheme" ? 0 : step === "result" ? 100 : Math.round((currentQ / questions.length) * 100);

  // SEIS-only disqualifiers that allow EIS continuation on "both" track
  const softSeisDisqualifiers = ["seis_age", "seis_amount", "seis_assets", "seis_employees"];

  // Inline transition message when switching from SEIS+EIS to EIS-only mid-flow
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  // Mapping: SEIS answer "yes" (passes SEIS) automatically satisfies EIS too
  // SEIS answer "no" (fails SEIS) needs re-asking against EIS threshold
  const seisToEisCarryForward: Record<string, string> = {
    seis_age: "eis_age",
    seis_employees: "eis_employees",
    seis_assets: "eis_assets",
    seis_amount: "eis_amount",
  };

  const transitionToEis = (updatedAnswers: Answers) => {
    // Build EIS answers from existing shared + threshold carry-forward
    const eisAnswers = { ...updatedAnswers };

    // For threshold-different pairs: if SEIS answer was "yes" (passed SEIS),
    // it also passes EIS (lower threshold passes higher). Auto-answer EIS equivalent.
    // If SEIS answer was "no" (failed SEIS), leave EIS unanswered so it gets re-asked.
    for (const [seisId, eisId] of Object.entries(seisToEisCarryForward)) {
      if (eisAnswers[seisId] === "yes") {
        eisAnswers[eisId] = "yes";
      }
      // If "no", don't carry forward — will be re-asked with EIS threshold
    }

    // Remove SEIS-only question answers that have no EIS equivalent
    delete eisAnswers.seis_no_prior;

    setAnswers(eisAnswers);
    setScheme("eis");
    setSoftDisqualified(null);

    // Build the new EIS question list (scheme will be "eis" after setState)
    // We need to compute it manually since scheme hasn't updated yet in this render
    let eisQs = [...seisQuestions.slice(0, 4), ...eisOnlyQuestions, seisQuestions[seisQuestions.length - 1]];
    if (eisAnswers.uk_incorporated === "no") {
      const idx = eisQs.findIndex(q => q.id === "uk_incorporated");
      if (idx !== -1) eisQs.splice(idx + 1, 0, ukEstablishmentQuestion);
    }
    if (eisAnswers.not_controlled === "no") {
      const idx = eisQs.findIndex(q => q.id === "not_controlled");
      if (idx !== -1) eisQs.splice(idx + 1, 0, qualifyingSubsidiaryQuestion);
    }
    eisQs = [...eisQs, ...dataQuestions, ...complexityQuestions];

    // Find first unanswered question
    const firstUnanswered = eisQs.findIndex(q => eisAnswers[q.id] === undefined || eisAnswers[q.id] === null);
    setCurrentQ(firstUnanswered >= 0 ? firstUnanswered : eisQs.length - 1);
    setStep("questions");

    // Show inline transition message briefly
    setTransitionMessage("That means you do not qualify for SEIS, but you may still qualify for EIS. Continuing your check now.");
    setTimeout(() => setTransitionMessage(null), 5000);
  };

  const handleAnswer = (answer: Answer) => {
    const q = questions[currentQ];
    const updatedAnswers = { ...answers, [q.id]: answer };
    setAnswers(updatedAnswers);

    if (answer === q.disqualifyOn && q.disqualifies) {
      // If on "both" track and this only disqualifies SEIS, transition inline to EIS
      if (scheme === "both" && q.disqualifies === "seis" && softSeisDisqualifiers.includes(q.id)) {
        transitionToEis(updatedAnswers);
        return;
      }

      // If on SEIS-only track and hit seis_amount, show interstitial with option to switch to both
      if (scheme === "seis" && q.id === "seis_amount") {
        setSeisAmountInterstitial(true);
        return;
      }

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

  const continueAsEisOnly = () => {
    transitionToEis(answers);
  };

  const continueAsBoth = () => {
    // Switch to "both" track, carrying all answers forward
    setScheme("both");
    setSeisAmountInterstitial(false);
    // The seis_amount answer "no" is already stored. On the "both" track,
    // handleAnswer will detect it as a soft SEIS disqualifier on the next render.
    // We need to re-trigger the question flow from the current position.
    // Since scheme changed, getQuestions() will rebuild with "both" questions.
    // We need to find the seis_amount position in the new list and advance past it.
    const bothQs = (() => {
      const eisToSeisMap: Record<string, string> = {
        eis_age: "seis_age", eis_employees: "seis_employees",
        eis_assets: "seis_assets", eis_amount: "seis_amount",
      };
      const filteredEis = eisOnlyQuestions.filter(q => {
        const seisEquiv = eisToSeisMap[q.id];
        if (seisEquiv && answers[seisEquiv] === "yes") return false;
        return true;
      });
      let qs = [...seisQuestions, ...filteredEis];
      if (answers.uk_incorporated === "no") {
        const idx = qs.findIndex(q => q.id === "uk_incorporated");
        if (idx !== -1) qs.splice(idx + 1, 0, ukEstablishmentQuestion);
      }
      if (answers.not_controlled === "no") {
        const idx = qs.findIndex(q => q.id === "not_controlled");
        if (idx !== -1) qs.splice(idx + 1, 0, qualifyingSubsidiaryQuestion);
      }
      return [...qs, ...dataQuestions, ...complexityQuestions];
    })();

    // Find first unanswered question after seis_amount
    const firstUnanswered = bothQs.findIndex(q => answers[q.id] === undefined || answers[q.id] === null);
    setCurrentQ(firstUnanswered >= 0 ? firstUnanswered : bothQs.length - 1);
    setStep("questions");
    setTransitionMessage("We have switched you to the combined SEIS and EIS track. Continuing your check now.");
    setTimeout(() => setTransitionMessage(null), 5000);
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
    setSoftDisqualified(null);
    setTransitionMessage(null);
    setSeisAmountInterstitial(false);
    setEmail("");
    setEmailSubmitted(false);
    setEmailError("");
    setComplexSubmitting(false);
    setComplexSubmitted(false);
  };

  const handleComplexSubmit = async () => {
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setComplexSubmitting(true);
    try {
      const res = await fetch("/api/complex-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          scheme: scheme || undefined,
          complexityFlags: getComplexityFlags(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComplexSubmitted(true);
      } else {
        setEmailError("Something went wrong. Please try again.");
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setComplexSubmitting(false);
    }
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

        {/* SEIS AMOUNT INTERSTITIAL */}
        {step === "questions" && seisAmountInterstitial && (
          <div>
            <div className="w-12 h-12 rounded-full bg-[#fff8e6] border border-[#f5d88a] flex items-center justify-center text-xl mb-6">!</div>
            <h2 className="font-serif text-[clamp(24px,3vw,36px)] leading-tight tracking-tight mb-4">
              Only the first £250,000 of your raise may qualify for SEIS.
            </h2>
            <p className="text-sm text-[#666] leading-relaxed mb-8">
              If you are raising more than £250,000, you have two options:
            </p>
            <div className="space-y-4">
              <div className="border border-[#0d7a5f] rounded-xl p-5 bg-white">
                <p className="text-sm font-medium text-[#1a1a18] mb-2">Check eligibility for both SEIS and EIS</p>
                <p className="text-sm text-[#666] leading-relaxed mb-4">
                  Check eligibility for SEIS on the first £250,000 and EIS on the remainder. We will carry your answers forward.
                </p>
                <button
                  onClick={continueAsBoth}
                  className="w-full bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors"
                >
                  Continue with SEIS and EIS
                </button>
              </div>
              <div className="border border-[#e8e8e4] rounded-xl p-5 bg-white">
                <p className="text-sm font-medium text-[#1a1a18] mb-2">Go back and adjust</p>
                <p className="text-sm text-[#666] leading-relaxed mb-4">
                  If you are raising £250,000 or less under SEIS, go back and update your answer.
                </p>
                <button
                  onClick={() => { setSeisAmountInterstitial(false); setAnswers(prev => { const a = { ...prev }; delete a.seis_amount; return a; }); }}
                  className="w-full border border-[#e8e8e4] text-[#888] py-3 rounded-lg text-sm font-medium hover:border-[#0d7a5f] hover:text-[#0d7a5f] transition-colors"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: QUESTIONS */}
        {step === "questions" && !seisAmountInterstitial && (
          <div>
            {transitionMessage && (
              <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-xl p-4 mb-6">
                <p className="text-sm text-[#8a6500] leading-relaxed">{transitionMessage}</p>
              </div>
            )}
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
              {(() => {
                const q = questions[currentQ];
                const yesIsDisqualifier = q.disqualifyOn === "yes" && !!q.disqualifies;
                const noIsDisqualifier = q.disqualifyOn === "no" && !!q.disqualifies;
                return (
                  <>
                    <button onClick={() => handleAnswer("yes")} className={`border border-[#e8e8e4] bg-white rounded-xl py-5 text-sm font-medium text-[#1a1a18] transition-all ${yesIsDisqualifier ? "hover:border-[#e55] hover:bg-[#fff5f5]" : "hover:border-[#0d7a5f] hover:bg-[#f0faf6]"}`}>
                      Yes
                    </button>
                    <button onClick={() => handleAnswer("no")} className={`border border-[#e8e8e4] bg-white rounded-xl py-5 text-sm font-medium text-[#1a1a18] transition-all ${noIsDisqualifier ? "hover:border-[#e55] hover:bg-[#fff5f5]" : "hover:border-[#0d7a5f] hover:bg-[#f0faf6]"}`}>
                      No
                    </button>
                  </>
                );
              })()}
            </div>
            <p className="text-xs text-[#aaa] mt-6 text-center">
              Answer based on your current situation. You can always come back and re-run the check.
            </p>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === "result" && (
          <div>
            {softDisqualified ? (
              /* SOFT SEIS DISQUALIFICATION — can continue as EIS */
              <div>
                <div className="w-12 h-12 rounded-full bg-[#fff8e6] border border-[#f5d88a] flex items-center justify-center text-xl mb-6">!</div>
                <p className="text-[11px] text-[#8a6500] uppercase tracking-widest font-medium mb-3">Partial result</p>
                <h2 className="font-serif text-4xl tracking-tight mb-4">
                  You may not qualify for SEIS<br />
                  <em className="text-[#0d7a5f]">but you may still qualify for EIS.</em>
                </h2>

                <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-xl p-5 mb-6">
                  <p className="text-sm text-[#8a6500] leading-relaxed">{softDisqualified.message}</p>
                </div>

                <p className="text-sm text-[#666] leading-relaxed mb-8">
                  Based on your answers, you do not qualify for SEIS, but you may qualify for EIS. We have carried your answers forward, just confirm a few additional details.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={continueAsEisOnly}
                    className="w-full bg-[#0d7a5f] text-white py-4 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors"
                  >
                    Continue for EIS only
                  </button>
                  <button
                    onClick={restart}
                    className="w-full text-center text-sm text-[#aaa] hover:text-[#1a1a18] transition-colors py-2"
                  >
                    Start again
                  </button>
                </div>
              </div>
            ) : qualified && isComplex ? (
              /* COMPLEX CASE — qualified but flagged */
              <div>
                <div className="w-12 h-12 rounded-full bg-[#fff8e6] border border-[#f5d88a] flex items-center justify-center text-xl mb-6">!</div>
                <p className="text-[11px] text-[#8a6500] uppercase tracking-widest font-medium mb-3">Nearly there</p>
                <h2 className="font-serif text-4xl tracking-tight mb-4">
                  Your case needs<br />
                  <em className="text-[#8a6500]">a quick review.</em>
                </h2>
                <p className="text-sm text-[#666] leading-relaxed mb-4">
                  Your company may well qualify but your application has some complexity we want to review before giving you a price. Leave your email and we will come back to you within 24 hours.
                </p>

                <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-xl p-4 mb-6">
                  <p className="text-xs font-medium text-[#8a6500] mb-2">Complexity flags detected:</p>
                  <ul className="space-y-1">
                    {getComplexityFlags().map((flag, i) => (
                      <li key={i} className="text-xs text-[#8a6500] flex gap-2">
                        <span>-</span> {flag}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-[#e8e8e4] rounded-xl p-6 bg-white mb-6">
                  {!complexSubmitted ? (
                    <div>
                      <p className="text-sm font-medium mb-3">Leave your details and we will review your case</p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleComplexSubmit()}
                          className="flex-1 border border-[#e8e8e4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0d7a5f] bg-white"
                        />
                        <button
                          onClick={handleComplexSubmit}
                          disabled={complexSubmitting}
                          className="bg-[#0d7a5f] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50"
                        >
                          {complexSubmitting ? "..." : "Get in touch"}
                        </button>
                      </div>
                      {emailError && <p className="text-xs text-[#e55] mt-2">{emailError}</p>}
                    </div>
                  ) : (
                    <div className="bg-[#f0faf6] border border-[#c0e8db] rounded-lg px-4 py-3 text-sm text-[#0a5c47] font-medium">
                      Thank you. We will review your case and get back to you within 24 hours.
                    </div>
                  )}
                </div>

                <button onClick={restart} className="w-full text-center text-sm text-[#aaa] hover:text-[#1a1a18] transition-colors py-2">
                  Start again
                </button>
              </div>
            ) : qualified ? (
              /* STANDARD PASS */
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
