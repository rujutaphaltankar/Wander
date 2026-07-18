import { useEffect, useState } from "react";
import { UtensilsCrossed, Bus, Landmark, ShoppingBag, Building2, Plus, Minus, AlertTriangle } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { api } from "../api/client";
import { Budget } from "../types";

const CATEGORIES = [
  { key: "spentFoodInr", label: "Food", icon: UtensilsCrossed, color: "text-orange" },
  { key: "spentTransportInr", label: "Transport", icon: Bus, color: "text-green" },
  { key: "spentTicketsInr", label: "Tickets", icon: Landmark, color: "text-blue" },
  { key: "spentShoppingInr", label: "Shopping", icon: ShoppingBag, color: "text-yellow" },
  { key: "spentHotelInr", label: "Hotel", icon: Building2, color: "text-navy" },
] as const;

export default function BudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/budgets")
      .then((res) => {
        if (res.data.budgets.length > 0) setBudget(res.data.budgets[0]);
        else return api.post("/budgets", { totalInr: 8000 }).then((r) => setBudget(r.data.budget));
      })
      .finally(() => setLoading(false));
  }, []);

  async function updateField(key: string, delta: number) {
    if (!budget) return;
    const nextValue = Math.max(0, (budget as any)[key] + delta);
    const updated = { ...budget, [key]: nextValue };
    setBudget(updated as Budget);
    await api.patch(`/budgets/${budget.id}`, { [key]: nextValue });
  }

  if (loading) return <div className="px-5 py-8 text-sm text-muted text-center">Loading budget…</div>;
  if (!budget) return null;

  const spent =
    budget.spentFoodInr + budget.spentTransportInr + budget.spentTicketsInr + budget.spentShoppingInr + budget.spentHotelInr;
  const remaining = budget.totalInr - spent;
  const pct = Math.min(100, Math.round((spent / Math.max(1, budget.totalInr)) * 100));

  return (
    <div className="pb-8">
      <TopBar title="Budget tracker" sub="Auto-fills from your AI itinerary, editable anytime." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left Side: Summary and Warnings */}
        <div className="space-y-6">
          <div className="card rounded-3xl p-6 transition-colors">
            <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] border-b border-line dark:border-[#22333A] pb-2 mb-4">
              Budget Overview
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Total Limit (₹)</label>
                <input
                  type="number"
                  value={budget.totalInr}
                  onChange={async (e) => {
                    const totalInr = Number(e.target.value);
                    setBudget({ ...budget, totalInr });
                    await api.patch(`/budgets/${budget.id}`, { totalInr });
                  }}
                  className="card w-full rounded-xl px-3 py-2.5 text-sm font-semibold font-mono bg-white dark:bg-[#122029]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted">
                  <span>Spent Progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="rounded-full h-3 overflow-hidden bg-line dark:bg-[#1C2C35]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: remaining < 0 ? "#D6455D" : "#1E9E6B" }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm pt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Total Spent</span>
                  <span className="font-semibold font-mono text-ink dark:text-[#EAF3EF]">₹{spent}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted">{remaining < 0 ? "Overdraft" : "Remaining"}</span>
                  <span className="font-semibold font-mono" style={{ color: remaining < 0 ? "#D6455D" : "#1E9E6B" }}>
                    ₹{Math.abs(remaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {remaining < 0 && (
            <div className="rounded-2xl p-4 text-xs flex items-start gap-2 bg-orange/10 border border-orange/20 text-[#FF8A3D] leading-relaxed">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Over budget alert:</strong> Try finding a cheaper restaurant in Explore, or adjust your travel itinerary details to bring the cost down.
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Category Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border-b border-line dark:border-[#22333A] pb-3 mb-2">
            <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF]">
              Spending Categories
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const val = (budget as any)[c.key] as number;
              return (
                <div key={c.key} className="card rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-3 bg-cloud dark:bg-transparent border border-line dark:border-[#22333A] ${c.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink dark:text-[#EAF3EF]">{c.label}</div>
                      <div className="text-xs font-mono text-muted">₹{val} spent</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-line/50 dark:border-[#22333A]/50">
                    <button onClick={() => updateField(c.key, -100)} className="chip rounded-xl px-3 py-1 flex items-center justify-center gap-1 text-xs">
                      <Minus size={11} /> 100
                    </button>
                    <button onClick={() => updateField(c.key, 100)} className="chip rounded-xl px-3 py-1 flex items-center justify-center gap-1 text-xs">
                      <Plus size={11} /> 100
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
