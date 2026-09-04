"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, History, MapPin, Wrench } from "lucide-react";
import { Nav, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  REPAIRING: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  INSPECTING: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  EN_ROUTE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  ASSIGNED: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  SEARCHING: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  NO_MECHANIC_AVAILABLE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export default function HistoryPage() {
  const requests = useQuery({
    queryKey: ["requests"],
    queryFn: () => endpoints.requests().then((r) => r.data.data.items)
  });

  return (
    <Shell>
      <Nav />
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Request History</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-metallic">View and track all past and active roadside assistance requests</p>
        </div>

        <div className="mt-6 grid gap-3">
          {requests.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-panel" />
              ))}
            </div>
          ) : requests.data?.length ? (
            requests.data.map((r) => {
              const statusStyle = statusColors[r.currentStatus] || "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
              const formattedDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent";

              return (
                <Link
                  href={`/tracking/${r._id}`}
                  key={r._id}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-panel sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-engine-red/10 text-engine-red">
                      <Wrench size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg font-bold capitalize text-zinc-900 dark:text-white">
                          {r.problemCategory}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusStyle}`}>
                          {r.currentStatus.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-2 text-sm text-zinc-600 dark:text-metallic">
                        <span className="font-medium text-zinc-900 dark:text-white">{r.vehicle?.registrationNumber || "Vehicle"}</span>
                        {r.vehicle?.make && <span>· {r.vehicle.make} {r.vehicle.model}</span>}
                      </p>
                      <p className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1"><MapPin size={13} /> {r.address}</span>
                        <span className="flex items-center gap-1"><Calendar size={13} /> {formattedDate}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-white/5 sm:border-0 sm:pt-0 sm:text-right">
                    <div>
                      <p className="text-xs font-medium text-zinc-400">Total Quote</p>
                      <p className="font-display text-lg font-bold text-zinc-900 dark:text-white">
                        {r.quotation?.total ? `LKR ${r.quotation.total.toLocaleString()}` : "Pending"}
                      </p>
                    </div>
                    <ChevronRight size={18} className="ml-4 text-zinc-400" />
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-white/10 dark:text-metallic">
              <History size={36} className="mx-auto text-zinc-400" />
              <p className="mt-3 font-semibold">No requests found</p>
              <p className="mt-1 text-sm">When you request roadside assistance, your service history will show here.</p>
              <Link href="/request" className="mt-4 inline-flex rounded-md bg-action-red px-4 py-2 text-sm font-semibold text-white">
                Request Assistance
              </Link>
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}
