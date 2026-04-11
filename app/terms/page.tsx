import Link from "next/link";
import type { Metadata } from "next";
import Footer from "../components/Footer";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "Terms of Service - Seisly",
};

export default function TermsOfUse() {
  return (
    <div className="bg-[#fafaf8] min-h-screen">
      <Nav variant="minimal" />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs text-[#aaa] uppercase tracking-widest mb-4">Legal</p>
        <h1 className="font-serif text-4xl tracking-tight mb-2">Terms of Use</h1>
        <p className="text-sm text-[#888] mb-12">Last updated: 2 April 2026</p>

        <div className="space-y-8 text-sm text-[#444] leading-relaxed">

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Who we are</h2>
            <p>Seisly is operated by Litigo Limited, a company incorporated in England and Wales (company number 16895608), registered at 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ.</p>
            <p className="mt-3">By using seisly.com you agree to these terms. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">What Seisly is</h2>
            <p>Seisly is a document preparation and application management service. We help UK companies prepare and submit applications for SEIS and EIS advance assurance to HMRC.</p>
            <p className="mt-3">Seisly is not a law firm, accountancy practice, or regulated financial services provider. We do not provide legal advice, tax advice, or investment advice. Nothing on seisly.com or in any document we prepare constitutes legal or tax advice.</p>
            <p className="mt-3">If you need legal or tax advice, you should consult a qualified solicitor or accountant. We can refer you to our GoLitigo Expert Adviser Network if you need one.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">What you are paying for</h2>
            <p>When you pay for a Seisly application, you are paying for the following services:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Preparation of your SEIS and/or EIS advance assurance application in the format required by HMRC</li>
              <li>An AI-drafted covering letter and supporting narrative, reviewed and approved by you before submission</li>
              <li>Completion of all required HMRC form sections based on the information you provide</li>
              <li>Submission of your application to HMRC on your behalf as your authorised agent</li>
              <li>Generation of investor certificates (SEIS3 or EIS3) once HMRC approves and shares are issued</li>
              <li>Compliance reminders during your 3-year compliance window</li>
              <li>Reasonable assistance responding to HMRC queries arising from your application</li>
            </ul>
            <p className="mt-4">All prices are as stated on the pricing page at the time of purchase. Prices are inclusive of VAT where applicable.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Agent authorisation</h2>
            <p>By completing the agent authority letter as part of the application process, you authorise Litigo Limited to act as your agent in submitting your advance assurance application to HMRC under the Venture Capital Schemes.</p>
            <p className="mt-3">This authorisation is limited to the specific advance assurance application you have submitted through Seisly. It does not give us authority to act on your behalf in any other matter with HMRC.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Your responsibilities</h2>
            <p>You are responsible for:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Ensuring that all information you provide through Seisly is accurate, complete, and not misleading</li>
              <li>Reviewing your application carefully before authorising submission to HMRC</li>
              <li>Uploading all required supporting documents in full</li>
              <li>Informing us promptly if any information changes after submission</li>
              <li>Complying with all SEIS and EIS conditions during the compliance period</li>
            </ul>
            <p className="mt-4">Providing false or misleading information to HMRC is a criminal offence. We accept no liability for applications submitted on the basis of information you have provided that is inaccurate or incomplete.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Refund policy</h2>
            <p>We will provide a full refund if:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>HMRC rejects your advance assurance application and the rejection is due to an error in our preparation of the application (not due to inaccurate information you provided, or your company not qualifying)</li>
              <li>You cancel before we have submitted your application to HMRC</li>
            </ul>
            <p className="mt-4">We will not refund if:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>HMRC rejects your application because your company does not meet the qualifying conditions</li>
              <li>HMRC rejects your application because the information you provided was inaccurate or incomplete</li>
              <li>You change your mind after submission</li>
            </ul>
            <p className="mt-4">To request a refund, contact <a href="mailto:support@seisly.com" className="text-[#0d7a5f]">support@seisly.com</a>.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Our right to decline</h2>
            <p>Seisly reserves the right to decline to proceed with any application at its sole discretion and for any reason. In the event that Seisly exercises this right, a full refund of any fees paid will be issued to the applicant. No further obligation shall arise on the part of Seisly in such circumstances.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">HMRC advance assurance - no guarantee of outcome</h2>
            <p>Seisly prepares and submits advance assurance applications to HMRC on your behalf. We do not guarantee, promise, or represent that any application will be approved by HMRC.</p>
            <p className="mt-3">Advance assurance is a discretionary service provided by HMRC. HMRC is not bound by any previous decisions and may refuse advance assurance even where a company appears to meet all qualifying conditions. HMRC&apos;s decision is final and there is no right of appeal against it.</p>
            <p className="mt-3">Our AI review is designed to identify common issues and improve application quality. It does not constitute a legal opinion on whether your company qualifies for SEIS or EIS, and it may not identify every potential issue with an application.</p>
            <p className="mt-3">HMRC typically takes 4 to 8 weeks to respond to advance assurance applications. We have no control over HMRC processing times.</p>
            <p className="mt-3">The founder remains solely responsible for the accuracy and completeness of all information provided, and for ensuring the company continues to meet all qualifying conditions throughout the compliance period.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Limitation of liability</h2>
            <p>To the fullest extent permitted by law, Litigo Limited&apos;s liability to you in connection with Seisly is limited to the amount you paid for the service.</p>
            <p className="mt-3">We are not liable for any indirect, consequential, or economic loss including loss of investment, loss of tax relief, or loss of business opportunity.</p>
            <p className="mt-3">Nothing in these terms limits our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Intellectual property</h2>
            <p>The Seisly platform, including its design, software, and content, is owned by Litigo Limited. You may not copy, reproduce, or distribute any part of it without our written permission.</p>
            <p className="mt-3">Documents we generate for your application belong to you once paid for and submitted.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Governing law</h2>
            <p>These terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[#1a1a18] mb-3">Changes to these terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes by email. Continued use of Seisly after changes take effect constitutes acceptance of the revised terms.</p>
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
