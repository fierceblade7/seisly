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
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────

interface Application {
  id: string;
  email: string;
  scheme: string;
  company_name: string;
  company_number: string;
  utr: string;
  incorporated_at: string;
  status: string;
  paid: boolean;
  paid_at: string;
  review_status: string;
  review_results: Record<string, unknown>;
  review_pass1: Record<string, unknown>;
  review_pass2: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  authorised_at: string;
  declared_by_name: string;
  declared_by_position: string;
  declared_at: string;
  authority_letter_url: string;
  admin_notes: string;
  review_overrides: Record<string, unknown>;
  ai_review_result: Record<string, unknown>;
  review_released: boolean;
  // All other fields from the application
  [key: string]: unknown;
}

interface OpsData {
  totalApps: number;
  statusCounts: Record<string, number>;
  waitlistCount: number;
  last7Days: number;
  last30Days: number;
  recentActivity: Application[];
  systemStatus: Record<string, string>;
  kbStats: { totalChunks: number; lastUpdated: string | null; sourceCount: number };
}

// ── Shared components ──────────────────────────────────────

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

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", paid: "Paid", documents_uploaded: "Documents uploaded",
  docs_uploaded: "Documents uploaded", review_complete: "Review complete",
  declared: "Declared", authorised: "Authorised", submitted: "Submitted",
  amber: "Amber", needs_attention: "Needs attention", ready: "Ready",
  pending: "Pending", in_progress: "In progress", failed: "Failed",
  pass: "Pass", fail: "Fail",
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  gross_assets_before: {
    up_to_350k: "Up to £350,000",
    "350k_to_1m": "£350,001 to £1,000,000",
    up_to_1m: "Up to £1,000,000",
    "1m_to_5m": "£1,000,001 to £5,000,000",
    "5m_to_10m": "£5,000,001 to £10,000,000",
    "10m_to_15m": "£10,000,001 to £15,000,000",
    over_10m: "More than £10,000,000",
    over_15m: "More than £15,000,000",
  },
  gross_assets_after: {
    up_to_16m: "Up to £16,000,000",
    over_16m: "More than £16,000,000",
  },
  scheme: {
    seis: "SEIS",
    eis: "EIS",
    both: "SEIS and EIS",
  },
  status: STATUS_LABELS,
  qualifying_activity: {
    trade: "Trade",
    rd: "Research and development",
  },
  within_initial_period: {
    yes: "Yes",
    no: "No",
    not_sure: "Not sure",
  },
  outside_period_reason: {
    follow_on: "Follow-on funding",
    new_market: "New product/geographic market",
  },
  review_status: {
    pending: "Pending", in_progress: "In progress", ready: "Ready",
    amber: "Amber", needs_attention: "Needs attention", failed: "Failed",
    pass: "Pass", fail: "Fail",
  },
};

const formatValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  const str = String(value);
  const fieldMap = VALUE_LABELS[field];
  if (fieldMap && fieldMap[str]) return fieldMap[str];
  return str;
};

const RagBadge = ({ status }: { status: string | undefined }) => {
  if (!status) return <span className="text-xs text-[#ccc]">-</span>;
  const cfg = {
    green: "bg-[#e8f5f1] text-[#0d7a5f] border-[#c0e8db]",
    ready: "bg-[#e8f5f1] text-[#0d7a5f] border-[#c0e8db]",
    amber: "bg-[#fff8e6] text-[#8a6500] border-[#f5d88a]",
    red: "bg-[#fef2f2] text-[#c0392b] border-[#fecaca]",
    needs_attention: "bg-[#fef2f2] text-[#c0392b] border-[#fecaca]",
    pass: "bg-[#e8f5f1] text-[#0d7a5f] border-[#c0e8db]",
    fail: "bg-[#fef2f2] text-[#c0392b] border-[#fecaca]",
  }[status] || "bg-[#f5f5f2] text-[#888] border-[#e8e8e4]";
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cfg}`}>{status}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    draft: "bg-[#f5f5f2] text-[#888] border-[#e8e8e4]",
    paid: "bg-[#fff8e6] text-[#8a6500] border-[#f5d88a]",
    documents_uploaded: "bg-[#fff8e6] text-[#8a6500] border-[#f5d88a]",
    docs_uploaded: "bg-[#fff8e6] text-[#8a6500] border-[#f5d88a]",
    review_complete: "bg-[#e8f5f1] text-[#0d7a5f] border-[#c0e8db]",
    declared: "bg-[#e8f5f1] text-[#0d7a5f] border-[#c0e8db]",
    authorised: "bg-[#e8f5f1] text-[#0d7a5f] border-[#c0e8db]",
    submitted: "bg-[#e8f5f1] text-[#0d7a5f] border-[#c0e8db]",
    pending: "bg-[#f5f5f2] text-[#888] border-[#e8e8e4]",
    in_progress: "bg-[#fff8e6] text-[#8a6500] border-[#f5d88a]",
    amber: "bg-[#fff8e6] text-[#8a6500] border-[#f5d88a]",
    needs_attention: "bg-[#fef2f2] text-[#c0392b] border-[#fecaca]",
    failed: "bg-[#fef2f2] text-[#c0392b] border-[#fecaca]",
    ready: "bg-[#e8f5f1] text-[#0d7a5f] border-[#c0e8db]",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[status] || colors.draft}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
};

// ── Main page ──────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"submissions" | "applications" | "ops">("submissions");
  const [loading, setLoading] = useState(false);

  // Submissions tab state
  const [submissions, setSubmissions] = useState<Application[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean[]>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);

  // Applications tab state
  const [allApps, setAllApps] = useState<Application[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [runningReview, setRunningReview] = useState<string | null>(null);
  const [releasingReview, setReleasingReview] = useState<string | null>(null);

  // Ops tab state
  const [opsData, setOpsData] = useState<OpsData | null>(null);

  // Modal state
  const [modal, setModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showConfirm = (title: string, message: string): Promise<boolean> => {
    return new Promise(resolve => {
      setModal({ title, message, onConfirm: () => { setModal(null); resolve(true); } });
      // If they close/cancel, resolve false — handled by the cancel button
    });
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const appKey = (app: Application) => `${app.email}__${app.scheme}`;

  const authHeaders = useCallback(() => ({ "x-admin-password": password }), [password]);

  // ── Fetch functions ──────────────────────────────────────

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/applications", { headers: authHeaders() });
      if (res.status === 401) { setAuthenticated(false); return; }
      const data = await res.json();
      setSubmissions(data.applications || []);
    } catch {}
  }, [authHeaders]);

  const fetchAllApps = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/all-applications", { headers: authHeaders() });
      if (res.status === 401) { setAuthenticated(false); return; }
      const data = await res.json();
      setAllApps(data.applications || []);
    } catch {}
  }, [authHeaders]);

  const fetchOps = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ops", { headers: authHeaders() });
      if (res.status === 401) { setAuthenticated(false); return; }
      const data = await res.json();
      setOpsData(data);
    } catch {}
  }, [authHeaders]);

  // ── Login ────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications", { headers: { "x-admin-password": password } });
      if (res.status === 401) { showToast("Invalid password", "error"); return; }
      const data = await res.json();
      setSubmissions(data.applications || []);
      setAuthenticated(true);
    } catch { showToast("Failed to connect", "error"); }
    finally { setLoading(false); }
  };

  // ── Tab-specific data loading ────────────────────────────

  useEffect(() => {
    if (!authenticated) return;
    if (activeTab === "submissions") fetchSubmissions();
    if (activeTab === "applications") fetchAllApps();
    if (activeTab === "ops") fetchOps();
  }, [authenticated, activeTab, fetchSubmissions, fetchAllApps, fetchOps]);

  // Auto-refresh ops tab
  useEffect(() => {
    if (!authenticated || activeTab !== "ops") return;
    const interval = setInterval(fetchOps, 60000);
    return () => clearInterval(interval);
  }, [authenticated, activeTab, fetchOps]);

  // ── Submissions tab handlers ─────────────────────────────

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
    const confirmed = await showConfirm("Submit to HMRC", `Submit ${app.company_name} (${app.scheme.toUpperCase()}) to HMRC? This will email the founder.`);
    if (!confirmed) return;
    setSubmitting(key);
    try {
      const res = await fetch("/api/admin/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ email: app.email, scheme: app.scheme }),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(prev => [...prev, key]); showToast("Submitted and founder notified"); }
      else showToast("Failed: " + (data.error || "Unknown error"), "error");
    } catch { showToast("Submission failed", "error"); }
    finally { setSubmitting(null); }
  };

  // ── Applications tab handlers ────────────────────────────

  const saveNotes = async (app: Application) => {
    const key = appKey(app);
    setSavingNotes(key);
    try {
      await fetch("/api/admin/update-application", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ email: app.email, scheme: app.scheme, updates: { admin_notes: editingNotes[key] || "" } }),
      });
      fetchAllApps();
    } catch {}
    finally { setSavingNotes(null); }
  };

  const runReview = async (app: Application) => {
    const key = appKey(app);
    setRunningReview(key);
    try {
      await fetch("/api/admin/run-review", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ email: app.email, scheme: app.scheme }),
      });
      setTimeout(() => fetchAllApps(), 2000);
    } catch {}
    finally { setRunningReview(null); }
  };

  const releaseReview = async (app: Application) => {
    const key = appKey(app);
    const confirmed = await showConfirm("Release review", `Release review to ${app.email}? This will email the founder.`);
    if (!confirmed) return;
    setReleasingReview(key);
    try {
      await fetch("/api/admin/release-review", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ email: app.email, scheme: app.scheme }),
      });
      fetchAllApps();
    } catch {}
    finally { setReleasingReview(null); }
  };

  const updateStatus = async (app: Application, newStatus: string) => {
    const key = appKey(app);
    setStatusUpdating(key);
    try {
      await fetch("/api/admin/update-application", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ email: app.email, scheme: app.scheme, updates: { status: newStatus } }),
      });
      fetchAllApps();
    } catch {}
    finally { setStatusUpdating(null); }
  };

  // ── Login screen ─────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white border border-[#e8e8e4] rounded-xl p-8 w-full max-w-sm">
          <h1 className="font-serif text-2xl mb-6">Seisly Admin</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Admin password" autoFocus
            className="w-full border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm mb-4 focus:outline-none focus:border-[#0d7a5f]" />
          <button type="submit" disabled={loading}
            className="w-full bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50">
            {loading ? "Checking..." : "Log in"}
          </button>
        </form>
      </div>
    );
  }

  // ── Authenticated layout ─────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl border border-[#e8e8e4] p-6 w-full max-w-sm mx-4 shadow-lg">
            <h3 className="font-medium text-sm mb-2">{modal.title}</h3>
            <p className="text-xs text-[#666] leading-relaxed mb-5">{modal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 border border-[#e8e8e4] text-[#888] py-2.5 rounded-lg text-xs font-medium hover:border-[#ccc] transition-colors">
                Cancel
              </button>
              <button onClick={modal.onConfirm}
                className="flex-1 bg-[#0d7a5f] text-white py-2.5 rounded-lg text-xs font-medium hover:bg-[#0a5c47] transition-colors">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-xs font-medium shadow-lg transition-all ${toast.type === 'error' ? 'bg-[#fef2f2] border-[#fecaca] text-[#c0392b]' : 'bg-[#f0faf6] border-[#c0e8db] text-[#0d7a5f]'}`}>
          {toast.message}
        </div>
      )}

      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center justify-between bg-white">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-xl">Seis<span className="text-[#0d7a5f]">ly</span> <span className="text-xs text-[#aaa] font-sans ml-1">Admin</span></Link>
          <div className="flex gap-1">
            {(["submissions", "applications", "ops"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === tab ? "bg-[#e8f5f1] text-[#0d7a5f]" : "text-[#888] hover:text-[#1a1a18]"}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { setAuthenticated(false); setPassword(""); }} className="text-xs text-[#aaa] hover:text-[#1a1a18]">Log out</button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ══════ TAB 1: SUBMISSIONS ══════ */}
        {activeTab === "submissions" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-serif text-2xl">Submissions</h1>
                <p className="text-sm text-[#888] mt-1">{submissions.length} awaiting HMRC submission</p>
              </div>
              <button onClick={fetchSubmissions} className="text-xs text-[#0d7a5f] hover:underline">Refresh</button>
            </div>
            {submissions.length === 0 && (
              <div className="bg-white border border-[#e8e8e4] rounded-xl p-8 text-center">
                <p className="text-sm text-[#888]">No applications awaiting submission.</p>
              </div>
            )}
            <div className="space-y-6">
              {submissions.map(app => {
                const key = appKey(app);
                const checks = checkedItems[key] || new Array(CHECKLIST.length).fill(false);
                const checkedCount = checks.filter(Boolean).length;
                if (submitted.includes(key)) {
                  return (
                    <div key={key} className="bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-6">
                      <p className="text-sm font-medium text-[#0a5c47]">{app.company_name} ({app.scheme.toUpperCase()}) - Submitted</p>
                      <p className="text-xs text-[#666] mt-1">Confirmation sent to {app.email}</p>
                    </div>
                  );
                }
                return (
                  <div key={key} className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#f0f0ec] flex items-start justify-between">
                      <div>
                        <h2 className="text-sm font-medium">{app.company_name}</h2>
                        <p className="text-xs text-[#888] mt-0.5">{app.company_number} · {app.scheme.toUpperCase()} · {app.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#888]">Authorised {app.authorised_at ? new Date(app.authorised_at).toLocaleDateString('en-GB') : 'N/A'}</p>
                        <p className="text-xs text-[#666] mt-0.5">{app.declared_by_name}, {app.declared_by_position}</p>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-[#888] uppercase tracking-wide">Pre-submission checklist</p>
                        <p className="text-xs text-[#888]">{checkedCount}/{CHECKLIST.length}</p>
                      </div>
                      <div className="space-y-2">
                        {CHECKLIST.map((item, i) => (
                          <label key={i} className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" checked={checks[i] || false} onChange={() => toggleCheck(key, i)}
                              className="mt-0.5 w-4 h-4 rounded border-[#e8e8e4] text-[#0d7a5f] focus:ring-[#0d7a5f] cursor-pointer" />
                            <span className={`text-sm leading-snug ${checks[i] ? 'text-[#0d7a5f]' : 'text-[#555] group-hover:text-[#1a1a18]'}`}>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#f0f0ec] flex items-center justify-between gap-3">
                      <Link href={`/apply/review?email=${encodeURIComponent(app.email)}&scheme=${app.scheme}`} className="text-xs text-[#0d7a5f] hover:underline" target="_blank">View review</Link>
                      <button onClick={() => handleSubmit(app)} disabled={!allChecked(key) || submitting === key}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${allChecked(key) ? 'bg-[#0d7a5f] text-white hover:bg-[#0a5c47]' : 'bg-[#e8e8e4] text-[#aaa] cursor-not-allowed'}`}>
                        {submitting === key ? 'Submitting...' : `Mark as submitted (${checkedCount}/${CHECKLIST.length})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════ TAB 2: APPLICATIONS ══════ */}
        {activeTab === "applications" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-serif text-2xl">All Applications</h1>
                <p className="text-sm text-[#888] mt-1">{allApps.length} total</p>
              </div>
              <button onClick={fetchAllApps} className="text-xs text-[#0d7a5f] hover:underline">Refresh</button>
            </div>

            {allApps.length === 0 ? (
              <div className="bg-white border border-[#e8e8e4] rounded-xl p-8 text-center">
                <p className="text-sm text-[#888]">No applications yet.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#e8e8e4] bg-[#f5f5f2]">
                        <th className="text-left px-4 py-3 font-medium text-[#888]">Company</th>
                        <th className="text-left px-4 py-3 font-medium text-[#888]">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-[#888]">Scheme</th>
                        <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-[#888]">Paid</th>
                        <th className="text-left px-4 py-3 font-medium text-[#888]">Review</th>
                        <th className="text-left px-4 py-3 font-medium text-[#888]">Created</th>
                        <th className="text-left px-4 py-3 font-medium text-[#888]">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0ec]">
                      {allApps.map(app => {
                        const key = appKey(app);
                        const isExpanded = expandedApp === key;
                        return (
                          <tr key={key} className="cursor-pointer hover:bg-[#fafaf8] transition-colors" onClick={() => {
                            setExpandedApp(isExpanded ? null : key);
                            if (!isExpanded && !editingNotes[key]) setEditingNotes(prev => ({ ...prev, [key]: app.admin_notes || "" }));
                          }}>
                            <td className="px-4 py-3 font-medium text-[#1a1a18]">{app.company_name || "-"}</td>
                            <td className="px-4 py-3 text-[#666]">{app.email}</td>
                            <td className="px-4 py-3">{app.scheme?.toUpperCase()}</td>
                            <td className="px-4 py-3"><StatusBadge status={app.status || "draft"} /></td>
                            <td className="px-4 py-3">{app.paid ? <span className="text-[#0d7a5f]">Yes</span> : <span className="text-[#ccc]">No</span>}</td>
                            <td className="px-4 py-3"><RagBadge status={app.review_status} /></td>
                            <td className="px-4 py-3 text-[#888]">{app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB') : "-"}</td>
                            <td className="px-4 py-3 text-[#888]">{app.updated_at ? new Date(app.updated_at).toLocaleDateString('en-GB') : "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Expanded detail panel */}
                {expandedApp && (() => {
                  const app = allApps.find(a => appKey(a) === expandedApp);
                  if (!app) return null;
                  const key = appKey(app);
                  const aiReview = (app.ai_review_result || {}) as Record<string, unknown>;
                  const checks = (aiReview.checks || []) as Array<{ id: string; category: string; description: string; status: string; confidence: string; notes: string }>;
                  const issues = (aiReview.issues || []) as Array<{ id: string; status: string; notes: string }>;
                  const categories = ['A - Company eligibility', 'B - Trade eligibility', 'C - Share structure', 'D - Use of funds', 'E - Risk to capital', 'F - Document adequacy', 'G - Document consistency', 'H - Red flags'];

                  return (
                    <div className="border-t border-[#e8e8e4] bg-[#fafaf8] px-6 py-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm">{app.company_name} - {app.scheme?.toUpperCase()}</h3>
                        <button onClick={() => setExpandedApp(null)} className="text-xs text-[#aaa] hover:text-[#1a1a18]">Close</button>
                      </div>

                      {/* Application fields */}
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
                        {[
                          ["Company number", app.company_number],
                          ["UTR", app.utr],
                          ["Incorporated", app.incorporated_at],
                          ["Email", app.email],
                          ["Scheme", formatValue("scheme", app.scheme)],
                          ["Status", formatValue("status", app.status)],
                          ["Raising", app.raising_amount ? `£${Number(app.raising_amount).toLocaleString()}` : "-"],
                          ["Employees", app.employee_count],
                          ["Gross assets before", formatValue("gross_assets_before", app.gross_assets_before)],
                          ["Gross assets after", formatValue("gross_assets_after", app.gross_assets_after)],
                          ["Qualifying activity", formatValue("qualifying_activity", app.qualifying_activity)],
                          ["Trade started", formatValue("trade_started", app.trade_started)],
                          ["Share class", app.share_class],
                          ["Preferential rights", formatValue("preferential_rights", app.preferential_rights)],
                          ["Previous VCS", formatValue("previous_vcs", app.previous_vcs)],
                          ["Has subsidiaries", formatValue("has_subsidiaries", app.has_subsidiaries)],
                          ["UK incorporated", formatValue("uk_incorporated", app.uk_incorporated)],
                          ["Within initial period", formatValue("within_initial_period", app.within_initial_period)],
                          ["Outside period reason", formatValue("outside_period_reason", app.outside_period_reason)],
                          ["Has commercial sale", formatValue("has_commercial_sale", app.has_commercial_sale)],
                          ["Signatory", app.declared_by_name ? `${app.declared_by_name}, ${app.declared_by_position}` : "-"],
                          ["Declared", app.declared_at ? new Date(app.declared_at).toLocaleString('en-GB') : "-"],
                          ["Authorised", app.authorised_at ? new Date(app.authorised_at).toLocaleString('en-GB') : "-"],
                          ["Authority letter", app.authority_letter_url ? "Generated" : "-"],
                          ["Paid", formatValue("paid", app.paid)],
                          ["Paid at", app.paid_at ? new Date(app.paid_at).toLocaleString('en-GB') : "-"],
                          ["Review released", formatValue("review_released", app.review_released)],
                        ].filter(([, v]) => v && v !== "-").map(([label, value]) => (
                          <div key={label as string} className="flex justify-between text-xs py-1 border-b border-[#f0f0ec]">
                            <span className="text-[#888]">{label as string}</span>
                            <span className="text-[#1a1a18] text-right max-w-[60%] truncate">{(value as string) || "-"}</span>
                          </div>
                        ))}
                      </div>

                      {/* Longer text fields */}
                      {([
                        ["Trade description", app.trade_description],
                        ["Risk to capital", app.risk_to_capital],
                        ["Share purpose", app.share_purpose],
                      ] as [string, unknown][]).filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} className="mb-4">
                          <p className="text-xs font-medium text-[#888] mb-1">{label}</p>
                          <p className="text-xs text-[#444] leading-relaxed bg-white rounded-lg border border-[#e8e8e4] p-3">{String(value)}</p>
                        </div>
                      ))}

                      {/* AI Review - Overall assessment */}
                      {(aiReview.overall_status as string | undefined) && (
                        <div className={`rounded-xl p-4 mb-4 border ${aiReview.overall_status === 'green' ? 'bg-[#f0faf6] border-[#c0e8db]' : aiReview.overall_status === 'red' ? 'bg-[#fef2f2] border-[#fecaca]' : 'bg-[#fff8e6] border-[#f5d88a]'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <RagBadge status={String(aiReview.overall_status)} />
                              <span className="text-xs font-medium text-[#888]">
                                {String(aiReview.priority || '')} · Confidence: {String(aiReview.confidence || 'unknown')}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#aaa]">v{String(aiReview.prompt_version || '?')}</span>
                          </div>
                          <p className="text-xs text-[#444] leading-relaxed">{String(aiReview.summary || '')}</p>
                        </div>
                      )}

                      {/* Issues (warns and fails) */}
                      {issues.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-[#888] mb-2">Issues ({issues.length})</p>
                          <div className="bg-white rounded-lg border border-[#e8e8e4] divide-y divide-[#f0f0ec]">
                            {issues.map((issue, i) => (
                              <div key={i} className="px-3 py-2 flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-xs font-medium">{issue.id}</p>
                                  <p className="text-[10px] text-[#666] mt-0.5">{issue.notes}</p>
                                </div>
                                <RagBadge status={issue.status} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full checklist by category */}
                      {checks.length > 0 && categories.map(cat => {
                        const catChecks = checks.filter(c => c.category === cat);
                        if (catChecks.length === 0) return null;
                        return (
                          <div key={cat} className="mb-4">
                            <p className="text-xs font-medium text-[#888] mb-2">{cat}</p>
                            <div className="bg-white rounded-lg border border-[#e8e8e4] divide-y divide-[#f0f0ec]">
                              {catChecks.map(check => (
                                <div key={check.id} className="px-3 py-2 flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">{check.id}: {check.description}</p>
                                    <p className="text-[10px] text-[#666] mt-0.5">{check.notes}</p>
                                    <p className="text-[10px] text-[#aaa] mt-0.5">Confidence: {check.confidence}</p>
                                  </div>
                                  <RagBadge status={check.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Admin action buttons */}
                      <div className="flex gap-3 mb-4">
                        <button onClick={() => runReview(app)} disabled={runningReview === key}
                          className="text-xs border border-[#e8e8e4] text-[#888] px-4 py-2 rounded-lg hover:border-[#0d7a5f] hover:text-[#0d7a5f] transition-colors disabled:opacity-50">
                          {runningReview === key ? "Running..." : app.review_status === 'in_progress' ? "Review in progress..." : "Run AI review"}
                        </button>
                        {(aiReview.overall_status as string) && !app.review_released && (
                          <button onClick={() => releaseReview(app)} disabled={releasingReview === key}
                            className="text-xs bg-[#0d7a5f] text-white px-4 py-2 rounded-lg hover:bg-[#0a5c47] transition-colors disabled:opacity-50">
                            {releasingReview === key ? "Releasing..." : "Approve and release to founder"}
                          </button>
                        )}
                        {app.review_released && (
                          <span className="text-xs text-[#0d7a5f] px-4 py-2">Released to founder</span>
                        )}
                      </div>

                      {/* Admin notes */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-[#888] mb-2">Admin notes</p>
                        <textarea
                          value={editingNotes[key] ?? app.admin_notes ?? ""}
                          onChange={e => setEditingNotes(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={3}
                          className="w-full border border-[#e8e8e4] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0d7a5f] bg-white resize-none"
                          placeholder="Internal notes about this application..."
                        />
                        <button onClick={() => saveNotes(app)} disabled={savingNotes === key}
                          className="mt-2 text-xs bg-[#0d7a5f] text-white px-4 py-1.5 rounded hover:bg-[#0a5c47] transition-colors disabled:opacity-50">
                          {savingNotes === key ? "Saving..." : "Save notes"}
                        </button>
                      </div>

                      {/* Status update */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-[#888] mb-2">Update status</p>
                        <div className="flex gap-2 flex-wrap">
                          {["draft", "paid", "documents_uploaded", "declared", "authorised", "submitted"].map(s => (
                            <button key={s} onClick={() => updateStatus(app, s)}
                              disabled={statusUpdating === key || app.status === s}
                              className={`text-[10px] px-3 py-1.5 rounded border transition-colors ${app.status === s ? "bg-[#0d7a5f] text-white border-[#0d7a5f]" : "border-[#e8e8e4] text-[#888] hover:border-[#0d7a5f] hover:text-[#0d7a5f]"}`}>
                              {STATUS_LABELS[s] || s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex gap-4">
                        <Link href={`/apply/review?email=${encodeURIComponent(app.email)}&scheme=${app.scheme}`}
                          target="_blank" className="text-xs text-[#0d7a5f] hover:underline">View founder review</Link>
                        {app.authority_letter_url && (
                          <a href={app.authority_letter_url as string} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#0d7a5f] hover:underline">Authority letter</a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB 3: OPS ══════ */}
        {activeTab === "ops" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-serif text-2xl">Ops</h1>
                <p className="text-sm text-[#888] mt-1">Auto-refreshes every 60 seconds</p>
              </div>
              <button onClick={fetchOps} className="text-xs text-[#0d7a5f] hover:underline">Refresh now</button>
            </div>

            {!opsData ? (
              <p className="text-sm text-[#888]">Loading...</p>
            ) : (
              <>
                {/* System status */}
                <div className="grid grid-cols-5 gap-3 mb-8">
                  {[
                    { label: "Supabase", status: opsData.systemStatus.supabase },
                    { label: "Anthropic", status: opsData.systemStatus.anthropic },
                    { label: "Stripe", status: opsData.systemStatus.stripe },
                    { label: "Resend", status: opsData.systemStatus.resend },
                    { label: "Voyage AI", status: opsData.systemStatus.voyage },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-4 border ${s.status === "green" ? "bg-[#f0faf6] border-[#c0e8db]" : s.status === "amber" ? "bg-[#fff8e6] border-[#f5d88a]" : "bg-[#fef2f2] border-[#fecaca]"}`}>
                      <p className="text-xs text-[#888] mb-1">{s.label}</p>
                      <p className={`text-sm font-medium ${s.status === "green" ? "text-[#0d7a5f]" : s.status === "amber" ? "text-[#8a6500]" : "text-[#c0392b]"}`}>
                        {s.status === "green" ? "Connected" : s.status === "amber" ? "Warning" : "Not configured"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Knowledge base */}
                <div className="bg-white border border-[#e8e8e4] rounded-xl p-4 mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-[#888] uppercase tracking-wide">Knowledge base</p>
                    <button
                      onClick={async () => {
                        const confirmed = await showConfirm("Update knowledge base", "This fetches all HMRC sources and may take several minutes. Continue?");
                        if (!confirmed) return;
                        try {
                          const res = await fetch('/api/admin/ingest-knowledge', { method: 'POST', headers: authHeaders() });
                          const data = await res.json();
                          showToast(`Done. Added: ${data.totalAdded}, Updated: ${data.totalUpdated}, Skipped: ${data.totalSkipped}, Errors: ${data.totalErrors}`);
                          fetchOps();
                        } catch { showToast('Knowledge base update failed', 'error'); }
                      }}
                      className="text-xs border border-[#e8e8e4] text-[#888] px-3 py-1.5 rounded hover:border-[#0d7a5f] hover:text-[#0d7a5f] transition-colors"
                    >
                      Update knowledge base
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[#888]">Total chunks</p>
                      <p className="text-sm font-medium">{opsData.kbStats?.totalChunks || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888]">Sources</p>
                      <p className="text-sm font-medium">{opsData.kbStats?.sourceCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888]">Last updated</p>
                      <p className="text-sm font-medium">{opsData.kbStats?.lastUpdated ? new Date(opsData.kbStats.lastUpdated).toLocaleDateString('en-GB') : 'Never'}</p>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-5 gap-3 mb-8">
                  {[
                    { label: "Total applications", value: opsData.totalApps },
                    { label: "Last 7 days", value: opsData.last7Days },
                    { label: "Last 30 days", value: opsData.last30Days },
                    { label: "Waitlist signups", value: opsData.waitlistCount },
                    { label: "Authorised", value: opsData.statusCounts.authorised || 0 },
                  ].map(m => (
                    <div key={m.label} className="bg-white border border-[#e8e8e4] rounded-xl p-4">
                      <p className="text-xs text-[#888] mb-1">{m.label}</p>
                      <p className="font-serif text-2xl text-[#1a1a18]">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Status breakdown */}
                <div className="bg-white border border-[#e8e8e4] rounded-xl p-4 mb-8">
                  <p className="text-xs font-medium text-[#888] uppercase tracking-wide mb-3">Applications by status</p>
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(opsData.statusCounts).sort(([, a], [, b]) => b - a).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        <span className="text-xs font-medium text-[#1a1a18]">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e8e8e4] bg-[#f5f5f2]">
                    <p className="text-xs font-medium text-[#888] uppercase tracking-wide">Recent activity (last 20)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#f0f0ec]">
                          <th className="text-left px-4 py-2 font-medium text-[#888]">Company</th>
                          <th className="text-left px-4 py-2 font-medium text-[#888]">Email</th>
                          <th className="text-left px-4 py-2 font-medium text-[#888]">Scheme</th>
                          <th className="text-left px-4 py-2 font-medium text-[#888]">Status</th>
                          <th className="text-left px-4 py-2 font-medium text-[#888]">Paid</th>
                          <th className="text-left px-4 py-2 font-medium text-[#888]">Review</th>
                          <th className="text-left px-4 py-2 font-medium text-[#888]">Created</th>
                          <th className="text-left px-4 py-2 font-medium text-[#888]">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f0ec]">
                        {opsData.recentActivity.map((app, i) => (
                          <tr key={i} className="hover:bg-[#fafaf8]">
                            <td className="px-4 py-2 text-[#1a1a18]">{app.company_name || "-"}</td>
                            <td className="px-4 py-2 text-[#666]">{app.email}</td>
                            <td className="px-4 py-2">{app.scheme?.toUpperCase()}</td>
                            <td className="px-4 py-2"><StatusBadge status={app.status || "draft"} /></td>
                            <td className="px-4 py-2">{app.paid ? <span className="text-[#0d7a5f]">Yes</span> : <span className="text-[#ccc]">No</span>}</td>
                            <td className="px-4 py-2"><RagBadge status={app.review_status} /></td>
                            <td className="px-4 py-2 text-[#888]">{app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB') : "-"}</td>
                            <td className="px-4 py-2 text-[#888]">{app.updated_at ? new Date(app.updated_at).toLocaleDateString('en-GB') : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
