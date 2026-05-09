"use client";
import { useEffect, useRef } from "react";

interface MarkerData {
  lat: number;
  lng: number;
  label: string;
  color?: string;
}

interface Props {
  center?: [number, number];
  zoom?: number;
  markers?: MarkerData[];
  height?: string;
  /** Explicit pixel height — preferred over the height Tailwind class */
  heightPx?: number;
}

export default function MapPreview({
  center = [-6.2088, 106.8456],
  zoom = 12,
  markers = [],
  height = "h-72",
  heightPx,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix default icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(center, zoom);
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      markers.forEach(({ lat, lng, label }) => {
        L.marker([lat, lng]).addTo(map).bindPopup(label);
      });

      // Re-measure if the container was hidden (e.g. inside lg:block) and later becomes visible
      const ro = new ResizeObserver(() => { map.invalidateSize(); });
      if (mapRef.current) ro.observe(mapRef.current);
      (mapInstanceRef.current as unknown as { _ro: ResizeObserver })._ro = ro;
    });

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inst = mapInstanceRef.current as any;
        inst._ro?.disconnect();
        inst.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className={`w-full ${heightPx ? "" : height} rounded-2xl overflow-hidden z-0`}
      style={{ height: heightPx ? `${heightPx}px` : undefined }}
    />
  );
}
