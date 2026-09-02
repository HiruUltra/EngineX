"use client";
import { useQuery } from "@tanstack/react-query";
import { Nav, Shell, Stat } from "@/components/ui";
import { endpoints } from "@/lib/api";

export default function AdminPage() {
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: () => endpoints.analytics().then((r) => r.data.data as Record<string, number>) });
  return <Shell><Nav /><section className="mx-auto max-w-7xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Administrator Portal</h1>
    <div className="mt-6 grid gap-4 sm:grid-cols-4"><Stat label="Users" value={analytics.data?.users || 0} /><Stat label="Requests" value={analytics.data?.requests || 0} /><Stat label="Active jobs" value={analytics.data?.active || 0} /><Stat label="Revenue" value={`LKR ${analytics.data?.revenue || 0}`} /></div>
    <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-lg bg-white p-5 dark:bg-panel">User management, mechanic verification, service centers, disputes, payments, reviews and platform settings.</div><div className="rounded-lg bg-white p-5 dark:bg-panel">Important admin mutations write audit-log records on the backend.</div></div>
  </section></Shell>;
}
