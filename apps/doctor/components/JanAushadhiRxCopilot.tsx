"use client";

import React, { useMemo } from "react";
import { PrimaryButton, Surface } from "@neighbourdoc/ui";
import {
  findJanAushadhiEquivalents,
  validatePrescriptionDrugs,
  JAN_AUSHADHI_CATALOG,
  type JanAushadhiMedicine
} from "@neighbourdoc/shared";

interface JanAushadhiRxCopilotProps {
  medicines: string;
  advice: string;
  medSearch: string;
  canComplete: boolean;
  onMedicinesChange: (val: string) => void;
  onAdviceChange: (val: string) => void;
  onMedSearchChange: (val: string) => void;
  onAppendJanAushadhi: (med: JanAushadhiMedicine) => void;
  onCompleteConsultation: () => void;
}

export function JanAushadhiRxCopilot({
  medicines,
  advice,
  medSearch,
  canComplete,
  onMedicinesChange,
  onAdviceChange,
  onMedSearchChange,
  onAppendJanAushadhi,
  onCompleteConsultation
}: JanAushadhiRxCopilotProps) {
  const drugSafetyAudit = useMemo(() => {
    return validatePrescriptionDrugs(medicines);
  }, [medicines]);

  const janAushadhiSuggestions = useMemo(() => {
    if (!medSearch.trim()) return [];
    return findJanAushadhiEquivalents(medSearch);
  }, [medSearch]);

  return (
    <Surface className="border-[#E2E8F0]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-[#0F2F2E]">डिजिटल पर्चा (Rx) फॉर्मूलेशन</h2>
          <p className="text-xs text-[#64748B]">यह पर्चा मरीज़ के WhatsApp और PDF पर स्वतः भेजा जाएगा</p>
        </div>
        <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
          List O / List A केवल
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-[#F8FAF9] p-2.5 text-[11px] text-[#64748B] border border-[#E9ECEF] leading-tight">
        ⚖️ <strong>सांविधिक नियम (NMC):</strong> टेलीमेडिसिन में Schedule X (नशीली/नींद की दवाएं) व इंजेक्शन प्रतिबंधित हैं।
      </div>

      {/* Jan Aushadhi Copilot Assistant */}
      <div className="mt-4 rounded-2xl border border-[#D1E6E3] bg-[#F2F8F7] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#0B4F48] flex items-center gap-1.5">
            💡 जन औषधि जेनेरिक को-पायलट (PMBJP)
          </span>
          <span className="text-[10px] font-bold text-[#107569] bg-white px-2 py-0.5 rounded-full border border-[#D1E6E3]">
            मरीज़ बचत: 60%-85%
          </span>
        </div>

        <div className="mt-2">
          <input
            className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0B4F48] focus:outline-none"
            placeholder="ब्रांड या साल्ट खोजें (उदा. Augmentin, Pan-D, Dolo, Zifi, खांसी...)"
            value={medSearch}
            onChange={(e) => onMedSearchChange(e.target.value)}
          />
        </div>

        {/* Suggestions dropdown */}
        {janAushadhiSuggestions.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#D1E6E3] bg-white p-2 divide-y divide-[#F1F5F9] shadow-sm">
            {janAushadhiSuggestions.map((med) => (
              <div key={med.id} className="py-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black text-[#0F2F2E]">{med.genericName}</p>
                  <p className="text-[10px] text-[#64748B]">
                    ब्रांड: {med.brandExamples.slice(0, 3).join(", ")}
                  </p>
                  <p className="text-[10px] font-bold text-[#0B4F48]">
                    जन औषधि: ₹{med.janAushadhiPriceInr} (ब्रांडेड ₹{med.brandAveragePriceInr} · {med.savingsPercent}% बचत)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAppendJanAushadhi(med)}
                  className="shrink-0 rounded-lg bg-[#0B4F48] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#083E38] transition shadow-xs"
                >
                  + जोड़ें
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Quick Chips */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-[#64748B] self-center">त्वरित:</span>
          <button
            type="button"
            onClick={() => onAppendJanAushadhi(JAN_AUSHADHI_CATALOG[0])}
            className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-[#0B4F48] border border-[#D1E6E3] hover:bg-[#E8F3F1]"
          >
            + Dolo (PCM 650)
          </button>
          <button
            type="button"
            onClick={() => onAppendJanAushadhi(JAN_AUSHADHI_CATALOG[1])}
            className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-[#0B4F48] border border-[#D1E6E3] hover:bg-[#E8F3F1]"
          >
            + Augmentin (Amox-Clav 625)
          </button>
          <button
            type="button"
            onClick={() => onAppendJanAushadhi(JAN_AUSHADHI_CATALOG[3])}
            className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-[#0B4F48] border border-[#D1E6E3] hover:bg-[#E8F3F1]"
          >
            + Pan-D (एसिडिटी)
          </button>
          <button
            type="button"
            onClick={() => onAppendJanAushadhi(JAN_AUSHADHI_CATALOG[7])}
            className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-[#0B4F48] border border-[#D1E6E3] hover:bg-[#E8F3F1]"
          >
            + Montair-LC (एलर्जी)
          </button>
        </div>
      </div>

      {/* Statutory Drug Safety Alert */}
      {!drugSafetyAudit.isCompliant && (
        <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          <p className="font-bold">⛔ {drugSafetyAudit.warningMessage}</p>
        </div>
      )}

      {drugSafetyAudit.isCompliant && drugSafetyAudit.estimatedSavingsInr > 0 && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>
            ✓ जन औषधि को-पायलट: मरीज़ के लिए लगभग ₹{drugSafetyAudit.estimatedSavingsInr} की बचत सुनिश्चित की जा रही है!
          </span>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-emerald-300">
            {drugSafetyAudit.recommendations.length} जेनेरिक दवाइयां
          </span>
        </div>
      )}

      <div className="mt-4 space-y-3.5">
        <div>
          <label className="text-xs font-bold text-[#334155]">दवाइयां व खुराक (Medicines &amp; Dosage)</label>
          <textarea
            className={`mt-1 min-h-[110px] w-full rounded-xl border p-3 text-xs font-medium focus:outline-none ${
              !drugSafetyAudit.isCompliant
                ? "border-red-400 bg-red-50/50 text-red-900 focus:border-red-600"
                : "border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:border-[#0B4F48] focus:bg-white"
            }`}
            value={medicines}
            onChange={(e) => onMedicinesChange(e.target.value)}
            placeholder="दवा का नाम, क्षमता, खुराक (सुबह-दोपहर-रात), कितने दिन"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#334155]">डॉक्टर की सलाह व परहेज (Advice &amp; Diet)</label>
          <textarea
            className="mt-1 min-h-[90px] w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs font-medium text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
            value={advice}
            onChange={(e) => onAdviceChange(e.target.value)}
            placeholder="परहेज, क्या खाएं-पिएं, फ़ॉलोअप निर्देश"
          />
        </div>

        <div className="pt-2">
          <PrimaryButton
            disabled={!canComplete || !drugSafetyAudit.isCompliant}
            onClick={onCompleteConsultation}
            className="w-full text-xs py-3"
          >
            {!drugSafetyAudit.isCompliant
              ? "⛔ प्रतिबंधित दवा हटाएं (Schedule X Banned)"
              : "✓ परामर्श पूरा करें व पर्चा जारी करें"}
          </PrimaryButton>
        </div>
      </div>
    </Surface>
  );
}
