"use client";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Nav, Shell, Stat } from "@/components/ui";
import { endpoints } from "@/lib/api";

export default function ManagerPage() {
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: () => endpoints.analytics().then((r) => r.data.data as Record<string, number>) });
  const data = [{ name: "Mon", jobs: 12 }, { name: "Tue", jobs: 16 }, { name: "Wed", jobs: 21 }, { name: "Thu", jobs: 18 }];
  return <Shell><Nav /><section className="mx-auto max-w-7xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Service Center Operations</h1>
    <div className="mt-6 grid gap-4 sm:grid-cols-4"><Stat label="Active requests" value={analytics.data?.active || 0} /><Stat label="Completed" value={analytics.data?.completed || 0} /><Stat label="Revenue" value={`LKR ${analytics.data?.revenue || 0}`} /><Stat label="Satisfaction" value={analytics.data?.satisfaction || 0} /></div>
    <div className="mt-6 h-72 rounded-lg bg-white p-4 dark:bg-panel"><ResponsiveContainer><AreaChart data={data}><XAxis dataKey="name" /><YAxis /><Area dataKey="jobs" fill="#E21D25" stroke="#FF2A2A" /></AreaChart></ResponsiveContainer></div>
    <div className="mt-6 rounded-lg bg-white p-5 dark:bg-panel">Pending unassigned requests, manual assignment, mechanic schedules, quotation review and CSV export are API-ready manager workflows.</div>
  </section></Shell>;
}
