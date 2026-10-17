import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFBF9] flex items-center justify-center p-4">
      <main className="w-full max-w-md rounded-3xl border border-[#CBD5E1] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-700">
          🔒
        </div>
        <h1 className="mt-3 text-xl font-black text-[#0F172A]">एडमिन रूट नहीं मिला</h1>
        <p className="mt-1 text-xs text-[#64748B]">ऑपरेशंस कंसोल पर वापस जाने के लिए नीचे क्लिक करें।</p>
        <div className="mt-6">
          <Link
            href="/"
            className="block w-full rounded-xl bg-[#0F172A] py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            एडमिन डैशबोर्ड खोलें &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
