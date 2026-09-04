"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Nav, Select, Shell } from "@/components/ui";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "CUSTOMER" });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  async function submit() {
    if (form.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (!form.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (form.phone.trim().length < 7) {
      toast.error("Phone number must be at least 7 digits");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await endpoints.register(form);
      setSession(res.data.data.user, res.data.data.accessToken);
      toast.success(form.role === "MECHANIC" ? "Application created" : "Account created");
      router.push(form.role === "MECHANIC" ? "/mechanic" : "/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } } } };
      const fieldErrors = axiosErr?.response?.data?.error?.details?.fieldErrors;
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        const errorList = Object.entries(fieldErrors)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
        toast.error(errorList);
      } else {
        toast.error(axiosErr?.response?.data?.error?.message || "Registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    { key: "name", label: "Full Name", type: "text", placeholder: "Full Name (min 2 characters)" },
    { key: "email", label: "Email Address", type: "email", placeholder: "Email (e.g. name@example.com)" },
    { key: "phone", label: "Phone Number", type: "tel", placeholder: "Phone (min 7 digits)" },
    { key: "password", label: "Password", type: "password", placeholder: "Password (min 8 characters)" }
  ] as const;

  return (
    <Shell>
      <Nav />
      <section className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-4xl font-bold">Create Account</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-metallic">Join EngineX as customer or roadside mechanic</p>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-6 grid gap-3">
          {fields.map(({ key, type, placeholder }) => (
            <Input
              key={key}
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="CUSTOMER">Customer</option>
            <option value="MECHANIC">Mechanic application</option>
          </Select>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Register"}
          </Button>

          {/* Google Sign-In / Sign-Up at bottom */}
          <div className="flex items-center gap-3 text-xs text-zinc-400 my-2">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            or sign up with
            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
          </div>

          <GoogleLoginButton
            role={form.role}
            label="Sign up with Google"
            onSuccess={(user, token) => {
              setSession(user, token);
              toast.success(`Welcome to EngineX, ${user.name}`);
              router.push(user.role === "MECHANIC" ? "/mechanic" : "/dashboard");
            }}
          />
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-metallic">
          Already have an account? <Link href="/login" className="font-semibold text-engine-red hover:underline">Login here</Link>
          {" · "}
          <Link href="/mechanic/register" className="font-semibold text-engine-red hover:underline">Mechanic portal</Link>
        </p>
      </section>
    </Shell>
  );
}
