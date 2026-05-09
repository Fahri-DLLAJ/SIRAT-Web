"use client";
import { useEffect } from "react";
import { useAppStore, Device } from "@/store/appStore";

export function useDevices() {
  const { devices, setDevices } = useAppStore();

  useEffect(() => {
    fetch("/api/admin/devices")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setDevices(d.devices); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = devices.filter((d) => d.status === "active").length;

  const byType = (type: Device["type"]) => devices.filter((d) => d.type === type);

  const systemStatus = (
    ["camera", "lamp", "traffic-light", "sensor"] as Device["type"][]
  ).map((type) => {
    const group  = byType(type);
    const online = group.filter((d) => d.status === "active").length;
    const total  = group.length;
    const status: "online" | "warning" | "offline" =
      total === 0 ? "offline" : online === total ? "online" : online > 0 ? "warning" : "offline";
    const labelMap: Record<Device["type"], string> = {
      camera: "Kamera",
      lamp: "Lampu Jalan",
      "traffic-light": "Traffic Light",
      sensor: "ZoSS / Sensor",
    };
    return { type, label: labelMap[type], online, total, status };
  });

  return { devices, activeCount, byType, systemStatus };
}
