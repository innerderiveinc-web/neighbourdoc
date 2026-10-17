import Link from "next/link";

export const metadata = {
  title: "रिफंड एवं रद्दीकरण नीति (Refund & Cancellation Policy) — NeighborDoc",
  description: "15 मिनट में डॉक्टर का फोन न आने पर 100% तुरंत रिफंड गारंटी। पारदर्शी और सुरक्षित नीति।"
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFBF9] py-12 px-4 sm:px-6">
      <main className="mx-auto max-w-3xl rounded-3xl border border-[#D1E6E3] bg-white p-6 sm:p-10 shadow-sm text-[#1E293B]">
        <Link href="/" className="text-xs font-bold text-[#0B4F48] hover:underline">
          &larr; NeighborDoc होमपेज पर वापस जाएं
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-[#E8F3F1] px-3 py-1 text-xs font-black text-[#0B4F48]">
            100% मनी-बैक गारंटी
          </span>
          <span className="text-xs text-[#64748B]">पारदर्शी नीति</span>
        </div>

        <h1 className="mt-2 text-3xl font-black text-[#0B4F48]">
          रिफंड एवं रद्दीकरण नीति (Refund &amp; Cancellation Policy)
        </h1>
        <p className="mt-2 text-xs text-[#64748B]">
          प्रभावी तिथि: जनवरी 2025 · Qsura India Pvt. Ltd. (क्युसुरा इंडिया प्राइवेट लिमिटेड) द्वारा संचालित
        </p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm leading-relaxed text-[#4A5568]">
          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">1. 15-मिनट SLA कॉलबैक रिफंड गारंटी (15-Minute Callback Guarantee)</h2>
            <p className="mt-1.5">
              NeighborDoc का प्राथमिक संकल्प त्वरित और विश्वसनीय प्राथमिक चिकित्सा सहायता पहुंचाना है। यदि ₹49/₹99 फीस के सफल भुगतान के <strong>15 मिनट के भीतर</strong> हमारे पंजीकृत डॉक्टर किसी आपातकाल या अप्रत्याशित तकनीकी कारण से आपसे संपर्क नहीं कर पाते हैं, तो:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 font-medium text-[#0F2F2E]">
              <li>आपकी <strong>100% पूरी फीस बिना किसी सवाल के</strong> स्वतः रिफंड कर दी जाएगी।</li>
              <li>रिफंड आपके मूल भुगतान माध्यम (UPI, Google Pay, PhonePe, Paytm, या डेबिट कार्ड) में 24 से 48 बैंकिंग घंटों के भीतर क्रेडिट हो जाता है।</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">2. आपातकालीन रेफरल एवं स्वतः रिफंड (Emergency Referral)</h2>
            <p className="mt-1.5">
              यदि डॉक्टर से बातचीत के दौरान या लक्षण समीक्षा में डॉक्टर पाते हैं कि आपकी स्थिति टेलीमेडिसिन के लिए उपयुक्त नहीं है (जैसे असहनीय सीने में दर्द, सांस का गंभीर अवरोध, या तत्काल अस्पताल में भर्ती की आवश्यकता), तो डॉक्टर आपको तुरंत नज़दीकी आपातकालीन कक्ष (112) जाने की सलाह देंगे और <strong>परामर्श शुल्क तुरंत शून्य/रिफंड</strong> कर दिया जाएगा।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">3. मरीज़ द्वारा रद्दीकरण (Cancellation by Patient)</h2>
            <p className="mt-1.5">
              जब तक डॉक्टर आपको कॉल डायल नहीं करते, आप बुकिंग स्क्रीन या कस्टमर सपोर्ट पर संपर्क करके अपनी बुकिंग रद्द कर सकते हैं। कॉल शुरू होने से पहले रद्द करने पर 100% रिफंड देय होगा। एक बार डॉक्टर द्वारा कॉल कनेक्ट होने और परामर्श पूरा हो जाने के बाद फीस नॉन-रिफंडेबल होती है।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">4. रिफंड की समय-सीमा (Processing Timeline)</h2>
            <div className="mt-2 rounded-2xl border border-[#E9ECEF] bg-[#FAFBF9] p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#CBD5E1] text-[#334155] font-bold">
                    <th className="pb-2 text-left">भुगतान माध्यम</th>
                    <th className="pb-2 text-right">रिफंड समय-सीमा</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#475569]">
                  <tr>
                    <td className="py-2">UPI (GPay / PhonePe / Paytm / BHIM)</td>
                    <td className="py-2 text-right font-bold text-[#0B4F48]">तुरंत से 24 घंटे</td>
                  </tr>
                  <tr>
                    <td className="py-2">डेबिट / क्रेडिट कार्ड</td>
                    <td className="py-2 text-right font-bold text-[#0B4F48]">2 से 5 कार्यदिवस</td>
                  </tr>
                  <tr>
                    <td className="py-2">नेटबैंकिंग</td>
                    <td className="py-2 text-right font-bold text-[#0B4F48]">2 से 4 कार्यदिवस</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">5. रिफंड सपोर्ट व सहायता (Refund Support Desk)</h2>
            <p className="mt-1.5">
              यदि आपको अपने रिफंड की स्थिति जाननी है, तो आप अपने बुकिंग टोकन नंबर के साथ हमें ईमेल या WhatsApp कर सकते हैं:
            </p>
            <div className="mt-3 rounded-2xl border border-[#D1E6E3] bg-[#F2F8F7] p-4 text-xs">
              <p><strong>ईमेल:</strong> <span className="font-semibold text-[#0B4F48]">refunds@neighbordoc.in</span></p>
              <p className="mt-1"><strong>कस्टमर केयर:</strong> <span className="font-semibold text-[#0B4F48]">+91 97111 11111</span> (सुबह 8:00 से रात 10:00 बजे तक)</p>
              <p className="mt-1"><strong>संचालक कंपनी:</strong> Qsura India Pvt. Ltd.</p>
            </div>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E9ECEF] flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-block rounded-xl bg-[#0B4F48] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#083E38] transition"
          >
            होमपेज पर जाएं
          </Link>
          <Link
            href="/contact"
            className="inline-block rounded-xl border border-[#CBD5E1] bg-white px-5 py-2.5 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition"
          >
            सपोर्ट से संपर्क करें
          </Link>
        </div>
      </main>
    </div>
  );
}
