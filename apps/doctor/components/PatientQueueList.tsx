"use client";

import React from "react";
import { PrimaryButton, Surface } from "@neighbourdoc/ui";

export type ConsultationItem = {
  id: string;
  patientId: string;
  doctorId: string | null;
  symptoms: string;
  urgencyLevel: string;
  status: string;
  paymentStatus: string;
  callbackDeadline: string | null;
  createdAt: string;
  plan?: string;
  amount?: number;
};

interface PatientQueueListProps {
  queue: ConsultationItem[];
  selectedId: string | null;
  onRefresh: () => void;
  onStartConsultation: (id: string) => void;
  onEscalate: (id: string) => void;
}

export function PatientQueueList({
  queue,
  selectedId,
  onRefresh,
  onStartConsultation,
  onEscalate
}: PatientQueueListProps) {
  return (
    <Surface className="border-[#E2E8F0]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0F2F2E]">प्रतीक्षारत मरीज़ (15 मिनट SLA)</h2>
          <p className="text-xs text-[#64748B]">मरीज़ों की कतार समयानुसार व्यवस्थित है</p>
        </div>
        <button onClick={onRefresh} className="text-xs font-bold text-[#0B4F48] hover:underline">
          ⟳ रीफ्रेश करें
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {queue.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 transition ${
              selectedId === item.id ? "border-[#0B4F48] bg-[#F0F7F6]" : "border-[#E9ECEF] bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-md bg-[#E2E8F0] px-2 py-0.5 text-[10px] font-mono font-bold text-[#475569]">
                  टोकन: {item.id.slice(0, 16)}
                </span>
                <p className="mt-1 text-base font-black text-[#0F2F2E]">{item.symptoms}</p>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  गंभीरता: <span className="font-bold capitalize">{item.urgencyLevel}</span> · कॉलबैक समय:{" "}
                  <span className="font-bold text-[#0B4F48]">
                    {item.callbackDeadline
                      ? new Date(item.callbackDeadline).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "15 मिनट में"}
                  </span>
                </p>
              </div>
              <span className="rounded-full bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-bold text-[#0B4F48]">
                फीस पूर्ण (₹{item.plan === "priority" || item.amount === 9900 ? "99" : "49"})
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <PrimaryButton onClick={() => onStartConsultation(item.id)} className="text-xs py-2 px-4">
                📞 कॉल व परामर्श शुरू करें
              </PrimaryButton>
              <button
                className="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs font-bold text-[#475569] hover:bg-slate-50"
                onClick={() => onEscalate(item.id)}
              >
                एस्केलेट
              </button>
            </div>
          </div>
        ))}

        {queue.length === 0 && (
          <div className="rounded-2xl bg-[#F8FAF9] p-8 text-center text-[#64748B]">
            <p className="font-bold text-sm">अभी कोई मरीज़ कतार में नहीं है।</p>
            <p className="mt-1 text-xs">ऊपर &quot;+ डेमो मरीज़ जोड़ें&quot; बटन दबाकर नया केस जोड़ें।</p>
          </div>
        )}
      </div>
    </Surface>
  );
}
