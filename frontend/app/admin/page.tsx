"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Nav, Select, Shell, Stat } from "@/components/ui";
import { endpoints } from "@/lib/api";
import type { MechanicProfile, User } from "@/types/api";

export default function AdminPage() {
  const qc = useQueryClient();
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: () => endpoints.analytics().then((r) => r.data.data as Record<string, number>) });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => endpoints.users().then((r) => r.data.data) });
  const applications = useQuery({ queryKey: ["mechanic-applications"], queryFn: () => endpoints.mechanicApplications().then((r) => r.data.data) });
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
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Could not update mechanic application")
  });
  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => endpoints.updateUser(id, data),
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Could not update user")
  });

  const pending = applications.data?.filter((profile) => !profile.isVerified).length || 0;

  return <Shell><Nav /><section className="mx-auto max-w-7xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Administrator Portal</h1>
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"><Stat label="Users" value={analytics.data?.users || 0} /><Stat label="Requests" value={analytics.data?.requests || 0} /><Stat label="Active jobs" value={analytics.data?.active || 0} /><Stat label="Pending mechanics" value={pending} /></div>
    <section className="mt-6 rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Users /> User management</h2>
        <span className="text-sm text-zinc-500 dark:text-metallic">{users.data?.length || 0} users</span>
      </div>
      <div className="mt-4 grid gap-3">
        {users.isLoading ? <div className="rounded-md bg-zinc-100 p-4 dark:bg-asphalt">Loading users...</div> : null}
        {users.data?.map((user) => <UserEditor key={user._id || user.id} user={user} busy={updateUser.isPending} onSave={(data) => updateUser.mutate({ id: user._id || user.id, data })} />)}
      </div>
    </section>
    <section className="mt-6 rounded-lg border border-white/10 bg-white p-5 dark:bg-panel">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><ShieldCheck /> Mechanic applications</h2>
        <span className="text-sm text-zinc-500 dark:text-metallic">Admin and manager approval queue</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {applications.isLoading ? <div className="rounded-md bg-zinc-100 p-4 dark:bg-asphalt">Loading applications...</div> : null}
        {!applications.isLoading && !applications.data?.length ? <div className="rounded-md bg-zinc-100 p-4 text-zinc-500 dark:bg-asphalt dark:text-metallic">No mechanic applications yet.</div> : null}
        {applications.data?.map((profile) => <MechanicApplicationCard key={profile._id} profile={profile} busy={verify.isPending} onVerify={(isVerified) => verify.mutate({ id: profile._id, isVerified })} />)}
      </div>
    </section>
  </section></Shell>;
}

function UserEditor({ user, busy, onSave }: { user: User; busy: boolean; onSave: (data: Partial<User>) => void }) {
  const [draft, setDraft] = useState({
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl || "",
    isActive: user.isActive ?? true
  });

  return <article className="grid gap-3 rounded-md bg-zinc-100 p-4 dark:bg-asphalt lg:grid-cols-[1.2fr_1fr_150px_150px_1.2fr_120px]">
    <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} aria-label="User name" />
    <Input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} aria-label="User phone" />
    <Select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as User["role"] })} aria-label="User role">
      <option value="CUSTOMER">Customer</option>
      <option value="MECHANIC">Mechanic</option>
      <option value="MANAGER">Manager</option>
      <option value="ADMIN">Admin</option>
    </Select>
    <Select value={String(draft.isActive)} onChange={(event) => setDraft({ ...draft, isActive: event.target.value === "true" })} aria-label="Account status">
      <option value="true">Active</option>
      <option value="false">Disabled</option>
    </Select>
    <Input value={draft.avatarUrl} onChange={(event) => setDraft({ ...draft, avatarUrl: event.target.value })} placeholder="Avatar URL" aria-label="Avatar URL" />
    <Button type="button" disabled={busy} onClick={() => onSave(draft)} className="shadow-none"><Save size={16} /> Save</Button>
    <p className="text-sm text-zinc-500 dark:text-metallic lg:col-span-6">{user.email}</p>
  </article>;
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
