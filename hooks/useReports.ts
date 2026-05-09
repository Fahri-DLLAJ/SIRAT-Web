"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";

export function useReports() {
  const { reports, setReports } = useAppStore();

  useEffect(() => {
    fetch("/api/report")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setReports(d.reports); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayCount = reports.filter(
    (r) => new Date(r.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const resolvedCount  = reports.filter((r) => r.status === "resolved").length;
  const highRiskCount  = reports.filter((r) => r.severity === "critical" || r.severity === "high").length;
  const latestReports  = [...reports]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return { reports, todayCount, resolvedCount, highRiskCount, latestReports };
}
