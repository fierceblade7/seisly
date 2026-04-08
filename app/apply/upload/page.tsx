"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import Footer from "../../components/Footer";
import Nav from "../../components/Nav";

const DOCUMENTS = [
  {
    id: "business_plan",
    title: "Business plan and financial forecasts",
    description: "Your full business plan including projected financials. HMRC will check this carefully against your application answers.",
    required: true,
  },
  {
    id: "accounts",
    title: "Latest accounts or management accounts",
    description: "Most recent filed accounts. If not yet available, provide management accounts or a detailed narrative of company activity.",
    required: true,
  },
  {
    id: "articles",
    title: "Memorandum and Articles of Association",
    description: "Current articles including any planned amendments. Must show the share structure matches what you described in the application.",
    required: true,
  },
  {
    id: "shareholder_list",
    title: "Current shareholder list",
    description: "Complete list of all current shareholders at the date of this application with their shareholdings.",
    required: true,
  },
  {
    id: "investor_documents",
    title: "Draft investor documents or information memorandum",
    description: "Any document you are using to explain the investment opportunity to potential investors.",
    required: true,
  },
  {
    id: "subscription_agreement",
    title: "Subscription agreement or side agreements",
    description: "Any agreements between the company and investors. If not yet drafted, upload a note confirming this.",
    required: false,
  },
];

export default function UploadPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [uploads, setUploads] = useState<Record<string, { file: File; status: "uploading" | "done" | "error"; url?: string }>>({});
  const [email, setEmail] = useState("");
  const [scheme, setScheme] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailWarning, setEmailWarning] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) {
        router.push("/login");
        return;
      }
      // Always trust the session email — never sessionStorage — to prevent
      // a malicious user from setting an arbitrary email and uploading docs
      // against another user's application.
      setEmail(authUser.email || "");

      // Look up the user's paid application across all three schemes. The
      // paid row's scheme field is the source of truth — sessionStorage is
      // only a fallback for edge cases (webhook delay, user landed here
      // without going through checkout in this browser, etc).
      try {
        const responses = await Promise.all([
          fetch('/api/application/load?scheme=seis'),
          fetch('/api/application/load?scheme=eis'),
          fetch('/api/application/load?scheme=both'),
        ]);
        const results = await Promise.all(
          responses.map(r => r.json() as Promise<{
            exists: boolean;
            application: { paid?: boolean; paid_at?: string; scheme?: string } | null;
          }>)
        );
        const paidRows = results
          .map(r => r.application)
          .filter((app): app is { paid?: boolean; paid_at?: string; scheme?: string } =>
            app !== null && app.paid === true
          )
          .sort((a, b) => {
            const at = a.paid_at ? new Date(a.paid_at).getTime() : 0;
            const bt = b.paid_at ? new Date(b.paid_at).getTime() : 0;
            return bt - at;
          });

        if (paidRows.length > 0 && paidRows[0].scheme) {
          setScheme(paidRows[0].scheme);
        } else {
          // No paid row found — fall back to sessionStorage
          const storedScheme = sessionStorage.getItem('seisly_scheme');
          if (storedScheme) setScheme(storedScheme);
        }
      } catch (loadErr) {
        console.error('Failed to load application for scheme detection:', loadErr);
        const storedScheme = sessionStorage.getItem('seisly_scheme');
        if (storedScheme) setScheme(storedScheme);
      }

      setAuthChecked(true);
    });
  }, [router])

  const handleFileChange = async (docType: string, file: File) => {
    if (!email) {
      setEmailWarning("Please enter your email address first.");
      return;
    }
    setEmailWarning("");

    setUploads(prev => ({ ...prev, [docType]: { file, status: "uploading" } }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    formData.append("email", email);
    formData.append("scheme", scheme || "seis");

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploads(prev => ({ ...prev, [docType]: { file, status: "done", url: data.url } }));
      } else {
        setUploads(prev => ({ ...prev, [docType]: { file, status: "error" } }));
      }
    } catch {
      setUploads(prev => ({ ...prev, [docType]: { file, status: "error" } }));
    }
  };

  const requiredDocs = DOCUMENTS.filter(d => d.required);
  const allRequiredUploaded = requiredDocs.every(d => uploads[d.id]?.status === "done");
  const uploadedCount = requiredDocs.filter(d => uploads[d.id]?.status === "done").length;

  const handleSubmit = async () => {
    if (!allRequiredUploaded) return;
    setSubmitting(true);
    const effectiveScheme = scheme || 'seis';
    try {
      await fetch("/api/application/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheme: effectiveScheme,
          documents_uploaded_at: new Date().toISOString(),
          status: "documents_uploaded",
        }),
      });
    } catch (e) {
      console.error(e);
    }

    // Trigger AI review in background
    try {
      await fetch("/api/review/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scheme: effectiveScheme }),
      })
    } catch (e) {
      console.error('Failed to start review:', e)
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <p className="text-sm text-[#888]">Loading...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafaf8]">
        <Nav
          variant="minimal"
          rightSlot={
            <button
              onClick={handleSignOut}
              className="text-xs text-[#888] hover:text-[#1a1a18] transition-colors"
            >
              Sign out
            </button>
          }
        />
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-2xl mx-auto mb-8">&#10003;</div>
          <h1 className="font-serif text-4xl tracking-tight mb-4">Documents received.</h1>
          <p className="text-sm text-[#666] leading-relaxed mb-8">
            We are now reviewing your documents and application. We will email you at <strong>{email}</strong> within 5 to 10 minutes with your review results. Once you have approved the review we will prepare your final HMRC submission.
          </p>
          <div className="bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-5 text-left">
            <p className="text-sm font-medium text-[#0a5c47] mb-3">What happens next</p>
            <ul className="space-y-2">
              {[
                "We review your documents for completeness and consistency",
                "We prepare your complete HMRC advance assurance application",
                "We email you the draft to review and approve",
                "You sign the agent authority letter digitally",
                "We submit to HMRC on your behalf",
                "HMRC responds within 4 to 8 weeks - we track and notify you",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-[#555]">
                  <span className="text-[#0d7a5f] flex-shrink-0 font-medium">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <Link href="/apply/review">
              <button className="w-full border border-[#0d7a5f] text-[#0d7a5f] py-3 rounded-lg text-sm font-medium hover:bg-[#f0faf6] transition-colors">
                View review progress
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Nav
        variant="minimal"
        rightSlot={
          <>
            <div className="text-xs text-[#aaa]">{uploadedCount} of {requiredDocs.length} required documents uploaded</div>
            <button
              onClick={handleSignOut}
              className="text-xs text-[#888] hover:text-[#1a1a18] transition-colors"
            >
              Sign out
            </button>
          </>
        }
      />

      <div className="max-w-xl mx-auto px-6 py-12">
        <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-3">Step 2 of 2</p>
        <h1 className="font-serif text-3xl tracking-tight mb-2">Upload your documents</h1>
        <p className="text-sm text-[#666] leading-relaxed mb-6">
          HMRC requires these documents with every advance assurance application. We will review them and check they are consistent with your application before submitting.
        </p>

        <p className="text-xs text-[#888] leading-relaxed mb-6">
          For best review results, upload documents as PDFs where possible. We also read Word and Excel files. Excel financial models are analysed by sheet, with summary and forecast sheets prioritised.
        </p>

        <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-xl p-4 mb-8">
          <p className="text-xs text-[#8a6500] leading-relaxed">
            Do not worry if your documents are drafts or incomplete. We will review them and let you know if anything needs strengthening before we submit to HMRC.
          </p>
        </div>

        {!email && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5">Your email address</label>
            <input
              type="email"
              className="w-full border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d7a5f] bg-white"
              placeholder="you@yourcompany.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <p className="text-xs text-[#888] mt-1.5">So we can match your documents to your application.</p>
            {emailWarning && <p className="text-xs text-[#c0392b] mt-1.5">{emailWarning}</p>}
          </div>
        )}

        {!scheme && (
          <div className="mb-8">
            <label className="block text-sm font-medium mb-1.5">Scheme</label>
            <div className="grid grid-cols-3 gap-2">
              {[["seis", "SEIS"], ["eis", "EIS"], ["both", "SEIS and EIS"]].map(([val, label]) => (
                <button key={val} onClick={() => setScheme(val)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${scheme === val ? "border-[#0d7a5f] bg-[#f0faf6] text-[#0d7a5f]" : "border-[#e8e8e4] bg-white text-[#888] hover:border-[#0d7a5f]"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 mb-10">
          {DOCUMENTS.map((doc) => {
            const upload = uploads[doc.id];
            return (
              <div key={doc.id} className={`border rounded-xl p-5 bg-white transition-all ${upload?.status === "done" ? "border-[#0d7a5f]" : "border-[#e8e8e4]"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-medium text-[#1a1a18]">
                      {doc.title}
                      {!doc.required && <span className="ml-2 text-[11px] bg-[#f5f5f2] text-[#888] px-2 py-0.5 rounded">Optional</span>}
                    </p>
                    <p className="text-xs text-[#888] mt-1 leading-relaxed">{doc.description}</p>
                  </div>
                  {upload?.status === "done" && (
                    <div className="w-6 h-6 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-xs text-[#0d7a5f] flex-shrink-0">&#10003;</div>
                  )}
                </div>

                {upload?.status === "done" ? (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0ec]">
                    <p className="text-xs text-[#0d7a5f]">{upload.file.name}</p>
                    <button
                      onClick={() => { const u = {...uploads}; delete u[doc.id]; setUploads(u); }}
                      className="text-xs text-[#aaa] hover:text-[#e55] transition-colors">
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className={`mt-3 flex items-center justify-center gap-2 border border-dashed rounded-lg py-3 px-4 cursor-pointer transition-colors ${upload?.status === "uploading" ? "border-[#0d7a5f] bg-[#f0faf6]" : "border-[#ddd] hover:border-[#0d7a5f] hover:bg-[#f0faf6]"}`}>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
                      onChange={e => e.target.files?.[0] && handleFileChange(doc.id, e.target.files[0])} />
                    <span className="text-xs text-[#888]">
                      {upload?.status === "uploading" ? "Uploading..." : upload?.status === "error" ? "Upload failed - try again" : "Click to upload PDF, Word, or Excel"}
                    </span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allRequiredUploaded || submitting || !email}
          className={`w-full py-4 rounded-lg text-sm font-medium transition-colors ${allRequiredUploaded && email ? "bg-[#0d7a5f] text-white hover:bg-[#0a5c47]" : "bg-[#ccc] text-white cursor-not-allowed"}`}>
          {submitting ? "Submitting..." : "Submit documents for review"}
        </button>

        {!allRequiredUploaded && (
          <p className="text-xs text-[#aaa] text-center mt-3">
            {requiredDocs.length - uploadedCount} required document{requiredDocs.length - uploadedCount !== 1 ? "s" : ""} still needed
          </p>
        )}

        <p className="text-xs text-center text-[#aaa] mt-4">
          You can also email documents to <a href="mailto:support@seisly.com" className="text-[#0d7a5f]">support@seisly.com</a>
        </p>
      </div>
      <Footer />
    </div>
  );
}
