"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LocateFixed, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Nav, Select, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";

export default function RequestPage() {
  const router = useRouter();
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => endpoints.vehicles().then((r) => r.data.data) });
  const [form, setForm] = useState({ vehicle: "", serviceType: "repair", problemCategory: "battery issue", description: "", urgency: "normal", address: "Colombo 07", longitude: 79.8612, latitude: 6.9271, images: [] as string[] });
  const selectedVehicle = form.vehicle || vehicles.data?.[0]?._id || "";
  const steps = useMemo(() => ["Location", "Vehicle", "Problem", "Photos", "Review"], []);
  const create = useMutation({
    mutationFn: () => endpoints.createRequest({ ...form, vehicle: selectedVehicle }),
    onSuccess: (res) => { toast.success("Searching for a mechanic"); router.push(`/tracking/${res.data.data._id}`); },
    onError: () => toast.error("Could not create request")
  });
  function detect() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setForm({ ...form, latitude: pos.coords.latitude, longitude: pos.coords.longitude, address: "Detected current location" }),
      () => toast.warning("Location permission rejected. Manual location is active.")
    );
  }
  return <Shell><Nav /><section className="mx-auto max-w-4xl px-4 py-8">
    <h1 className="font-display text-4xl font-bold">Request Assistance</h1>
    <div className="mt-5 grid grid-cols-5 gap-2 text-xs">{steps.map((s, i) => <div key={s} className="rounded-md bg-panel p-2 text-center text-white">{i + 1}. {s}</div>)}</div>
    <div className="mt-6 grid gap-4 rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">
      <Button onClick={detect} className="w-full"><LocateFixed size={18} /> Detect current GPS location</Button>
      <div className="grid gap-3 sm:grid-cols-3"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /><Input type="number" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} /><Input type="number" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} /></div>
      <Select value={selectedVehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>{vehicles.data?.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} · {v.make} {v.model}</option>)}</Select>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select value={form.problemCategory} onChange={(e) => setForm({ ...form, problemCategory: e.target.value })}>{["engine problem", "battery issue", "flat tyre", "overheating", "fuel problem", "electrical fault", "brake issue", "accident damage", "towing request", "unknown problem", "other"].map((v) => <option key={v}>{v}</option>)}</Select>
        <Select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>{["low", "normal", "high", "emergency"].map((v) => <option key={v}>{v}</option>)}</Select>
        <Select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>{["inspection", "repair", "towing"].map((v) => <option key={v}>{v}</option>)}</Select>
      </div>
      <Input placeholder="Describe the problem" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="rounded-md border border-dashed border-zinc-300 p-4 text-sm dark:border-white/20"><Upload className="mb-2 text-engine-red" /> Photo upload endpoint is ready; paste uploaded image URLs here for demo.</div>
      <Button onClick={() => create.mutate()} disabled={create.isPending || !selectedVehicle}>Confirm request</Button>
    </div>
  </section></Shell>;
}
