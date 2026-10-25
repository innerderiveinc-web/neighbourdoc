"use client";

import React, { useState } from "react";

interface VoiceSymptomRecorderProps {
  language: string;
  symptoms: string;
  isEmergencyBlocked: boolean;
  onSymptomsChange: (symptoms: string) => void;
}

export function VoiceSymptomRecorder({
  language,
  symptoms,
  isEmergencyBlocked,
  onSymptomsChange
}: VoiceSymptomRecorderProps) {
  const [isListening, setIsListening] = useState(false);

  const quickSymptomChips = [
    { label: "+ 2 दिन से बुखार", text: "2 दिन से बुखार और बदन दर्द है" },
    { label: "+ खांसी-जुकाम", text: "गले में खराश, सूखी खांसी और छींकें हैं" },
    { label: "+ पेट दर्द व उल्टी", text: "पेट में मरोड़ और दस्त की शिकायत है" },
    { label: "+ सिरदर्द व कमजोरी", text: "तेज़ सिरदर्द और चक्कर आ रहे हैं" }
  ];

  function startVoiceRecording() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("आपके ब्राउज़र में आवाज़ पहचान (Voice Input) की सुविधा समर्थित नहीं है। कृपया लिखकर लक्षण दर्ज करें।");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "English" ? "en-IN" : "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onSymptomsChange(symptoms ? `${symptoms} ${transcript}` : transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-[#0F2F2E]">
          मरीज की मुख्य तकलीफ़ / लक्षण (Symptoms) *
        </label>
        <button
          type="button"
          onClick={startVoiceRecording}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition shadow-xs ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-[#E8F3F1] text-[#0B4F48] hover:bg-[#D1E6E3]"
          }`}
        >
          <span>{isListening ? "🔴 सुन रहे हैं..." : "🎤 बोलकर बताएं"}</span>
        </button>
      </div>

      <textarea
        className={`w-full rounded-2xl border p-3.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-3 transition min-h-[95px] ${
          isEmergencyBlocked
            ? "border-red-500 bg-red-50/50 text-red-950 focus:border-red-600 focus:ring-red-100"
            : "border-[#CBD5E1] bg-[#F8FAFC] focus:border-[#0B4F48] focus:ring-[#0B4F48]/15"
        }`}
        value={symptoms}
        onChange={(e) => onSymptomsChange(e.target.value)}
        placeholder="उदा. 2 दिन से बुखार है, गले में दर्द और बदन दर्द हो रहा है... (या माइक बटन दबाकर बोलें)"
      />

      {/* Quick Rural Chips */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="text-[11px] font-medium text-[#64748B] self-center">जल्दी जोड़ें:</span>
        {quickSymptomChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSymptomsChange(symptoms ? `${symptoms}, ${chip.text}` : chip.text)}
            className="rounded-lg border border-[#CBD5E1] bg-white px-2 py-0.5 text-[11px] font-medium text-[#475569] hover:border-[#0B4F48] hover:text-[#0B4F48] transition"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
