"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import Footer from "../../components/Footer";
import Nav from "../../components/Nav";

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
  const router = useRouter()
  const urlScheme = params.get('scheme') || ''
  const [email, setEmail] = useState('')
  const [scheme, setScheme] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const [review, setReview] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('loading')
  const [companyName, setCompanyName] = useState('')
  const [released, setReleased] = useState(false)
  const [isExpress, setIsExpress] = useState(false)
  const [slaDeadline, setSlaDeadline] = useState<string | null>(null)
  const [slaHours, setSlaHours] = useState(72)
  const [declined, setDeclined] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [freeResubmission, setFreeResubmission] = useState(false)

  // Declaration/authorisation flow
  const [flowStep, setFlowStep] = useState<'review' | 'declare' | 'declared' | 'authorised'>('review')
  const [sigName, setSigName] = useState('')
  const [sigPosition, setSigPosition] = useState('')
  const [declaring, setDeclaring] = useState(false)
  const [authorising, setAuthorising] = useState(false)
  const [letterUrl, setLetterUrl] = useState<string | null>(null)
  const [letterLoading, setLetterLoading] = useState(false)
  const [declareError, setDeclareError] = useState('')
  const [authoriseError, setAuthoriseError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser || !authUser.email) {
        router.push("/login")
        return
      }

      // Email always comes from the session — never from the URL — so a
      // user cannot deep-link to another user's review. The applications
      // table has no user_id column; email is the natural key.
      setEmail(authUser.email)

      // Scheme: if the URL provided one (and it's valid), use it for
      // disambiguation. Otherwise look up the user's most recently
      // updated application across all three schemes and use its scheme.
      // This is what makes the upload page's "View review progress" link
      // work without URL params, while still letting the dashboard's per-
      // row "View application" links target a specific application.
      const validUrlScheme =
        urlScheme === 'seis' || urlScheme === 'eis' || urlScheme === 'both'
          ? urlScheme
          : null

      if (validUrlScheme) {
        setScheme(validUrlScheme)
        setAuthChecked(true)
        return
      }

      try {
        const responses = await Promise.all([
          fetch('/api/application/load?scheme=seis'),
          fetch('/api/application/load?scheme=eis'),
          fetch('/api/application/load?scheme=both'),
        ])
        const results = await Promise.all(
          responses.map(r => r.json() as Promise<{
            exists: boolean
            application: { scheme?: string; updated_at?: string } | null
          }>)
        )
        const apps = results
          .map(r => r.application)
          .filter((app): app is { scheme?: string; updated_at?: string } => app !== null)
          .sort((a, b) => {
            const at = a.updated_at ? new Date(a.updated_at).getTime() : 0
            const bt = b.updated_at ? new Date(b.updated_at).getTime() : 0
            return bt - at
          })

        if (apps.length > 0 && apps[0].scheme) {
          setScheme(apps[0].scheme)
          setAuthChecked(true)
        } else {
          // No application at all — nothing to review. Send to dashboard.
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Failed to load application for review:', err)
        router.push('/dashboard')
      }
    })
  }, [router, urlScheme])

  useEffect(() => {
    if (!authChecked || !email) return
    const fetchReview = async () => {
      try {
        const res = await fetch(`/api/review/status?email=${encodeURIComponent(email)}&scheme=${scheme}`)
        const data = await res.json()
        setStatus(data.review_status || 'pending')
        setReleased(!!data.review_released)
        if (data.is_express) setIsExpress(true)
        if (data.sla_deadline) setSlaDeadline(data.sla_deadline)
        if (data.review_sla_hours) setSlaHours(data.review_sla_hours)
        if (data.status === 'declined') {
          setDeclined(true)
          if (data.decline_reason) setDeclineReason(data.decline_reason)
          if (data.free_resubmission_available) setFreeResubmission(true)
        }
        if (data.status === 'declared') setFlowStep('declared')
        if (data.status === 'authorised') setFlowStep('authorised')

        // Fetch full results when released and not yet loaded
        if (data.review_released && !review) {
          try {
            const resultsRes = await fetch(`/api/review/results?email=${encodeURIComponent(email)}&scheme=${scheme}`)
            if (resultsRes.ok) {
              const resultsData = await resultsRes.json()
              if (resultsData.ai_review_result) {
                setReview(resultsData.ai_review_result)
              } else if (resultsData.review_results) {
                setReview(resultsData.review_results)
              }
              if (resultsData.company_name) setCompanyName(resultsData.company_name)
            }
          } catch {}
        }
      } catch {
        setStatus('error')
      } finally {
        setLoading(false)
      }
    }
    fetchReview()
    const interval = setInterval(fetchReview, 5000)
    return () => clearInterval(interval)
  }, [authChecked, email, scheme, review])

  const generateLetter = async () => {
    setLetterLoading(true)
    try {
      const res = await fetch('/api/authority-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, scheme })
      })
      const data = await res.json()
      if (data.url) setLetterUrl(data.url)
    } catch {
      console.error('Letter generation failed')
    } finally {
      setLetterLoading(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  useEffect(() => {
    // Generate the authority letter only once the founder has authorised
    // Seisly as their agent — the letter contains the authorisation text
    // and only makes sense after that step.
    if (flowStep === 'authorised' && !letterUrl && !letterLoading) generateLetter()
  }, [flowStep]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!authChecked || loading) return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
      <p className="text-sm text-[#888]">Loading your review...</p>
    </div>
  )

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

      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-[11px] text-[#0d7a5f] uppercase tracking-widest font-medium mb-3">Application review</p>
        <h1 className="font-serif text-3xl tracking-tight mb-2">Your application review</h1>
        <p className="text-sm text-[#888] mb-8">{email} · {scheme.toUpperCase()}</p>

        {/* Holding page — shown when review not yet released to founder */}
        {!released && (status === 'pending' || status === 'in_progress' || status === 'ready' || status === 'amber' || status === 'needs_attention') && (
          <div className="bg-white border border-[#e8e8e4] rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-2xl mx-auto mb-6">&#10003;</div>
            <h2 className="font-serif text-2xl mb-3">Thank you - your application is with us</h2>
            {isExpress ? (
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                <span className="inline-block bg-[#fff8e6] border border-[#f5d88a] text-[#8a6500] text-xs px-2 py-0.5 rounded mb-2">Express Review</span><br />
                Express Review &ndash; your application will be reviewed within 24&ndash;36 hours.
                {slaDeadline && <> Expected by {new Date(slaDeadline).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.</>}
              </p>
            ) : (
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                Your application is now being reviewed. Standard review: up to 72 hours. At busy times, this may take longer &ndash; we will let you know.
                {slaDeadline && <> Expected by {new Date(slaDeadline).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.</>}
              </p>
            )}
            <p className="text-xs text-[#aaa]">You can close this page. We will email you at <strong>{email}</strong> when there is an update.</p>
          </div>
        )}

        {/* Declined state */}
        {declined && (
          <div className="space-y-4">
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-6">
              <p className="text-sm font-medium text-[#c0392b] mb-2">We have reviewed your application and believe it needs some changes before it can be submitted to HMRC.</p>
            </div>

            {declineReason && (
              <div className="bg-white border border-[#e8e8e4] rounded-xl p-6">
                <p className="text-xs font-medium text-[#888] uppercase tracking-wide mb-3">What we found</p>
                <p className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap">{declineReason}</p>
              </div>
            )}

            {freeResubmission && (
              <div className="bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-6 text-center">
                <p className="text-sm text-[#555] mb-4">Once you have addressed the points above, you can resubmit at no extra charge.</p>
                <Link href="/apply">
                  <button className="bg-[#0d7a5f] text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors">
                    Resubmit for free
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-6">
            <p className="text-sm text-[#c0392b]">The automated review encountered an issue. Our team has been notified and will review your application manually. We will email you within 24 hours.</p>
          </div>
        )}

        {released && review && (status === 'ready' || status === 'amber' || status === 'needs_attention') && (
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
                <div className="bg-[#f5f5f2] border border-[#e8e8e4] rounded-xl p-4 mb-4">
                  <p className="text-xs text-[#888] leading-relaxed">
                    Please note: Seisly does not guarantee that your application will be approved by HMRC. Our AI review is designed to improve your application quality but is not infallible. HMRC advance assurance is discretionary and their decision is final. Our money-back guarantee applies only where rejection is demonstrably due to an error in our preparation or submission.
                  </p>
                </div>
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
                  {authoriseError && (
                    <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-4 mb-4">
                      <p className="text-xs text-[#c0392b] mb-2">{authoriseError}</p>
                      {authoriseError.includes('expired') && (
                        <button onClick={() => setFlowStep('declare')} className="text-xs text-[#0d7a5f] hover:underline">
                          Re-sign your declaration
                        </button>
                      )}
                    </div>
                  )}
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
                        else setAuthoriseError(d.error || 'Something went wrong. Please try again.')
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
              <div className="space-y-4">
                <div className="bg-[#f0faf6] border border-[#c0e8db] rounded-xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-xl mx-auto mb-4">&#10003;</div>
                  <h3 className="font-serif text-xl mb-2">All done - your application is authorised</h3>
                  <p className="text-sm text-[#666] leading-relaxed">
                    You have signed your accuracy declaration and authorised Seisly to submit your application to HMRC on your behalf. There is nothing more for you to do right now.
                  </p>
                </div>

                <div className="bg-white border border-[#e8e8e4] rounded-xl p-6">
                  <h3 className="font-serif text-lg mb-2">What happens next</h3>
                  <ol className="space-y-3 text-sm text-[#555] leading-relaxed">
                    <li className="flex gap-3">
                      <span className="text-[#0d7a5f] font-medium flex-shrink-0">1.</span>
                      <span>We will submit your application to HMRC as your authorised agent within the next working day.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#0d7a5f] font-medium flex-shrink-0">2.</span>
                      <span>HMRC typically responds within 4 to 8 weeks. We will track the response and let you know as soon as we hear back.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#0d7a5f] font-medium flex-shrink-0">3.</span>
                      <span>If HMRC have follow-up questions, we will support you through one round of queries at no extra cost.</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-white border border-[#e8e8e4] rounded-xl p-6">
                  <h3 className="font-serif text-lg mb-2">Your signed authority letter</h3>
                  <p className="text-sm text-[#666] mb-4 leading-relaxed">
                    This is the agent authority letter we will submit to HMRC alongside your application. Save a copy for your records.
                  </p>
                  {letterLoading ? (
                    <p className="text-xs text-[#aaa]">Preparing your authority letter...</p>
                  ) : letterUrl ? (
                    <a
                      href={letterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border border-[#0d7a5f] text-[#0d7a5f] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#f0faf6] transition-colors"
                    >
                      Download authority letter (PDF)
                    </a>
                  ) : (
                    <button
                      onClick={generateLetter}
                      className="text-xs text-[#0d7a5f] border border-[#0d7a5f] px-4 py-2 rounded-lg hover:bg-[#f0faf6]"
                    >
                      Generate authority letter
                    </button>
                  )}
                </div>

                <div className="bg-[#f5f5f2] border border-[#e8e8e4] rounded-xl p-6 text-center">
                  <p className="text-sm text-[#555] mb-4 leading-relaxed">
                    You can check your dashboard for status updates at any time. We will also email you at <strong>{email}</strong> whenever there is news on your application.
                  </p>
                  <Link href="/dashboard">
                    <button className="bg-[#0d7a5f] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors">
                      Go to your dashboard
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
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
