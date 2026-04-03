import Link from "next/link";

export default function CookiePolicy() {
  return (
    <div className="bg-[#fafaf8] min-h-screen">
      <nav className="border-b border-[#e8e8e4] px-6 h-[60px] flex items-center justify-between bg-white">
        <Link href="/">
          <svg width="140" height="37" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="52" height="52" rx="11" fill="#0d7a5f"/>
            <path d="M34 10 C34 10 18 10 18 18 C18 26 34 26 34 34 C34 42 18 42 18 42" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
            <text x="68" y="30" fontFamily="Georgia, serif" fontSize="30" fontWeight="400" fill="#1a1a18" letterSpacing="-0.8">Seis<tspan fill="#0d7a5f">ly</tspan></text>
            <text x="70" y="47" fontFamily="Georgia, serif" fontSize="11" fontWeight="400" fill="#aaa" letterSpacing="0.8" fontStyle="italic">Seisly done.</text>
          </svg>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs text-[#aaa] uppercase tracking-widest mb-4">Legal</p>
        <h1 className="font-serif text-4xl tracking-tight mb-2">Cookie Policy</h1>
        <p className="text-sm text-[#888] mb-12">Last updated: 2 April 2026</p>

        <div className="space-y-8 text-sm text-[#444] leading-relaxed">

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">What are cookies</h2>
            <p>Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work, to remember your preferences, and to provide information to website owners.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">How we use cookies</h2>
            <p>Seisly uses only essential cookies. We do not use advertising cookies, tracking cookies, or analytics cookies that monitor your behaviour across other websites.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Essential cookies</h2>
            <p className="mb-4">These cookies are necessary for the website to function and cannot be switched off. They are set in response to actions you take such as logging in or filling in a form.</p>
            <div className="border border-[#e8e8e4] rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#f5f5f2] border-b border-[#e8e8e4]">
                    <th className="text-left px-4 py-3 font-medium text-[#1a1a18]">Cookie</th>
                    <th className="text-left px-4 py-3 font-medium text-[#1a1a18]">Purpose</th>
                    <th className="text-left px-4 py-3 font-medium text-[#1a1a18]">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  <tr>
                    <td className="px-4 py-3 font-mono">sb-session</td>
                    <td className="px-4 py-3 text-[#666]">Maintains your login session securely</td>
                    <td className="px-4 py-3 text-[#666]">Session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono">sb-refresh</td>
                    <td className="px-4 py-3 text-[#666]">Keeps you logged in between visits</td>
                    <td className="px-4 py-3 text-[#666]">7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Third-party cookies</h2>
            <p>Our payment provider Stripe may set cookies when you complete a payment. These are set by Stripe and governed by <a href="https://stripe.com/gb/privacy" className="text-[#0d7a5f]" target="_blank" rel="noopener noreferrer">Stripe&apos;s privacy policy</a>. We have no control over these cookies.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">What we do not do</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>We do not use Google Analytics or any other behavioural analytics service</li>
              <li>We do not use advertising networks or retargeting pixels</li>
              <li>We do not track you across other websites</li>
              <li>We do not sell data derived from cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Managing cookies</h2>
            <p>Because we only use essential cookies, blocking them may prevent Seisly from working correctly. You can manage cookies in your browser settings. Most browsers allow you to view, delete, and block cookies from specific websites.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Contact</h2>
            <p>If you have questions about our use of cookies, contact us at <a href="mailto:privacy@seisly.com" className="text-[#0d7a5f]">privacy@seisly.com</a>.</p>
          </section>

        </div>
      </div>

      <footer className="bg-[#111] px-6 py-10 flex flex-wrap justify-between items-center gap-4">
        <div className="font-serif text-xl text-white">Seis<span className="text-[#5DCAA5]">ly</span></div>
        <div className="flex gap-6 text-xs text-[#555]">
          <Link href="/privacy" className="hover:text-[#aaa]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#aaa]">Terms</Link>
          <Link href="/cookies" className="hover:text-[#aaa]">Cookies</Link>
          <Link href="/acceptable-use" className="hover:text-[#aaa]">Acceptable use</Link>
        </div>
        <p className="text-xs text-[#555]">&copy; 2026 Litigo Limited</p>
      </footer>
    </div>
  );
}
