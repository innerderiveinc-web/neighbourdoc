"use client";

import React from "react";
import { Surface } from "@neighbourdoc/ui";

export type ConsultationRow = {
  id: string;
  symptoms: string;
  status: string;
  paymentStatus: string;
  amount: number;
  callbackDeadline: string | null;
  paidAt?: string;
  createdAt?: string;
  cancellationReason?: string;
};

interface ConsultationsTableProps {
  consultations: ConsultationRow[];
  slaCallbackMinutes?: number;
  watchdogRunning: boolean;
  watchdogNotice: string;
  onTriggerWatchdog: () => void;
  onClearNotice: () => void;
  onIssueRefund: (id: string) => void;
}

export function ConsultationsTable({
  consultations,
  slaCallbackMinutes = 15,
  watchdogRunning,
  watchdogNotice,
  onTriggerWatchdog,
  onClearNotice,
  onIssueRefund
}: ConsultationsTableProps) {
  return (
    <Surface className="border-[#E2E8F0]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
        <div>
          <h2 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
            लाइव परामर्श टाइमलाइन
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              15-Min SLA Watchdog
            </span>
          </h2>
          <p className="text-xs text-[#64748B]">
            T+8m स्वतः-पुनर्निधारण • T+15m स्वतः-रिफंड व WhatsApp क्षमा संदेश
          </p>
        </div>
        <button
          disabled={watchdogRunning}
          onClick={onTriggerWatchdog}
          className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          {watchdogRunning ? "⏳ वॉचडॉग चल रहा है..." : "⚡ अभी SLA चेक चलाएं"}
        </button>
      </div>

      {watchdogNotice && (
        <div className="mt-3 rounded-xl bg-teal-50 border border-teal-200 p-2.5 text-xs font-medium text-teal-800 flex justify-between items-center">
          <span>{watchdogNotice}</span>
          <button onClick={onClearNotice} className="text-teal-600 hover:text-teal-900 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[550px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[11px] font-bold uppercase text-[#64748B]">
              <th className="py-2.5">टोकन ID</th>
              <th className="py-2.5">लक्षण</th>
              <th className="py-2.5">स्थिति</th>
              <th className="py-2.5">भुगतान</th>
              <th className="py-2.5">{slaCallbackMinutes}-Min SLA</th>
              <th className="py-2.5">शुल्क</th>
              <th className="py-2.5 text-right">कार्रवाई (Action)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {consultations.map((row) => {
              const nowMs = Date.now();
              const refTime = row.paidAt || row.createdAt;
              const elapsedMinutes = refTime
                ? Math.floor(Math.max(0, nowMs - new Date(refTime).getTime()) / 60000)
                : 0;
              const slaLimit = slaCallbackMinutes;
              const isBreached = elapsedMinutes >= slaLimit;
              const isEscalated = elapsedMinutes >= 8 && elapsedMinutes < slaLimit;

              return (
                <tr className="hover:bg-[#F8FAFC]" key={row.id}>
                  <td className="py-3 font-mono text-[11px] font-bold text-[#0B4F48]">
                    {row.id.slice(0, 14)}
                  </td>
                  <td className="py-3 font-medium text-[#334155]">{row.symptoms}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        row.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : row.status === "refunded"
                          ? "bg-rose-100 text-rose-800"
                          : row.status === "in_consultation"
                          ? "bg-blue-100 text-blue-800 animate-pulse"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        row.paymentStatus === "paid"
                          ? "text-emerald-700"
                          : row.paymentStatus === "refunded"
                          ? "text-rose-700"
                          : "text-slate-500"
                      }`}
                    >
                      {row.paymentStatus === "paid"
                        ? "सफल"
                        : row.paymentStatus === "refunded"
                        ? "रिफंडेड"
                        : "लंबित"}
                    </span>
                  </td>
                  <td className="py-3 text-[11px] font-bold">
                    {row.status === "refunded" ? (
                      <span className="text-rose-600">
                        रिफंडेड {row.cancellationReason === "SLA_BREACH_15MIN_AUTOREFUND" ? "(15m उल्लंघन)" : ""}
                      </span>
                    ) : row.status === "completed" ? (
                      <span className="text-emerald-700">पूर्ण</span>
                    ) : isBreached ? (
                      <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-rose-800 font-bold animate-pulse">
                        🚨 {elapsedMinutes}m (उल्लंघन)
                      </span>
                    ) : isEscalated ? (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-amber-800 font-bold">
                        ⚠️ {elapsedMinutes}m / {slaLimit}m (री-असाइंड)
                      </span>
                    ) : (
                      <span className="text-[#0B4F48]">
                        ⏱️ {elapsedMinutes}m / {slaLimit}m
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-bold text-[#0F172A]">₹{row.amount / 100}</td>
                  <td className="py-3 text-right">
                    {row.status === "refunded" ? (
                      <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                        रिफंडेड
                      </span>
                    ) : row.status !== "completed" && isBreached ? (
                      <button
                        onClick={() => onIssueRefund(row.id)}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 transition shadow-sm"
                      >
                        SLA रिफंड करें
                      </button>
                    ) : row.status !== "completed" && isEscalated ? (
                      <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        एस्केलेटेड
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#94A3B8]">सामान्य</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {consultations.length === 0 && (
              <tr>
                <td className="py-8 text-center text-[#94A3B8]" colSpan={7}>
                  अभी कोई परामर्श दर्ज नहीं हुआ है।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
