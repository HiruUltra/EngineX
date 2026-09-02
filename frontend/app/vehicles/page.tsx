"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Input, Nav, Select, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";

export default function VehiclesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ registrationNumber: "", make: "", model: "", manufactureYear: 2018, vehicleType: "car", fuelType: "petrol", transmission: "automatic", colour: "" });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => endpoints.vehicles().then((r) => r.data.data) });
  const create = useMutation({ mutationFn: () => endpoints.createVehicle(form), onSuccess: () => { toast.success("Vehicle saved"); qc.invalidateQueries({ queryKey: ["vehicles"] }); } });
  return <Shell><Nav /><section className="mx-auto max-w-5xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Vehicles</h1>
    <div className="mt-6 grid gap-3 rounded-lg border border-white/10 bg-white p-5 dark:bg-panel sm:grid-cols-2">
      {(["registrationNumber", "make", "model", "colour"] as const).map((key) => <Input key={key} placeholder={key} value={String(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
      <Input type="number" value={form.manufactureYear} onChange={(e) => setForm({ ...form, manufactureYear: Number(e.target.value) })} />
      <Select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>{["motorcycle", "three-wheeler", "car", "van", "truck", "bus", "other"].map((v) => <option key={v}>{v}</option>)}</Select>
      <Select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>{["petrol", "diesel", "hybrid", "electric", "other"].map((v) => <option key={v}>{v}</option>)}</Select>
      <Select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })}>{["manual", "automatic", "other"].map((v) => <option key={v}>{v}</option>)}</Select>
      <Button onClick={() => create.mutate()} disabled={create.isPending}>Save vehicle</Button>
    </div>
    <div className="mt-6 grid gap-3">{vehicles.data?.map((v) => <div key={v._id} className="rounded-lg bg-white p-4 dark:bg-panel">{v.registrationNumber} · {v.make} {v.model} · {v.vehicleType}</div>)}</div>
  </section></Shell>;
}
