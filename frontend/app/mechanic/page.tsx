"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Nav, Shell, Stat } from "@/components/ui";
import { endpoints } from "@/lib/api";

export default function MechanicPage() {
  const qc = useQueryClient();
  const requests = useQuery({ queryKey: ["requests"], queryFn: () => endpoints.requests().then((r) => r.data.data.items) });
  const current = requests.data?.[0];
  const status = useMutation({ mutationFn: (next: string) => endpoints.status(current!._id, next), onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }) });
  const quote = useMutation({ mutationFn: () => endpoints.quote(current!._id, { labourFee: 2500, partsCost: 6500, serviceFee: 1000, taxes: 0, estimatedRepairMinutes: 90 }), onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }) });
  return <Shell><Nav /><section className="mx-auto max-w-6xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Mechanic Console</h1>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Stat label="Availability" value="Online" /><Stat label="Today earnings" value="LKR 12,500" /><Stat label="Rating" value="4.9" /></div>
    <div className="mt-6 rounded-lg border border-white/10 bg-white p-5 dark:bg-panel"><h2 className="font-display text-2xl font-bold">Current job</h2>{current ? <><p className="mt-2">{current.problemCategory} · {current.address}</p><div className="mt-4 flex flex-wrap gap-2">{["ACCEPTED", "EN_ROUTE", "ARRIVED", "INSPECTING", "QUOTE_SENT", "REPAIRING", "PAYMENT_PENDING"].map((s) => <Button key={s} onClick={() => s === "QUOTE_SENT" ? quote.mutate() : status.mutate(s)}>{s}</Button>)}</div></> : <p>No assigned jobs.</p>}</div>
  </section></Shell>;
}
