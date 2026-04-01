import Link from "next/link";

export default function EligibilityPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-serif text-3xl mb-2">
          Seis<span className="text-[#0d7a5f]">ly</span>
        </div>
        <p className="text-[11px] text-[#aaa] tracking-wide mb-10">Seisly done.</p>
        <h1 className="font-serif text-4xl mb-4 tracking-tight">
          Eligibility checker<br />
          <em className="text-[#0d7a5f]">coming soon.</em>
        </h1>
        <p className="text-[#666] text-sm leading-relaxed mb-8">
          We are building the eligibility checker right now. Leave your email and we will let you know the moment it is ready.
        </p>
        <form className="flex gap-2 mb-6">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 border border-[#e8e8e4] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0d7a5f] bg-white"
          />
          <button
            type="submit"
            className="bg-[#0d7a5f] text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-[#0a5c47] transition-colors"
          >
            Notify me
          </button>
        </form>
        <Link href="/" className="text-sm text-[#aaa] hover:text-[#1a1a18] transition-colors">
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
