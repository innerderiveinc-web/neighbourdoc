import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFBF9] flex items-center justify-center p-4">
      <main className="w-full max-w-md rounded-3xl border border-[#D1E6E3] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F3F1] text-2xl font-black text-[#0B4F48]">
          +
        </div>

        <span className="mt-4 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
          त्रुटि 404 (Page Not Found)
        </span>

        <h1 className="mt-3 text-2xl font-black text-[#0F2F2E]">
          यह पेज नहीं मिला
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
          जिस पेज या पर्चे को आप ढूंढ रहे हैं, वह शायद गलत पते पर है, हटा दिया गया है, या टोकन नंबर अमान्य है।
        </p>

        <div className="mt-6 space-y-2.5">
          <Link
            href="/"
            className="block w-full rounded-xl bg-[#0B4F48] py-3 text-xs font-black text-white hover:bg-[#083E38] shadow transition"
          >
            होमपेज पर वापस जाएं &rarr;
          </Link>
          <Link
            href="/#book"
            className="block w-full rounded-xl border border-[#0B4F48] bg-white py-2.5 text-xs font-bold text-[#0B4F48] hover:bg-[#F2F8F7] transition"
          >
            नया डॉक्टर परामर्श लें (₹49)
          </Link>
          <Link
            href="/contact"
            className="block w-full rounded-xl border border-[#CBD5E1] bg-white py-2.5 text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition"
          >
            कस्टमर केयर से संपर्क करें
          </Link>
        </div>

        <p className="mt-6 text-[10px] text-[#94A3B8]">
          NeighborDoc · Powered by Qsura India Pvt. Ltd.
        </p>
      </main>
    </div>
  );
}
