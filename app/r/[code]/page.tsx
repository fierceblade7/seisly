import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  // Look up the code
  const { data } = await supabase
    .from('referral_codes')
    .select('code, is_active')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (!data || !data.is_active) {
    redirect('/eligibility')
  }

  // Set referral cookie
  const cookieStore = await cookies()
  cookieStore.set('seisly_referral', code.toUpperCase(), {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col">
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center bg-white">
        <Link href="/" className="font-serif text-xl text-[#1a1a18]">
          Seis<span className="text-[#0d7a5f]">ly</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[#e8f5f1] border border-[#c0e8db] flex items-center justify-center text-2xl mx-auto mb-6">
            &#127873;
          </div>
          <h1 className="font-serif text-3xl tracking-tight mb-3">
            You have been invited to try Seisly
          </h1>
          <p className="text-sm text-[#666] leading-relaxed mb-8">
            Get £10 off your SEIS or EIS advance assurance application. Your discount will be applied automatically at checkout.
          </p>
          <Link href="/eligibility">
            <button className="w-full bg-[#0d7a5f] text-white py-4 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors">
              Check your eligibility
            </button>
          </Link>
          <p className="text-xs text-[#aaa] mt-4">
            Free eligibility check. Takes 2 minutes. No account needed.
          </p>
        </div>
      </div>
    </div>
  )
}
