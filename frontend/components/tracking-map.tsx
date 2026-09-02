"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

export default function TrackingMap({ mechanic, customer }: { mechanic: [number, number]; customer: [number, number] }) {
  const mechanicLatLng: [number, number] = [mechanic[1], mechanic[0]];
  const customerLatLng: [number, number] = [customer[1], customer[0]];
  return <MapContainer center={customerLatLng} zoom={13} scrollWheelZoom className="min-h-[70vh]">
    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker position={customerLatLng}><Popup>Customer breakdown location</Popup></Marker>
    <Marker position={mechanicLatLng}><Popup>Assigned mechanic</Popup></Marker>
    <Polyline positions={[customerLatLng, mechanicLatLng]} pathOptions={{ color: "#E21D25", weight: 5 }} />
  </MapContainer>;
}
