import Link from "next/link";
import type { Metadata } from "next";
import Footer from "../components/Footer";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "Acceptable Use Policy - Seisly",
};

export default function AcceptableUsePolicy() {
  return (
    <div className="bg-[#fafaf8] min-h-screen">
      <Nav variant="minimal" />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs text-[#aaa] uppercase tracking-widest mb-4">Legal</p>
        <h1 className="font-serif text-4xl tracking-tight mb-2">Acceptable Use Policy</h1>
        <p className="text-sm text-[#888] mb-12">Last updated: 2 April 2026</p>

        <div className="space-y-8 text-sm text-[#444] leading-relaxed">

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Overview</h2>
            <p>This policy sets out what you may and may not do when using Seisly. It applies to all users of seisly.com and any related services operated by Litigo Limited.</p>
            <p className="mt-3">By using Seisly you agree to this policy. Breach of this policy may result in immediate suspension of your access and, where appropriate, referral to relevant authorities.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Permitted use</h2>
            <p>You may use Seisly to:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Check whether your company is eligible for SEIS or EIS advance assurance</li>
              <li>Prepare and submit a genuine SEIS or EIS advance assurance application to HMRC on behalf of a company you are authorised to represent</li>
              <li>Manage and track applications you have submitted through the platform</li>
              <li>Generate investor certificates for genuine investments made into your company under an approved SEIS or EIS advance assurance</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Prohibited use</h2>
            <p>You must not use Seisly to:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong className="font-medium text-[#1a1a18]">Submit false information.</strong> Providing inaccurate, misleading, or fraudulent information in an HMRC application is a criminal offence. We take this seriously and will report suspected fraud to HMRC and relevant authorities.</li>
              <li><strong className="font-medium text-[#1a1a18]">Apply on behalf of a company you are not authorised to represent.</strong> You must have the authority of a director, company secretary, or equivalent to submit an advance assurance application.</li>
              <li><strong className="font-medium text-[#1a1a18]">Circumvent SEIS or EIS qualifying conditions.</strong> Do not use Seisly to prepare applications for companies you know or suspect do not genuinely qualify for the scheme.</li>
              <li><strong className="font-medium text-[#1a1a18]">Use the platform for any unlawful purpose.</strong> This includes money laundering, tax evasion, or any other illegal activity.</li>
              <li><strong className="font-medium text-[#1a1a18]">Attempt to reverse engineer, copy, or scrape the platform.</strong> You may not copy our eligibility logic, application templates, or any other part of the service for use in a competing product.</li>
              <li><strong className="font-medium text-[#1a1a18]">Overload or interfere with the platform.</strong> Do not attempt to disrupt the service or gain unauthorised access to our systems.</li>
              <li><strong className="font-medium text-[#1a1a18]">Resell access to the platform</strong> without our prior written permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Your responsibility for accuracy</h2>
            <p>You are solely responsible for the accuracy and completeness of all information you submit through Seisly. We prepare documents based on what you tell us. We do not independently verify the information you provide.</p>
            <p className="mt-3">If you discover that information you have submitted is inaccurate, contact us immediately at <a href="mailto:support@seisly.com" className="text-[#0d7a5f]">support@seisly.com</a>. Do not allow an application containing inaccurate information to be submitted to HMRC.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">HMRC compliance</h2>
            <p>Advance assurance is granted on the basis of information provided at the time of application. You remain responsible for ensuring your company continues to meet all SEIS and EIS conditions throughout the compliance period.</p>
            <p className="mt-3">If circumstances change after advance assurance is granted - for example, a change in trade, a new subsidiary, or additional funding - you should notify HMRC and contact us at <a href="mailto:support@seisly.com" className="text-[#0d7a5f]">support@seisly.com</a>.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Consequences of breach</h2>
            <p>If we believe you are in breach of this policy, we may:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Suspend or terminate your access to Seisly without refund</li>
              <li>Withdraw any pending application submission</li>
              <li>Report the matter to HMRC, Action Fraud, or other relevant authorities</li>
              <li>Pursue any other legal remedies available to us</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Reporting concerns</h2>
            <p>If you become aware of misuse of the Seisly platform, or if you believe an application has been submitted containing false information, please contact us at <a href="mailto:support@seisly.com" className="text-[#0d7a5f]">support@seisly.com</a>.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Contact</h2>
            <p>Litigo Limited, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ</p>
            <p className="mt-1"><a href="mailto:hello@seisly.com" className="text-[#0d7a5f]">hello@seisly.com</a></p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
