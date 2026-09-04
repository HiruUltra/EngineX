"use client";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPinned, Route, Send, ShieldAlert, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button, Nav, Shell, Stat } from "@/components/ui";
import { endpoints } from "@/lib/api";
import type { ServiceRequest } from "@/types/api";

const nextActions: Record<string, { label: string; status: string }[]> = {
  ASSIGNED: [{ label: "Accept job", status: "ACCEPTED" }],
  ACCEPTED: [{ label: "Start route", status: "EN_ROUTE" }],
  EN_ROUTE: [{ label: "Arrived", status: "ARRIVED" }],
  ARRIVED: [{ label: "Start inspection", status: "INSPECTING" }],
  QUOTE_APPROVED: [{ label: "Start repair", status: "REPAIRING" }],
  REPAIRING: [{ label: "Request payment", status: "PAYMENT_PENDING" }],
  PAYMENT_PENDING: [{ label: "Complete job", status: "COMPLETED" }]
};

export default function MechanicPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["mechanic-profile"], queryFn: () => endpoints.mechanicProfile().then((r) => r.data.data) });
  const requests = useQuery({ queryKey: ["mechanic-requests"], queryFn: () => endpoints.requests().then((r) => r.data.data.items) });
  const jobs = requests.data || [];
  const activeJobs = jobs.filter((job) => !["COMPLETED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_MECHANIC", "CANCELLED_BY_MANAGER", "DISPUTED"].includes(job.currentStatus));
  const completedJobs = jobs.filter((job) => job.currentStatus === "COMPLETED");
  const current = activeJobs[0];
  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => endpoints.status(id, next),
    onSuccess: () => {
      toast.success("Job updated");
      qc.invalidateQueries({ queryKey: ["mechanic-requests"] });
    },
    onError: () => toast.error("Could not update job")
  });
  const quote = useMutation({
    mutationFn: (id: string) => endpoints.quote(id, { labourFee: 2500, partsCost: 6500, serviceFee: 1000, taxes: 0, estimatedRepairMinutes: 90 }),
    onSuccess: () => {
      toast.success("Quote sent");
      qc.invalidateQueries({ queryKey: ["mechanic-requests"] });
    },
    onError: () => toast.error("Could not send quote")
  });

  const profileStatus = profile.data?.profileStatus ?? "payment_pending";
  const isPaymentPending = profileStatus === "payment_pending";
  const isPendingVerification = profileStatus === "pending_verification";
  const isApproved = profileStatus === "approved";
  const isRejected = profileStatus === "rejected";

  return <Shell><Nav /><section className="mx-auto max-w-6xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Mechanic Console</h1>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Stat label="Availability" value={profile.data?.isOnline ? "Online" : "Offline"} /><Stat label="Assigned jobs" value={isApproved ? activeJobs.length : 0} /><Stat label="Status" value={profileStatus.replace(/_/g, " ")} /></div>
    {isPaymentPending ? <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 text-amber-100">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><ShieldAlert /> Complete your profile</h2>
      <p className="mt-2 text-sm text-amber-50/80">Pay the one-time registration fee and submit your profile to start receiving jobs.</p>
      <Link href="/mechanic/register" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-amber-500 px-5 py-2 font-bold text-black">Set up profile & pay →</Link>
    </div> : null}
    {isPendingVerification ? <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 text-amber-100">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><ShieldAlert /> Application pending manager review</h2>
      <p className="mt-2 text-sm text-amber-50/80">Your registration fee was received and your profile is awaiting approval by a manager. You will be notified once approved.</p>
    </div> : null}
    {isRejected ? <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-5 text-red-100">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><ShieldAlert /> Application rejected</h2>
      <p className="mt-2 text-sm text-red-50/80">Your application was rejected. Please contact support or re-submit with updated documents.</p>
    </div> : null}
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-3">
        <h2 className="font-display text-2xl font-bold">Assigned jobs</h2>
        {requests.isLoading ? <div className="rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">Loading jobs...</div> : null}
        {!requests.isLoading && !activeJobs.length && isApproved ? <div className="rounded-lg border border-white/10 bg-white p-5 text-zinc-500 dark:bg-panel dark:text-metallic">No assigned jobs yet.</div> : null}
        {isApproved && activeJobs.map((job) => <JobCard
          key={job._id}
          job={job}
          busy={status.isPending || quote.isPending}
          onStatus={(next) => status.mutate({ id: job._id, next })}
          onQuote={() => quote.mutate(job._id)}
        />)}
      </div>
      <aside className="rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">
        <h2 className="font-display text-2xl font-bold">Current job</h2>
        {current ? <>
          <p className="mt-3 font-semibold">{current.problemCategory}</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-metallic">{current.address}</p>
          <div className="mt-4 grid gap-2 text-sm">
            <p className="flex items-center gap-2"><Route size={16} className="text-engine-red" /> {current.estimatedDistanceKm || 4.2} km away</p>
            <p className="flex items-center gap-2"><Clock size={16} className="text-engine-red" /> {current.estimatedArrivalMinutes || 14} min ETA</p>
          </div>
          <Link href={`/tracking/${current._id}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-action-red px-4 py-2 font-semibold text-white shadow-red"><MapPinned size={16} /> Open tracking</Link>
        </> : <p className="mt-3 text-zinc-500 dark:text-metallic">No active job selected.</p>}
      </aside>
    </div>
  </section></Shell>;
}

function JobCard({ job, busy, onStatus, onQuote }: { job: ServiceRequest; busy: boolean; onStatus: (next: string) => void; onQuote: () => void }) {
  const actions = nextActions[job.currentStatus] || [];
  return <article className="rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <span className="rounded-md bg-engine-red px-2 py-1 text-xs font-bold text-white">{job.currentStatus}</span>
        <h3 className="mt-3 font-display text-2xl font-bold">{job.problemCategory}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-metallic">{job.vehicle?.registrationNumber || "No vehicle"} - {job.vehicle?.make} {job.vehicle?.model}</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-metallic">{job.address}</p>
      </div>
      <Link href={`/tracking/${job._id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-2 font-semibold"><MapPinned size={16} /> Track</Link>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {actions.map((action) => <Button key={action.status} type="button" disabled={busy} onClick={() => onStatus(action.status)} className="shadow-none"><Wrench size={16} /> {action.label}</Button>)}
      {job.currentStatus === "INSPECTING" ? <Button type="button" disabled={busy} onClick={onQuote} className="shadow-none"><Send size={16} /> Send quote</Button> : null}
      {!actions.length && job.currentStatus !== "INSPECTING" ? <span className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-asphalt dark:text-metallic">Waiting for next role action</span> : null}
    </div>
  </article>;
}
