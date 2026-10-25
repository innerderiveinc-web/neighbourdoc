"use client";

import React from "react";

export type PaymentModalData = {
  open: boolean;
  consultationId: string;
  orderId: string;
  amount: number;
  patientName: string;
  isProcessing?: boolean;
  selectedApp?: string;
};

interface UpiPaymentModalProps {
  paymentModal: PaymentModalData | null;
  onConfirmPayment: (app: string) => void;
  onCancel: () => void;
}

export function UpiPaymentModal({
  paymentModal,
  onConfirmPayment,
  onCancel
}: UpiPaymentModalProps) {
  if (!paymentModal || !paymentModal.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072421]/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#D1E6E3]">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#E9ECEF] pb-4">
          <div>
            <span className="rounded-full bg-[#E8F3F1] px-2.5 py-0.5 text-[10px] font-bold text-[#0B4F48]">
              🔒 256-बिट सुरक्षित भुगतान गेटवे
            </span>
            <h3 className="mt-1 text-lg font-black text-[#0F2F2E]">परामर्श शुल्क का भुगतान</h3>
            <p className="text-xs text-[#64748B]">मरीज़: {paymentModal.patientName}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#0B4F48]">₹{paymentModal.amount}</span>
            <p className="text-[10px] text-[#64748B]">कुल देय राशि</p>
          </div>
        </div>

        {/* Processing State */}
        {paymentModal.isProcessing ? (
          <div className="py-10 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#0B4F48] border-t-transparent mb-3"></div>
            <h4 className="text-sm font-bold text-[#0F2F2E]">
              {paymentModal.selectedApp} से भुगतान सत्यापित हो रहा है...
            </h4>
            <p className="mt-1 text-xs text-[#64748B]">कृपया विंडो बंद न करें।</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-xs font-bold text-[#334155]">अपना पसंदीदा UPI माध्यम चुनें:</p>

            <div className="grid gap-2.5">
              <button
                onClick={() => onConfirmPayment("Google Pay")}
                className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#0B4F48] hover:bg-[#F2F8F7]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 font-black text-sm text-emerald-800">
                    G
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#0F2F2E]">Google Pay UPI</p>
                    <p className="text-[10px] text-[#64748B]">1-टैप फास्ट पेमेंट</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0B4F48]">पे करें ₹{paymentModal.amount} &rarr;</span>
              </button>

              <button
                onClick={() => onConfirmPayment("PhonePe")}
                className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#0B4F48] hover:bg-[#F2F8F7]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 font-black text-sm text-purple-800">
                    Pe
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#0F2F2E]">PhonePe UPI</p>
                    <p className="text-[10px] text-[#64748B]">सभी UPI बैंक खाते</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0B4F48]">पे करें ₹{paymentModal.amount} &rarr;</span>
              </button>

              <button
                onClick={() => onConfirmPayment("Paytm")}
                className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#0B4F48] hover:bg-[#F2F8F7]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 font-black text-sm text-sky-800">
                    Pay
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#0F2F2E]">Paytm / Wallet / UPI</p>
                    <p className="text-[10px] text-[#64748B]">Paytm UPI व कार्ड</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0B4F48]">पे करें ₹{paymentModal.amount} &rarr;</span>
              </button>

              <button
                onClick={() => onConfirmPayment("BHIM UPI")}
                className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#0B4F48] hover:bg-[#F2F8F7]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 font-black text-sm text-amber-800">
                    ₹
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#0F2F2E]">BHIM या अन्य UPI ऐप्स</p>
                    <p className="text-[10px] text-[#64748B]">कोई भी UPI ID या QR</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0B4F48]">पे करें ₹{paymentModal.amount} &rarr;</span>
              </button>
            </div>

            <div className="pt-3 border-t border-[#E9ECEF] flex items-center justify-between">
              <span className="text-[10px] text-[#64748B]">
                ऑर्डर ID: #{paymentModal.orderId.slice(0, 14)}
              </span>
              <button onClick={onCancel} className="text-xs font-bold text-red-600 hover:underline">
                रद्द करें (Cancel)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
