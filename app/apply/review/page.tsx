"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const Logo = () => (
  <svg width="140" height="37" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
    <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
    <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
    <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
  </svg>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    green: { bg: 'bg-[#e8f5f1]', text: 'text-[#0d7a5f]', border: 'border-[#c0e8db]', label: 'Good' },
    amber: { bg: 'bg-[#fff8e6]', text: 'text-[#8a6500]', border: 'border-[#f5d88a]', label: 'Review' },
    red: { bg: 'bg-[#fef2f2]', text: 'text-[#c0392b]', border: 'border-[#fecaca]', label: 'Action needed' },
  }[status] || { bg: 'bg-[#f5f5f2]', text: 'text-[#888]', border: 'border-[#e8e8e4]', label: 'Unknown' }

  return (
    <span className={`text-xs px-2 py-1 rounded border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  )
}

interface ReviewCheck { status: string; message: string }
interface SuggestedImprovement { field: string; current: string; suggested: string }
interface ReviewPass1 { summary?: string; documents?: Record<string, ReviewCheck>; form_answers?: Record<string, ReviewCheck>; action_items?: string[] }
interface ReviewPass2 { consistency_checks?: Record<string, ReviewCheck>; suggested_improvements?: SuggestedImprovement[] }
interface ReviewData { pass1?: ReviewPass1; pass2?: ReviewPass2; overall?: string }

function ReviewPageContent() {
  const params = useSearchParams()
  const email = params.get('email') || ''
  const scheme = params.get('scheme') || ''
  const [review, setReview] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('loading')
  const [companyName, setCompanyName] = useState('')

  // Declaration/authorisation flow
  const [flowStep, setFlowStep] = useState<'review' | 'declare' | 'declared' | 'authorised'>('review')
  const [sigName, setSigName] = useState('')
  const [sigPosition, setSigPosition] = useState('')
  const [declaring, setDeclaring] = useState(false)
  const [authorising, setAuthorising] = useState(false)
  const [declareError, setDeclareError] = useState('')
  const [authoriseError, setAuthoriseError] = useState('')

  useEffect(() => {
    if (!email) return
    const fetchReview = async () => {
      try {
        const res = await fetch(`/api/review/status?email=${encodeURIComponent(email)}&scheme=${scheme}`)
        const data = await res.json()
        setStatus(data.review_status || 'pending')
        if (data.review_results) {
          setReview(data.review_results)
        }
        if (data.company_name) setCompanyName(data.company_name)
        if (data.status === 'declared') setFlowStep('declared')
        if (data.status === 'authorised') setFlowStep('authorised')
      } catch {
        setStatus('error')
      } finally {
        setLoading(false)
      }
    }
    fetchReview()
    const interval = setInterval(fetchReview, 5000)
    return () => clearInterval(interval)
  }, [email, scheme])

  if (loading) return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
      <p className="text-sm text-[#888]">Loading your review...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center bg-white">
        <Link href="/"><Logo /></Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-3">Application review</p>
        <h1 className="font-serif text-3xl tracking-tight mb-2">Your application review</h1>
        <p className="text-sm text-[#888] mb-8">{email} · {scheme.toUpperCase()}</p>

        {(status === 'pending' || status === 'in_progress') && (
          <div className="bg-white border border-[#e8e8e4] rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f0faf6] border border-[#c0e8db] flex items-center justify-center mx-auto mb-4">
              <div className="w-4 h-4 rounded-full bg-[#0d7a5f] animate-pulse"></div>
            </div>
            <h2 className="font-serif text-xl mb-2">Review in progress</h2>
            <p className="text-sm text-[#666] leading-relaxed mb-4">
              We are reviewing your documents and application answers. This usually takes 5 to 10 minutes.
            </p>
            <p className="text-xs text-[#aaa]">You will receive an email when your review is ready. You can close this page.</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-6">
            <p className="text-sm text-[#c0392b]">The automated review encountered an issue. Our team has been notified and will review your application manually. We will email you within 24 hours.</p>
          </div>
        )}

        {review && (status === 'ready' || status === 'amber' || status === 'needs_attention') && (
          <div className="space-y-6">

            <div className={`border rounded-xl p-5 ${status === 'ready' ? 'bg-[#f0faf6] border-[#c0e8db]' : status === 'amber' ? 'bg-[#fff8e6] border-[#f5d88a]' : 'bg-[#fef2f2] border-[#fecaca]'}`}>
              <p className="text-sm font-medium mb-1">
                {status === 'ready' ? 'Ready to submit' : status === 'amber' ? 'A few things to review' : 'Needs attention before submission'}
              </p>
              <p className="text-sm text-[#555]">{review.pass1?.summary}</p>
            </div>

            <div className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f0f0ec]">
                <h2 className="font-medium text-sm">Document review</h2>
              </div>
              <div className="divide-y divide-[#f0f0ec]">
                {review.pass1?.documents && Object.entries(review.pass1.documents).map(([key, val]) => (
                  <div key={key} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a1a18] mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-xs text-[#666] leading-relaxed">{val.message}</p>
                    </div>
                    <StatusBadge status={val.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f0f0ec]">
                <h2 className="font-medium text-sm">Application answers</h2>
              </div>
              <div className="divide-y divide-[#f0f0ec]">
                {review.pass1?.form_answers && Object.entries(review.pass1.form_answers).map(([key, val]) => (
                  <div key={key} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a1a18] mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-xs text-[#666] leading-relaxed">{val.message}</p>
                    </div>
                    <StatusBadge status={val.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f0f0ec]">
                <h2 className="font-medium text-sm">Consistency check</h2>
              </div>
              <div className="divide-y divide-[#f0f0ec]">
                {review.pass2?.consistency_checks && Object.entries(review.pass2.consistency_checks).map(([key, val]) => (
                  <div key={key} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a1a18] mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-xs text-[#666] leading-relaxed">{val.message}</p>
                    </div>
                    <StatusBadge status={val.status} />
                  </div>
                ))}
              </div>
            </div>

            {review.pass2?.suggested_improvements && review.pass2.suggested_improvements.length > 0 && (
              <div className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#f0f0ec]">
                  <h2 className="font-medium text-sm">Suggested improvements</h2>
                  <p className="text-xs text-[#888] mt-0.5">These changes would strengthen your application</p>
                </div>
                <div className="divide-y divide-[#f0f0ec]">
                  {review.pass2.suggested_improvements.map((item, i) => (
                    <div key={i} className="px-5 py-4">
                      <p className="text-xs font-medium text-[#0d7a5f] uppercase tracking-wide mb-2">{item.field}</p>
                      <p className="text-xs text-[#888] mb-2"><span className="font-medium">Current:</span> {item.current}</p>
                      <p className="text-xs text-[#1a1a18]"><span className="font-medium text-[#0d7a5f]">Suggestion:</span> {item.suggested}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {review.pass1?.action_items && review.pass1.action_items.length > 0 && (
              <div className="bg-[#fff8e6] border border-[#f5d88a] rounded-xl p-5">
                <p className="text-sm font-medium text-[#8a6500] mb-3">Action items before submission</p>
                <ul className="space-y-2">
                  {review.pass1.action_items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#666]">
                      <span className="text-[#8a6500] flex-shrink-0">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step 1 - Ready to proceed */}
            {flowStep === 'review' && (
              <div className="bg-white border border-[#e8e8e4] rounded-xl p-6">
                <h3 className="font-serif text-lg mb-2">Ready to proceed?</h3>
                <p className="text-sm text-[#666] mb-4 leading-relaxed">
                  Review the feedback above and when you are ready, sign the accuracy declaration below.
                  Once signed, your application will be locked and you can proceed to submission.
                </p>
                {status === 'needs_attention' && (
                  <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-4 mb-4">
                    <p className="text-xs text-[#c0392b]">
                      Your application has items that need attention. You can still proceed
                      but we recommend addressing the action items above first for the best
                      chance of HMRC approval.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setFlowStep('declare')}
                  className="w-full bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors"
                >
                  Proceed to declaration
                </button>
              </div>
            )}

            {/* Declaration form */}
            {flowStep === 'declare' && (
              <div className="bg-white border border-[#e8e8e4] rounded-xl p-6">
                <h3 className="font-serif text-lg mb-1">Accuracy declaration</h3>
                <p className="text-sm text-[#666] mb-6 leading-relaxed">
                  By signing below, you confirm that the information in this application
                  is accurate and complete to the best of your knowledge. This locks your
                  application.
                </p>
                <div className="bg-[#f5f5f2] border border-[#e8e8e4] rounded-lg p-4 mb-6">
                  <p className="text-sm text-[#444] leading-relaxed italic">
                    &ldquo;I confirm that the information in this application is accurate and
                    complete to the best of my knowledge, and that I am authorised to make
                    this declaration on behalf of the company.&rdquo;
                  </p>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Full name</label>
                    <input type="text" value={sigName} onChange={e => setSigName(e.target.value)}
                      placeholder="Your full legal name"
                      className="w-full border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d7a5f]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Position in company</label>
                    <input type="text" value={sigPosition} onChange={e => setSigPosition(e.target.value)}
                      placeholder="e.g. Director, Company Secretary"
                      className="w-full border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d7a5f]" />
                  </div>
                </div>
                {sigName && (
                  <div className="border border-[#e8e8e4] rounded-lg p-4 mb-6 bg-[#fafaf8]">
                    <p className="text-xs text-[#aaa] mb-2">Signature preview</p>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#1a1a18' }}>{sigName}</p>
                    <p className="text-xs text-[#888] mt-1">{sigPosition}</p>
                  </div>
                )}
                {declareError && <p className="text-xs text-[#c0392b] mb-4">{declareError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setFlowStep('review')}
                    className="flex-1 border border-[#e8e8e4] text-[#888] py-3 rounded-lg text-sm font-medium hover:border-[#ccc] transition-colors">
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      if (!sigName.trim()) { setDeclareError('Please enter your full name'); return }
                      if (!sigPosition.trim()) { setDeclareError('Please enter your position'); return }
                      setDeclaring(true)
                      setDeclareError('')
                      try {
                        const res = await fetch('/api/application/declare', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, scheme, name: sigName, position: sigPosition })
                        })
                        const d = await res.json()
                        if (d.success) setFlowStep('declared')
                        else setDeclareError('Something went wrong. Please try again.')
                      } catch { setDeclareError('Something went wrong. Please try again.') }
                      finally { setDeclaring(false) }
                    }}
                    disabled={declaring || !sigName.trim() || !sigPosition.trim()}
                    className="flex-1 bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {declaring ? 'Signing...' : 'Sign declaration'}
                  </button>
                </div>
              </div>
            )}

            {/* After declaration - two options */}
            {flowStep === 'declared' && (
              <div className="space-y-4">
                <div className="bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-5">
                  <p className="text-sm font-medium text-[#0a5c47] mb-1">Declaration signed{sigName ? ` by ${sigName}` : ''}</p>
                  <p className="text-xs text-[#666]">Your application is locked. Choose how you would like to proceed.</p>
                </div>
                <div className="bg-white border border-[#e8e8e4] rounded-xl p-6">
                  <h3 className="font-serif text-lg mb-2">Submit it yourself</h3>
                  <p className="text-sm text-[#666] leading-relaxed mb-4">
                    Download your complete application pack and step-by-step instructions
                    for submitting to HMRC directly via their online service. Please note
                    the money-back guarantee does not apply to self-submitted applications.
                  </p>
                  <button
                    className="w-full border border-[#0d7a5f] text-[#0d7a5f] py-3 rounded-lg text-sm font-medium hover:bg-[#f0faf6] transition-colors"
                    onClick={() => alert('Application pack download coming soon. We will email it to you shortly.')}>
                    Download application pack and instructions
                  </button>
                </div>
                <div className="bg-white border border-[#0d7a5f] rounded-xl p-6">
                  <h3 className="font-serif text-lg mb-2">Let Seisly submit for you</h3>
                  <p className="text-sm text-[#666] leading-relaxed mb-4">
                    We will submit your application to HMRC on your behalf as your
                    authorised agent, track the response, and support you through one
                    round of HMRC queries if needed. Money-back guarantee applies.
                  </p>
                  <div className="bg-[#f5f5f2] border border-[#e8e8e4] rounded-lg p-4 mb-6">
                    <p className="text-sm text-[#444] leading-relaxed italic">
                      &ldquo;I authorise Litigo Limited (trading as Seisly) to submit this
                      application to HMRC on behalf of {companyName || 'the company'} as our
                      authorised agent.&rdquo;
                    </p>
                  </div>
                  {authoriseError && <p className="text-xs text-[#c0392b] mb-4">{authoriseError}</p>}
                  <button
                    onClick={async () => {
                      setAuthorising(true)
                      setAuthoriseError('')
                      try {
                        const res = await fetch('/api/application/authorise', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, scheme, name: sigName, companyName })
                        })
                        const d = await res.json()
                        if (d.success) setFlowStep('authorised')
                        else setAuthoriseError('Something went wrong. Please try again.')
                      } catch { setAuthoriseError('Something went wrong. Please try again.') }
                      finally { setAuthorising(false) }
                    }}
                    disabled={authorising}
                    className="w-full bg-[#0d7a5f] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors disabled:opacity-50">
                    {authorising ? 'Authorising...' : 'Authorise Seisly to submit'}
                  </button>
                </div>
              </div>
            )}

            {/* Authorised confirmation */}
            {flowStep === 'authorised' && (
              <div className="bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-xl mx-auto mb-4">&#10003;</div>
                <h3 className="font-serif text-xl mb-2">Submission authorised.</h3>
                <p className="text-sm text-[#666] leading-relaxed">
                  We have received your authorisation and will submit your application
                  to HMRC shortly. You will receive a confirmation email with next steps.
                  HMRC typically responds within 4 to 8 weeks.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafaf8] flex items-center justify-center"><p className="text-sm text-[#888]">Loading...</p></div>}>
      <ReviewPageContent />
    </Suspense>
  )
}
