"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CheckCircle2, ClipboardList, Download, Search, Truck, UserCheck, UserX, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button, Nav, Select, Shell, Stat } from "@/components/ui";
import { endpoints } from "@/lib/api";
import type { MechanicProfile, ServiceRequest } from "@/types/api";

const activeStatuses = ["SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "INSPECTING", "REPAIRING", "PAYMENT_PENDING"];
const tabs = ["Active", "Unassigned", "Completed", "All"] as const;

export default function ManagerPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Active");
  const qc = useQueryClient();
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: () => endpoints.analytics().then((r) => r.data.data as Record<string, number>) });
  const requests = useQuery({ queryKey: ["manager-requests"], queryFn: () => endpoints.requests().then((r) => r.data.data.items) });
  const applications = useQuery({ queryKey: ["mechanic-applications"], queryFn: () => endpoints.mechanicApplications().then((r) => r.data.data) });
  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => endpoints.status(id, next),
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["manager-requests"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Could not update request")
  });
  const verify = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) => endpoints.updateMechanicApplication(id, {
      isVerified,
      isOnline: isVerified,
      skills: ["engine", "battery", "tyres", "electrical"],
      supportedVehicleTypes: ["motorcycle", "three-wheeler", "car", "van", "truck"]
    }),
    onSuccess: () => {
      toast.success("Mechanic application updated");
      qc.invalidateQueries({ queryKey: ["mechanic-applications"] });
    },
    onError: () => toast.error("Could not update mechanic application")
  });

  const filtered = useMemo(() => {
    const items = requests.data || [];
    if (tab === "Unassigned") return items.filter((request) => request.currentStatus === "NO_MECHANIC_AVAILABLE" || !request.assignedMechanic);
    if (tab === "Completed") return items.filter((request) => request.currentStatus === "COMPLETED");
    if (tab === "Active") return items.filter((request) => activeStatuses.includes(request.currentStatus));
    return items;
  }, [requests.data, tab]);

  const data = [{ name: "Mon", jobs: 12 }, { name: "Tue", jobs: 16 }, { name: "Wed", jobs: 21 }, { name: "Thu", jobs: 18 }];

  function exportCsv() {
    const rows = [
      ["id", "status", "problem", "service", "urgency", "vehicle", "address"],
      ...filtered.map((request) => [
        request._id,
        request.currentStatus,
        request.problemCategory,
        request.serviceType,
        request.urgency,
        request.vehicle?.registrationNumber || "",
        request.address
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `enginex-${tab.toLowerCase()}-requests.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <Shell><Nav /><section className="mx-auto max-w-7xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Service Center Operations</h1>
    <div className="mt-6 grid gap-4 sm:grid-cols-4"><Stat label="Active requests" value={analytics.data?.active || 0} /><Stat label="Completed" value={analytics.data?.completed || 0} /><Stat label="Revenue" value={`LKR ${analytics.data?.revenue || 0}`} /><Stat label="Satisfaction" value={analytics.data?.satisfaction || 0} /></div>
    <div className="mt-6 h-72 rounded-lg bg-white p-4 dark:bg-panel"><ResponsiveContainer><AreaChart data={data}><XAxis dataKey="name" /><YAxis /><Area dataKey="jobs" fill="#E21D25" stroke="#FF2A2A" /></AreaChart></ResponsiveContainer></div>
    <section className="mt-6 rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl font-bold">Mechanic applications</h2>
        <span className="text-sm text-zinc-500 dark:text-metallic">{applications.data?.filter((profile) => !profile.isVerified).length || 0} pending</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {applications.isLoading ? <div className="rounded-md bg-zinc-100 p-4 dark:bg-asphalt">Loading applications...</div> : null}
        {!applications.isLoading && !applications.data?.length ? <div className="rounded-md bg-zinc-100 p-4 text-zinc-500 dark:bg-asphalt dark:text-metallic">No mechanic applications yet.</div> : null}
        {applications.data?.map((profile) => <MechanicApplicationCard key={profile._id} profile={profile} busy={verify.isPending} onVerify={(isVerified) => verify.mutate({ id: profile._id, isVerified })} />)}
      </div>
    </section>
    <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="grid content-start gap-2 rounded-lg border border-white/10 bg-white p-3 dark:bg-panel">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`flex items-center gap-2 rounded-md px-3 py-2 text-left font-semibold ${tab === item ? "bg-action-red text-white" : "bg-zinc-100 text-zinc-900 dark:bg-asphalt dark:text-white"}`}><ClipboardList size={16} /> {item}</button>)}
        <Button type="button" onClick={exportCsv} disabled={!filtered.length} className="mt-2 shadow-none"><Download size={16} /> Export CSV</Button>
      </aside>
      <div className="grid gap-3">
        {requests.isLoading ? <div className="rounded-lg bg-white p-5 dark:bg-panel">Loading requests...</div> : null}
        {!requests.isLoading && !filtered.length ? <div className="rounded-lg bg-white p-5 text-zinc-500 dark:bg-panel dark:text-metallic">No {tab.toLowerCase()} requests found.</div> : null}
        {filtered.map((request) => <RequestCard key={request._id} request={request} onStatus={(next) => status.mutate({ id: request._id, next })} busy={status.isPending} />)}
      </div>
    </div>
  </section></Shell>;
}

function MechanicApplicationCard({ profile, busy, onVerify }: { profile: MechanicProfile; busy: boolean; onVerify: (isVerified: boolean) => void }) {
  return <article className="rounded-md bg-zinc-100 p-4 dark:bg-asphalt">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-semibold">{profile.user.name}</p>
        <p className="text-sm text-zinc-500 dark:text-metallic">{profile.user.email}</p>
        <p className="mt-2 text-sm">{profile.isVerified ? "Approved mechanic" : "Pending approval"}</p>
      </div>
      <span className={`rounded-md px-2 py-1 text-xs font-bold ${profile.isVerified ? "bg-emerald-600 text-white" : "bg-amber-500 text-black"}`}>{profile.isVerified ? "APPROVED" : "PENDING"}</span>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <Button type="button" disabled={busy || profile.isVerified} onClick={() => onVerify(true)} className="shadow-none"><UserCheck size={16} /> Approve</Button>
      <Button type="button" disabled={busy || !profile.isVerified} onClick={() => onVerify(false)} className="bg-zinc-700 shadow-none"><UserX size={16} /> Suspend</Button>
    </div>
  </article>;
}

function RequestCard({ request, onStatus, busy }: { request: ServiceRequest; onStatus: (next: string) => void; busy: boolean }) {
  return <article className="rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-engine-red px-2 py-1 text-xs font-bold text-white">{request.currentStatus}</span>
          <span className="text-sm text-zinc-500 dark:text-metallic">{request.urgency} urgency</span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold">{request.problemCategory}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-metallic">{request.vehicle?.registrationNumber || "No vehicle"} - {request.vehicle?.make} {request.vehicle?.model}</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-metallic">{request.address}</p>
      </div>
      <Link href={`/tracking/${request._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-2 font-semibold"><Search size={16} /> View</Link>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      <Button type="button" disabled={busy || request.currentStatus !== "NO_MECHANIC_AVAILABLE"} onClick={() => onStatus("SEARCHING")} className="shadow-none"><Truck size={16} /> Re-search</Button>
      <Button type="button" disabled={busy || request.currentStatus !== "QUOTE_REJECTED"} onClick={() => onStatus("DISPUTED")} className="shadow-none"><Wrench size={16} /> Mark dispute</Button>
      <Select value={request.currentStatus} onChange={(e) => onStatus(e.target.value)} disabled={busy} aria-label="Request status">
        {["SEARCHING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "INSPECTING", "QUOTE_SENT", "QUOTE_APPROVED", "REPAIRING", "PAYMENT_PENDING", "COMPLETED", "NO_MECHANIC_AVAILABLE", "DISPUTED"].map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
    </div>
    {request.currentStatus === "COMPLETED" ? <p className="mt-3 flex items-center gap-2 text-sm text-emerald-500"><CheckCircle2 size={16} /> Completed job</p> : null}
  </article>;
}
