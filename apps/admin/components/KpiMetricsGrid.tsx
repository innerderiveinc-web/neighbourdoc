"use client";

import React from "react";
import { MetricCard } from "@neighbourdoc/ui";

export type KpiMetrics = {
  totalConsultations: number;
  completedConsultations: number;
  pendingConsultations: number;
  dailyRevenue: number;
  averageCallbackTimeMinutes: number;
  completionRate: number;
  doctorsOnline: number;
};

interface KpiMetricsGridProps {
  metrics: KpiMetrics | null;
}

export function KpiMetricsGrid({ metrics }: KpiMetricsGridProps) {
  return (
    <section className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      <MetricCard label="कुल परामर्श (Total)" value={String(metrics?.totalConsultations ?? 0)} tone="teal" />
      <MetricCard
        label="आज का कुल राजस्व"
        value={`₹${((metrics?.dailyRevenue ?? 0) / 100).toLocaleString("en-IN")}`}
        tone="green"
      />
      <MetricCard
        label="प्रतीक्षारत कॉल्स (Pending)"
        value={String(metrics?.pendingConsultations ?? 0)}
        tone={(metrics?.pendingConsultations ?? 0) > 0 ? "amber" : "green"}
      />
      <MetricCard label="ऑनलाइन डॉक्टर" value={String(metrics?.doctorsOnline ?? 0)} tone="teal" />
    </section>
  );
}
