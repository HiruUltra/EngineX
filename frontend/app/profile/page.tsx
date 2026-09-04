"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Input, Nav, Select, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, setSession } = useAuthStore();
  const me = useQuery({ queryKey: ["me"], queryFn: () => endpoints.me().then((r) => r.data.data.user) });
  const [form, setForm] = useState({ name: "", phone: "", theme: "dark", avatarUrl: "" });

  useEffect(() => {
    const current = me.data || user;
    if (!current) return;
    setForm({ name: current.name, phone: current.phone, theme: current.theme || "dark", avatarUrl: current.avatarUrl || "" });
  }, [me.data, user]);

  const save = useMutation({
    mutationFn: () => endpoints.updateMe(form),
    onSuccess: (res) => {
      setSession(res.data.data.user, useAuthStore.getState().accessToken || "");
      toast.success("Profile updated");
    },
    onError: () => toast.error("Could not update profile")
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const data = new FormData();
      data.append("file", file);
      const res = await endpoints.upload(data);
      return res.data.data.url;
    },
    onSuccess: (url) => {
      setForm((current) => ({ ...current, avatarUrl: url }));
      toast.success("Profile picture selected");
    },
    onError: () => toast.error("Could not upload profile picture")
  });

  const avatarSrc = form.avatarUrl || "/brand/enginex-logo-cropped.jpeg";

  return <Shell><Nav /><section className="mx-auto max-w-4xl px-4 py-8">
    <h1 className="font-display text-4xl font-bold">Profile</h1>
    <div className="mt-6 grid gap-6 rounded-lg border border-white/10 bg-white p-5 dark:bg-panel md:grid-cols-[220px_1fr]">
      <div className="grid content-start gap-3">
        <div className="aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-asphalt">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt="Profile picture" className="h-full w-full object-cover" />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload.mutate(file);
            event.target.value = "";
          }}
        />
        <Button type="button" onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="shadow-none"><Camera size={18} /> Set picture</Button>
      </div>
      <div className="grid content-start gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Full Name</label>
          <Input placeholder="Full Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Email (Account)</label>
          <Input disabled value={user?.email || ""} className="cursor-not-allowed opacity-75" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Phone Number</label>
          <Input placeholder="Phone Number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-metallic">Theme Preference</label>
          <Select value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })} aria-label="Theme">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </Select>
        </div>
        <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}><Save size={18} /> Save profile</Button>
      </div>
    </div>
  </section></Shell>;
}
