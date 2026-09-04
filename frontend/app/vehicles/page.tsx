"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Nav, Select, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";

export default function VehiclesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    registrationNumber: "",
    make: "",
    model: "",
    manufactureYear: 2018,
    vehicleType: "car",
    fuelType: "petrol",
    transmission: "automatic",
    colour: ""
  });

  const vehicles = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => endpoints.vehicles().then((r) => r.data.data)
  });

  const create = useMutation({
    mutationFn: () => endpoints.createVehicle(form),
    onSuccess: () => {
      toast.success("Vehicle saved successfully");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setForm({
        registrationNumber: "",
        make: "",
        model: "",
        manufactureYear: 2018,
        vehicleType: "car",
        fuelType: "petrol",
        transmission: "automatic",
        colour: ""
      });
    },
    onError: (err: unknown) => {
      const msg = typeof err === "object" && err && "response" in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : undefined;
      toast.error(msg || "Failed to save vehicle");
    }
  });

  return (
    <Shell>
      <Nav />
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">My Vehicles</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-metallic">Add and manage your registered vehicles for quick roadside assistance</p>
          </div>
        </div>

        {/* Add vehicle form */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-panel sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold">Add New Vehicle</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Registration / Plate Number</label>
              <Input
                placeholder="e.g. WP CAB-4821"
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Make / Brand</label>
              <Input
                placeholder="e.g. Toyota"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Model</label>
              <Input
                placeholder="e.g. Aqua, Corolla, Swift"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Manufacture Year</label>
              <Input
                type="number"
                min="1970"
                max="2035"
                placeholder="Year"
                value={form.manufactureYear}
                onChange={(e) => setForm({ ...form, manufactureYear: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Colour</label>
              <Input
                placeholder="e.g. White, Silver, Black"
                value={form.colour}
                onChange={(e) => setForm({ ...form, colour: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Vehicle Type</label>
              <Select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                {["car", "motorcycle", "three-wheeler", "van", "truck", "bus", "other"].map((v) => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Fuel Type</label>
              <Select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                {["petrol", "diesel", "hybrid", "electric", "other"].map((v) => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Transmission</label>
              <Select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })}>
                {["automatic", "manual", "other"].map((v) => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending || !form.registrationNumber || !form.make || !form.model}
                className="w-full"
              >
                <Plus size={18} /> {create.isPending ? "Saving…" : "Save Vehicle"}
              </Button>
            </div>
          </div>
        </div>

        {/* Vehicle list */}
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold">Saved Vehicles ({vehicles.data?.length || 0})</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.isLoading ? (
              <div className="h-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-panel" />
            ) : vehicles.data?.length ? (
              vehicles.data.map((v) => (
                <div
                  key={v._id}
                  className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-panel"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-engine-red/10 text-engine-red">
                    <Car size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                      {v.registrationNumber}
                    </p>
                    <p className="truncate text-sm font-semibold text-zinc-700 dark:text-metallic">
                      {v.make} {v.model} · {v.manufactureYear}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-metallic">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 capitalize dark:bg-asphalt">{v.vehicleType}</span>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 capitalize dark:bg-asphalt">{v.fuelType}</span>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 capitalize dark:bg-asphalt">{v.transmission}</span>
                      {v.colour && <span className="rounded bg-zinc-100 px-2 py-0.5 capitalize dark:bg-asphalt">{v.colour}</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-white/10 dark:text-metallic">
                No vehicles added yet. Add your first vehicle above.
              </div>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}
