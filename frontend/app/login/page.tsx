"use client";
import { Eye, LogIn } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Nav, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const [email, setEmail] = useState("customer@enginex.lk");
  const [password, setPassword] = useState("EngineXDemo123!");
  const [show, setShow] = useState(false);
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  async function submit(roleEmail = email) {
    try {
      const res = await endpoints.login(roleEmail, password);
      setSession(res.data.data.user, res.data.data.accessToken);
      toast.success("Welcome to EngineX");
      const role = res.data.data.user.role;
      router.push(role === "MECHANIC" ? "/mechanic" : role === "MANAGER" ? "/manager" : role === "ADMIN" ? "/admin" : "/dashboard");
    } catch {
      toast.error("Login failed. Check the API server and credentials.");
    }
  }
  return (
    <Shell><Nav /><section className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Login</h1>
      <div className="mt-6 grid gap-3">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <div className="relative"><Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /><button className="absolute right-3 top-3" onClick={() => setShow(!show)}><Eye size={18} /></button></div>
        <Button onClick={() => submit()}><LogIn size={18} /> Login</Button>
        {process.env.NODE_ENV === "development" && <div className="grid grid-cols-2 gap-2 text-sm">{["customer@enginex.lk", "mechanic@enginex.lk", "manager@enginex.lk", "admin@enginex.lk"].map((mail) => <button key={mail} onClick={() => submit(mail)} className="rounded-md border border-white/10 p-2">{mail.split("@")[0]}</button>)}</div>}
      </div>
    </section></Shell>
  );
}
