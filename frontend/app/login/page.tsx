"use client";
import { Eye, LogIn, Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Nav, Shell } from "@/components/ui";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("customer@enginex.lk");
  const [password, setPassword] = useState("EngineXDemo123!");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  function redirectToDashboard(role: string) {
    if (role === "MECHANIC") router.push("/mechanic");
    else if (role === "MANAGER") router.push("/manager");
    else if (role === "ADMIN") router.push("/admin");
    else router.push("/dashboard");
  }

  async function submit(roleIdentifier = identifier, rolePassword = password) {
    setSubmitting(true);
    try {
      const res = await endpoints.login(roleIdentifier, rolePassword);
      setSession(res.data.data.user, res.data.data.accessToken);
      toast.success("Welcome to EngineX");
      redirectToDashboard(res.data.data.user.role);
    } catch (error) {
      const message = typeof error === "object" && error && "response" in error
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : undefined;
      toast.error(message || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  if (syncingGoogle) {
    return (
      <Shell>
        <Nav />
        <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <Loader2 className="size-10 animate-spin text-engine-red" />
          <h2 className="mt-4 font-display text-2xl font-bold">Signing in with Google</h2>
          <p className="mt-2 text-sm text-zinc-400">Authenticating your Google account with EngineX…</p>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <Nav />
      <section className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-4xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-metallic">Access your EngineX account</p>

        <div className="mt-6 grid gap-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3.5 text-zinc-400" />
            <Input
              id="input-email"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email address or Phone number"
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Input
              id="input-password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              className="absolute right-3 top-3"
              onClick={() => setShow(!show)}
            >
              <Eye size={18} />
            </button>
          </div>
          <Button id="btn-email-login" onClick={() => submit()} disabled={submitting}>
            <LogIn size={18} /> {submitting ? "Signing in…" : "Login"}
          </Button>

          {process.env.NODE_ENV === "development" && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {["customer@enginex.lk", "mechanic@enginex.lk", "manager@enginex.lk", "admin@enginex.lk"].map((mail) => (
                <button
                  key={mail}
                  id={`btn-demo-${mail.split("@")[0]}`}
                  onClick={() => submit(mail, "EngineXDemo123!")}
                  className="rounded-md border border-white/10 p-2 hover:bg-white/5"
                >
                  {mail.split("@")[0]}
                </button>
              ))}
            </div>
          )}

          {/* Google Sign-In button at the bottom */}
          <div className="flex items-center gap-3 text-xs text-zinc-400 my-2">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            or continue with
            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
          </div>

          <GoogleLoginButton
            onStart={() => setSyncingGoogle(true)}
            onSuccess={(user, token) => {
              setSession(user, token);
              toast.success(`Welcome back, ${user.name}`);
              redirectToDashboard(user.role);
            }}
          />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-metallic">
          No account? <a href="/register" className="font-semibold text-engine-red hover:underline">Register here</a>
          {" · "}
          <a href="/mechanic/register" className="font-semibold text-engine-red hover:underline">Join as mechanic</a>
        </p>
      </section>
    </Shell>
  );
}
