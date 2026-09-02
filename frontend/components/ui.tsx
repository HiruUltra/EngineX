import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-action-red px-4 py-2 font-semibold text-white shadow-red disabled:opacity-50", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white px-3 text-sm text-zinc-950 placeholder:text-zinc-500 dark:bg-panel dark:text-white" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white px-3 text-sm text-zinc-950 dark:bg-panel dark:text-white" {...props} />;
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-asphalt dark:text-white">{children}</main>;
}

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-asphalt/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex h-16 w-64 items-center">
          <Image
            src="/brand/enginex-logo-cropped.jpeg"
            alt="EngineX"
            width={480}
            height={170}
            className="h-auto w-full object-contain"
            priority
          />
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-md px-3 py-2 text-metallic hover:text-white">Login</Link>
          <Link href="/register" className="rounded-md bg-engine-red px-3 py-2 font-semibold text-white">Register</Link>
        </div>
      </nav>
    </header>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-white/10 bg-white p-4 dark:bg-panel"><div className="text-2xl font-bold">{value}</div><div className="text-sm text-zinc-500 dark:text-metallic">{label}</div></div>;
}
