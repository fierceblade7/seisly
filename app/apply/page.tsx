"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type Scheme = "seis" | "eis" | "both";

interface ApplicationData {
  email: string;
  scheme: Scheme | null;
  companyName: string;
  companyNumber: string;
  utr: string;
  incorporatedAt: string;
  isKic: boolean | null;
  kickReason: string;
  riskToCapital: string;
  qualifyingActivity: "trade" | "rd" | null;
  tradeStarted: boolean | null;
  tradeStartDate: string;
  tradeDescription: string;
  previousVcs: boolean | null;
  previousVcsTypes: string[];
  raisingAmount: string;
  sharePurpose: string;
  proposedInvestors: { name: string; address: string; amount: string }[];
  shareClass: string;
  preferentialRights: boolean | null;
  preferentialRightsDetail: string;
  withinInitialPeriod: string;
  hasSubsidiaries: boolean | null;
  grossAssetsBefore: string;
  grossAssetsAfter: string;
  employeeCount: string;
  ukIncorporated: boolean | null;
  registeredAddress: { line1: string; line2: string; city: string; postcode: string };
  ukEstablishmentAddress: { line1: string; line2: string; city: string; postcode: string };
  establishmentNarrative: string;
}

const Logo = () => (
  <svg width="140" height="37" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
    <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
    <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
    <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
  </svg>
);

const STEPS = [
  { id: 1, title: "Company details" },
  { id: 2, title: "Scheme and risk" },
  { id: 3, title: "Your trade" },
  { id: 4, title: "Previous funding" },
  { id: 5, title: "This raise" },
  { id: 6, title: "Share structure" },
  { id: 7, title: "Company limits" },
  { id: 8, title: "Business address" },
  { id: 9, title: "Review" },
];

const empty: ApplicationData = {
  email: "", scheme: null, companyName: "", companyNumber: "", utr: "", incorporatedAt: "",
  isKic: null, kickReason: "", riskToCapital: "", qualifyingActivity: null,
  tradeStarted: null, tradeStartDate: "", tradeDescription: "", previousVcs: null,
  previousVcsTypes: [], raisingAmount: "", sharePurpose: "",
  proposedInvestors: [{ name: "", address: "", amount: "" }],
  shareClass: "", preferentialRights: null, preferentialRightsDetail: "",
  withinInitialPeriod: "", hasSubsidiaries: null, grossAssetsBefore: "", grossAssetsAfter: "",
  employeeCount: "", ukIncorporated: null,
  registeredAddress: { line1: "", line2: "", city: "", postcode: "" },
  ukEstablishmentAddress: { line1: "", line2: "", city: "", postcode: "" },
  establishmentNarrative: "",
};

const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-8">
    <h2 className="font-serif text-3xl tracking-tight mb-2">{title}</h2>
    {subtitle && <p className="text-sm text-[#666] leading-relaxed">{subtitle}</p>}
  </div>
);

const Err = ({ field, showErrors, errors, currentErrors }: { field: string; showErrors: boolean; errors: Record<string, string>; currentErrors: Record<string, string> }) => {
  const msg = showErrors ? (errors[field] || currentErrors[field]) : null;
  if (!msg) return null;
  return <p data-error className="text-xs text-[#e55] mt-1.5">{msg}</p>;
};

interface Step1Props {
  data: ApplicationData;
  set: (field: keyof ApplicationData, value: unknown) => void;
  fieldClass: string;
  labelClass: string;
  inputClass: string;
  hintClass: string;
  showErrors: boolean;
  errors: Record<string, string>;
  currentErrors: Record<string, string>;
}

function Step1CompanyDetails({ data, set, fieldClass, labelClass, inputClass, hintClass, showErrors, errors, currentErrors }: Step1Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    company_name: string;
    company_number: string;
    date_of_creation: string;
    registered_office_address: { address_line_1: string; address_line_2: string; locality: string; postal_code: string };
  }>>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [companySelected, setCompanySelected] = useState(!!data.companyName && !!data.companyNumber);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    fetch(`/api/companies-house/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(d => {
        setSearchResults(d.items || []);
        setHasSearched(true);
      })
      .catch(() => {
        setSearchResults([]);
        setHasSearched(true);
      })
      .finally(() => setSearching(false));
  }, []);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 400);
  };

  const selectCompany = (company: typeof searchResults[0]) => {
    set("companyName", company.company_name);
    set("companyNumber", company.company_number);
    if (company.date_of_creation) {
      set("incorporatedAt", company.date_of_creation);
    }
    const addr = company.registered_office_address;
    set("registeredAddress", {
      line1: addr.address_line_1 || "",
      line2: addr.address_line_2 || "",
      city: addr.locality || "",
      postcode: addr.postal_code || "",
    });
    setCompanySelected(true);
    setSearchResults([]);
    setSearchQuery("");
  };

  const resetCompany = () => {
    set("companyName", "");
    set("companyNumber", "");
    set("incorporatedAt", "");
    set("registeredAddress", { line1: "", line2: "", city: "", postcode: "" });
    setCompanySelected(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div>
      <SectionHeading
        title="Company details"
        subtitle="We need a few basic details about your company. These will be pre-filled into your HMRC application."
      />

      {/* Company search */}
      <div className={fieldClass}>
        <label className={labelClass}>Company name</label>
        {companySelected ? (
          <div className="border border-[#0d7a5f] bg-[#f0faf6] rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#1a1a18]">{data.companyName}</p>
                <p className="text-xs text-[#666] mt-1">Company number: {data.companyNumber}</p>
                {data.incorporatedAt && (
                  <p className="text-xs text-[#666] mt-0.5">Incorporated: {data.incorporatedAt.split("-").reverse().join("/")}</p>
                )}
              </div>
              <button onClick={resetCompany} className="text-xs text-[#0d7a5f] hover:text-[#0a5c47] font-medium">
                Change company
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              className={inputClass}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Start typing your company name..."
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[#0d7a5f] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#e8e8e4] rounded-xl shadow-lg overflow-hidden">
                {searchResults.map((company) => (
                  <button
                    key={company.company_number}
                    onClick={() => selectCompany(company)}
                    className="w-full text-left px-4 py-3 hover:bg-[#fafaf8] border-b border-[#f5f5f2] last:border-b-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-[#1a1a18]">{company.company_name}</p>
                    <p className="text-xs text-[#888] mt-0.5">{company.company_number}</p>
                  </button>
                ))}
              </div>
            )}
            {hasSearched && !searching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#e8e8e4] rounded-xl shadow-lg px-4 py-3">
                <p className="text-sm text-[#888]">No companies found</p>
              </div>
            )}
          </div>
        )}
        <p className={hintClass}>Search by company name. We will fill in the details from Companies House.</p>
        <Err field="companyName" showErrors={showErrors} errors={errors} currentErrors={currentErrors} />
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Company registration number</label>
        <input className={inputClass} value={data.companyNumber} onChange={e => set("companyNumber", e.target.value)} placeholder="12345678" maxLength={8} />
        <p className={hintClass}>8 characters. Find it on Companies House if you are not sure.</p>
        <Err field="companyNumber" showErrors={showErrors} errors={errors} currentErrors={currentErrors} />
      </div>
      <div className={fieldClass}>
        <label className={labelClass}>Corporation Tax Unique Taxpayer Reference (UTR)</label>
        <input className={inputClass} value={data.utr} onChange={e => set("utr", e.target.value)} placeholder="1234567890" maxLength={10} />
        <p className={hintClass}>10 digits. Found on letters from HMRC about Corporation Tax.</p>
        <Err field="utr" showErrors={showErrors} errors={errors} currentErrors={currentErrors} />
      </div>
      <div className={fieldClass}>
        <label className={labelClass}>Date of incorporation</label>
        <input className={inputClass} type="date" value={data.incorporatedAt} onChange={e => set("incorporatedAt", e.target.value)} />
        <p className={hintClass}>This is on your Companies House records.</p>
        <Err field="incorporatedAt" showErrors={showErrors} errors={errors} currentErrors={currentErrors} />
      </div>
      <div className={fieldClass}>
        <label className={labelClass}>Your email address</label>
        <input className={inputClass} type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="you@yourcompany.com" />
        <p className={hintClass}>We will send your application confirmation and HMRC updates here.</p>
        <Err field="email" showErrors={showErrors} errors={errors} currentErrors={currentErrors} />
      </div>
      <div className={fieldClass}>
        <label className={labelClass}>Which scheme are you applying for?</label>
        <div className="space-y-2">
          {([["seis", "SEIS only", "£149 + VAT", "Raising up to £250,000"], ["eis", "EIS only", "£149 + VAT", "Raising up to £5 million"], ["both", "SEIS and EIS", "£199 + VAT", "Applying for both schemes"]] as const).map(([val, label, price, desc]) => (
            <button key={val} onClick={() => set("scheme", val)}
              className={`w-full text-left border rounded-xl p-4 transition-all ${data.scheme === val ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{label}</span>
                <span className="font-serif text-base text-[#0d7a5f]">{price}</span>
              </div>
              <p className="text-xs text-[#888] mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
        <Err field="scheme" showErrors={showErrors} errors={errors} currentErrors={currentErrors} />
      </div>
    </div>
  );
}

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ApplicationData>(empty);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showErrors, setShowErrors] = useState(false);

  const set = (field: keyof ApplicationData, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep = (s: number, d: ApplicationData): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!d.companyName.trim()) e.companyName = "Please select your company from Companies House.";
      if (!d.companyNumber.trim()) e.companyNumber = "Company number is required.";
      if (!d.utr.trim()) e.utr = "UTR is required.";
      else if (!/^\d{10}$/.test(d.utr.trim())) e.utr = "UTR must be exactly 10 digits.";
      if (!d.incorporatedAt) e.incorporatedAt = "Date of incorporation is required.";
      if (!d.email.trim()) e.email = "Email address is required.";
      else if (!/^[^@]+@[^@]+\.[^@]+$/.test(d.email.trim())) e.email = "Please enter a valid email address.";
      if (!d.scheme) e.scheme = "Please select a scheme.";
    }
    if (s === 2) {
      if ((d.scheme === "eis" || d.scheme === "both") && d.isKic === null) e.isKic = "Please select Yes or No.";
      if (d.isKic === true && !d.kickReason) e.kickReason = "Please select a reason.";
      if (!d.riskToCapital.trim()) e.riskToCapital = "Risk to capital is required.";
      else if (d.riskToCapital.trim().length < 100) e.riskToCapital = `Minimum 100 characters required (${d.riskToCapital.trim().length}/100).`;
    }
    if (s === 3) {
      if (!d.qualifyingActivity) e.qualifyingActivity = "Please select a qualifying activity.";
      if (d.qualifyingActivity === "trade" && d.tradeStarted === null) e.tradeStarted = "Please select Yes or No.";
      if (d.qualifyingActivity === "trade" && d.tradeStarted === true && !d.tradeStartDate) e.tradeStartDate = "Trade start date is required.";
      if (!d.tradeDescription.trim()) e.tradeDescription = "Trade description is required.";
      else if (d.tradeDescription.trim().length < 50) e.tradeDescription = `Minimum 50 characters required (${d.tradeDescription.trim().length}/50).`;
    }
    if (s === 4) {
      if (d.previousVcs === null) e.previousVcs = "Please select Yes or No.";
      if (d.previousVcs === true && d.previousVcsTypes.length === 0) e.previousVcsTypes = "Please select at least one type.";
    }
    if (s === 5) {
      const amt = Number(d.raisingAmount.replace(/,/g, ""));
      if (!d.raisingAmount.trim()) e.raisingAmount = "Amount is required.";
      else if (isNaN(amt) || amt <= 0) e.raisingAmount = "Please enter a valid positive amount.";
      else if (d.scheme === "seis" && amt > 250000) e.raisingAmount = "SEIS maximum is £250,000.";
      else if (d.scheme === "eis" && amt > 5000000) e.raisingAmount = "EIS maximum is £5,000,000.";
      if (!d.sharePurpose.trim()) e.sharePurpose = "Purpose of issuing shares is required.";
      else if (d.sharePurpose.trim().length < 50) e.sharePurpose = `Minimum 50 characters required (${d.sharePurpose.trim().length}/50).`;
      if (d.previousVcs === false) {
        d.proposedInvestors.forEach((inv, i) => {
          if (!inv.name.trim()) e[`investor_${i}_name`] = "Investor name is required.";
          if (!inv.address.trim()) e[`investor_${i}_address`] = "Investor address is required.";
          if (!inv.amount.trim()) e[`investor_${i}_amount`] = "Investment amount is required.";
        });
      }
    }
    if (s === 6) {
      if (!d.shareClass.trim()) e.shareClass = "Share class is required.";
      if (d.preferentialRights === null) e.preferentialRights = "Please select Yes or No.";
      if (d.preferentialRights === true && !d.preferentialRightsDetail.trim()) e.preferentialRightsDetail = "Please describe the preferential rights.";
      if ((d.scheme === "eis" || d.scheme === "both") && !d.withinInitialPeriod) e.withinInitialPeriod = "Please select an option.";
    }
    if (s === 7) {
      if (d.hasSubsidiaries === null) e.hasSubsidiaries = "Please select Yes or No.";
      if (!d.grossAssetsBefore) e.grossAssetsBefore = "Please select a gross assets range.";
      if ((d.scheme === "eis" || d.scheme === "both") && !d.grossAssetsAfter) e.grossAssetsAfter = "Please select a gross assets range.";
      if (!d.employeeCount.trim()) e.employeeCount = "Employee count is required.";
      else if (isNaN(Number(d.employeeCount)) || Number(d.employeeCount) <= 0 || !Number.isInteger(Number(d.employeeCount))) e.employeeCount = "Please enter a positive whole number.";
    }
    if (s === 8) {
      if (d.ukIncorporated === null) e.ukIncorporated = "Please select Yes or No.";
      if (d.ukIncorporated === true) {
        if (!d.registeredAddress.line1.trim()) e["registeredAddress.line1"] = "Address line 1 is required.";
        if (!d.registeredAddress.postcode.trim()) e["registeredAddress.postcode"] = "Postcode is required.";
      }
      if (d.ukIncorporated === false) {
        if (!d.ukEstablishmentAddress.line1.trim()) e["ukEstablishmentAddress.line1"] = "Address line 1 is required.";
        if (!d.ukEstablishmentAddress.postcode.trim()) e["ukEstablishmentAddress.postcode"] = "Postcode is required.";
        if (!d.establishmentNarrative.trim()) e.establishmentNarrative = "Please explain how the company meets the permanent establishment requirement.";
      }
    }
    return e;
  };

  const currentErrors = validateStep(step, data);
  const errorCount = Object.keys(currentErrors).length;
  const isValid = errorCount === 0;

  const progress = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  const saveProgress = async () => {
    setSaving(true);
    try {
      await fetch("/api/application/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    setShowErrors(true);
    const errs = validateStep(step, data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstErr = document.querySelector("[data-error]");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShowErrors(false);
    await saveProgress();
    setStep(s => Math.min(s + 1, STEPS.length));
    window.scrollTo(0, 0);
  };

  const back = () => {
    setShowErrors(false);
    setErrors({});
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo(0, 0);
  };

  const handlePayment = async () => {
    setSaving(true);
    try {
      sessionStorage.setItem('seisly_email', data.email)
      sessionStorage.setItem('seisly_scheme', data.scheme || '')

      // Try to save progress but don't block payment if it fails
      try {
        await saveProgress();
      } catch (saveErr) {
        console.error('Save failed but continuing to payment:', saveErr)
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheme: data.scheme,
          email: data.email,
          applicationId: data.companyNumber,
        }),
      });
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert("Payment could not be started. Please try again or contact support@seisly.com");
      }
    } catch (err) {
      console.error('Payment error:', err)
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d7a5f] bg-white";
  const textareaClass = "w-full border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d7a5f] bg-white resize-none";
  const labelClass = "block text-sm font-medium text-[#1a1a18] mb-1.5";
  const hintClass = "text-xs text-[#888] mt-1.5 leading-relaxed";
  const fieldClass = "mb-6";

  const errProps = { showErrors, errors, currentErrors };

  const YesNo = ({ field, value }: { field: keyof ApplicationData; value: boolean | null }) => (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => set(field, true)}
        className={`py-3 rounded-lg text-sm font-medium border transition-all ${value === true ? "border-[#0d7a5f] bg-[#f0faf6] text-[#0d7a5f]" : "border-[#e8e8e4] bg-white text-[#1a1a18] hover:border-[#0d7a5f]"}`}
      >
        Yes
      </button>
      <button
        onClick={() => set(field, false)}
        className={`py-3 rounded-lg text-sm font-medium border transition-all ${value === false ? "border-[#e55] bg-[#fff5f5] text-[#e55]" : "border-[#e8e8e4] bg-white text-[#1a1a18] hover:border-[#aaa]"}`}
      >
        No
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* NAV */}
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center justify-between bg-white">
        <Link href="/"><Logo /></Link>
        <div className="text-xs text-[#aaa]">
          {saving ? "Saving..." : `Step ${step} of ${STEPS.length}`}
        </div>
      </nav>

      {/* PROGRESS */}
      <div className="h-1 bg-[#e8e8e4]">
        <div className="h-1 bg-[#0d7a5f] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* STEP INDICATOR */}
      <div className="bg-white border-b border-[#e8e8e4] px-6 py-3 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <div className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${step === s.id ? "bg-[#e8f5f1] text-[#0a5c47]" : step > s.id ? "text-[#0d7a5f]" : "text-[#ccc]"}`}>
                {step > s.id ? "✓ " : ""}{s.title}
              </div>
              {s.id < STEPS.length && <div className="w-4 h-px bg-[#e8e8e4]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <p className="text-xs text-[#8a6500]">Dev mode — test data available</p>
            <button
              onClick={() => {
                setData({
                  email: "test@testcompany.com",
                  scheme: "seis",
                  companyName: "Test Company Ltd",
                  companyNumber: "12345678",
                  utr: "1234567890",
                  incorporatedAt: "2024-01-15",
                  isKic: false,
                  kickReason: "",
                  riskToCapital: "The company aims to grow its SaaS platform to 10,000 paying customers within 3 years, scaling from current revenue of £50,000 ARR. The business plan projects headcount growth from 3 to 15 employees. Investor capital is at risk as the company is pre-profitability and dependent on continued product development and sales execution. The long-term objective is to capture 1% of the UK SME market for compliance software.",
                  qualifyingActivity: "trade",
                  tradeStarted: true,
                  tradeStartDate: "2024-03-01",
                  tradeDescription: "The company provides SaaS compliance software to UK SMEs. Revenue is generated through monthly subscriptions. Customers are small businesses in regulated industries including financial services and healthcare.",
                  previousVcs: false,
                  previousVcsTypes: [],
                  raisingAmount: "150000",
                  sharePurpose: "The funds will be used to hire two additional software engineers at £45,000 each, expand sales and marketing activities with a budget of £30,000, and invest £30,000 in product development to build new compliance modules. This directly supports the growth and development of the business.",
                  proposedInvestors: [
                    { name: "James Thomas", address: "14 High Street, London, SW1A 1AA", amount: "75000" },
                    { name: "Sarah Williams", address: "22 Park Lane, Manchester, M1 2AB", amount: "75000" },
                  ],
                  shareClass: "Ordinary shares",
                  preferentialRights: false,
                  preferentialRightsDetail: "",
                  withinInitialPeriod: "yes",
                  hasSubsidiaries: false,
                  grossAssetsBefore: "up_to_350k",
                  grossAssetsAfter: "",
                  employeeCount: "3",
                  ukIncorporated: true,
                  registeredAddress: { line1: "1 Test Street", line2: "", city: "London", postcode: "SW1A 1AA" },
                  ukEstablishmentAddress: { line1: "", line2: "", city: "", postcode: "" },
                  establishmentNarrative: "",
                });
                setStep(9);
              }}
              className="text-xs bg-[#8a6500] text-white px-3 py-1.5 rounded hover:bg-[#6b5000] transition-colors"
            >
              Fill test data and jump to review
            </button>
          </div>
        )}

        {/* STEP 1: COMPANY DETAILS */}
        {step === 1 && (
          <Step1CompanyDetails
            data={data}
            set={set}
            fieldClass={fieldClass}
            labelClass={labelClass}
            inputClass={inputClass}
            hintClass={hintClass}
            {...errProps}
          />
        )}

        {/* STEP 2: SCHEME AND RISK */}
        {step === 2 && (
          <div>
            <SectionHeading
              title="Scheme and risk to capital"
              subtitle="HMRC requires you to explain how your company meets the risk to capital condition."
            />
            {(data.scheme === "eis" || data.scheme === "both") && (
              <div className={fieldClass}>
                <label className={labelClass}>Is your company applying as a knowledge-intensive company (KIC)?</label>
                <YesNo field="isKic" value={data.isKic} />
                <p className={hintClass}>KICs can use an extended 10-year age limit and higher funding limits. Most companies answer No.</p>
                <Err field="isKic" {...errProps} />
              </div>
            )}
            {data.isKic && (
              <div className={fieldClass}>
                <label className={labelClass}>Why is the company applying as a KIC?</label>
                <div className="space-y-2">
                  {["To use the extended age limit of 10 years", "To use the enhanced annual investment limit of £10m", "To use the higher total funding limit of £20m", "For investor benefit"].map(opt => (
                    <button key={opt} onClick={() => set("kickReason", opt)}
                      className={`w-full text-left border rounded-lg p-3 text-sm transition-all ${data.kickReason === opt ? "border-[#0d7a5f] bg-[#f0faf6] text-[#0d7a5f]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <Err field="kickReason" {...errProps} />
              </div>
            )}
            <div className={fieldClass}>
              <label className={labelClass}>Risk to capital</label>
              <p className="text-xs text-[#666] mb-3 leading-relaxed">Explain how your company meets the risk to capital condition. You must cover two things: the long-term objectives to grow and develop the trade (with reference to your business plan), and what the risk to investors' capital will be.</p>
              <textarea className={textareaClass} rows={8} value={data.riskToCapital}
                onChange={e => set("riskToCapital", e.target.value)}
                placeholder="Example: The company aims to grow its SaaS platform to 10,000 paying customers within 3 years, scaling from current revenue of £50,000 ARR. The business plan projects headcount growth from 3 to 15 employees. Investor capital is at risk as the company is pre-profitability and dependent on continued product development and sales execution..." />
              <p className={hintClass}>Be specific. Reference your business plan. HMRC will check this carefully.</p>
              <Err field="riskToCapital" {...errProps} />
            </div>
          </div>
        )}

        {/* STEP 3: QUALIFYING TRADE */}
        {step === 3 && (
          <div>
            <SectionHeading
              title="Your qualifying trade"
              subtitle="Tell us about the business activity the investment will support."
            />
            <div className={fieldClass}>
              <label className={labelClass}>What is the qualifying business activity?</label>
              <div className="space-y-2">
                <button onClick={() => set("qualifyingActivity", "trade")}
                  className={`w-full text-left border rounded-lg p-4 text-sm transition-all ${data.qualifyingActivity === "trade" ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                  <p className="font-medium">Trade</p>
                  <p className="text-xs text-[#888] mt-0.5">The company is carrying on or will carry on a qualifying trade</p>
                </button>
                <button onClick={() => set("qualifyingActivity", "rd")}
                  className={`w-full text-left border rounded-lg p-4 text-sm transition-all ${data.qualifyingActivity === "rd" ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                  <p className="font-medium">Research and development</p>
                  <p className="text-xs text-[#888] mt-0.5">R&D intended to lead to a qualifying trade</p>
                </button>
              </div>
              <Err field="qualifyingActivity" {...errProps} />
            </div>
            {data.qualifyingActivity === "trade" && (
              <>
                <div className={fieldClass}>
                  <label className={labelClass}>Has the trade started yet?</label>
                  <YesNo field="tradeStarted" value={data.tradeStarted} />
                  <Err field="tradeStarted" {...errProps} />
                </div>
                {data.tradeStarted && (
                  <div className={fieldClass}>
                    <label className={labelClass}>When did the trade start?</label>
                    <input className={inputClass} type="date" value={data.tradeStartDate} onChange={e => set("tradeStartDate", e.target.value)} />
                    <p className={hintClass}>For SEIS, the trade must have started less than 3 years before the date of share issue.</p>
                    <Err field="tradeStartDate" {...errProps} />
                  </div>
                )}
                <div className={fieldClass}>
                  <label className={labelClass}>{data.tradeStarted ? "What type of trade is the company carrying out?" : "What will the company's trade be?"}</label>
                  <textarea className={textareaClass} rows={5} value={data.tradeDescription}
                    onChange={e => set("tradeDescription", e.target.value)}
                    placeholder={data.tradeStarted
                      ? "Include how the company makes its money and the types of customers it has..."
                      : "Include how the company intends to make its money and the types of customers it will have..."} />
                  <p className={hintClass}>Be specific about the revenue model and customer types. If there is more than one trade in the group, describe the trade for which money is being raised.</p>
                  <Err field="tradeDescription" {...errProps} />
                </div>
              </>
            )}
            {data.qualifyingActivity === "rd" && (
              <div className={fieldClass}>
                <label className={labelClass}>Describe the research and development activity</label>
                <textarea className={textareaClass} rows={5} value={data.tradeDescription}
                  onChange={e => set("tradeDescription", e.target.value)}
                  placeholder="Describe the R&D activity and the qualifying trade it is intended to lead to..." />
                <Err field="tradeDescription" {...errProps} />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PREVIOUS FUNDING */}
        {step === 4 && (
          <div>
            <SectionHeading
              title="Previous funding"
              subtitle="Has the company received any venture capital scheme investment or State aid before?"
            />
            <div className={fieldClass}>
              <label className={labelClass}>Has the company ever had venture capital scheme investments or State aid before?</label>
              <p className="text-xs text-[#666] mb-3">This includes SEIS, EIS, VCT or SITR investment, or any de minimis State aid or risk finance investment.</p>
              <YesNo field="previousVcs" value={data.previousVcs} />
              <Err field="previousVcs" {...errProps} />
            </div>
            {data.previousVcs && (
              <div className={fieldClass}>
                <label className={labelClass}>What type of investment has the company had?</label>
                <p className="text-xs text-[#666] mb-3">Select all that apply.</p>
                <div className="space-y-2">
                  {["SEIS", "De minimis State aid", "EIS, VCT or SITR", "Other risk finance State aid"].map(opt => {
                    const selected = data.previousVcsTypes.includes(opt);
                    return (
                      <button key={opt}
                        onClick={() => set("previousVcsTypes", selected ? data.previousVcsTypes.filter(t => t !== opt) : [...data.previousVcsTypes, opt])}
                        className={`w-full text-left border rounded-lg p-3 text-sm transition-all ${selected ? "border-[#0d7a5f] bg-[#f0faf6] text-[#0d7a5f]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <Err field="previousVcsTypes" {...errProps} />
              </div>
            )}
          </div>
        )}

        {/* STEP 5: THIS RAISE */}
        {step === 5 && (
          <div>
            <SectionHeading
              title="This raise"
              subtitle="Tell us about the investment you are seeking advance assurance for."
            />
            <div className={fieldClass}>
              <label className={labelClass}>How much capital does the company intend to raise?</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#888]">£</span>
                <input className={`${inputClass} pl-8`} value={data.raisingAmount} onChange={e => set("raisingAmount", e.target.value)} placeholder="150,000" />
              </div>
              <p className={hintClass}>
                {data.scheme === "seis" && "Maximum £250,000 for SEIS."}
                {data.scheme === "eis" && "Maximum £5,000,000 for EIS."}
                {data.scheme === "both" && "Maximum £250,000 for SEIS, £5,000,000 for EIS."}
                {" "}This must reconcile with your business plan and financial forecasts.
              </p>
              <Err field="raisingAmount" {...errProps} />
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>What is the purpose of issuing the shares?</label>
              <textarea className={textareaClass} rows={5} value={data.sharePurpose}
                onChange={e => set("sharePurpose", e.target.value)}
                placeholder="Include details of what the company will spend the money raised on. For example: product development (£60,000), sales and marketing (£50,000), hiring two engineers (£40,000)..." />
              <Err field="sharePurpose" {...errProps} />
            </div>

            {/* Proposed investor list — only shown if no previous VCS investment */}
            {data.previousVcs === false && (
              <div className={fieldClass}>
                <label className={labelClass}>Proposed investor list</label>
                <p className="text-xs text-[#666] mb-4 leading-relaxed">
                  As this is your first venture capital scheme application, HMRC requires the full name, address, and amount invested by each prospective investor. We will format this correctly for you.
                </p>
                <div className="space-y-4">
                  {data.proposedInvestors.map((investor, i) => (
                    <div key={i} className="border border-[#e8e8e4] rounded-xl p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-medium text-[#888] uppercase tracking-wide">Investor {i + 1}</p>
                        {i > 0 && (
                          <button onClick={() => set("proposedInvestors", data.proposedInvestors.filter((_, j) => j !== i))}
                            className="text-xs text-[#e55] hover:text-[#c44]">Remove</button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <input className={inputClass} placeholder="Full legal name" value={investor.name}
                          onChange={e => {
                            const updated = [...data.proposedInvestors];
                            updated[i] = { ...updated[i], name: e.target.value };
                            set("proposedInvestors", updated);
                          }} />
                        <Err field={`investor_${i}_name`} {...errProps} />
                        <input className={inputClass} placeholder="Full address" value={investor.address}
                          onChange={e => {
                            const updated = [...data.proposedInvestors];
                            updated[i] = { ...updated[i], address: e.target.value };
                            set("proposedInvestors", updated);
                          }} />
                        <Err field={`investor_${i}_address`} {...errProps} />
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#888]">£</span>
                          <input className={`${inputClass} pl-8`} placeholder="Amount invested" value={investor.amount}
                            onChange={e => {
                              const updated = [...data.proposedInvestors];
                              updated[i] = { ...updated[i], amount: e.target.value };
                              set("proposedInvestors", updated);
                            }} />
                        </div>
                        <Err field={`investor_${i}_amount`} {...errProps} />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => set("proposedInvestors", [...data.proposedInvestors, { name: "", address: "", amount: "" }])}
                    className="w-full border border-dashed border-[#c0e8db] rounded-xl py-3 text-sm text-[#0d7a5f] hover:bg-[#f0faf6] transition-colors">
                    + Add another investor
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: SHARE STRUCTURE */}
        {step === 6 && (
          <div>
            <SectionHeading
              title="Share structure"
              subtitle="Tell us about the shares being issued for this raise."
            />
            <div className={fieldClass}>
              <label className={labelClass}>Which class of shares will be issued?</label>
              <input className={inputClass} value={data.shareClass} onChange={e => set("shareClass", e.target.value)} placeholder="e.g. Ordinary shares" />
              <Err field="shareClass" {...errProps} />
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Are there any preferential rights attached to this class of shares?</label>
              <YesNo field="preferentialRights" value={data.preferentialRights} />
              <p className={hintClass}>SEIS and EIS shares must generally be ordinary shares without preferential rights to qualify.</p>
              <Err field="preferentialRights" {...errProps} />
            </div>
            {data.preferentialRights && (
              <div className={fieldClass}>
                <label className={labelClass}>What are the preferential rights?</label>
                <textarea className={textareaClass} rows={4} value={data.preferentialRightsDetail}
                  onChange={e => set("preferentialRightsDetail", e.target.value)}
                  placeholder="Refer to the company's articles of association and describe the preferential rights attached to this share class..." />
                <Err field="preferentialRightsDetail" {...errProps} />
              </div>
            )}
            {(data.scheme === "eis" || data.scheme === "both") && (
              <div className={fieldClass}>
                <label className={labelClass}>Will the company be within its initial investing period at the time of share issue?</label>
                <div className="space-y-2">
                  {[["yes", "Yes"], ["no", "No"], ["unsure", "I am not sure"]].map(([val, label]) => (
                    <button key={val} onClick={() => set("withinInitialPeriod", val)}
                      className={`w-full text-left border rounded-lg p-3 text-sm transition-all ${data.withinInitialPeriod === val ? "border-[#0d7a5f] bg-[#f0faf6] text-[#0d7a5f]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className={hintClass}>Within 7 years of first commercial sale for standard companies, 10 years for knowledge-intensive companies.</p>
                <Err field="withinInitialPeriod" {...errProps} />
              </div>
            )}
          </div>
        )}

        {/* STEP 7: COMPANY LIMITS */}
        {step === 7 && (
          <div>
            <SectionHeading
              title="Company limits"
              subtitle="HMRC needs to verify your company meets the size requirements for the scheme."
            />
            <div className={fieldClass}>
              <label className={labelClass}>Does the company have any subsidiaries?</label>
              <YesNo field="hasSubsidiaries" value={data.hasSubsidiaries} />
              <Err field="hasSubsidiaries" {...errProps} />
              {data.hasSubsidiaries && (
                <div className="mt-3 bg-[#fff8e6] border border-[#f5d88a] rounded-lg p-3">
                  <p className="text-xs text-[#8a6500] leading-relaxed">You will need to upload a business structure diagram showing all companies, when they were incorporated, your shareholding in each, and what their trade is. You can do this in the document upload step.</p>
                </div>
              )}
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>What will the expected gross assets be immediately before the share issue?</label>
              <div className="space-y-2">
                {[
                  ["up_to_350k", "Up to £350,000", "Required for SEIS"],
                  ["350k_to_1m", "£350,001 to £1,000,000", "EIS only"],
                  ["1m_to_5m", "£1,000,001 to £5,000,000", "EIS only"],
                  ["5m_to_10m", "£5,000,001 to £10,000,000", "EIS only"],
                  ["10m_to_15m", "£10,000,001 to £15,000,000", "EIS only"],
                  ["over_15m", "More than £15,000,000", "Does not qualify"],
                ].map(([val, label, note]) => (
                  <button key={val} onClick={() => set("grossAssetsBefore", val)}
                    className={`w-full text-left border rounded-lg p-3 transition-all ${data.grossAssetsBefore === val ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-[#888] ml-2">{note}</span>
                  </button>
                ))}
              </div>
              <Err field="grossAssetsBefore" {...errProps} />
            </div>
            {(data.scheme === "eis" || data.scheme === "both") && (
              <div className={fieldClass}>
                <label className={labelClass}>What will be the gross assets immediately after the share issue?</label>
                <div className="space-y-2">
                  {[["up_to_16m", "Up to £16,000,000"], ["over_16m", "More than £16,000,000"]].map(([val, label]) => (
                    <button key={val} onClick={() => set("grossAssetsAfter", val)}
                      className={`w-full text-left border rounded-lg p-3 text-sm transition-all ${data.grossAssetsAfter === val ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <Err field="grossAssetsAfter" {...errProps} />
              </div>
            )}
            <div className={fieldClass}>
              <label className={labelClass}>How many full-time equivalent employees does the company expect to have on the date of share issue?</label>
              <input className={inputClass} type="number" value={data.employeeCount} onChange={e => set("employeeCount", e.target.value)} placeholder="e.g. 3" />
              <p className={hintClass}>
                Include employees of any subsidiaries.
                {data.scheme === "seis" && " Fewer than 25 required for SEIS."}
                {data.scheme === "eis" && " Fewer than 250 required for EIS."}
                {data.scheme === "both" && " Fewer than 25 for SEIS, fewer than 250 for EIS."}
              </p>
              <Err field="employeeCount" {...errProps} />
            </div>
          </div>
        )}

        {/* STEP 8: BUSINESS ADDRESS */}
        {step === 8 && (
          <div>
            <SectionHeading
              title="Business address"
              subtitle="Where is the company registered and where does it operate?"
            />
            <div className={fieldClass}>
              <label className={labelClass}>Was the company incorporated in the UK?</label>
              <YesNo field="ukIncorporated" value={data.ukIncorporated} />
              <Err field="ukIncorporated" {...errProps} />
            </div>
            {data.ukIncorporated && (
              <div className={fieldClass}>
                <label className={labelClass}>Registered business address</label>
                <div className="space-y-3">
                  <div>
                    <input className={inputClass} placeholder="Address line 1" value={data.registeredAddress.line1} onChange={e => set("registeredAddress", { ...data.registeredAddress, line1: e.target.value })} />
                    <Err field="registeredAddress.line1" {...errProps} />
                  </div>
                  <input className={inputClass} placeholder="Address line 2 (optional)" value={data.registeredAddress.line2} onChange={e => set("registeredAddress", { ...data.registeredAddress, line2: e.target.value })} />
                  <input className={inputClass} placeholder="Town or city" value={data.registeredAddress.city} onChange={e => set("registeredAddress", { ...data.registeredAddress, city: e.target.value })} />
                  <div>
                    <input className={inputClass} placeholder="Postcode" value={data.registeredAddress.postcode} onChange={e => set("registeredAddress", { ...data.registeredAddress, postcode: e.target.value })} />
                    <Err field="registeredAddress.postcode" {...errProps} />
                  </div>
                </div>
              </div>
            )}
            {data.ukIncorporated === false && (
              <>
                <div className={fieldClass}>
                  <label className={labelClass}>Permanent UK establishment address</label>
                  <div className="space-y-3">
                    <div>
                      <input className={inputClass} placeholder="Address line 1" value={data.ukEstablishmentAddress.line1} onChange={e => set("ukEstablishmentAddress", { ...data.ukEstablishmentAddress, line1: e.target.value })} />
                      <Err field="ukEstablishmentAddress.line1" {...errProps} />
                    </div>
                    <input className={inputClass} placeholder="Address line 2 (optional)" value={data.ukEstablishmentAddress.line2} onChange={e => set("ukEstablishmentAddress", { ...data.ukEstablishmentAddress, line2: e.target.value })} />
                    <input className={inputClass} placeholder="Town or city" value={data.ukEstablishmentAddress.city} onChange={e => set("ukEstablishmentAddress", { ...data.ukEstablishmentAddress, city: e.target.value })} />
                    <div>
                      <input className={inputClass} placeholder="Postcode" value={data.ukEstablishmentAddress.postcode} onChange={e => set("ukEstablishmentAddress", { ...data.ukEstablishmentAddress, postcode: e.target.value })} />
                      <Err field="ukEstablishmentAddress.postcode" {...errProps} />
                    </div>
                  </div>
                </div>
                <div className={fieldClass}>
                  <label className={labelClass}>How does the company meet the permanent establishment requirement?</label>
                  <textarea className={textareaClass} rows={4} value={data.establishmentNarrative}
                    onChange={e => set("establishmentNarrative", e.target.value)}
                    placeholder="Explain how the company has a fixed place of business in the UK..." />
                  <Err field="establishmentNarrative" {...errProps} />
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 9: REVIEW */}
        {step === 9 && (
          <div>
            {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("payment") === "cancelled" && (
              <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-xl p-4 mb-6">
                <p className="text-sm text-[#8a6500]">Your payment was cancelled. Your application has been saved — you can complete payment when you are ready.</p>
              </div>
            )}
            <SectionHeading
              title="Review your application"
              subtitle="Check everything looks right before we prepare your submission."
            />
            <div className="space-y-4">
              {[
                { label: "Company name", value: data.companyName },
                { label: "Company number", value: data.companyNumber },
                { label: "UTR", value: data.utr },
                { label: "Incorporated", value: data.incorporatedAt ? data.incorporatedAt.split("-").reverse().join("/") : "" },
                { label: "Scheme", value: data.scheme === "seis" ? "SEIS" : data.scheme === "eis" ? "EIS" : data.scheme === "both" ? "SEIS and EIS" : "" },
                { label: "Amount raising", value: data.raisingAmount ? `£${Number(data.raisingAmount.replace(/,/g, "")).toLocaleString("en-GB")}` : "" },
                { label: "Trade started", value: data.tradeStarted === true ? "Yes" : data.tradeStarted === false ? "No" : "" },
                { label: "Previous VCS", value: data.previousVcs === true ? "Yes" : data.previousVcs === false ? "No" : "" },
                { label: "Employees", value: data.employeeCount },
                { label: "Gross assets before", value: ({ up_to_350k: "Up to £350,000", "350k_to_1m": "£350,001 to £1,000,000", "1m_to_5m": "£1,000,001 to £5,000,000", "5m_to_10m": "£5,000,001 to £10,000,000", "10m_to_15m": "£10,000,001 to £15,000,000", over_15m: "More than £15,000,000" } as Record<string, string>)[data.grossAssetsBefore] || data.grossAssetsBefore },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex justify-between items-start py-3 border-b border-[#f5f5f2]">
                  <span className="text-sm text-[#666]">{row.label}</span>
                  <span className="text-sm font-medium text-right max-w-[60%]">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-5">
              <p className="text-sm font-medium text-[#0a5c47] mb-2">What happens next</p>
              <p className="text-sm text-[#555] leading-relaxed">
                Once you confirm, you will be taken to pay £{data.scheme === "seis" ? "149" : data.scheme === "eis" ? "149" : "199"} + VAT. After payment, you will need to upload your supporting documents (business plan, accounts, articles of association, shareholder list, and investor documents). We will then prepare your complete HMRC submission and submit it on your behalf as your agent.
              </p>
            </div>

            <div className="mt-6 bg-white border border-[#e8e8e4] rounded-xl p-5">
              <p className="text-sm font-medium mb-1">
                {data.scheme === "seis" ? "SEIS advance assurance" : data.scheme === "eis" ? "EIS advance assurance" : "SEIS and EIS advance assurance"}
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-serif text-4xl">&pound;{data.scheme === "seis" ? "149" : data.scheme === "eis" ? "149" : "199"}</span>
                <span className="text-sm text-[#aaa]">+ VAT. One-time payment.</span>
              </div>
              <button
                onClick={handlePayment}
                disabled={saving}
                className="w-full bg-[#0d7a5f] text-white py-4 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Preparing payment..." : "Confirm and pay →"}
              </button>
              <p className="text-xs text-[#aaa] text-center mt-3">Money-back guarantee if rejected due to our error</p>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="mt-10 pt-6 border-t border-[#f0f0ec]">
          {step < STEPS.length && showErrors && errorCount > 0 && (
            <p className="text-xs text-[#e55] mb-3 text-right">{errorCount} {errorCount === 1 ? "field" : "fields"} still needed</p>
          )}
          {step < STEPS.length && !showErrors && errorCount > 0 && (
            <p className="text-xs text-[#aaa] mb-3 text-right">{errorCount} {errorCount === 1 ? "field" : "fields"} still needed</p>
          )}
          <div className="flex justify-between items-center">
            {step > 1 ? (
              <button onClick={back} className="text-sm text-[#666] hover:text-[#1a1a18] transition-colors">
                &larr; Back
              </button>
            ) : (
              <div />
            )}
            {step < STEPS.length && (
              <button
                onClick={next}
                disabled={showErrors && !isValid}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-colors ${
                  showErrors && !isValid
                    ? "bg-[#ccc] text-white cursor-not-allowed"
                    : "bg-[#0d7a5f] text-white hover:bg-[#0a5c47]"
                }`}
              >
                Continue &rarr;
              </button>
            )}
          </div>
        </div>
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
