"use client";
import Link from "next/link";
import { Bell, Car, LifeBuoy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Nav, Shell, Stat } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => endpoints.vehicles().then((r) => r.data.data) });
  const requests = useQuery({ queryKey: ["requests"], queryFn: () => endpoints.requests().then((r) => r.data.data.items) });
  const active = requests.data?.find((r) => !["COMPLETED", "CANCELLED_BY_CUSTOMER"].includes(r.currentStatus));
  return <Shell><Nav /><section className="mx-auto max-w-7xl px-4 py-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-display text-4xl font-bold">Hi {user?.name || "driver"}</h1><p className="text-zinc-500 dark:text-metallic">Your roadside command center.</p></div><Link href="/request" className="rounded-md bg-action-red px-5 py-3 text-center font-bold text-white shadow-red"><LifeBuoy className="inline" size={18} /> Request Assistance</Link></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Stat label="Saved vehicles" value={vehicles.data?.length || 0} /><Stat label="Total requests" value={requests.data?.length || 0} /><Stat label="Notifications" value="1" /></div>
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-white/10 bg-white p-5 dark:bg-panel"><h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Car /> Vehicles</h2>{vehicles.isLoading ? <p>Loading...</p> : vehicles.data?.map((v) => <p key={v._id} className="mt-3 rounded-md bg-zinc-100 p-3 dark:bg-asphalt">{v.registrationNumber} · {v.make} {v.model}</p>)}<Link href="/vehicles" className="mt-4 inline-block text-engine-red">Manage vehicles</Link></div>
      <div className="rounded-lg border border-white/10 bg-white p-5 dark:bg-panel"><h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Bell /> Active request</h2>{active ? <Link href={`/tracking/${active._id}`} className="mt-3 block rounded-md bg-zinc-100 p-3 dark:bg-asphalt">{active.problemCategory} · {active.currentStatus}</Link> : <p className="mt-3 text-zinc-500 dark:text-metallic">No active request.</p>}</div>
    </div>
  </section></Shell>;
}
