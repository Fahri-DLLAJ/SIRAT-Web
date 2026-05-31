"use client";
import { useEffect, useRef } from "react";

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

const KLATEN: [number, number] = [-7.7059, 110.601];

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef      = useRef<any>(null);

  // ── Init map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;
      LRef.current = L;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, { center: KLATEN, zoom: 13 });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        placeMarker(L, map, e.latlng.lat, e.latlng.lng);
        onChange(e.latlng.lat, e.latlng.lng);
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── React to external lat/lng changes (GPS button) ─────────────────────
  useEffect(() => {
    if (lat === null || lng === null || !mapRef.current || !LRef.current) return;
    placeMarker(LRef.current, mapRef.current, lat, lng);
    mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
  }, [lat, lng]);

  function placeMarker(L: unknown, map: unknown, pLat: number, pLng: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (markerRef.current) (markerRef.current as any).remove();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markerRef.current = (L as any).marker([pLat, pLng]).addTo(map);
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/10"
      style={{ isolation: "isolate", height: "220px" }}
    />
  );
}
