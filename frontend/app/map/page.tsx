"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw, Wrench, AlertTriangle } from "lucide-react";
import { Nav, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

// Leaflet must be loaded client-side only
const LiveMapInner = dynamic(() => import("./live-map-inner"), { ssr: false, loading: () => <div className="flex h-[60vh] items-center justify-center rounded-xl bg-zinc-200 dark:bg-panel text-zinc-500">Loading map…</div> });

export default function LiveMapPage() {
  const user = useAuthStore((s) => s.user);
  const mechanics = useQuery({ queryKey: ["map-mechanics"], queryFn: () => endpoints.mapMechanics().then((r) => r.data.data as MechanicPin[]), refetchInterval: 10000 });
  const breakdowns = useQuery({ queryKey: ["map-breakdowns"], queryFn: () => endpoints.mapBreakdowns().then((r) => r.data.data as BreakdownPin[]), refetchInterval: 10000 });

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  return (
    <Shell>
      <Nav />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-engine-red">Live Operations</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold">Field Map</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-500 dark:text-metallic">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500 inline-block" /> {mechanics.data?.length ?? 0} mechanics</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-engine-red inline-block" /> {breakdowns.data?.length ?? 0} breakdowns</span>
            <button
              type="button"
              onClick={() => { mechanics.refetch(); breakdowns.refetch(); }}
              className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <LiveMapInner
          mechanics={mechanics.data ?? []}
          breakdowns={breakdowns.data ?? []}
          isManager={isManager}
        />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-6 text-sm text-zinc-500 dark:text-metallic">
          <span className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500"><Wrench size={12} /></span>
            Mechanic online
          </span>
          <span className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-500"><Wrench size={12} /></span>
            Mechanic on job
          </span>
          <span className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-engine-red/20 text-engine-red"><AlertTriangle size={12} /></span>
            Active breakdown
          </span>
          <span className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-red-900/20 text-red-400"><AlertTriangle size={12} /></span>
            Emergency breakdown
          </span>
        </div>

        {/* Side list */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {breakdowns.data && breakdowns.data.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-panel">
              <h2 className="font-display text-xl font-bold">Active Breakdowns</h2>
              <div className="mt-3 grid gap-2">
                {breakdowns.data.map((b) => (
                  <div key={String(b._id)} className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-asphalt">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-engine-red" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{b.problemCategory}</p>
                      <p className="text-xs text-zinc-500 dark:text-metallic truncate">{b.address}</p>
                      <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ${b.urgency === "emergency" ? "bg-red-500 text-white" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"}`}>{b.status} · {b.urgency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isManager && mechanics.data && mechanics.data.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-panel">
              <h2 className="font-display text-xl font-bold">Online Mechanics</h2>
              <div className="mt-3 grid gap-2">
                {mechanics.data.map((m) => (
                  <div key={String(m._id)} className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-asphalt">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-600">{m.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-metallic">{m.phone} · ⭐ {m.rating}</p>
                    </div>
                    <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${m.hasActiveJob ? "bg-amber-500/20 text-amber-600" : "bg-emerald-500/20 text-emerald-600"}`}>{m.hasActiveJob ? "On job" : "Available"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}

interface MechanicPin { _id: unknown; name: string; phone: string; rating: number; coordinates?: [number, number]; hasActiveJob: boolean; avatarUrl?: string }
interface BreakdownPin { _id: unknown; status: string; problemCategory: string; address: string; coordinates?: [number, number]; urgency: string }
