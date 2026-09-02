import { Nav, Shell } from "@/components/ui";

export default function ProfilePage() {
  return <Shell><Nav /><section className="mx-auto max-w-4xl px-4 py-8"><h1 className="font-display text-4xl font-bold">Profile</h1><div className="mt-6 grid gap-4 rounded-lg bg-white p-5 dark:bg-panel"><p>Personal information, phone number, saved addresses, emergency contact, notification preferences, theme preference, password change, account security and delete-account request controls.</p></div></section></Shell>;
}
