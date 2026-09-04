 "use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu, Moon, PanelLeft, PanelLeftClose, Sun, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-action-red px-4 py-2 font-semibold text-white shadow-red disabled:opacity-50", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white px-3 text-sm text-zinc-950 placeholder:text-zinc-500 dark:bg-panel dark:text-white" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white px-3 text-sm text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-panel dark:text-white [&>option]:bg-white [&>option]:text-zinc-950 dark:[&>option]:bg-panel dark:[&>option]:text-white" {...props} />;
}

function useSidebarHidden() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = () => setHidden(window.localStorage.getItem("enginex-sidebar-hidden") === "true");
    sync();
    window.addEventListener("enginex-sidebar-change", sync);
    return () => window.removeEventListener("enginex-sidebar-change", sync);
  }, []);

  function setSidebarHidden(value: boolean) {
    setHidden(value);
    window.localStorage.setItem("enginex-sidebar-hidden", String(value));
    window.dispatchEvent(new Event("enginex-sidebar-change"));
  }

  return [hidden, setSidebarHidden] as const;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [sidebarHidden] = useSidebarHidden();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasSidebar = mounted && Boolean(user) && !sidebarHidden;
  return <main className={cn("min-h-screen bg-zinc-50 text-zinc-950 dark:bg-asphalt dark:text-white", hasSidebar && "lg:pl-64")}>{children}</main>;
}

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user: storedUser, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useSidebarHidden();

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? storedUser : undefined;
  const home = user?.role === "MECHANIC" ? "/mechanic" : user?.role === "MANAGER" ? "/manager" : user?.role === "ADMIN" ? "/admin" : user ? "/dashboard" : "/";
  const links = user ? [
    { href: home, label: "Overview" },
    ...(user.role === "CUSTOMER" ? [
      { href: "/request", label: "Request assistance" },
      { href: "/vehicles", label: "My vehicles" },
      { href: "/history", label: "Request history" }
    ] : []),
    { href: "/profile", label: "Profile" }
  ] : [];

  async function signOut() {
    try {
      await endpoints.logout();
    } finally {
      logout();
      setMenuOpen(false);
      router.push("/login");
    }
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      {user && !sidebarHidden ? <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-panel lg:flex">
        <Link href={home} onClick={closeMenu} className="flex h-16 items-center border-b border-zinc-200 pb-3 dark:border-white/10">
          <Image src="/brand/enginex-logo-cropped.jpeg" alt="EngineX" width={480} height={170} className="h-auto w-full object-contain" />
        </Link>
        <div className="mt-6 flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-engine-red font-display text-lg font-bold text-white">{user.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0"><p className="truncate font-semibold">{user.name}</p><p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-metallic">{user.role.toLowerCase()}</p></div>
        </div>
        <div className="mt-6 grid gap-1">
          {links.map((link) => <Link key={link.href} href={link.href} className={`focus-ring rounded-md px-3 py-3 font-semibold ${pathname === link.href ? "bg-engine-red text-white" : "text-zinc-700 hover:bg-zinc-100 dark:text-white dark:hover:bg-white/10"}`}>{link.label}</Link>)}
        </div>
        <button type="button" onClick={signOut} className="focus-ring mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 font-semibold text-engine-red dark:border-white/10"><LogOut size={17} /> Logout</button>
        <button type="button" onClick={() => setSidebarHidden(true)} aria-label="Hide sidebar" title="Hide sidebar" className="focus-ring mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-metallic dark:hover:bg-white/10"><PanelLeftClose size={17} /> Hide sidebar</button>
      </aside> : null}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-asphalt/95 lg:ml-0">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:py-3">
        <div className="fixed left-2 top-2 z-50 flex items-center gap-2 sm:left-4 sm:top-3 lg:left-4">
          {user && sidebarHidden ? <button type="button" onClick={() => setSidebarHidden(false)} aria-label="Show sidebar" title="Show sidebar" className="focus-ring hidden size-11 items-center justify-center rounded-md bg-engine-red text-white lg:inline-flex"><PanelLeft size={19} /></button> : null}
          {user ? <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} className="focus-ring inline-flex size-11 items-center justify-center rounded-md bg-engine-red text-white sm:hidden">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button> : null}
        </div>
        <Link href={home} onClick={closeMenu} className={cn("flex h-14 w-48 items-center sm:h-16 sm:w-64", user ? "ml-14 sm:ml-0 lg:hidden" : "mx-auto sm:mx-0")}>
          <Image
            src="/brand/enginex-logo-cropped.jpeg"
            alt="EngineX"
            width={480}
            height={170}
            className="h-auto w-full object-contain"
            priority
          />
        </Link>
        <div className="flex items-center gap-1 text-sm sm:gap-2">
          <button type="button" onClick={toggleTheme} aria-label="Toggle light and dark mode" title="Toggle light and dark mode" className="focus-ring inline-flex size-11 items-center justify-center rounded-md bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            {mounted ? (resolvedTheme === "dark" ? <Sun size={19} /> : <Moon size={19} />) : <span className="size-[19px]" />}
          </button>
          {user ? <>
            <div className={cn("hidden items-center gap-2 sm:flex", user.role === "CUSTOMER" && "lg:hidden")}>
              <Link href={home} className="rounded-md px-3 py-2 text-zinc-600 hover:text-zinc-950 dark:text-metallic dark:hover:text-white">{user.role.toLowerCase()}</Link>
              <Link href="/profile" className="rounded-md px-3 py-2 text-zinc-600 hover:text-zinc-950 dark:text-metallic dark:hover:text-white">Profile</Link>
              <button onClick={signOut} className="focus-ring inline-flex items-center gap-2 rounded-md bg-engine-red px-3 py-2 font-semibold text-white"><LogOut size={16} /> Logout</button>
            </div>
          </> : <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className="rounded-md px-3 py-2 text-zinc-600 hover:text-zinc-950 dark:text-metallic dark:hover:text-white">Login</Link>
            <Link href="/register" className="rounded-md bg-engine-red px-3 py-2 font-semibold text-white">Register</Link>
          </div>}
        </div>
      </nav>
      {user && menuOpen ? <>
        <button type="button" aria-label="Close navigation menu" onClick={closeMenu} className="fixed inset-0 top-[73px] bg-black/50 sm:hidden" />
        <aside className="absolute left-0 right-0 top-full border-b border-zinc-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-panel sm:hidden">
          <div className="mb-4 flex items-center gap-3 border-b border-zinc-200 pb-4 dark:border-white/10">
            <div className="flex size-11 items-center justify-center rounded-full bg-engine-red font-display text-lg font-bold text-white">{user.name.charAt(0).toUpperCase()}</div>
            <div><p className="font-semibold">{user.name}</p><p className="text-sm text-zinc-500 dark:text-metallic">{user.role.toLowerCase()}</p></div>
          </div>
          <div className="grid gap-1">
            {links.map((link) => <Link key={link.href} href={link.href} onClick={closeMenu} className={`focus-ring rounded-md px-3 py-3 font-semibold ${pathname === link.href ? "bg-engine-red text-white" : "text-zinc-700 hover:bg-zinc-100 dark:text-white dark:hover:bg-white/10"}`}>{link.label}</Link>)}
          </div>
          <button type="button" onClick={signOut} className="focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 font-semibold text-engine-red dark:border-white/10"><LogOut size={17} /> Logout</button>
        </aside>
      </> : null}
      </header>
    </>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-white/10 bg-white p-4 dark:bg-panel"><div className="text-2xl font-bold">{value}</div><div className="text-sm text-zinc-500 dark:text-metallic">{label}</div></div>;
}
