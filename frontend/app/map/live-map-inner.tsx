"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MechanicPin { _id: unknown; name: string; phone: string; rating: number; coordinates?: [number, number]; hasActiveJob: boolean }
interface BreakdownPin { _id: unknown; status: string; problemCategory: string; address: string; coordinates?: [number, number]; urgency: string }

function mechanicIcon(hasActiveJob: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${hasActiveJob ? "#F59E0B" : "#10B981"};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;">🔧</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function breakdownIcon(urgency: string) {
  const color = urgency === "emergency" ? "#DC2626" : "#E21D25";
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:15px;">🚨</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

export default function LiveMapInner({
  mechanics,
  breakdowns,
  isManager
}: {
  mechanics: MechanicPin[];
  breakdowns: BreakdownPin[];
  isManager: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, {
      center: [6.9271, 79.8612], // Colombo
      zoom: 12,
      zoomControl: true
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapInstance.current);
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Re-render markers when data changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Breakdown pins
    for (const b of breakdowns) {
      if (!b.coordinates) continue;
      const [lon, lat] = b.coordinates;
      const marker = L.marker([lat, lon], { icon: breakdownIcon(b.urgency) })
        .addTo(map)
        .bindPopup(`
          <strong>${b.problemCategory}</strong><br/>
          ${b.address}<br/>
          <span style="font-size:11px;color:#888">${b.status} · ${b.urgency}</span>
        `);
      markersRef.current.push(marker);
    }

    // Mechanic pins (manager only for privacy)
    if (isManager) {
      for (const m of mechanics) {
        if (!m.coordinates) continue;
        const [lon, lat] = m.coordinates;
        const marker = L.marker([lat, lon], { icon: mechanicIcon(m.hasActiveJob) })
          .addTo(map)
          .bindPopup(`
            <strong>${m.name}</strong><br/>
            ${m.phone}<br/>
            ⭐ ${m.rating} · ${m.hasActiveJob ? "On job" : "Available"}
          `);
        markersRef.current.push(marker);
      }
    }
  }, [mechanics, breakdowns, isManager]);

  return (
    <div
      ref={mapRef}
      style={{ height: "60vh", width: "100%", borderRadius: "12px", overflow: "hidden" }}
    />
  );
}
