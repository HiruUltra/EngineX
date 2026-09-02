"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Nav, Select, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "CUSTOMER" });
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  async function submit() {
    try {
      const res = await endpoints.register(form);
      setSession(res.data.data.user, res.data.data.accessToken);
      toast.success(form.role === "MECHANIC" ? "Application created" : "Account created");
      router.push(form.role === "MECHANIC" ? "/mechanic" : "/dashboard");
    } catch {
      toast.error("Registration failed");
    }
  }
  return <Shell><Nav /><section className="mx-auto max-w-md px-4 py-12"><h1 className="font-display text-4xl font-bold">Create Account</h1><div className="mt-6 grid gap-3">
    {(["name", "email", "phone", "password"] as const).map((key) => <Input key={key} type={key === "password" ? "password" : "text"} placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
    <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="CUSTOMER">Customer</option><option value="MECHANIC">Mechanic application</option></Select>
    <Button onClick={submit}>Register</Button>
  </div></section></Shell>;
}
