import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_ORIGINS = ['https://seisly.com', 'http://localhost:3000']

export async function GET(request: NextRequest) {
  const { searchParams, origin: rawOrigin } = new URL(request.url)
  const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://seisly.com'
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user?.email) {
      // Check if application exists for this email
      const { data: applications } = await supabaseAdmin
        .from("applications")
        .select("email, scheme, status")
        .eq("email", user.email)
        .order("created_at", { ascending: false })

      if (applications && applications.length === 1) {
        // Single application - go straight to review
        const app = applications[0]
        return NextResponse.redirect(
          `${origin}/apply/review?email=${encodeURIComponent(app.email)}&scheme=${app.scheme}`
        )
      } else {
        // Multiple or no applications - go to dashboard
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
