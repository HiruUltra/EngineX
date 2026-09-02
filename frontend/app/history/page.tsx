"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Nav, Shell } from "@/components/ui";
import { endpoints } from "@/lib/api";

export default function HistoryPage() {
  const requests = useQuery({ queryKey: ["requests"], queryFn: () => endpoints.requests().then((r) => r.data.data.items) });
  return <Shell><Nav /><section className="mx-auto max-w-5xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Request History</h1><div className="mt-6 grid gap-3">{requests.data?.map((r) => <Link href={`/tracking/${r._id}`} key={r._id} className="rounded-lg bg-white p-4 dark:bg-panel">{r.problemCategory} · {r.vehicle?.registrationNumber} · {r.currentStatus} · LKR {r.quotation?.total || 0}</Link>)}</div></section></Shell>;
}
