import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFBF9] flex items-center justify-center p-4">
      <main className="w-full max-w-md rounded-3xl border border-[#D1E6E3] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3F1] text-2xl font-black text-[#0B4F48]">
          👨‍⚕️
        </div>
        <h1 className="mt-3 text-xl font-black text-[#0F2F2E]">पेज उपलब्ध नहीं है</h1>
        <p className="mt-1 text-xs text-[#64748B]">डॉक्टर क्लिनिक कंसोल पर वापस जाने के लिए नीचे क्लिक करें।</p>
        <div className="mt-6">
          <Link
            href="/"
            className="block w-full rounded-xl bg-[#0B4F48] py-2.5 text-xs font-bold text-white hover:bg-[#083E38] transition"
          >
            डॉक्टर डैशबोर्ड खोलें &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
