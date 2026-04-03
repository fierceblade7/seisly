// SECURITY REMINDER: Before going live, ensure MFA is
// enabled on all admin accounts:
// - Supabase dashboard
// - Vercel dashboard
// - Stripe dashboard
// - Resend dashboard
// - GitHub repository
// - Anthropic console
// Last reviewed: April 2026

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const CHECKLIST = [
  "AI review completed with no unresolved red flags",
  "Founder has signed the accuracy declaration",
  "Founder has authorised Seisly as agent",
  "All five mandatory documents uploaded and readable",
  "Agent authority letter generated with correct details",
  "Authority letter dated within 3 months of submission",
  "Application form answers complete, no null values",
  "Raising amount within SEIS/EIS lifetime limits",
  "Company incorporated in UK or non-UK process followed",
  "UTR confirmed and matches Companies House records",
  "Trade description does not reference excluded activities",
  "Risk to capital narrative meets minimum length",
  "Use of funds meets VCM8130 growth and development requirement",
  "Gross assets within qualifying limits",
  "Employee count within qualifying limits",
];

interface Application {
  email: string;
  scheme: string;
  company_name: string;
  company_number: string;
  authorised_at: string;
  declared_by_name: string;
  declared_by_position: string;
  review_status: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean[]>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);

  const appKey = (app: Application) => `${app.email}__${app.scheme}`;

  const fetchApplications = async (pw: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications", {
        headers: { "x-admin-password": pw },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        alert("Invalid password");
        return;
      }
      const data = await res.json();
      setApplications(data.applications || []);
      setAuthenticated(true);
    } catch {
      alert("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications(password);
  };

  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(() => fetchApplications(password), 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, password]);

  const toggleCheck = (key: string, index: number) => {
    setCheckedItems(prev => {
      const current = prev[key] || new Array(CHECKLIST.length).fill(false);
      const updated = [...current];
      updated[index] = !updated[index];
      return { ...prev, [key]: updated };
    });
  };

  const allChecked = (key: string) => {
    const checks = checkedItems[key];
    return checks && checks.length === CHECKLIST.length && checks.every(Boolean);
  };

  const handleSubmit = async (app: Application) => {
    const key = appKey(app);
    if (!allChecked(key)) return;
    if (!confirm(`Submit ${app.company_name} (${app.scheme.toUpperCase()}) to HMRC? This will email the founder.`)) return;

    setSubmitting(key);
    try {
      const res = await fetch("/api/admin/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ email: app.email, scheme: app.scheme }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(prev => [...prev, key]);
      } else {
        alert("Submission failed: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Submission failed. Check the console.");
    } finally {
      setSubmitting(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white border border-[#e8e8e4] rounded-xl p-8 w-full max-w-sm">
          <h1 className="font-serif text-2xl mb-6">Seisly Admin</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm mb-4 focus:outline-none focus:border-[#0d7a5f]"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50"
          >
            {loading ? "Checking..." : "Log in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center justify-between bg-white">
        <Link href="/" className="font-serif text-xl">Seis<span className="text-[#0d7a5f]">ly</span> <span className="text-xs text-[#aaa] font-sans ml-2">Admin</span></Link>
        <button onClick={() => { setAuthenticated(false); setPassword(""); }} className="text-xs text-[#aaa] hover:text-[#1a1a18]">Log out</button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl">Applications ready for submission</h1>
            <p className="text-sm text-[#888] mt-1">{applications.length} application{applications.length !== 1 ? "s" : ""} awaiting HMRC submission</p>
          </div>
          <button onClick={() => fetchApplications(password)} className="text-xs text-[#0d7a5f] hover:underline">
            Refresh
          </button>
        </div>

        {applications.length === 0 && (
          <div className="bg-white border border-[#e8e8e4] rounded-xl p-8 text-center">
            <p className="text-sm text-[#888]">No applications awaiting submission.</p>
          </div>
        )}

        <div className="space-y-6">
          {applications.map(app => {
            const key = appKey(app);
            const checks = checkedItems[key] || new Array(CHECKLIST.length).fill(false);
            const checkedCount = checks.filter(Boolean).length;
            const isSubmitted = submitted.includes(key);

            if (isSubmitted) {
              return (
                <div key={key} className="bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-6">
                  <p className="text-sm font-medium text-[#0a5c47]">
                    {app.company_name} ({app.scheme.toUpperCase()}) - Submitted to HMRC
                  </p>
                  <p className="text-xs text-[#666] mt-1">Confirmation email sent to {app.email}</p>
                </div>
              );
            }

            return (
              <div key={key} className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#f0f0ec]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-medium text-[#1a1a18]">{app.company_name}</h2>
                      <p className="text-xs text-[#888] mt-0.5">{app.company_number} · {app.scheme.toUpperCase()} · {app.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#888]">Authorised {app.authorised_at ? new Date(app.authorised_at).toLocaleDateString('en-GB') : 'N/A'}</p>
                      <p className="text-xs text-[#666] mt-0.5">Signatory: {app.declared_by_name}, {app.declared_by_position}</p>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-[#888] uppercase tracking-wide">Pre-submission checklist</p>
                    <p className="text-xs text-[#888]">{checkedCount}/{CHECKLIST.length}</p>
                  </div>
                  <div className="space-y-2">
                    {CHECKLIST.map((item, i) => (
                      <label key={i} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checks[i] || false}
                          onChange={() => toggleCheck(key, i)}
                          className="mt-0.5 w-4 h-4 rounded border-[#e8e8e4] text-[#0d7a5f] focus:ring-[#0d7a5f] cursor-pointer"
                        />
                        <span className={`text-sm leading-snug ${checks[i] ? 'text-[#0d7a5f]' : 'text-[#555] group-hover:text-[#1a1a18]'}`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-[#f0f0ec] flex items-center justify-between gap-3">
                  <Link
                    href={`/apply/review?email=${encodeURIComponent(app.email)}&scheme=${app.scheme}`}
                    className="text-xs text-[#0d7a5f] hover:underline"
                    target="_blank"
                  >
                    View review
                  </Link>
                  <button
                    onClick={() => handleSubmit(app)}
                    disabled={!allChecked(key) || submitting === key}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      allChecked(key)
                        ? 'bg-[#0d7a5f] text-white hover:bg-[#0a5c47]'
                        : 'bg-[#e8e8e4] text-[#aaa] cursor-not-allowed'
                    }`}
                  >
                    {submitting === key ? 'Submitting...' : `Mark as submitted to HMRC (${checkedCount}/${CHECKLIST.length})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
