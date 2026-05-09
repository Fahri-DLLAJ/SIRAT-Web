"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Layer, Circle } from "leaflet";
import { Device, Report } from "@/store/appStore";

export type FilterLayer = "all" | "reports" | "devices" | "cameras" | "highRisk";

interface Props {
  devices: Device[];
  reports: Report[];
  filters: FilterLayer[];
  onSelectDevice: (d: Device) => void;
  onSelectReport: (r: Report) => void;
}

// ── Klaten Regency, Central Java ───────────────────────────────────────────
const KLATEN_CENTER: [number, number] = [-7.7059, 110.6010];
const KLATEN_ZOOM = 13;

// ── Styled pin icon: colored circle + emoji ────────────────────────────────
function pinIcon(L: typeof import("leaflet"), emoji: string, bg: string, size = 36) {
  const half = size / 2;
  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${bg};
        border:2.5px solid rgba(255,255,255,0.85);
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.45);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:${size * 0.44}px;line-height:1">${emoji}</span>
      </div>`,
    className: "",
    iconSize:   [size, size],
    iconAnchor: [half, size],
    popupAnchor:[0, -(size + 4)],
  });
}

const DEVICE_PIN: Record<Device["type"], { emoji: string; bg: string }> = {
  "traffic-light": { emoji: "🚦", bg: "#16a34a" },
  lamp:            { emoji: "💡", bg: "#ca8a04" },
  sensor:          { emoji: "🏫", bg: "#7c3aed" },
  camera:          { emoji: "📷", bg: "#2563eb" },
};

const REPORT_PIN: Record<string, { emoji: string; bg: string }> = {
  Kecelakaan:   { emoji: "🚨", bg: "#dc2626" },
  Banjir:       { emoji: "🌊", bg: "#0284c7" },
  "Jalan Rusak":{ emoji: "⚠️", bg: "#d97706" },
  default:      { emoji: "⚠️", bg: "#d97706" },
};

const SEVERITY_HEAT: Record<Report["severity"], { color: string; radius: number; opacity: number }> = {
  critical: { color: "#ef4444", radius: 500, opacity: 0.30 },
  high:     { color: "#f97316", radius: 380, opacity: 0.24 },
  medium:   { color: "#eab308", radius: 260, opacity: 0.20 },
  low:      { color: "#22c55e", radius: 180, opacity: 0.16 },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s} detik lalu`;
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  return `${Math.floor(s / 3600)} jam lalu`;
}

// ── Popup styles (injected once) ───────────────────────────────────────────
const POPUP_CSS = `
  .s-popup { font-family: system-ui, sans-serif; min-width: 210px; color: #f1f5f9; }
  .s-popup-title { font-weight: 700; font-size: 13px; margin-bottom: 3px; }
  .s-popup-sub   { font-size: 11px; color: #94a3b8; margin-bottom: 10px; }
  .s-popup-row   { display:flex; align-items:center; gap:6px; font-size:11px; margin-bottom:5px; }
  .s-popup-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px;
                   border-radius:999px; font-size:10px; font-weight:600; }
  .leaflet-popup-content-wrapper { background:#1e293b !important; border:1px solid rgba(255,255,255,0.1) !important;
                                    border-radius:12px !important; box-shadow:0 8px 32px rgba(0,0,0,0.5) !important; }
  .leaflet-popup-tip             { background:#1e293b !important; }
  .leaflet-popup-close-button    { color:#94a3b8 !important; font-size:16px !important; top:8px !important; right:8px !important; }
`;

export default function MainMap({ devices, reports, filters, onSelectDevice, onSelectReport }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const markersRef   = useRef<Layer[]>([]);
  const heatRef      = useRef<Circle[]>([]);
  // Keep latest props accessible inside the async init callback
  const propsRef = useRef({ devices, reports, filters, onSelectDevice, onSelectReport });
  useEffect(() => { propsRef.current = { devices, reports, filters, onSelectDevice, onSelectReport }; });

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    // Inject popup CSS once
    if (!document.getElementById("s-popup-css")) {
      const style = document.createElement("style");
      style.id = "s-popup-css";
      style.textContent = POPUP_CSS;
      document.head.appendChild(style);
    }

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current, {
        center: KLATEN_CENTER,
        zoom:   KLATEN_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Render markers immediately after map is ready using latest props
      renderMarkers(L, map, markersRef, heatRef, propsRef.current);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Re-render markers/heat when data or filters change ────────────────────
  useEffect(() => {
    if (!mapRef.current) return; // map not ready yet — init effect handles first render
    import("leaflet").then((L) => {
      renderMarkers(L, mapRef.current!, markersRef, heatRef, { devices, reports, filters, onSelectDevice, onSelectReport });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, reports, filters]);

  return <div ref={containerRef} className="w-full h-full" style={{ isolation: "isolate" }} />;
}

// ── Extracted render logic ─────────────────────────────────────────────────
function renderMarkers(
  L: typeof import("leaflet"),
  map: import("leaflet").Map,
  markersRef: React.MutableRefObject<Layer[]>,
  heatRef: React.MutableRefObject<import("leaflet").Circle[]>,
  { devices, reports, filters, onSelectDevice, onSelectReport }: {
    devices: Device[];
    reports: Report[];
    filters: FilterLayer[];
    onSelectDevice: (d: Device) => void;
    onSelectReport: (r: Report) => void;
  }
) {
  markersRef.current.forEach((l) => map.removeLayer(l));
  heatRef.current.forEach((l)   => map.removeLayer(l));
  markersRef.current = [];
  heatRef.current    = [];

  const all         = filters.includes("all");
  const showReports = all || filters.includes("reports");
  const showDevices = all || filters.includes("devices");
  const showCameras = all || filters.includes("cameras");
  const showHeat    = all || filters.includes("highRisk");

  if (showHeat) {
    reports.forEach((r) => {
      const h = SEVERITY_HEAT[r.severity];
      const c = L.circle([r.lat, r.lng], {
        radius: h.radius, color: "transparent",
        fillColor: h.color, fillOpacity: h.opacity,
      }).addTo(map);
      heatRef.current.push(c);
    });
  }

  if (showDevices || showCameras) {
    devices.forEach((d) => {
      if (d.type === "camera" && !showCameras && !all) return;
      if (d.type !== "camera" && !showDevices && !all) return;
      const pin = DEVICE_PIN[d.type] ?? DEVICE_PIN.camera;
      const m = L.marker([d.lat, d.lng], { icon: pinIcon(L, pin.emoji, pin.bg) })
        .addTo(map)
        .bindPopup(devicePopup(d), { maxWidth: 280, className: "" });
      m.on("click", () => onSelectDevice(d));
      markersRef.current.push(m);
    });
  }

  if (showReports) {
    reports.filter((r) => !r.hidden).forEach((r) => {
      const pin = REPORT_PIN[r.type] ?? REPORT_PIN.default;
      const m = L.marker([r.lat, r.lng], { icon: pinIcon(L, pin.emoji, pin.bg) })
        .addTo(map)
        .bindPopup(reportPopup(r), { maxWidth: 280, className: "" });
      m.on("click", () => onSelectReport(r));
      markersRef.current.push(m);
    });
  }
}

// ── Popup builders ─────────────────────────────────────────────────────────
function statusBadge(status: Device["status"]) {
  const map = {
    active:  { color: "#22c55e", bg: "rgba(34,197,94,0.15)",  label: "● Online"   },
    offline: { color: "#6b7280", bg: "rgba(107,114,128,0.15)", label: "● Offline"  },
    pending: { color: "#eab308", bg: "rgba(234,179,8,0.15)",  label: "● Menunggu" },
  };
  const s = map[status] ?? map.offline;
  return `<span class="s-popup-badge" style="color:${s.color};background:${s.bg}">${s.label}</span>`;
}

function sevBadge(sev: Report["severity"]) {
  const map = {
    critical: { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   label: "Kritis"  },
    high:     { color: "#f97316", bg: "rgba(249,115,22,0.15)",  label: "Tinggi"  },
    medium:   { color: "#eab308", bg: "rgba(234,179,8,0.15)",   label: "Sedang"  },
    low:      { color: "#22c55e", bg: "rgba(34,197,94,0.15)",   label: "Rendah"  },
  };
  const s = map[sev];
  return `<span class="s-popup-badge" style="color:${s.color};background:${s.bg}">${s.label}</span>`;
}

function devicePopup(d: Device): string {
  const typeLabel: Record<Device["type"], string> = {
    "traffic-light": "Traffic Light", lamp: "Lampu Jalan", sensor: "ZoSS / Sensor", camera: "Kamera",
  };
  return `<div class="s-popup">
    <div class="s-popup-title">${d.name}</div>
    <div class="s-popup-sub">${typeLabel[d.type]}</div>
    <div class="s-popup-row">📍 <span style="color:#cbd5e1">${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</span></div>
    <div class="s-popup-row">Status: ${statusBadge(d.status)}</div>
    <div class="s-popup-row">🕐 <span style="color:#94a3b8">${timeAgo(d.lastSeen)}</span></div>
    ${d.ip ? `<div class="s-popup-row">🌐 <span style="color:#64748b">${d.ip}</span></div>` : ""}
  </div>`;
}

function reportPopup(r: Report): string {
  const statusMap: Record<Report["status"], string> = {
    active: "Sedang ditangani", pending: "Menunggu respons", resolved: "Selesai",
  };
  return `<div class="s-popup">
    <div class="s-popup-title">${r.type}</div>
    <div class="s-popup-sub">📍 ${r.location}</div>
    <div class="s-popup-row">Tingkat: ${sevBadge(r.severity)}</div>
    <div class="s-popup-row">Status: <span style="color:#cbd5e1">${statusMap[r.status]}</span></div>
    <div class="s-popup-row">🕐 <span style="color:#94a3b8">${timeAgo(r.timestamp)}</span></div>
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#94a3b8;line-height:1.5">${r.description}</div>
  </div>`;
}
