import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFBF9] py-12 px-4 sm:px-6">
      <main className="mx-auto max-w-3xl rounded-3xl border border-[#D1E6E3] bg-white p-6 sm:p-10 shadow-sm text-[#1E293B]">
        <Link href="/" className="text-xs font-bold text-[#0B4F48] hover:underline">
          &larr; NeighborDoc होमपेज पर वापस जाएं
        </Link>

        <h1 className="mt-4 text-3xl font-black text-[#0B4F48]">
          नियम एवं चिकित्सीय अस्वीकरण (Terms &amp; Medical Disclaimer)
        </h1>
        <p className="mt-2 text-xs text-[#64748B]">
          टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स (2020), स्वास्थ्य एवं परिवार कल्याण मंत्रालय, भारत सरकार
        </p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm leading-relaxed text-[#4A5568]">
          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">1. सेवा का स्वरूप (Nature of Service)</h2>
            <p className="mt-1.5">
              NeighborDoc भारत के नागरिकों को सामान्य बीमारियों के लिए प्राथमिक टेली-परामर्श (Primary Teleconsultation) की सुविधा देता है। यह सेवा सामान्य लक्षणों जैसे बुखार, सर्दी-जुकाम, खांसी, सिरदर्द, सामान्य पेट दर्द, त्वचा संक्रमण व प्राथमिक स्वास्थ्य सलाह के लिए है।
            </p>
          </section>

          <section className="rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-[#9F1239]">
            <h2 className="text-sm font-black text-[#BE123C]">
              ⚠️ 2. आपातकालीन स्थिति के लिए अस्वीकरण (Emergency Disclaimer)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#9F1239]">
              NeighborDoc किसी भी गंभीर आपातकाल (Emergency) का विकल्प नहीं है। यदि मरीज़ को छाती में तेज दर्द या दबाव, सांस लेने में अत्यंत रुकावट, अचानक बेहोशी, अनियंत्रित रक्तस्राव, लकवा, गंभीर दौरे या दुर्घटना की स्थिति हो, तो <strong>ऑनलाइन परामर्श का प्रयास न करें। तुरंत 112 डायल करें या नज़दीकी अस्पताल के आपातकालीन विभाग में जाएं।</strong>
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">3. डॉक्टर की योग्यता व सत्यापन</h2>
            <p className="mt-1.5">
              NeighborDoc पर उपलब्ध सभी डॉक्टर नेशनल मेडिकल कमीशन (NMC) अथवा संबंधित राज्य मेडिकल काउंसिल द्वारा प्रमाणित MBBS या पोस्ट-ग्रेजुएट डॉक्टर हैं। हर पर्चे पर डॉक्टर का नाम, योग्यता और काउंसिल रजिस्ट्रेशन नंबर दर्ज होता है।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">4. दवाओं की सीमाएं (Prescription Restrictions)</h2>
            <p className="mt-1.5">
              भारत के टेलीमेडिसिन कानून के तहत डॉक्टर केवल सामान्य व सुरक्षित दवाएं (जैसे लिस्ट O व लिस्ट A की दवाएं) ही ऑनलाइन लिख सकते हैं। नशीली दवाइयां, नींद की भारी गोलियां (Schedule X) या आदत डालने वाली दवाएं ऑनलाइन नहीं लिखी जा सकती हैं।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">5. 15 मिनट कॉलबैक व रिफंड गारंटी</h2>
            <p className="mt-1.5">
              हम 15 मिनट के अंदर डॉक्टर का कॉलबैक सुनिश्चित करते हैं। यदि किसी अप्रत्याशित कारण से डॉक्टर 15 मिनट में आपसे संपर्क नहीं कर पाते, तो आप पूरा रिफंड पाने के हकदार हैं, जो आपके मूल भुगतान माध्यम में तुरंत वापस कर दिया जाएगा।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">6. स्वामित्व व तकनीकी विकास (Ownership &amp; Technology)</h2>
            <p className="mt-1.5">
              NeighborDoc टेलीहेल्थ प्लेटफॉर्म एवं संबंधित सॉफ़्टवेयर सिस्टम का पूर्ण स्वामित्व, इंजीनियरिंग व संचालन <strong>Qsura India Pvt. Ltd. (क्युसुरा इंडिया प्राइवेट लिमिटेड)</strong> द्वारा किया जाता है।
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E9ECEF]">
          <Link
            href="/"
            className="inline-block rounded-xl bg-[#0B4F48] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#083E38] transition"
          >
            होमपेज पर जाएं
          </Link>
        </div>
      </main>
    </div>
  );
}
