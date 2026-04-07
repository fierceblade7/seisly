"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import Footer from "../components/Footer";
import Nav from "../components/Nav";

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
  hasCommercialSale: boolean | null;
  firstCommercialSaleDate: string;
  outsidePeriodReason: string;
  previousInvestmentAmount: string;
  previousInvestmentDate: string;
  newMarketDetails: string;
  signatoryName: string;
  signatoryPosition: string;
}

// Steps are now defined as SEIS_STEPS and EIS_STEPS below the empty object

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
  hasCommercialSale: null, firstCommercialSaleDate: "",
  outsidePeriodReason: "", previousInvestmentAmount: "",
  previousInvestmentDate: "", newMarketDetails: "",
  signatoryName: "", signatoryPosition: "",
};

// Inverse of the column mapping in /api/application/save/route.ts.
// Converts a snake_case DB row back into the camelCase form shape so a
// loaded draft can be dropped straight into formData.
function mapRowToFormData(row: Record<string, unknown>): ApplicationData {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const num = (v: unknown) => (v == null ? '' : String(v));
  const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
  return {
    email: str(row.email),
    scheme: (row.scheme as Scheme) ?? null,
    companyName: str(row.company_name),
    companyNumber: str(row.company_number),
    utr: str(row.utr),
    incorporatedAt: str(row.incorporated_at),
    isKic: bool(row.is_kic),
    kickReason: str(row.kick_reason),
    riskToCapital: str(row.risk_to_capital),
    qualifyingActivity: (row.qualifying_activity as 'trade' | 'rd' | null) ?? null,
    tradeStarted: bool(row.trade_started),
    tradeStartDate: str(row.trade_start_date),
    tradeDescription: str(row.trade_description),
    previousVcs: bool(row.previous_vcs),
    previousVcsTypes: Array.isArray(row.previous_vcs_types) ? (row.previous_vcs_types as string[]) : [],
    raisingAmount: num(row.raising_amount),
    sharePurpose: str(row.share_purpose),
    proposedInvestors: Array.isArray(row.proposed_investors)
      ? (row.proposed_investors as { name: string; address: string; amount: string }[])
      : [{ name: '', address: '', amount: '' }],
    shareClass: str(row.share_class),
    preferentialRights: bool(row.preferential_rights),
    preferentialRightsDetail: str(row.preferential_rights_detail),
    withinInitialPeriod: str(row.within_initial_period),
    hasSubsidiaries: bool(row.has_subsidiaries),
    grossAssetsBefore: str(row.gross_assets_before),
    grossAssetsAfter: str(row.gross_assets_after),
    employeeCount: num(row.employee_count),
    ukIncorporated: bool(row.uk_incorporated),
    registeredAddress: (row.registered_address as ApplicationData['registeredAddress']) ?? { line1: '', line2: '', city: '', postcode: '' },
    ukEstablishmentAddress: (row.uk_establishment_address as ApplicationData['ukEstablishmentAddress']) ?? { line1: '', line2: '', city: '', postcode: '' },
    establishmentNarrative: str(row.establishment_narrative),
    hasCommercialSale: bool(row.has_commercial_sale),
    firstCommercialSaleDate: str(row.first_commercial_sale_date),
    outsidePeriodReason: str(row.outside_period_reason),
    previousInvestmentAmount: num(row.previous_investment_amount),
    previousInvestmentDate: str(row.previous_investment_date),
    newMarketDetails: str(row.new_market_details),
    signatoryName: str(row.signatory_name),
    signatoryPosition: str(row.signatory_position),
  };
}

const SEIS_STEPS = [
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

const EIS_STEPS = [
  { id: 1, title: "Company details" },
  { id: 2, title: "Scheme and risk" },
  { id: 3, title: "Your trade" },
  { id: 4, title: "Maximum permitted age" },
  { id: 5, title: "Previous funding" },
  { id: 6, title: "This raise" },
  { id: 7, title: "Share structure" },
  { id: 8, title: "Company limits" },
  { id: 9, title: "Business address" },
  { id: 10, title: "Review" },
];

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
          {([["seis", "SEIS only", "£179", "Raising up to £250,000"], ["eis", "EIS only", "£179", "Raising up to £5 million"], ["both", "SEIS and EIS", "£249", "Applying for both schemes"]] as const).map(([val, label, price, desc]) => (
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
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ApplicationData>(empty);
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [expressReview, setExpressReview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) {
        router.push("/login");
        return;
      }

      // Deep-link override: a URL like /apply?step=5 means "show me the
      // form at this specific step". We read this once at mount and use
      // it both to suppress the auto-redirect-to-upload for paid rows
      // AND to override the resume-at-first-incomplete-step logic below.
      const urlParams = new URLSearchParams(window.location.search);
      const stepParam = urlParams.get('step');
      const requestedStep = stepParam ? parseInt(stepParam, 10) : NaN;
      const hasDeepLink = Number.isInteger(requestedStep) && requestedStep >= 1;

      // Try to load any existing application across all three schemes.
      // We don't know which scheme the user picked until they tell us, so
      // fetch all three in parallel and use the most recently updated row.
      try {
        const responses = await Promise.all([
          fetch('/api/application/load?scheme=seis'),
          fetch('/api/application/load?scheme=eis'),
          fetch('/api/application/load?scheme=both'),
        ]);
        const results = await Promise.all(
          responses.map(r => r.json() as Promise<{ exists: boolean; application: Record<string, unknown> | null }>)
        );
        const existing = results
          .filter(r => r.exists && r.application)
          .map(r => r.application as Record<string, unknown>);

        if (existing.length > 0) {
          const mostRecent = existing.sort((a, b) => {
            const at = a.updated_at ? new Date(a.updated_at as string).getTime() : 0;
            const bt = b.updated_at ? new Date(b.updated_at as string).getTime() : 0;
            return bt - at;
          })[0];

          // Already paid — jump to upload UNLESS the user explicitly
          // deep-linked to a specific step (e.g. an email link asking
          // them to fix a typo in pre-payment data).
          if (mostRecent.paid === true && !hasDeepLink) {
            router.push('/apply/upload');
            return;
          }

          // Pre-populate the form from the loaded draft.
          const loaded = mapRowToFormData(mostRecent);
          setData(loaded);
          const loadedSteps =
            loaded.scheme === 'eis' || loaded.scheme === 'both' ? EIS_STEPS : SEIS_STEPS;

          if (hasDeepLink) {
            // Deep-link wins: clamp to the valid step range for this scheme.
            const clamped = Math.min(Math.max(requestedStep, 1), loadedSteps.length);
            setStep(clamped);
          } else {
            // Resume at the first step whose fields are still incomplete.
            let resumeStep = loadedSteps[loadedSteps.length - 1].id;
            for (const s of loadedSteps) {
              const errs = validateStep(s.id, loaded, loadedSteps);
              if (Object.keys(errs).length > 0) {
                resumeStep = s.id;
                break;
              }
            }
            setStep(resumeStep);
          }
        } else {
          // No existing draft — pre-fill the email from the session
          // so the first save creates a row keyed to this user.
          setData(prev => ({ ...prev, email: authUser.email || "" }));
        }
      } catch (loadErr) {
        console.error('Failed to load existing application:', loadErr);
        // Fall back to a fresh form with email pre-filled
        setData(prev => ({ ...prev, email: authUser.email || "" }));
      }

      setAuthChecked(true);
    });
  }, [router]);

  const isEis = data.scheme === "eis" || data.scheme === "both";
  const steps = isEis ? EIS_STEPS : SEIS_STEPS;

  // Map logical content to step numbers (EIS inserts "Maximum permitted age" at step 4)
  const stepFor = (name: string) => {
    const found = steps.find(s => s.title === name);
    return found ? found.id : -1;
  };

  const set = (field: keyof ApplicationData, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep = (s: number, d: ApplicationData, stepList = steps): Record<string, string> => {
    const e: Record<string, string> = {};
    const stepTitle = stepList.find(st => st.id === s)?.title;
    if (stepTitle === "Company details") {
      if (!d.companyName.trim()) e.companyName = "Please select your company from Companies House.";
      if (!d.companyNumber.trim()) e.companyNumber = "Company number is required.";
      if (!d.utr.trim()) e.utr = "UTR is required.";
      else if (!/^\d{10}$/.test(d.utr.trim())) e.utr = "UTR must be exactly 10 digits.";
      if (!d.incorporatedAt) e.incorporatedAt = "Date of incorporation is required.";
      if (!d.email.trim()) e.email = "Email address is required.";
      else if (!/^[^@]+@[^@]+\.[^@]+$/.test(d.email.trim())) e.email = "Please enter a valid email address.";
      if (!d.scheme) e.scheme = "Please select a scheme.";
    }
    if (stepTitle === "Scheme and risk") {
      if ((d.scheme === "eis" || d.scheme === "both") && d.isKic === null) e.isKic = "Please select Yes or No.";
      if (d.isKic === true && !d.kickReason) e.kickReason = "Please select a reason.";
      if (!d.riskToCapital.trim()) e.riskToCapital = "Risk to capital is required.";
      else if (d.riskToCapital.trim().length < 100) e.riskToCapital = `Minimum 100 characters required (${d.riskToCapital.trim().length}/100).`;
    }
    if (stepTitle === "Your trade") {
      if (!d.qualifyingActivity) e.qualifyingActivity = "Please select a qualifying activity.";
      if (d.qualifyingActivity === "trade" && d.tradeStarted === null) e.tradeStarted = "Please select Yes or No.";
      if (d.qualifyingActivity === "trade" && d.tradeStarted === true && !d.tradeStartDate) e.tradeStartDate = "Trade start date is required.";
      if (!d.tradeDescription.trim()) e.tradeDescription = "Trade description is required.";
      else if (d.tradeDescription.trim().length < 50) e.tradeDescription = `Minimum 50 characters required (${d.tradeDescription.trim().length}/50).`;
    }
    if (stepTitle === "Maximum permitted age") {
      if (d.hasCommercialSale === null) e.hasCommercialSale = "Please select Yes or No.";
      if (d.hasCommercialSale === true) {
        if (!d.firstCommercialSaleDate) e.firstCommercialSaleDate = "Date of first commercial sale is required.";
        if (!d.withinInitialPeriod) e.withinInitialPeriod = "Please select an option.";
        if ((d.withinInitialPeriod === "no" || d.withinInitialPeriod === "not_sure") && !d.outsidePeriodReason) e.outsidePeriodReason = "Please select a reason.";
        if (d.outsidePeriodReason === "follow_on") {
          if (!d.previousInvestmentAmount.trim()) e.previousInvestmentAmount = "Previous investment amount is required.";
          if (!d.previousInvestmentDate) e.previousInvestmentDate = "Previous investment date is required.";
        }
        if (d.outsidePeriodReason === "new_market") {
          if (!d.newMarketDetails.trim()) e.newMarketDetails = "New market details are required.";
          else if (d.newMarketDetails.trim().length < 100) e.newMarketDetails = `Minimum 100 characters required (${d.newMarketDetails.trim().length}/100).`;
        }
      }
    }
    if (stepTitle === "Previous funding") {
      if (d.previousVcs === null) e.previousVcs = "Please select Yes or No.";
      if (d.previousVcs === true && d.previousVcsTypes.length === 0) e.previousVcsTypes = "Please select at least one type.";
    }
    if (stepTitle === "This raise") {
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
    if (stepTitle === "Share structure") {
      if (!d.shareClass.trim()) e.shareClass = "Share class is required.";
      if (d.preferentialRights === null) e.preferentialRights = "Please select Yes or No.";
      if (d.preferentialRights === true && !d.preferentialRightsDetail.trim()) e.preferentialRightsDetail = "Please describe the preferential rights.";
    }
    if (stepTitle === "Company limits") {
      if (d.hasSubsidiaries === null) e.hasSubsidiaries = "Please select Yes or No.";
      if (!d.grossAssetsBefore) e.grossAssetsBefore = "Please select a gross assets range.";
      if ((d.scheme === "eis" || d.scheme === "both") && !d.grossAssetsAfter) e.grossAssetsAfter = "Please select a gross assets range.";
      if (!d.employeeCount.trim()) e.employeeCount = "Employee count is required.";
      else if (isNaN(Number(d.employeeCount)) || Number(d.employeeCount) <= 0 || !Number.isInteger(Number(d.employeeCount))) e.employeeCount = "Please enter a positive whole number.";
    }
    if (stepTitle === "Business address") {
      if (!d.signatoryName.trim()) e.signatoryName = "Signatory name is required.";
      if (!d.signatoryPosition.trim()) e.signatoryPosition = "Signatory position is required.";
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

  const progress = Math.round(((step - 1) / (steps.length - 1)) * 100);

  const saveProgress = async () => {
    setSaving(true);
    try {
      await fetch("/api/application/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: 'draft' }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    setShowErrors(true);
    const errs = validateStep(step, data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstErr = document.querySelector("[data-error]");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShowErrors(false);
    // Fire-and-forget: don't block step navigation on the network round-trip.
    // Errors are logged inside saveProgress; the user is never shown a save error.
    void saveProgress();
    setStep(s => Math.min(s + 1, steps.length));
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
      // Pay-later guard: if this application has already been paid (in
      // another tab, on another device, or earlier in this session), do
      // not start a second checkout. Jump straight to upload instead.
      // Fresh fetch — not from component state — to handle the
      // multi-tab race where a parallel tab paid after this one mounted.
      if (data.scheme) {
        try {
          const checkRes = await fetch(`/api/application/load?scheme=${encodeURIComponent(data.scheme)}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json() as { exists: boolean; application: { paid?: boolean } | null };
            if (checkData.exists && checkData.application?.paid === true) {
              router.push('/apply/upload');
              return;
            }
          }
        } catch (checkErr) {
          // If the check itself fails, fall through and let Stripe enforce
          // any duplicate-payment guard. Don't block the user on a flaky
          // network call to our own API.
          console.error('Pre-payment paid-status check failed:', checkErr);
        }
      }

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
          express: expressReview,
        }),
      });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        setPaymentError("Payment could not be started. Please try again or contact support@seisly.com");
      }
    } catch (err) {
      console.error('Payment error:', err)
      setPaymentError("Something went wrong. Please try again.");
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

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <p className="text-sm text-[#888]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* NAV */}
      <Nav variant="minimal" rightSlot={<div className="text-xs text-[#aaa]">{saving ? "Saving..." : `Step ${step} of ${steps.length}`}</div>} />

      {/* PROGRESS */}
      <div className="h-1 bg-[#e8e8e4]">
        <div className="h-1 bg-[#0d7a5f] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* STEP INDICATOR */}
      <div className="bg-white border-b border-[#e8e8e4] px-6 py-3 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <div className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${step === s.id ? "bg-[#e8f5f1] text-[#0a5c47]" : step > s.id ? "text-[#0d7a5f]" : "text-[#ccc]"}`}>
                {step > s.id ? "✓ " : ""}{s.title}
              </div>
              {s.id < steps.length && <div className="w-4 h-px bg-[#e8e8e4]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <p className="text-xs text-[#8a6500]">Dev mode - test data available</p>
            <button
              onClick={async () => {
                const { DEV_TEST_DATA } = await import('@/lib/dev-test-data');
                setData(DEV_TEST_DATA);
                setStep(9);
              }}
              className="text-xs bg-[#8a6500] text-white px-3 py-1.5 rounded hover:bg-[#6b5000] transition-colors"
            >
              Fill test data and jump to review
            </button>
          </div>
        )}

        {/* STEP: COMPANY DETAILS */}
        {step === stepFor("Company details") && (
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

        {/* STEP: SCHEME AND RISK */}
        {step === stepFor("Scheme and risk") && (
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

        {/* STEP: QUALIFYING TRADE */}
        {step === stepFor("Your trade") && (
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

        {/* STEP: MAXIMUM PERMITTED AGE (EIS/both only) */}
        {step === stepFor("Maximum permitted age") && (
          <div>
            <SectionHeading
              title="Maximum permitted age"
              subtitle="EIS investment must be made within the company's initial investing period, unless an exception applies."
            />
            <div className={fieldClass}>
              <label className={labelClass}>Has the company made a commercial sale of a product or service?</label>
              <p className={hintClass} style={{ marginTop: 0, marginBottom: 8 }}>This does not include limited sales to test the market. Commercial sales are anything by the company itself, a 51% subsidiary, or an acquired company.</p>
              <YesNo field="hasCommercialSale" value={data.hasCommercialSale} />
              <Err field="hasCommercialSale" {...errProps} />
            </div>
            {data.hasCommercialSale === true && (
              <>
                <div className={fieldClass}>
                  <label className={labelClass}>What was the date of the first commercial sale?</label>
                  <input className={inputClass} type="date" value={data.firstCommercialSaleDate} onChange={e => set("firstCommercialSaleDate", e.target.value)} />
                  <p className={hintClass}>The date the company (or a 51% subsidiary) first made a commercial sale.</p>
                  <Err field="firstCommercialSaleDate" {...errProps} />
                </div>
                <div className={fieldClass}>
                  <label className={labelClass}>Will the company be within its initial investing period at the time of share issue?</label>
                  <p className={hintClass} style={{ marginTop: 0, marginBottom: 8 }}>The initial investing period is 7 years from first commercial sale for standard companies, or 10 years for Knowledge Intensive Companies (KICs).</p>
                  <div className="space-y-2">
                    {[["yes", "Yes"], ["no", "No"], ["not_sure", "I am not sure"]].map(([val, label]) => (
                      <button key={val} onClick={() => set("withinInitialPeriod", val)}
                        className={`w-full text-left border rounded-lg p-3 text-sm transition-all ${data.withinInitialPeriod === val ? "border-[#0d7a5f] bg-[#f0faf6] text-[#0d7a5f]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <Err field="withinInitialPeriod" {...errProps} />
                </div>
                {(data.withinInitialPeriod === "no" || data.withinInitialPeriod === "not_sure") && (
                  <>
                    <div className={fieldClass}>
                      <label className={labelClass}>What is the proposed investment for?</label>
                      <p className={hintClass} style={{ marginTop: 0, marginBottom: 8 }}>The company is outside or approaching the end of its initial investing period. EIS investment is still possible in limited circumstances.</p>
                      <div className="space-y-2">
                        <button onClick={() => set("outsidePeriodReason", "follow_on")}
                          className={`w-full text-left border rounded-lg p-4 text-sm transition-all ${data.outsidePeriodReason === "follow_on" ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                          <p className="font-medium">Follow-on funding</p>
                          <p className="text-xs text-[#888] mt-0.5">Follow-on funding for a previous EIS/VCT investment made within the initial investing period</p>
                        </button>
                        <button onClick={() => set("outsidePeriodReason", "new_market")}
                          className={`w-full text-left border rounded-lg p-4 text-sm transition-all ${data.outsidePeriodReason === "new_market" ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                          <p className="font-medium">Entering a new market</p>
                          <p className="text-xs text-[#888] mt-0.5">Entering a new product market or new geographic market</p>
                        </button>
                      </div>
                      <Err field="outsidePeriodReason" {...errProps} />
                    </div>
                    {data.outsidePeriodReason === "follow_on" && (
                      <>
                        <div className={fieldClass}>
                          <label className={labelClass}>Amount of previous EIS or VCT investment</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#888]">£</span>
                            <input className={`${inputClass} pl-8`} value={data.previousInvestmentAmount} onChange={e => set("previousInvestmentAmount", e.target.value)} placeholder="100,000" />
                          </div>
                          <p className={hintClass}>The amount of the previous qualifying investment made within the initial investing period.</p>
                          <Err field="previousInvestmentAmount" {...errProps} />
                        </div>
                        <div className={fieldClass}>
                          <label className={labelClass}>Date of previous investment</label>
                          <input className={inputClass} type="date" value={data.previousInvestmentDate} onChange={e => set("previousInvestmentDate", e.target.value)} />
                          <Err field="previousInvestmentDate" {...errProps} />
                        </div>
                      </>
                    )}
                    {data.outsidePeriodReason === "new_market" && (
                      <div className={fieldClass}>
                        <label className={labelClass}>Details of the new market and specific activity</label>
                        <textarea className={textareaClass} rows={6} value={data.newMarketDetails}
                          onChange={e => set("newMarketDetails", e.target.value)}
                          placeholder="You must reference existing operations and customers, and demonstrate clearly how the conditions of the new market are appreciably different to existing product or geographic markets..." />
                        <p className={hintClass}>You must reference existing operations and customers, and demonstrate clearly how the conditions of the new market are appreciably different to existing product or geographic markets.</p>
                        <Err field="newMarketDetails" {...errProps} />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP: PREVIOUS FUNDING */}
        {step === stepFor("Previous funding") && (
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

        {/* STEP: THIS RAISE */}
        {step === stepFor("This raise") && (
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

        {/* STEP: SHARE STRUCTURE */}
        {step === stepFor("Share structure") && (
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
          </div>
        )}

        {/* STEP: COMPANY LIMITS */}
        {step === stepFor("Company limits") && (
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
                {(data.scheme === "seis" ? [
                  ["up_to_350k", "Up to £350,000"],
                  ["350k_to_1m", "£350,001 to £1,000,000"],
                  ["1m_to_5m", "£1,000,001 to £5,000,000"],
                  ["5m_to_10m", "£5,000,001 to £10,000,000"],
                  ["over_10m", "More than £10,000,000"],
                ] : [
                  ["up_to_1m", "Up to £1,000,000"],
                  ["1m_to_5m", "£1,000,001 to £5,000,000"],
                  ["5m_to_10m", "£5,000,001 to £10,000,000"],
                  ["10m_to_15m", "£10,000,001 to £15,000,000"],
                  ["over_15m", "More than £15,000,000"],
                ]).map(([val, label]) => (
                  <button key={val} onClick={() => set("grossAssetsBefore", val)}
                    className={`w-full text-left border rounded-lg p-3 transition-all ${data.grossAssetsBefore === val ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#e8e8e4] bg-white hover:border-[#0d7a5f]"}`}>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
              {data.scheme === "seis" && <p className={hintClass}>SEIS requires gross assets of no more than £350,000 before the investment.</p>}
              {isEis && <p className={hintClass}>EIS requires gross assets of less than £15 million before the investment.</p>}
              <Err field="grossAssetsBefore" {...errProps} />
            </div>
            {isEis && (
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
                {data.scheme === "seis" && "Must be fewer than 25 full-time equivalent employees."}
                {data.scheme === "eis" && "Must be fewer than 250 full-time equivalent employees (500 for KICs)."}
                {data.scheme === "both" && "Must be fewer than 25 full-time equivalent employees for SEIS, fewer than 250 for EIS (500 for KICs)."}
              </p>
              <Err field="employeeCount" {...errProps} />
            </div>
          </div>
        )}

        {/* STEP: BUSINESS ADDRESS */}
        {step === stepFor("Business address") && (
          <div>
            <SectionHeading
              title="Business address and signatory"
              subtitle="Where is the company registered and who will sign the agent authority letter?"
            />
            <div className={fieldClass}>
              <label className={labelClass}>Full name of authorised signatory</label>
              <input className={inputClass} value={data.signatoryName} onChange={e => set("signatoryName", e.target.value)} placeholder="e.g. Jane Smith" />
              <p className={hintClass}>The director or company secretary who will sign the agent authority letter. This must be a director, company secretary, or other registered officer of the company.</p>
              <Err field="signatoryName" {...errProps} />
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Position in company</label>
              <input className={inputClass} value={data.signatoryPosition} onChange={e => set("signatoryPosition", e.target.value)} placeholder="e.g. Director" />
              <p className={hintClass}>For example: Director, Company Secretary, Chief Executive Officer.</p>
              <Err field="signatoryPosition" {...errProps} />
            </div>
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
                  <label className={labelClass}>Enter details of how the company meets the permanent establishment requirement</label>
                  <textarea className={textareaClass} rows={4} value={data.establishmentNarrative}
                    onChange={e => set("establishmentNarrative", e.target.value)}
                    placeholder="Describe the fixed UK address or place of business through which the company carries out its trade..." />
                  <p className={hintClass}>Describe the fixed UK address or place of business through which the company carries out its trade.</p>
                  <Err field="establishmentNarrative" {...errProps} />
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP: REVIEW */}
        {step === stepFor("Review") && (
          <div>
            {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("payment") === "cancelled" && (
              <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-xl p-4 mb-6">
                <p className="text-sm text-[#8a6500]">Your payment was cancelled. Your application has been saved. You can complete payment when you are ready.</p>
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
                { label: "Gross assets before", value: ({ up_to_350k: "Up to £350,000", "350k_to_1m": "£350,001 to £1,000,000", up_to_1m: "Up to £1,000,000", "1m_to_5m": "£1,000,001 to £5,000,000", "5m_to_10m": "£5,000,001 to £10,000,000", "10m_to_15m": "£10,000,001 to £15,000,000", over_10m: "More than £10,000,000", over_15m: "More than £15,000,000" } as Record<string, string>)[data.grossAssetsBefore] || data.grossAssetsBefore },
                { label: "Commercial sale", value: data.hasCommercialSale === true ? "Yes" : data.hasCommercialSale === false ? "No" : "" },
                { label: "First commercial sale", value: data.firstCommercialSaleDate ? data.firstCommercialSaleDate.split("-").reverse().join("/") : "" },
                { label: "Within initial period", value: data.withinInitialPeriod === "yes" ? "Yes" : data.withinInitialPeriod === "no" ? "No" : data.withinInitialPeriod === "not_sure" ? "Not sure" : "" },
                { label: "Signatory", value: data.signatoryName ? `${data.signatoryName}, ${data.signatoryPosition}` : "" },
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
                Once you confirm, you will be taken to pay £{data.scheme === "seis" ? "179" : data.scheme === "eis" ? "179" : "249"}. After payment, you will need to upload your supporting documents (business plan, accounts, articles of association, shareholder list, and investor documents). We will then prepare your complete HMRC submission and submit it on your behalf as your agent.
              </p>
            </div>

            <div className="mt-6 bg-white border border-[#e8e8e4] rounded-xl p-5">
              <p className="text-sm font-medium mb-1">
                {data.scheme === "seis" ? "SEIS advance assurance" : data.scheme === "eis" ? "EIS advance assurance" : "SEIS and EIS advance assurance"}
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-serif text-4xl">&pound;{data.scheme === "seis" ? "179" : data.scheme === "eis" ? "179" : "249"}</span>
                <span className="text-sm text-[#aaa]">One-time payment.</span>
              </div>
              <label className="flex items-start gap-3 cursor-pointer mb-4 border border-[#e8e8e4] rounded-lg p-4 hover:border-[#0d7a5f] transition-colors">
                <input
                  type="checkbox"
                  checked={expressReview}
                  onChange={e => setExpressReview(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#e8e8e4] text-[#0d7a5f] focus:ring-[#0d7a5f] cursor-pointer"
                />
                <div>
                  <p className="text-sm font-medium text-[#1a1a18]">Express Review (+£100)</p>
                  <p className="text-xs text-[#888] mt-0.5">Guaranteed review within 24-36 hours instead of up to 72 hours.</p>
                </div>
              </label>
              <button
                onClick={handlePayment}
                disabled={saving}
                className="w-full bg-[#0d7a5f] text-white py-4 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Preparing payment..." : "Confirm and pay →"}
              </button>
              {paymentError && (
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-3 mt-3">
                  <p className="text-xs text-[#c0392b]">{paymentError}</p>
                </div>
              )}
              <p className="text-xs text-[#aaa] text-center mt-3">Money-back guarantee if rejected due to our error</p>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="mt-10 pt-6 border-t border-[#f0f0ec]">
          {step < steps.length && showErrors && errorCount > 0 && (
            <p className="text-xs text-[#e55] mb-3 text-right">{errorCount} {errorCount === 1 ? "field" : "fields"} still needed</p>
          )}
          {step < steps.length && !showErrors && errorCount > 0 && (
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
            {step < steps.length && (
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
      <Footer />
    </div>
  );
}
