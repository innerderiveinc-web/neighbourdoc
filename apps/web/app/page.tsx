import Link from "next/link";
import { getConsultationPrice } from "@neighbourdoc/shared";
import { BookingForm } from "./booking-form";

const verifiedDoctors = [
  {
    name: "डॉ. प्रिया शर्मा",
    degrees: "MBBS (KGMU Lucknow)",
    specialty: "जनरल फिजिशियन · 8+ वर्ष अनुभव",
    regNo: "NMC-LKO-1001",
    languages: "हिंदी, English",
    experience: "8+ वर्ष क्लीनिकल अनुभव (OPD व अस्पताल)",
    badge: "NMC वेरिफाइड फिजिशियन",
    quote: "हमारा संकल्प है कि दवा से पहले सही सलाह मिले, ताकि छोटी तकलीफ़ बड़ी बीमारी न बने।"
  },
  {
    name: "डॉ. राहुल वर्मा",
    degrees: "MBBS, MD (Internal Medicine)",
    specialty: "सीनियर फिजीशियन · 11+ वर्ष अनुभव",
    regNo: "NMC-KNP-1002",
    languages: "हिंदी",
    experience: "11+ वर्ष क्लीनिकल अनुभव (OPD व अस्पताल)",
    badge: "NMC वेरिफाइड कंसल्टेंट",
    quote: "मेडिकल स्टोर से बिना पर्चे के गोलियां खाना खतरनाक है। ₹49 में सही डॉक्टर की राय हर किसी का हक है।"
  }
];

const patientStories = [
  {
    name: "सुनीता देवी",
    place: "अलीगंज, लखनऊ",
    issue: "3 दिन से तेज़ बुखार व खाँसी",
    comment: "सरकारी अस्पताल में 4 घंटे लाइन लगती। NeighbourDoc पर 10 मिनट में डॉक्टर साहिबा का फोन आया, पूरा हाल सुना और सही दवा का पर्चा दिया। बहुत आराम मिला।",
    rating: 5
  },
  {
    name: "अमित कुमार मौर्या",
    place: "ट्रांसपोर्ट नगर, कानपुर",
    issue: "पेट में तेज़ दर्द व उल्टी",
    comment: "केमिस्ट वाला कोई भी दवा दे देता था। यहाँ डॉक्टर ने साफ़ बताया कि क्या खाना है और क्या नहीं। सिर्फ ₹49 में इतना बढ़िया डॉक्टर मिलना सचमुच बड़ी बात है।",
    rating: 5
  },
  {
    name: "मोहम्मद इमरान",
    place: "हज़रतगंज, लखनऊ",
    issue: "मौसम बदलने से गले में दर्द",
    comment: "पर्चा तुरंत WhatsApp पर आ गया, उसी से पास की जन औषधि दुकान से 60% सस्ती दवा ले ली। पूरा परिवार अब यही इस्तेमाल करता है।",
    rating: 5
  }
];

const faqs = [
  {
    q: "क्या ₹49 में सचमुच असली MBBS डॉक्टर बात करेंगे?",
    a: "हाँ, बिल्कुल। NeighbourDoc पर सभी डॉक्टर नेशनल मेडिकल कमीशन (NMC) से रजिस्टर्ड और वेरिफाइड MBBS/MD डॉक्टर हैं। पर्चे पर डॉक्टर का नाम और मेडिकल काउंसिल रजिस्ट्रेशन नंबर लिखा होता है।"
  },
  {
    q: "डॉक्टर मुझसे कैसे और कितनी देर में संपर्क करेंगे?",
    a: "फॉर्म भरने और ₹49 फीस देने के 15 मिनट के अंदर डॉक्टर सीधे आपके दर्ज किए गए मोबाइल नंबर पर नॉर्मल फोन कॉल करेंगे। आपको कोई नया ऐप डाउनलोड करने की ज़रूरत नहीं है।"
  },
  {
    q: "दवा का पर्चा (Prescription) मुझे कहाँ मिलेगा?",
    a: "डॉक्टर से बातचीत पूरी होते ही आपके WhatsApp नंबर और स्क्रीन पर डिजिटल पर्चा भेज दिया जाता है। इस पर्चे को दिखाकर आप भारत के किसी भी मेडिकल स्टोर या जन औषधि केंद्र से दवा ले सकते हैं।"
  },
  {
    q: "क्या सभी प्रकार की दवाइयां ऑनलाइन लिखी जा सकती हैं?",
    a: "नहीं। राष्ट्रीय टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स 2020 के अनुसार केवल सामान्य, गैर-आपातकालीन व सुरक्षित दवाएं (List O व List A) ही लिखी जा सकती हैं। नींद की गोलियां, नशीली दवाएं (Schedule X), आदत डालने वाली दवाएं और इंजेक्टेबल्स ऑनलाइन लिखना कानूनन प्रतिबंधित है।"
  },
  {
    q: "अगर 15 मिनट में डॉक्टर का कॉल न आए तो क्या होगा?",
    a: "अगर किसी आपातकाल या तकनीकी कारण से डॉक्टर 15 मिनट में संपर्क नहीं कर पाते, तो आपकी पूरी फीस बिना किसी सवाल के तुरंत आपके बैंक खाते/UPI में वापस कर दी जाती है।"
  }
];

export default function PatientHome() {
  const basicPrice = getConsultationPrice("basic");
  const priorityPrice = getConsultationPrice("priority");

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#1E293B]">
      {/* Top Notice Bar */}
      <div className="bg-[#0B4F48] text-[#E8F3F1] py-2 px-4 text-xs font-semibold text-center">
        <span>🇮🇳 भारत सरकार की टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स 2020 के तहत प्रमाणित एवं सुरक्षित</span>
        <span className="mx-2 hidden sm:inline">·</span>
        <span className="hidden sm:inline">प्राथमिक स्वास्थ्य परामर्श एवं डिजिटल पर्चा (OPD Teleconsultation)</span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#EBECEF] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0B4F48] text-white font-black text-xl shadow-sm">
              +
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-[#0B4F48]">NeighbourDoc</p>
              <p className="text-[11px] font-bold text-[#107569] leading-none">आपका अपना डिजिटल फैमिली डॉक्टर</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#64748B]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              RMP डॉक्टर ऑन-ड्यूटी उपलब्ध
            </div>
            <a
              href="#book"
              className="rounded-xl bg-[#0B4F48] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#083E38] transition"
            >
              परामर्श लें (₹49)
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* Hero Left Content */}
            <div>
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F3F1] px-3.5 py-1.5 text-xs font-bold text-[#0B4F48]">
                <span>✓ NMC वेरिफाइड MBBS डॉक्टर</span>
                <span>·</span>
                <span>15 मिनट में सीधा फोन कॉल</span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#0F2F2E] sm:text-5xl lg:text-[52px] lg:leading-[1.15]">
                घर बैठे डॉक्टर से सही सलाह लें —{" "}
                <span className="text-[#0B4F48] underline decoration-[#107569]/30 decoration-wavy">
                  सिर्फ 15 मिनट में
                </span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-[#4A5568] sm:text-lg">
                मौसम का बुखार हो, खांसी, पेट दर्द या त्वचा की तकलीफ़ — अस्पताल की लंबी कतारों और केमिस्ट की अधूरी सलाह से बचें। अपने फोन पर सीधे MBBS डॉक्टर से बात करें और तुरंत मान्य डिजिटल पर्चा (Rx) पाएं।
              </p>

              {/* Core USPs Grid */}
              <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
                  <div className="text-xl">⏱️</div>
                  <p className="mt-1 text-sm font-black text-[#0F2F2E]">15 मिनट में कॉलबैक</p>
                  <p className="text-xs text-[#64748B]">लंबा इंतज़ार नहीं, तुरंत फोन पर बात</p>
                </div>
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
                  <div className="text-xl">💰</div>
                  <p className="mt-1 text-sm font-black text-[#0F2F2E]">सिर्फ ₹49 फीस</p>
                  <p className="text-xs text-[#64748B]">चाय-नाश्ते से भी कम खर्च में डॉक्टर</p>
                </div>
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
                  <div className="text-xl">📄</div>
                  <p className="mt-1 text-sm font-black text-[#0F2F2E]">मान्य डिजिटल पर्चा</p>
                  <p className="text-xs text-[#64748B]">WhatsApp व SMS पर कानूनी Rx</p>
                </div>
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
                  <div className="text-xl">🗣️</div>
                  <p className="mt-1 text-sm font-black text-[#0F2F2E]">अपनी भाषा में बात</p>
                  <p className="text-xs text-[#64748B]">हिंदी, English व क्षेत्रीय भाषाएं</p>
                </div>
              </div>

              {/* Doctor Endorsement Quote */}
              <div className="mt-8 rounded-2xl border border-[#D1E6E3] bg-[#F2F8F7] p-4 text-xs text-[#0F2F2E] flex items-center gap-3.5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#0B4F48] text-white font-bold text-base">
                  👨‍⚕️
                </div>
                <div>
                  <p className="font-bold">
                    &ldquo;बिना डॉक्टर की सलाह के मेडिकल स्टोर से एंटीबायोटिक या पेनकिलर खाना सेहत के लिए घातक है। ₹49 में डॉक्टर की सही सलाह आपका हक़ है।&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#107569]">
                    — डॉ. राहुल वर्मा, MBBS, MD (सीनियर कंसल्टेंट)
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Right Booking Form */}
            <div id="book">
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="border-t border-[#EBECEF] bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B4F48] bg-[#E8F3F1] px-3 py-1 rounded-full">
              आसान और पारदर्शी प्रक्रिया
            </span>
            <h2 className="mt-3 text-3xl font-black text-[#0F2F2E] sm:text-4xl">
              NeighbourDoc कैसे काम करता है?
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              कोई ऐप डाउनलोड नहीं, कोई झंझट नहीं — बस 3 आसान कदम:
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="relative rounded-3xl border border-[#E9ECEF] bg-[#FAFBF9] p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0B4F48] text-white font-black text-sm">
                1
              </span>
              <h3 className="mt-4 text-lg font-black text-[#0F2F2E]">तकलीफ़ व लक्षण बताएं</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
                ऊपर दिए गए फॉर्म में मरीज़ का नाम, फोन नंबर और जो भी तकलीफ़ है (जैसे बुखार, सिरदर्द, पेट में दर्द) संक्षेप में लिखें।
              </p>
            </div>

            <div className="relative rounded-3xl border border-[#E9ECEF] bg-[#FAFBF9] p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0B4F48] text-white font-black text-sm">
                2
              </span>
              <h3 className="mt-4 text-lg font-black text-[#0F2F2E]">सिर्फ ₹49 फीस जमा करें</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
                PhonePe, Google Pay, Paytm या किसी भी UPI से सुरक्षित ₹49 फीस का भुगतान करें। तुरंत बुकिंग टोकन मिल जाएगा।
              </p>
            </div>

            <div className="relative rounded-3xl border border-[#E9ECEF] bg-[#FAFBF9] p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0B4F48] text-white font-black text-sm">
                3
              </span>
              <h3 className="mt-4 text-lg font-black text-[#0F2F2E]">डॉक्टर 15 मिनट में कॉल करेंगे</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
                MBBS डॉक्टर सीधे आपके नंबर पर कॉल करके हाल पूछेंगे। बातचीत के बाद आधिकारिक पर्चा WhatsApp पर मिल जाएगा।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: NeighbourDoc vs Chemist Counter */}
      <section className="py-16 bg-[#F4F7F6]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-[#0F2F2E]">
              केमिस्ट से बिना पर्चे की दवा बनाम NeighbourDoc
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              जानिए क्यों छोटी बीमारी में भी डॉक्टर की राय लेना आपके परिवार के लिए सुरक्षित है
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-[#D1E6E3] bg-white shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b bg-[#FAFBF9] text-xs font-black uppercase text-[#475569]">
                <tr>
                  <th className="p-4 sm:p-5">सुविधा / सुरक्षा</th>
                  <th className="p-4 sm:p-5 text-red-700 bg-red-50/50">मेडिकल स्टोर से दवा</th>
                  <th className="p-4 sm:p-5 text-[#0B4F48] bg-[#E8F3F1]">NeighbourDoc डॉक्टर</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#1E293B]">परामर्श देने वाला कौन है?</td>
                  <td className="p-4 sm:p-5 text-red-600 bg-red-50/20">दुकानदार / सेल्समैन (बिना मेडिकल डिग्री)</td>
                  <td className="p-4 sm:p-5 font-bold text-[#0B4F48] bg-[#E8F3F1]/40">NMC वेरिफाइड MBBS डॉक्टर</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#1E293B]">गलत दवा या साइड-इफ़ेक्ट का खतरा</td>
                  <td className="p-4 sm:p-5 text-red-600 bg-red-50/20">बहुत अधिक (एंटीबायोटिक का गलत इस्तेमाल)</td>
                  <td className="p-4 sm:p-5 font-bold text-[#0B4F48] bg-[#E8F3F1]/40">न्यूनतम व नियंत्रित (उम्र, वज़न व एलर्जी की समीक्षा के बाद सुरक्षित खुराक)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#1E293B]">खर्च</td>
                  <td className="p-4 sm:p-5 text-[#64748B] bg-red-50/20">₹150-₹300 (अक्सर महंगी ब्रांडेड दवाइयां)</td>
                  <td className="p-4 sm:p-5 font-bold text-[#0B4F48] bg-[#E8F3F1]/40">₹49 फीस + सस्ती जन औषधि दवाइयां</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#1E293B]">कानूनी डिजिटल पर्चा (Rx)</td>
                  <td className="p-4 sm:p-5 text-red-600 bg-red-50/20">नहीं मिलता</td>
                  <td className="p-4 sm:p-5 font-bold text-[#0B4F48] bg-[#E8F3F1]/40">तुरंत WhatsApp व PDF पर उपलब्ध</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Verified Doctors Profiles */}
      <section className="py-16 bg-white border-t border-[#EBECEF]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B4F48] bg-[#E8F3F1] px-3 py-1 rounded-full">
              हमारे समर्पित चिकित्सक
            </span>
            <h2 className="mt-3 text-3xl font-black text-[#0F2F2E]">
              मिलिए अपने NeighbourDoc चिकित्सकों से
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              सभी डॉक्टर पूरी तरह जाँचे-परखे और भारत के प्रतिष्ठित मेडिकल कॉलेजों से प्रशिक्षित हैं
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {verifiedDoctors.map((doc) => (
              <div
                key={doc.regNo}
                className="rounded-3xl border border-[#E9ECEF] bg-[#FAFBF9] p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-[#0F2F2E]">{doc.name}</h3>
                      <p className="text-xs font-bold text-[#0B4F48]">{doc.degrees}</p>
                      <p className="mt-0.5 text-xs text-[#64748B]">{doc.specialty}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                      {doc.badge}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-[#475569] bg-white p-3 rounded-2xl border border-[#E9ECEF]">
                    <div>
                      <span className="font-bold text-[#64748B]">रजिस्ट्रेशन नंबर:</span>
                      <p className="font-mono font-bold text-[#0F2F2E]">{doc.regNo}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#64748B]">परामर्श भाषा:</span>
                      <p className="font-bold text-[#0F2F2E]">{doc.languages}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs italic text-[#4A5568] leading-relaxed">
                    &ldquo;{doc.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E9ECEF] flex items-center justify-between text-xs text-[#64748B]">
                  <span>{doc.experience}</span>
                  <a href="#book" className="font-bold text-[#0B4F48] hover:underline">
                    इनसे परामर्श लें &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patient Testimonials */}
      <section className="py-16 bg-[#FAFBF9] border-t border-[#EBECEF]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-[#0F2F2E]">
              मरीज़ों का अनुभव और भरोसा
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              पायलट ट्रायल्स व शुरुआती उपयोगकर्ताओं का वास्तविक अनुभव (Community Feedback)
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {patientStories.map((story) => (
              <div
                key={story.name}
                className="rounded-3xl border border-[#E9ECEF] bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    {"★".repeat(story.rating)}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#0B4F48] bg-[#F0F7F6] px-2.5 py-1 rounded-lg inline-block">
                    तकलीफ़: {story.issue}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[#4A5568]">
                    &ldquo;{story.comment}&rdquo;
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F1F5F9]">
                  <p className="text-sm font-black text-[#0F2F2E]">{story.name}</p>
                  <p className="text-[11px] text-[#64748B]">{story.place}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Guidance Section */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-[#FECDD3] bg-[#FFF1F2] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-block rounded-full bg-[#FFE4E6] px-3 py-1 text-xs font-black uppercase text-[#9F1239]">
                इमरजेंसी / गंभीर मामलों की चेतावनी
              </span>
              <h3 className="mt-2 text-xl font-black text-[#881337]">
                कब ऑनलाइन डॉक्टर के बजाय सीधे अस्पताल जाएं?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#9F1239]">
                छाती में असहनीय दबाव या दर्द, सांस लेने में अत्यंत कठिनाई, अचानक बेहोशी, गंभीर रक्तस्राव, लकवे (Stroke) के लक्षण, या गंभीर दुर्घटना के मामलों में टेलीमेडिसिन सुरक्षित नहीं है। ऐसे समय पर तुरंत <strong>112 डायल करें</strong> या एम्बुलेंस बुलाकर नज़दीकी आपातकालीन कक्ष (Emergency Room) में जाएं।
              </p>
            </div>
            <a
              href="tel:112"
              className="rounded-2xl bg-[#BE123C] px-6 py-3.5 text-xs font-black text-white hover:bg-[#9F1239] transition shadow"
            >
              📞 112 इमरजेंसी कॉल
            </a>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 bg-white border-t border-[#EBECEF]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-black text-[#0F2F2E]">
              अक्सर पूछे जाने वाले सवाल (FAQ)
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              अगर आपके मन में कोई संदेह है, तो यहाँ आपके सवालों के सीधे जवाब हैं
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-[#E9ECEF] bg-[#FAFBF9] p-5 shadow-sm"
              >
                <h4 className="text-sm font-black text-[#0F2F2E]">{faq.q}</h4>
                <p className="mt-2 text-xs leading-relaxed text-[#4A5568]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EBECEF] bg-[#FAFBF9] py-12 text-xs text-[#64748B]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-[#E9ECEF] pb-8">
            <div>
              <p className="text-lg font-black text-[#0B4F48]">NeighbourDoc</p>
              <p className="text-xs text-[#64748B]">सुलभ, विश्वसनीय व किफ़ायती प्राथमिक स्वास्थ्य परामर्श</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-[#0B4F48]">
              <Link href="/privacy" className="hover:underline">प्राइवेसी पॉलिसी</Link>
              <Link href="/terms" className="hover:underline">नियम एवं शर्तें</Link>
              <Link href="/refunds" className="hover:underline">रिफंड नीति</Link>
              <Link href="/contact" className="hover:underline">संपर्क व सहायता</Link>
            </div>
          </div>

          <div className="mt-6 text-[11px] leading-relaxed text-[#94A3B8]">
            <p>
              <strong>अस्वीकरण (Medical Disclaimer):</strong> NeighbourDoc भारत सरकार के स्वास्थ्य एवं परिवार कल्याण मंत्रालय द्वारा जारी टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स (2020) के अधीन संचालित होता है। यह सेवा सामान्य प्राथमिक परामर्श (Primary Triage) के लिए है और किसी भी गंभीर आपात स्थिति का विकल्प नहीं है। नशीली दवाएं (Schedule X) ऑनलाइन नहीं लिखी जाती हैं।
            </p>
            <p className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span>© {new Date().getFullYear()} NeighbourDoc Healthcare Network. All rights reserved.</span>
              <span className="font-semibold text-[#0B4F48]">
                Developed &amp; Powered by <strong>Qsura India Pvt. Ltd.</strong>
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
