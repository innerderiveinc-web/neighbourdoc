"use client";

import React, { useState } from "react";

interface EmergencyAlertBannerProps {
  matchedTerms: string[];
}

export function EmergencyAlertBanner({ matchedTerms }: EmergencyAlertBannerProps) {
  const [showFirstAid, setShowFirstAid] = useState(false);

  return (
    <div className="mt-3 rounded-2xl border-2 border-red-500 bg-red-50 p-4 shadow-md">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🚨</span>
        <div className="flex-1">
          <h4 className="text-sm font-black text-red-900">
            आपातकालीन संकेत मिले: {matchedTerms.join(", ")}
          </h4>
          <p className="mt-1 text-xs text-red-800 leading-relaxed">
            यह स्थिति गंभीर या जानलेवा हो सकती है। भारत सरकार के टेलीमेडिसिन दिशा-निर्देशों के अनुसार इसके लिए तत्काल अस्पताल जाना अनिवार्य है।
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-black text-white hover:bg-red-700 shadow transition"
            >
              📞 112 डायल करें (Emergency)
            </a>
            <a
              href="tel:108"
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-2 text-xs font-black text-white hover:bg-red-800 shadow transition"
            >
              🚑 108 डायल करें (Ambulance)
            </a>
            <a
              href="tel:1800116117"
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-800 hover:bg-red-100 transition"
            >
              🧪 1800-116-117 (विषाक्तता केंद्र)
            </a>
          </div>

          <button
            type="button"
            onClick={() => setShowFirstAid(!showFirstAid)}
            className="mt-3 text-xs font-bold text-red-700 underline hover:text-red-900 block"
          >
            {showFirstAid ? "▲ प्राथमिक उपचार निर्देश छुपाएं" : "▼ आपातकालीन प्राथमिक उपचार (First Aid) देखें"}
          </button>

          {showFirstAid && (
            <div className="mt-2.5 rounded-xl bg-white p-3 border border-red-200 text-xs text-red-950 space-y-1.5">
              <p>
                <strong>सीने में दर्द या भारीपन:</strong> मरीज को शांत बैठाएं, तंग कपड़े तुरंत ढीले करें।
              </p>
              <p>
                <strong>सांस लेने में तकलीफ़:</strong> मरीज को तकिए के सहारे 45 डिग्री पर बैठाएं।
              </p>
              <p>
                <strong>बेहोशी या दौरा:</strong> मरीज को बाएं करवट लिटाएं (Recovery Position), मुंह में कुछ न डालें।
              </p>
              <p>
                <strong>सांप का काटना:</strong> काटे अंग को स्थिर रखें, पट्टी अधिक कसकर न बांधें, तुरंत अस्पताल पहुंचें।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
