"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, MessageCircle, Phone, Star } from "lucide-react";
import { Button, Nav, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const TrackingMap = dynamic(() => import("@/components/tracking-map"), { ssr: false, loading: () => <div className="h-[360px] rounded-lg bg-panel" /> });

export default function TrackingPage({ params }: { params: { id: string } }) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [live, setLive] = useState<[number, number]>([79.872, 6.92]);
  const req = useQuery({ queryKey: ["request", params.id], queryFn: () => endpoints.requests().then((r) => r.data.data.items.find((x) => x._id === params.id)!) });
  useEffect(() => {
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", { auth: { token } });
    socket.emit("request:join", params.id);
    socket.on("mechanic:location-updated", (payload) => {
      setLive((current) => payload.location?.coordinates || payload.coordinates || current);
    });
    socket.on("request:status-changed", () => qc.invalidateQueries({ queryKey: ["request", params.id] }));
    socket.on("quote:created", () => qc.invalidateQueries({ queryKey: ["request", params.id] }));
    return () => { socket.disconnect(); };
  }, [params.id, token, qc]);
  const approve = useMutation({ mutationFn: () => endpoints.approveQuote(params.id), onSuccess: () => qc.invalidateQueries({ queryKey: ["request", params.id] }) });
  const pay = useMutation({ mutationFn: () => endpoints.pay(params.id, "cash"), onSuccess: () => qc.invalidateQueries({ queryKey: ["request", params.id] }) });
  const request = req.data;
  return <Shell><Nav /><section className="mx-auto max-w-7xl px-4 py-6">
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]"><TrackingMap mechanic={live} customer={[79.8612, 6.9271]} /><aside className="rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">
      <h1 className="font-display text-3xl font-bold">{request?.currentStatus || "Live tracking"}</h1>
      <p className="mt-2 text-zinc-500 dark:text-metallic">{request?.address} · {request?.estimatedArrivalMinutes || 14} min · {request?.estimatedDistanceKm || 4.2} km</p>
      <div className="mt-4 rounded-md bg-zinc-100 p-4 dark:bg-asphalt"><p className="font-semibold">{request?.assignedMechanic?.name || "Mechanic assigning"}</p><p className="text-sm text-zinc-500 dark:text-metallic"><Star className="inline text-amber-400" size={16} /> 4.9 · {request?.assignedMechanic?.phone || "+94 demo"}</p></div>
      <div className="mt-4 grid grid-cols-2 gap-2"><Button><Phone size={18} /> Call</Button><Button className="bg-panel dark:bg-zinc-800"><MessageCircle size={18} /> Chat</Button></div>
      <ol className="mt-5 space-y-2 text-sm">{request?.statusHistory?.map((h, i) => <li key={`${h.status}-${i}`} className="rounded-md bg-zinc-100 p-2 dark:bg-asphalt">{h.status}</li>)}</ol>
      {request?.quotation && <div className="mt-5 rounded-md border border-engine-red/40 p-4"><p className="font-bold">Quote LKR {request.quotation.total}</p><Button className="mt-3 w-full" onClick={() => approve.mutate()}>Approve Quote</Button></div>}
      {request?.currentStatus === "QUOTE_APPROVED" && <Button className="mt-4 w-full" onClick={() => pay.mutate()}><CreditCard size={18} /> Pay test cash receipt</Button>}
      <p className="mt-4 text-xs text-amber-500">Development tracking may be simulated. Call local emergency services when safety is at risk.</p>
    </aside></div>
  </section></Shell>;
}
