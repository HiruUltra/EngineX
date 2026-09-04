"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

export default function TrackingMap({ mechanic, customer }: { mechanic?: [number, number]; customer: [number, number] }) {
  const mechanicLatLng: [number, number] | null = mechanic ? [mechanic[1], mechanic[0]] : null;
  const customerLatLng: [number, number] = [customer[1], customer[0]];
  return <MapContainer center={customerLatLng} zoom={13} scrollWheelZoom className="h-full min-h-[290px] w-full">
    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker position={customerLatLng}><Popup>Customer breakdown location</Popup></Marker>
    {mechanicLatLng ? <Marker position={mechanicLatLng}><Popup>Assigned mechanic</Popup></Marker> : null}
    {mechanicLatLng ? <Polyline positions={[customerLatLng, mechanicLatLng]} pathOptions={{ color: "#E21D25", weight: 5 }} /> : null}
  </MapContainer>;
}
