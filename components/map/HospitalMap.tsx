"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { Hospital } from "@/app/emergency/page";

interface Props {
  hospitals: Hospital[];
  userCoords: { lat: number; lng: number } | null;
  selected: Hospital | null;
  onSelect: (h: Hospital) => void;
}

const KLATEN: [number, number] = [-7.7059, 110.6010];

const POPUP_CSS = `
  .h-popup { font-family: system-ui, sans-serif; min-width: 200px; color: #f1f5f9; }
  .h-popup-title { font-weight: 700; font-size: 13px; margin-bottom: 4px; letter-spacing: -0.01em; }
  .h-popup-sub   { font-size: 11px; color: #94a3b8; margin-bottom: 8px; }
  .h-popup-row   { font-size: 11px; color: #cbd5e1; margin-bottom: 4px; display:flex; align-items:center; gap:5px; }
  .leaflet-popup-content-wrapper { 
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset !important;
    padding: 4px !important;
  }
  .leaflet-popup-content { margin: 12px 14px !important; }
  .leaflet-popup-tip { 
    background: rgba(15, 23, 42, 0.98) !important;
    box-shadow: 0 0 10px rgba(0,0,0,0.3) !important;
  }
  .leaflet-popup-close-button { 
    color: #94a3b8 !important;
    font-size: 18px !important;
    top: 10px !important;
    right: 10px !important;
    width: 24px !important;
    height: 24px !important;
    border-radius: 6px !important;
    transition: all 0.2s !important;
  }
  .leaflet-popup-close-button:hover {
    background: rgba(255,255,255,0.1) !important;
    color: #fff !important;
  }
`;

export default function HospitalMap({ hospitals, userCoords, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const markersRef   = useRef<Map<string, Marker>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);

  // ── Init map once ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    if (!document.getElementById("h-popup-css")) {
      const s = document.createElement("style");
      s.id = "h-popup-css";
      s.textContent = POPUP_CSS;
      document.head.appendChild(s);
    }

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current, {
        center: KLATEN,
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // ── Render hospital markers ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const map = mapRef.current!;

      // Remove old markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current.clear();

      hospitals.forEach((h, idx) => {
        const isFirst = idx === 0 && !!userCoords;
        const color = isFirst ? "#10b981" : "#0ea5e9";
        const icon = L.divIcon({
          html: `<div style="
            width:36px;height:36px;background:${color};
            border:3px solid rgba(255,255,255,0.9);border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.5), 0 0 0 2px rgba(0,0,0,0.1);
            display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(45deg);font-size:15px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">🏥</span>
          </div>`,
          className: "map-pin-icon",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -40],
        });

        const popup = `<div class="h-popup">
          <div class="h-popup-title">${h.name}</div>
          <div class="h-popup-sub">${h.type}</div>
          <div class="h-popup-row">📍 ${h.address}</div>
          <div class="h-popup-row">📞 ${h.phone}</div>
          ${h.distance ? `<div class="h-popup-row">🧭 ${h.distance}</div>` : ""}
        </div>`;

        const marker = L.marker([h.lat, h.lng], { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 260 });
        marker.on("click", () => onSelect(h));
        markersRef.current.set(h.id, marker);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitals]);

  // ── User location marker ───────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userCoords) return;
    import("leaflet").then((L) => {
      const map = mapRef.current!;
      if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
      const icon = L.divIcon({
        html: `<div style="
          width:18px;height:18px;background:#0ea5e9;
          border:3px solid white;border-radius:50%;
          box-shadow:0 0 0 4px rgba(14,165,233,0.3), 0 2px 8px rgba(0,0,0,0.3);">
        </div>`,
        className: "user-location-icon",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon })
        .addTo(map)
        .bindPopup("<div style='color:#f1f5f9;font-size:12px;font-weight:600;padding:2px'>📍 Lokasi Anda</div>");
      map.flyTo([userCoords.lat, userCoords.lng], 14, { duration: 1 });
    });
  }, [userCoords]);

  // ── Pan to selected hospital ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selected) return;
    const marker = markersRef.current.get(selected.id);
    if (marker) {
      mapRef.current.flyTo([selected.lat, selected.lng], 15, { duration: 0.8 });
      marker.openPopup();
    }
  }, [selected]);

  return <div ref={containerRef} className="w-full h-full" style={{ isolation: "isolate" }} />;
}
