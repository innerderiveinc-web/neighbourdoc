"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAFBF9] py-12 px-4 sm:px-6">
      <main className="mx-auto max-w-4xl rounded-3xl border border-[#D1E6E3] bg-white p-6 sm:p-10 shadow-sm text-[#1E293B]">
        <Link href="/" className="text-xs font-bold text-[#0B4F48] hover:underline">
          &larr; NeighbourDoc होमपेज पर वापस जाएं
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-[#E8F3F1] px-3 py-1 text-xs font-black text-[#0B4F48]">
            कस्टमर केयर व सहायता
          </span>
          <span className="text-xs text-[#64748B]">8:00 AM - 10:00 PM IST</span>
        </div>

        <h1 className="mt-2 text-3xl font-black text-[#0B4F48]">
          संपर्क करें व शिकायत निवारण (Contact &amp; Grievance)
        </h1>
        <p className="mt-2 text-xs text-[#64748B]">
          NeighbourDoc एक टेलीहेल्थ पहल है, जिसका संचालन <strong>Qsura India Pvt. Ltd. (क्युसुरा इंडिया प्राइवेट लिमिटेड)</strong> द्वारा किया जाता है।
        </p>

        {/* Emergency Notice */}
        <div className="mt-6 rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-xs text-[#9F1239]">
          <p className="font-black text-sm text-[#BE123C]">⚠️ मेडिकल इमरजेंसी सूचना (Medical Emergency):</p>
          <p className="mt-1 leading-relaxed">
            यदि आपको या आपके किसी परिजन को सीने में तेज दर्द, सांस लेने में अत्यंत कठिनाई, अचानक बेहोशी, या गंभीर दुर्घटना हुई है, तो कृपया ऑनलाइन सहायता का इंतज़ार न करें। <strong>तुरंत 112 डायल करें या नज़दीकी अस्पताल के आपातकालीन कक्ष (ER) में जाएं।</strong>
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Support Channels */}
          <div className="rounded-2xl border border-[#E9ECEF] bg-[#FAFBF9] p-5 shadow-sm">
            <h2 className="text-base font-black text-[#0F2F2E]">मरीज़ सहायता केंद्र (Patient Helpdesk)</h2>
            <p className="mt-1 text-xs text-[#64748B]">परामर्श बुकिंग, डॉक्टर कॉलबैक या पर्चे से जुड़े प्रश्नों के लिए:</p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-base">📞</span>
                <div>
                  <p className="font-bold text-[#0F2F2E]">हेल्पलाइन नंबर:</p>
                  <p className="font-mono font-bold text-[#0B4F48]">+91 97111 11111</p>
                  <p className="text-[10px] text-[#64748B]">प्रतिदिन सुबह 8:00 से रात 10:00 बजे तक</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-base">💬</span>
                <div>
                  <p className="font-bold text-[#0F2F2E]">WhatsApp सहायता:</p>
                  <p className="font-mono font-bold text-[#0B4F48]">+91 97111 11111</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-base">✉️</span>
                <div>
                  <p className="font-bold text-[#0F2F2E]">सामान्य ईमेल:</p>
                  <p className="font-semibold text-[#0B4F48]">support@neighbourdoc.in</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-base">💰</span>
                <div>
                  <p className="font-bold text-[#0F2F2E]">रिफंड डेस्क:</p>
                  <p className="font-semibold text-[#0B4F48]">refunds@neighbourdoc.in</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grievance & Corporate Entity */}
          <div className="rounded-2xl border border-[#E9ECEF] bg-[#FAFBF9] p-5 shadow-sm">
            <h2 className="text-base font-black text-[#0F2F2E]">शिकायत निवारण अधिकारी (Grievance Officer)</h2>
            <p className="mt-1 text-xs text-[#64748B]">डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) एक्ट एवं टेलीमेडिसिन दिशा-निर्देश:</p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="font-bold text-[#0F2F2E]">शिकायत अधिकारी का पदनाम:</p>
                <p className="text-[#334155]">Grievance &amp; Compliance Officer</p>
              </div>

              <div>
                <p className="font-bold text-[#0F2F2E]">ईमेल:</p>
                <p className="font-semibold text-[#0B4F48]">grievance@neighbourdoc.in</p>
                <p className="text-[10px] text-[#64748B]">सभी शिकायतों का 48 घंटे के भीतर समाधान</p>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0]">
                <p className="font-bold text-[#0F2F2E]">कॉर्पोरेट मुख्यालय (Corporate Office):</p>
                <p className="mt-0.5 text-[#475569] leading-relaxed">
                  <strong>Qsura India Pvt. Ltd.</strong>
                  <br />
                  टेक्नोलॉजी व ऑपरेशंस हब,
                  <br />
                  भारत (India)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Message Form */}
        <div className="mt-8 rounded-2xl border border-[#D1E6E3] bg-[#F2F8F7] p-5">
          <h3 className="text-sm font-black text-[#0F2F2E]">हमें संदेश भेजें (Leave a Message)</h3>
          <p className="text-xs text-[#64748B] mt-0.5">क्या आपके पास कोई सवाल या सुझाव है? हमारी टीम आपसे 2 घंटे में संपर्क करेगी।</p>

          <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); alert("धन्यवाद! आपका संदेश प्राप्त हो गया है। हमारी टीम जल्द संपर्क करेगी।"); }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                type="text"
                placeholder="आपका नाम"
                className="rounded-xl border border-[#CBD5E1] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#0B4F48] focus:outline-none"
              />
              <input
                required
                type="tel"
                placeholder="मोबाइल नंबर (+91)"
                className="rounded-xl border border-[#CBD5E1] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#0B4F48] focus:outline-none"
              />
            </div>
            <textarea
              required
              rows={3}
              placeholder="आपका संदेश या समस्या का विवरण..."
              className="w-full rounded-xl border border-[#CBD5E1] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#0B4F48] focus:outline-none"
            ></textarea>
            <button
              type="submit"
              className="rounded-xl bg-[#0B4F48] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#083E38] transition shadow"
            >
              संदेश भेजें &rarr;
            </button>
          </form>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E9ECEF] flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-block rounded-xl bg-[#0B4F48] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#083E38] transition"
          >
            होमपेज पर जाएं
          </Link>
          <Link
            href="/refunds"
            className="inline-block rounded-xl border border-[#CBD5E1] bg-white px-5 py-2.5 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition"
          >
            रिफंड नीति पढ़ें
          </Link>
        </div>
      </main>
    </div>
  );
}
