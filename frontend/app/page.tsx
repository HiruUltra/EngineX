import Link from "next/link";
import { BatteryCharging, Car, MapPinned, ShieldCheck, Star, Wrench } from "lucide-react";
import { Nav, Shell } from "@/components/ui";

const services = ["Engine problem", "Battery issue", "Flat tyre", "Overheating", "Towing request", "Electrical fault"];

export default function LandingPage() {
  return (
    <Shell>
      <Nav />
      <section className="relative overflow-hidden bg-asphalt">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(226,29,37,0.24),transparent_32%)]" />
        <div className="relative mx-auto grid min-h-[86vh] max-w-7xl content-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_.9fr]">
          <div className="max-w-2xl">
            <h1 className="font-display text-5xl font-bold leading-none text-white sm:text-7xl">EngineX</h1>
            <p className="mt-5 text-xl text-metallic">Premium roadside assistance for Sri Lankan drivers, with live mechanic tracking, transparent quotes and secure job workflows.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-md bg-action-red px-5 py-3 font-bold text-white shadow-red">Get Roadside Help</Link>
              <Link href="/login" className="rounded-md border border-white/15 px-5 py-3 font-semibold text-white">Login</Link>
            </div>
          </div>
          <div className="grid gap-3 self-end">
            {["Detect location", "Assign nearby verified mechanic", "Track ETA live", "Approve quote and pay"].map((item, index) => (
              <div key={item} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 text-white">
                <span className="flex size-10 items-center justify-center rounded-md bg-engine-red font-bold">{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[["24/7 verified mechanics", ShieldCheck], ["Live maps and ETA", MapPinned], ["Inspection to receipt", Wrench]].map(([title, Icon]) => (
            <div key={String(title)} className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-panel">
              <Icon className="text-engine-red" />
              <h2 className="mt-4 font-display text-2xl font-bold">{title as string}</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-metallic">Built for Colombo, Kandy, Galle and intercity breakdown scenarios with transparent workflow states.</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-zinc-100 py-14 dark:bg-panel/60">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-4xl font-bold">Services</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <div key={service} className="flex items-center gap-3 rounded-lg bg-white p-4 dark:bg-asphalt"><Car className="text-engine-red" />{service}</div>)}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl font-bold">Coverage</h2>
          <p className="mt-3 text-zinc-600 dark:text-metallic">Demo operations are seeded around Colombo, Rajagiriya, Nugegoda and Kandy with Sri Lankan coordinates and addresses.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-panel p-6 text-white">
          <Star className="text-amber-400" />
          <p className="mt-3">“Demo testimonial: EngineX showed the mechanic route and quote before work started.”</p>
          <p className="mt-2 text-sm text-metallic">Fictional customer demo content</p>
        </div>
      </section>
      <footer className="border-t border-white/10 bg-asphalt px-4 py-8 text-center text-sm text-metallic">EngineX demo platform. Test payments only.</footer>
    </Shell>
  );
}
