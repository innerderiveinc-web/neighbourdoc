import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAFBF9] py-12 px-4 sm:px-6">
      <main className="mx-auto max-w-3xl rounded-3xl border border-[#D1E6E3] bg-white p-6 sm:p-10 shadow-sm text-[#1E293B]">
        <Link href="/" className="text-xs font-bold text-[#0B4F48] hover:underline">
          &larr; NeighbourDoc होमपेज पर वापस जाएं
        </Link>

        <h1 className="mt-4 text-3xl font-black text-[#0B4F48]">
          गोपनीयता नीति (Privacy Policy)
        </h1>
        <p className="mt-2 text-xs text-[#64748B]">
          अंतिम नवीनीकरण: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} · भारत सरकार के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP) एवं टेलीमेडिसिन नियमों के अनुरूप
        </p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm leading-relaxed text-[#4A5568]">
          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">1. हमारी प्रतिबद्धता (Our Commitment)</h2>
            <p className="mt-1.5">
              NeighbourDoc पर हम समझते हैं कि आपकी सेहत और बीमारी से जुड़ी जानकारी अत्यंत व्यक्तिगत और संवेदनशील होती है। हम आपके द्वारा साझा किए गए हर एक विवरण (जैसे नाम, फोन नंबर, उम्र, लक्षण और डॉक्टरों द्वारा जारी पर्चे) की सुरक्षा व गोपनीयता को भारत सरकार के DPDP अधिनियम (डिजिटल पर्सनल डेटा प्रोटेक्शन एक्ट 2023) और टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स के तहत उच्चतम चिकित्सा मानकों व एंड-टू-एंड एन्क्रिप्शन के साथ सुरक्षित रखते हैं।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">2. हम कौन-सी जानकारी एकत्र करते हैं?</h2>
            <ul className="mt-1.5 list-disc pl-5 space-y-1">
              <li><strong>व्यक्तिगत पहचान:</strong> नाम, संपर्क मोबाइल नंबर, उम्र, लिंग और शहर/कस्बा ताकि डॉक्टर आपसे संपर्क कर सकें।</li>
              <li><strong>स्वास्थ्य विवरण:</strong> आपके द्वारा बताए गए लक्षण, पुरानी बीमारियां या मौजूदा दवाइयां जो डॉक्टर को सही निदान में मदद करती हैं।</li>
              <li><strong>परामर्श रिकॉर्ड:</strong> डॉक्टर से बातचीत का समय, जारी किया गया डिजिटल पर्चा (Rx) और दी गई चिकित्सकीय सलाह।</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">3. जानकारी का सुरक्षित उपयोग</h2>
            <p className="mt-1.5">
              आपकी जानकारी का उपयोग केवल और केवल आपको स्वास्थ्य परामर्श प्रदान करने, WhatsApp/SMS पर पर्चा भेजने और आपकी अनुमति से फ़ॉलो-अप देखभाल के लिए किया जाता है। <strong>हम आपका डेटा किसी भी विज्ञापनदाता या तीसरे पक्ष को कभी नहीं बेचते हैं।</strong>
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">4. मेडिकल रिकॉर्ड्स का एक्सेस और सुरक्षा</h2>
            <p className="mt-1.5">
              आपका डिजिटल पर्चा सिर्फ आपको और आपके असाइंड डॉक्टर को ही दिखाई देता है। सभी मेडिकल डेटा 256-बिट एन्क्रिप्शन के साथ सुरक्षित सर्वरों पर रखा जाता है और टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स 2020 के कानूनी प्रावधानों का कड़ाई से पालन किया जाता है।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">5. डेटा फिड्यूशरी व कॉर्पोरेट स्वामित्व (Data Fiduciary &amp; Ownership)</h2>
            <p className="mt-1.5">
              DPDP अधिनियम 2023 के तहत NeighbourDoc प्लेटफॉर्म का संचालन और डेटा प्रबंधन <strong>Qsura India Pvt. Ltd. (क्युसुरा इंडिया प्राइवेट लिमिटेड)</strong> द्वारा किया जाता है। सभी डेटा सुरक्षा व गोपनीयता नीतियां Qsura India Pvt. Ltd. द्वारा सीधे नियंत्रित और सुरक्षित रखी जाती हैं।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">6. डेटा मिटाने का अधिकार (Right to Erasure &amp; Medical Retention)</h2>
            <p className="mt-1.5">
              डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 (DPDP) के तहत मरीजों को अपनी व्यक्तिगत पहचान संबंधी जानकारी को मिटाने (Right to Erasure / Anonymization) का अधिकार प्राप्त है। टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स 2020 के कानूनी अनुपालन अनुसार क्लीनिकल रिकॉर्ड्स 3 वर्षों तक ऑडिट हेतु सुरक्षित रखे जाते हैं, जबकि व्यक्तिगत फोन नंबर, नाम व पहचान को मरीज के अनुरोध पर तत्काल एनोनिमाइज (गुमनाम) कर दिया जाता है। डेटा विलोपन अनुरोध ऐप सेटिंग्स से अथवा <span className="font-semibold text-[#0B4F48]">privacy@neighbourdoc.in</span> पर भेजा जा सकता है।
            </p>
          </section>

          <section>
            <h2 className="text-base font-black text-[#0F2F2E]">7. संपर्क व शिकायत निवारण (Grievance Officer)</h2>
            <p className="mt-1.5">
              यदि आपकी निजता को लेकर कोई भी प्रश्न या शिकायत हो, तो आप Qsura India Pvt. Ltd. की ग्रीवेंस टीम से संपर्क कर सकते हैं:
              <br />
              ईमेल: <span className="font-semibold text-[#0B4F48]">privacy@neighbourdoc.in</span>
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
