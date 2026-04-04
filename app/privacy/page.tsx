import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Seisly",
};

export default function PrivacyPolicy() {
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
        <h1 className="font-serif text-4xl tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#888] mb-12">Last updated: 2 April 2026</p>

        <div className="prose-seisly space-y-8 text-sm text-[#444] leading-relaxed">

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Who we are</h2>
            <p>Seisly is a product of Litigo Limited, a company incorporated in England and Wales (company number 16895608), whose registered office is at 71-75 Shelton Street, Covent Garden, London, United Kingdom, WC2H 9JQ.</p>
            <p className="mt-3">Litigo Limited is the data controller for personal data collected through seisly.com. If you have any questions about how we handle your data, contact us at <a href="mailto:privacy@seisly.com" className="text-[#0d7a5f]">privacy@seisly.com</a>.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">What data we collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong className="font-medium text-[#1a1a18]">Contact information:</strong> your email address, provided when you join our waitlist or start an application.</li>
              <li><strong className="font-medium text-[#1a1a18]">Company information:</strong> company name, registration number, Corporation Tax UTR, incorporation date, and registered address. This is information about your company, not personal data about you individually, though some of it (such as director names) may relate to individuals.</li>
              <li><strong className="font-medium text-[#1a1a18]">Application data:</strong> details about your proposed investment, trade description, share structure, investor names and addresses, and other information required for an HMRC SEIS or EIS advance assurance application.</li>
              <li><strong className="font-medium text-[#1a1a18]">Payment information:</strong> payment is processed by Stripe. We do not store card numbers or payment details. We retain a record of the transaction amount, date, and Stripe payment reference.</li>
              <li><strong className="font-medium text-[#1a1a18]">Usage data:</strong> standard web server logs including IP address, browser type, pages visited, and timestamps. We use this to maintain and improve the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Why we collect it and our legal basis</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-[#1a1a18]">To provide the service (contract performance)</p>
                <p className="mt-1">We need your company and application data to prepare and submit your SEIS or EIS advance assurance application to HMRC on your behalf. Without this data we cannot provide the service.</p>
              </div>
              <div>
                <p className="font-medium text-[#1a1a18]">To send you updates about your application (legitimate interests)</p>
                <p className="mt-1">We will email you when your application is submitted, when HMRC responds, and if any action is required. These communications are necessary to deliver the service.</p>
              </div>
              <div>
                <p className="font-medium text-[#1a1a18]">Waitlist and early access communications (consent)</p>
                <p className="mt-1">If you join our waitlist, we will email you when the product launches or when your requested feature is available. You can unsubscribe at any time.</p>
              </div>
              <div>
                <p className="font-medium text-[#1a1a18]">Legal compliance</p>
                <p className="mt-1">We may be required to retain certain records for legal or regulatory purposes, including for tax and accounting obligations.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Who we share your data with</h2>
            <p>We share your data with the following third parties only where necessary to provide the service:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong className="font-medium text-[#1a1a18]">Supabase Inc:</strong> our database and authentication provider. Data is stored on servers in the European Union. Supabase acts as a data processor under our instructions.</li>
              <li><strong className="font-medium text-[#1a1a18]">Anthropic Inc:</strong> we use Claude, Anthropic&apos;s AI, to help draft application documents. Content you submit may be processed by Anthropic&apos;s systems to generate application text. Anthropic does not use your data to train its models.</li>
              <li><strong className="font-medium text-[#1a1a18]">Stripe Inc:</strong> payment processing. Stripe is an independent data controller for payment data. See Stripe&apos;s privacy policy at stripe.com/gb/privacy.</li>
              <li><strong className="font-medium text-[#1a1a18]">Resend Inc:</strong> transactional email delivery. We share your email address with Resend solely to deliver emails you have requested or that are necessary for the service.</li>
              <li><strong className="font-medium text-[#1a1a18]">HMRC:</strong> your application data is submitted to His Majesty&apos;s Revenue and Customs as part of the advance assurance application process. This is the core purpose of the service.</li>
              <li><strong className="font-medium text-[#1a1a18]">GoLitigo Expert Adviser Network:</strong> if you request a referral to a specialist, we may share your contact details and a brief description of your situation with an appropriate adviser in our network. We will always ask your permission before doing this.</li>
            </ul>
            <p className="mt-4">We do not sell your personal data to any third party.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">How long we keep your data</h2>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Waitlist emails are kept until you unsubscribe or ask us to delete them.</li>
              <li>Application data is kept for 7 years from the date of submission to HMRC, to comply with our obligations as your agent and for HMRC compliance purposes.</li>
              <li>Payment records are kept for 7 years for accounting and tax purposes.</li>
              <li>Usage logs are kept for 90 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Your rights</h2>
            <p>Under UK GDPR you have the right to:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data (subject to our legal retention obligations)</li>
              <li>Object to processing based on legitimate interests</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Data portability - receive your data in a machine-readable format</li>
              <li>Lodge a complaint with the Information Commissioner&apos;s Office at ico.org.uk</li>
            </ul>
            <p className="mt-4">To exercise any of these rights, email us at <a href="mailto:privacy@seisly.com" className="text-[#0d7a5f]">privacy@seisly.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Cookies</h2>
            <p>We use only essential cookies required to operate the service - session management and security. We do not use advertising or tracking cookies. See our <Link href="/cookies" className="text-[#0d7a5f]">Cookie Policy</Link> for full details.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Changes to this policy</h2>
            <p>If we make material changes to this policy we will notify you by email if you have an account with us, and update the date at the top of this page.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Contact</h2>
            <p>Litigo Limited, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ</p>
            <p className="mt-1"><a href="mailto:privacy@seisly.com" className="text-[#0d7a5f]">privacy@seisly.com</a></p>
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
