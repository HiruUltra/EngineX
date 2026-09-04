"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, ImageIcon, LocateFixed, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Nav, Select, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";

export default function RequestPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => endpoints.vehicles().then((r) => r.data.data) });
  const [form, setForm] = useState({ vehicle: "", serviceType: "repair", problemCategory: "battery issue", description: "", urgency: "normal", address: "Colombo 07", longitude: 79.8612, latitude: 6.9271, images: [] as string[] });
  const selectedVehicle = form.vehicle || vehicles.data?.[0]?._id || "";
  const hasVehicles = Boolean(vehicles.data?.length);
  const steps = useMemo(() => ["Location", "Vehicle", "Problem", "Photos", "Review"], []);
  useEffect(() => {
    const service = new URLSearchParams(window.location.search).get("service");
    if (service) setForm((current) => ({ ...current, problemCategory: service }));
  }, []);
  const create = useMutation({
    mutationFn: () => endpoints.createRequest({
      ...form,
      vehicle: selectedVehicle,
      description: form.description.trim().length >= 5 ? form.description.trim() : "Customer did not provide details."
    }),
    onSuccess: (res) => { toast.success("Searching for a mechanic"); router.push(`/tracking/${res.data.data._id}`); },
    onError: (error) => toast.error(getRequestErrorMessage(error))
  });
  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const remainingSlots = 5 - form.images.length;
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const uploadedUrls = [];
      for (const file of selectedFiles) {
        const data = new FormData();
        data.append("file", file);
        const res = await endpoints.upload(data);
        uploadedUrls.push(res.data.data.url);
      }
      return uploadedUrls;
    },
    onSuccess: (urls) => {
      setForm((current) => ({ ...current, images: [...current.images, ...urls].slice(0, 5) }));
      toast.success("Photo added");
    },
    onError: () => toast.error("Could not upload photo")
  });

  function detect() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setForm({ ...form, latitude: pos.coords.latitude, longitude: pos.coords.longitude, address: "Detected current location" }),
      () => toast.warning("Location permission rejected. Manual location is active.")
    );
  }

  function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    if (form.images.length >= 5) {
      toast.warning("You can attach up to 5 photos");
      return;
    }
    upload.mutate(files);
  }

  function removePhoto(url: string) {
    setForm({ ...form, images: form.images.filter((image) => image !== url) });
  }

  function getRequestErrorMessage(error: unknown) {
    if (typeof error === "object" && error && "response" in error) {
      const response = (error as { response?: { data?: { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } } } }).response;
      const fieldErrors = response?.data?.error?.details?.fieldErrors;
      const firstFieldError = fieldErrors && Object.values(fieldErrors).flat()[0];
      return firstFieldError || response?.data?.error?.message || "Could not create request";
    }
    return "Could not create request";
  }

  return <Shell><Nav /><section className="mx-auto max-w-4xl px-4 py-8">
    <h1 className="font-display text-4xl font-bold">Request Assistance</h1>
    <div className="mt-5 grid grid-cols-5 gap-1.5 text-[10px] font-semibold sm:gap-2 sm:text-xs">{steps.map((s, i) => <div key={s} className="truncate rounded-md bg-zinc-200 p-2 text-center text-zinc-800 dark:bg-panel dark:text-white">{i + 1}. {s}</div>)}</div>
    <div className="mt-6 grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-panel sm:p-6">
      <Button onClick={detect} className="w-full"><LocateFixed size={18} /> Detect current GPS location</Button>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Address / Landmark</label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Longitude</label>
          <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} placeholder="Longitude" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Latitude</label>
          <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} placeholder="Latitude" />
        </div>
      </div>
      <div className="grid gap-1">
        <label className="block text-xs font-medium text-zinc-500 dark:text-metallic">Vehicle</label>
        <Select
          value={selectedVehicle}
          onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
          disabled={vehicles.isLoading || !hasVehicles}
          aria-label="Vehicle"
        >
          <option value="">
            {vehicles.isLoading ? "Loading vehicles..." : hasVehicles ? "Select vehicle" : "No vehicles saved yet"}
          </option>
          {vehicles.data?.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber} - {v.make} {v.model}</option>)}
        </Select>
        {!vehicles.isLoading && !hasVehicles ? <Link href="/vehicles" className="text-sm font-semibold text-engine-red">Add a vehicle first</Link> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Problem</label>
          <Select value={form.problemCategory} onChange={(e) => setForm({ ...form, problemCategory: e.target.value })}>{["engine problem", "battery issue", "flat tyre", "overheating", "fuel problem", "electrical fault", "brake issue", "accident damage", "towing request", "unknown problem", "other"].map((v) => <option key={v}>{v}</option>)}</Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Urgency</label>
          <Select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>{["low", "normal", "high", "emergency"].map((v) => <option key={v}>{v}</option>)}</Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Service type</label>
          <Select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>{["inspection", "repair", "towing"].map((v) => <option key={v}>{v}</option>)}</Select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Problem description</label>
        <Input placeholder="Describe what happened (e.g. Engine won't crank, smoke from hood)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid gap-3 rounded-md border border-dashed border-zinc-300 p-4 text-sm dark:border-white/20">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            uploadPhotos(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            uploadPhotos(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={() => cameraInputRef.current?.click()} disabled={upload.isPending || form.images.length >= 5} className="bg-panel shadow-none ring-1 ring-white/10 hover:bg-zinc-800">
            <Camera size={18} /> Take photo
          </Button>
          <Button type="button" onClick={() => galleryInputRef.current?.click()} disabled={upload.isPending || form.images.length >= 5} className="bg-panel shadow-none ring-1 ring-white/10 hover:bg-zinc-800">
            <ImageIcon size={18} /> Select from gallery
          </Button>
        </div>
        {form.images.length ? <div className="grid gap-2 sm:grid-cols-2">
          {form.images.map((url) => <div key={url} className="flex items-center justify-between gap-3 rounded-md bg-zinc-100 px-3 py-2 text-zinc-950 dark:bg-asphalt dark:text-white">
            <span className="truncate">{url}</span>
            <button type="button" onClick={() => removePhoto(url)} aria-label="Remove photo" className="focus-ring rounded p-1 text-engine-red"><X size={16} /></button>
          </div>)}
        </div> : null}
      </div>
      <Button onClick={() => create.mutate()} disabled={create.isPending || !selectedVehicle}>Confirm request</Button>
    </div>
  </section></Shell>;
}
