"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";
import Nav from "../components/Nav";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: "In progress", color: "text-[#8a6500]", bg: "bg-[#fff8e6]", border: "border-[#f5d88a]" },
  paid: { label: "Paid, awaiting documents", color: "text-[#8a6500]", bg: "bg-[#fff8e6]", border: "border-[#f5d88a]" },
  documents_uploaded: { label: "Documents uploaded", color: "text-[#8a6500]", bg: "bg-[#fff8e6]", border: "border-[#f5d88a]" },
  review_complete: { label: "Review complete", color: "text-[#0d7a5f]", bg: "bg-[#f0faf6]", border: "border-[#c0e8db]" },
  amber: { label: "Review complete, items to address", color: "text-[#8a6500]", bg: "bg-[#fff8e6]", border: "border-[#f5d88a]" },
  needs_attention: { label: "Needs attention before submission", color: "text-[#c0392b]", bg: "bg-[#fef2f2]", border: "border-[#fecaca]" },
  declared: { label: "Declaration signed", color: "text-[#0d7a5f]", bg: "bg-[#f0faf6]", border: "border-[#c0e8db]" },
  authorised: { label: "Awaiting submission to HMRC", color: "text-[#0d7a5f]", bg: "bg-[#f0faf6]", border: "border-[#c0e8db]" },
  submitted: { label: "Submitted to HMRC", color: "text-[#0d7a5f]", bg: "bg-[#f0faf6]", border: "border-[#c0e8db]" },
};

interface Application {
  id: string;
  email: string;
  scheme: string;
  company_name: string;
  status: string;
  authority_letter_url: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState<{ code: string | null; totalUses: number; totalCreditsEarned: number; currentBalance: number; recentUses: Array<{ email: string; date: string; credited: boolean }> } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }
      setUser(authUser);

      const res = await fetch(`/api/dashboard/applications?email=${encodeURIComponent(authUser.email!)}`);
      const data = await res.json();
      setApplications(data.applications || []);

      // Fetch referral stats
      try {
        const refRes = await fetch(`/api/referral?email=${encodeURIComponent(authUser.email!)}`);
        if (refRes.ok) {
          const refData = await refRes.json();
          setReferral(refData);
        }
      } catch {}

      setLoading(false);
    };
    getUser();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <p className="text-sm text-[#888]">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Nav
        variant="minimal"
        rightSlot={
          <>
            <span className="text-xs text-[#888]">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-xs text-[#888] hover:text-[#1a1a18] transition-colors"
            >
              Sign out
            </button>
          </>
        }
      />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-3xl tracking-tight mb-8">Your applications</h1>

        {applications.length === 0 ? (
          <div className="bg-white border border-[#e8e8e4] rounded-xl p-8 text-center">
            <p className="text-sm text-[#666] mb-4">
              You do not have any applications yet.
            </p>
            <Link href="/eligibility">
              <button className="bg-[#0d7a5f] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors">
                Check my eligibility
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const statusConfig = STATUS_LABELS[app.status] || STATUS_LABELS.draft;
              return (
                <div key={app.id} className="bg-white border border-[#e8e8e4] rounded-xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="font-medium text-[#1a1a18]">{app.company_name || "Your company"}</h2>
                      <p className="text-xs text-[#888] mt-0.5">
                        {app.scheme?.toUpperCase()} advance assurance
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {app.status !== "draft" && (
                      <Link
                        href={`/apply/review?email=${encodeURIComponent(app.email)}&scheme=${app.scheme}`}
                        className="flex-1"
                      >
                        <button className="w-full border border-[#0d7a5f] text-[#0d7a5f] py-2 rounded-lg text-xs font-medium hover:bg-[#f0faf6] transition-colors">
                          View application
                        </button>
                      </Link>
                    )}
                    {app.status === "draft" && (
                      <Link href="/apply" className="flex-1">
                        <button className="w-full bg-[#0d7a5f] text-white py-2 rounded-lg text-xs font-medium hover:bg-[#0a5c47] transition-colors">
                          Continue application
                        </button>
                      </Link>
                    )}
                    {app.status === "paid" && (
                      <Link href="/apply/upload" className="flex-1">
                        <button className="w-full bg-[#0d7a5f] text-white py-2 rounded-lg text-xs font-medium hover:bg-[#0a5c47] transition-colors">
                          Upload documents
                        </button>
                      </Link>
                    )}
                    {app.authority_letter_url && (
                      <a
                        href={app.authority_letter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <button className="w-full border border-[#e8e8e4] text-[#888] py-2 rounded-lg text-xs font-medium hover:border-[#0d7a5f] hover:text-[#0d7a5f] transition-colors">
                          Authority letter
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Referral section */}
        {referral?.code && (
          <div className="mt-10">
            <h2 className="font-serif text-2xl tracking-tight mb-4">Refer a founder</h2>
            <div className="bg-white border border-[#e8e8e4] rounded-xl p-6 mb-4">
              <p className="text-sm text-[#666] mb-4">Share your referral link with other founders. They get £10 off, you earn £10 credit.</p>
              <div className="bg-[#f5f5f2] rounded-lg p-4 mb-4">
                <p className="text-xs text-[#888] mb-1">Your referral code</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-lg text-[#1a1a18] tracking-wide">{referral.code}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`https://seisly.com/r/${referral.code}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="text-xs border border-[#0d7a5f] text-[#0d7a5f] px-3 py-1.5 rounded hover:bg-[#f0faf6] transition-colors">
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                </div>
                <p className="text-xs text-[#aaa] mt-2">seisly.com/r/{referral.code}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-[#888]">Total referrals</p>
                  <p className="font-serif text-xl">{referral.totalUses}</p>
                </div>
                <div>
                  <p className="text-xs text-[#888]">Credits earned</p>
                  <p className="font-serif text-xl">£{referral.totalCreditsEarned}</p>
                </div>
                <div>
                  <p className="text-xs text-[#888]">Current balance</p>
                  <p className="font-serif text-xl text-[#0d7a5f]">£{referral.currentBalance}</p>
                </div>
              </div>
              {referral.recentUses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#888] uppercase tracking-wide mb-2">Recent referrals</p>
                  <div className="space-y-2">
                    {referral.recentUses.map((use, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-[#f0f0ec]">
                        <span className="text-[#666]">{use.email}</span>
                        <span className="text-[#888]">{new Date(use.date).toLocaleDateString('en-GB')}</span>
                        <span className={use.credited ? "text-[#0d7a5f]" : "text-[#aaa]"}>{use.credited ? "£10 credited" : "Pending"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-[#aaa] mt-4">Credits can be applied to resubmission (£50) or compliance statements (£399).</p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
