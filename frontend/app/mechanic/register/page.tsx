"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, CreditCard, FileText, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Nav, Shell } from "@/components/ui";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { endpoints } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const VEHICLE_TYPES = ["motorcycle", "three-wheeler", "car", "van", "truck", "bus", "other"];
const SKILL_OPTIONS = ["Engine repair", "Battery & electrical", "Tyre & wheel", "Brakes", "AC & cooling", "Suspension", "Transmission", "Towing", "Fuel system", "Bodywork"];
const STEPS = ["Profile", "Payment", "Done"] as const;

export default function MechanicRegisterPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<{ receiptNumber: string; amount: number } | null>(null);

  // Profile form state
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);

  // Payment state
  const [payMethod, setPayMethod] = useState<"card" | "online">("card");
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  function toggleSkill(s: string) {
    setSelectedSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function toggleVehicle(v: string) {
    setSelectedVehicleTypes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  async function handleProfileNext() {
    if (selectedSkills.length === 0) { toast.error("Select at least one skill"); return; }
    if (selectedVehicleTypes.length === 0) { toast.error("Select at least one vehicle type"); return; }
    setStep(1);
  }

  async function handlePayment() {
    if (payMethod === "card") {
      if (cardNum.replace(/\s/g, "").length < 13) { toast.error("Invalid card number"); return; }
      if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) { toast.error("Invalid expiry (MM/YY)"); return; }
      if (cardCvv.length < 3) { toast.error("Invalid CVV"); return; }
    }
    setLoading(true);
    try {
      // Step 1: pay registration fee
      const payRes = await endpoints.mechanicRegistrationPayment(payMethod);
      const { receiptNumber, amount } = payRes.data.data;
      // Step 2: submit profile
      await endpoints.submitMechanicProfile({
        skills: selectedSkills,
        supportedVehicleTypes: selectedVehicleTypes
      });
      setReceipt({ receiptNumber, amount });
      setStep(2);
      toast.success("Profile submitted! Awaiting manager verification.");
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== "MECHANIC") {
    return (
      <Shell>
        <Nav />
        <section className="mx-auto max-w-md px-4 py-16 text-center">
          <ShieldCheck size={40} className="mx-auto text-engine-red" />
          <h1 className="mt-4 font-display text-3xl font-bold">Mechanic Portal</h1>
          <p className="mt-3 text-zinc-500 dark:text-metallic">Sign in or register as a mechanic to complete your verification and profile.</p>
          <div className="mt-6 grid gap-3">
            <GoogleLoginButton
              role="MECHANIC"
              label="Join as Mechanic with Google"
              onSuccess={(u, token) => {
                useAuthStore.getState().setSession(u, token);
                toast.success(`Welcome, ${u.name}`);
                router.push("/mechanic/register");
              }}
            />
            <a href="/register" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-action-red px-5 py-2 font-bold text-white shadow-red hover:brightness-110">
              Register with Email / Phone
            </a>
            <a href="/login" className="text-sm font-semibold text-zinc-400 hover:text-white">
              Already have an account? Login here
            </a>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <Nav />
      <section className="mx-auto max-w-2xl px-4 py-10">
        {/* Step indicator */}
        <div className="mb-10 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-engine-red text-white" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-metallic"}`}>
                {i < step ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-sm font-semibold ${i === step ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>{label}</span>
              {i < STEPS.length - 1 && <ChevronRight size={16} className="text-zinc-300" />}
            </div>
          ))}
        </div>

        {/* Step 0: Profile form */}
        {step === 0 && (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-engine-red/10 text-engine-red"><Wrench size={24} /></div>
              <div>
                <h1 className="font-display text-3xl font-bold">Set up your mechanic profile</h1>
                <p className="text-sm text-zinc-500 dark:text-metallic">Tell us about your skills and what vehicles you service</p>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-panel">
              <h2 className="font-display text-xl font-bold">Your skills</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-metallic">Select all that apply</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${selectedSkills.includes(skill) ? "bg-engine-red text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-asphalt dark:text-metallic dark:hover:bg-white/10"}`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-panel">
              <h2 className="font-display text-xl font-bold">Vehicle types you service</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVehicle(v)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${selectedVehicleTypes.includes(v) ? "bg-engine-red text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-asphalt dark:text-metallic dark:hover:bg-white/10"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button id="btn-profile-next" onClick={handleProfileNext} disabled={loading}>
                Next — Registration fee <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Payment */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-engine-red/10 text-engine-red"><CreditCard size={24} /></div>
              <div>
                <h1 className="font-display text-3xl font-bold">Registration fee</h1>
                <p className="text-sm text-zinc-500 dark:text-metallic">One-time payment to activate your mechanic account</p>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-panel">
              <div className="flex items-baseline justify-between">
                <span className="text-zinc-500 dark:text-metallic">Registration fee</span>
                <span className="font-display text-4xl font-bold">LKR 2,500</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">One-time fee. No recurring charges.</p>
              <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-white/10">
                <div className="mb-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod("card")}
                    className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${payMethod === "card" ? "border-engine-red bg-engine-red/10 text-engine-red" : "border-zinc-200 dark:border-white/10"}`}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("online")}
                    className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${payMethod === "online" ? "border-engine-red bg-engine-red/10 text-engine-red" : "border-zinc-200 dark:border-white/10"}`}
                  >
                    🏦 Online Banking
                  </button>
                </div>
                {payMethod === "card" && (
                  <div className="grid gap-3">
                    <Input
                      id="input-card-number"
                      placeholder="Card number"
                      value={cardNum}
                      onChange={(e) => setCardNum(e.target.value.replace(/[^\d\s]/g, "").slice(0, 19))}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input id="input-card-expiry" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} maxLength={5} />
                      <Input id="input-card-cvv" placeholder="CVV" type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} maxLength={4} />
                    </div>
                  </div>
                )}
                {payMethod === "online" && (
                  <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-asphalt dark:text-metallic">
                    <p>You will be redirected to your bank&apos;s secure payment page after clicking Pay.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button type="button" onClick={() => setStep(0)} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Back</button>
              <Button id="btn-pay-register" onClick={handlePayment} disabled={loading}>
                {loading ? "Processing…" : "Pay LKR 2,500 & Submit"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div className="text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold">You&apos;re in the queue!</h1>
            <p className="mt-3 max-w-md mx-auto text-zinc-500 dark:text-metallic">
              Your profile has been submitted and your registration fee has been received. A manager will review and approve your account shortly.
            </p>
            {receipt && (
              <div className="mt-6 inline-block rounded-xl border border-zinc-200 bg-white p-5 text-left dark:border-white/10 dark:bg-panel">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Receipt</p>
                <p className="mt-1 font-display text-2xl font-bold">{receipt.receiptNumber}</p>
                <p className="text-sm text-zinc-500 dark:text-metallic">LKR {receipt.amount.toLocaleString()}</p>
              </div>
            )}
            <div className="mt-8 flex justify-center gap-3">
              <Button id="btn-go-to-dashboard" onClick={() => router.push("/mechanic")}>
                <FileText size={18} /> Go to mechanic dashboard
              </Button>
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}
