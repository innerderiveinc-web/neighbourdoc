import type { ButtonHTMLAttributes, ReactNode } from "react";

export function MetricCard({
  label,
  value,
  sublabel,
  tone = "teal",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "teal" | "green" | "amber" | "rose" | "blue";
}) {
  const toneMap = {
    teal: "text-[#0B4F48] bg-[#F0F7F6] border-[#D1E6E3]",
    green: "text-[#166534] bg-[#F0FDF4] border-[#BBF7D0]",
    amber: "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]",
    rose: "text-[#9F1239] bg-[#FFF1F2] border-[#FECDD3]",
    blue: "text-[#1E40AF] bg-[#EFF6FF] border-[#BFDBFE]",
  };

  return (
    <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5 shadow-[0_2px_12px_-2px_rgba(15,79,72,0.04)] transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{label}</p>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${toneMap[tone]}`}>
          {tone}
        </span>
      </div>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#0F172A]">{value}</p>
      {sublabel && <p className="mt-1 text-xs font-medium text-[#64748B]">{sublabel}</p>}
    </div>
  );
}

export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#EBECEF] bg-white p-6 shadow-[0_4px_20px_-4px_rgba(15,79,72,0.05)] ${className}`}
    >
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
}) {
  const variants = {
    primary:
      "bg-[#0B4F48] text-white shadow-sm hover:bg-[#083E38] active:bg-[#062F2B] focus:ring-4 focus:ring-[#0B4F48]/20",
    secondary:
      "bg-[#E8F3F1] text-[#0B4F48] hover:bg-[#D9ECE9] active:bg-[#C9E4E0] font-bold",
    outline:
      "border-2 border-[#D1E6E3] bg-white text-[#0B4F48] hover:bg-[#F8FAF9] active:bg-[#EEF4F3]",
  };

  return (
    <button
      className={`inline-flex min-h-[50px] items-center justify-center rounded-xl px-6 py-3 text-sm font-black tracking-wide transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusBadge({
  status,
  label,
  pulse = false
}: {
  status: "queued" | "assigned" | "in_consultation" | "completed" | "refunded" | "cancelled" | "paid" | "pending" | string;
  label?: string;
  pulse?: boolean;
}) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    in_consultation: "bg-blue-100 text-blue-800 border-blue-200",
    assigned: "bg-teal-100 text-teal-800 border-teal-200",
    queued: "bg-amber-100 text-amber-800 border-amber-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    refunded: "bg-rose-100 text-rose-800 border-rose-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200"
  };

  const currentStyle = styles[status] ?? "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${currentStyle}`}
    >
      {pulse && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function BrandFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`mt-8 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#94A3B8] ${className}`}>
      NeighbourDoc Healthcare Platform · Proprietary Asset of <strong>Qsura India Pvt. Ltd.</strong> · Founder &amp; Chief Architect: <strong>Dr. Irfan Ashraf</strong>
    </footer>
  );
}


