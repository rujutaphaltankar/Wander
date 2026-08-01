import { useEffect, useState } from "react";
import { UtensilsCrossed, Bus, Landmark, ShoppingBag, Building2, Plus, Minus, AlertTriangle, Star, Users, PieChart } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { api } from "../api/client";
import { Budget } from "../types";

const CATEGORIES = [
  { key: "spentFoodInr", label: "Food & Dining", icon: UtensilsCrossed, color: "text-orange", fill: "#FF8A3D" },
  { key: "spentTransportInr", label: "Transport", icon: Bus, color: "text-green", fill: "#1E9E6B" },
  { key: "spentTicketsInr", label: "Entry Tickets", icon: Landmark, color: "text-blue", fill: "#2563EB" },
  { key: "spentShoppingInr", label: "Shopping", icon: ShoppingBag, color: "text-yellow", fill: "#EAB308" },
  { key: "spentHotelInr", label: "Hotel / Stay", icon: Building2, color: "text-navy", fill: "#1E3A5F" },
  { key: "spentActivitiesInr", label: "Activities", icon: Star, color: "text-purple-500", fill: "#7C3AED" },
] as const;

// SVG Donut chart — no external library needed
function DonutChart({ segments }: { segments: { value: number; fill: string; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-44">
        <div className="text-xs text-muted">No spending yet</div>
      </div>
    );
  }

  const cx = 80, cy = 80, r = 60, innerR = 36;
  let currentAngle = -Math.PI / 2;
  const arcs: { d: string; fill: string; label: string; pct: number }[] = [];

  segments.forEach((seg) => {
    if (seg.value === 0) return;
    const pct = seg.value / total;
    const angle = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(currentAngle);
    const y1 = cy + r * Math.sin(currentAngle);
    const x2 = cx + r * Math.cos(currentAngle + angle);
    const y2 = cy + r * Math.sin(currentAngle + angle);
    const ix1 = cx + innerR * Math.cos(currentAngle);
    const iy1 = cy + innerR * Math.sin(currentAngle);
    const ix2 = cx + innerR * Math.cos(currentAngle + angle);
    const iy2 = cy + innerR * Math.sin(currentAngle + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    arcs.push({
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`,
      fill: seg.fill,
      label: seg.label,
      pct: Math.round(pct * 100),
    });
    currentAngle += angle;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.fill} className="transition-all hover:opacity-80 cursor-pointer">
            <title>{arc.label}: {arc.pct}%</title>
          </path>
        ))}
        {/* Center text */}
        <text x="80" y="76" textAnchor="middle" className="fill-current" style={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}>Spent</text>
        <text x="80" y="90" textAnchor="middle" style={{ fontSize: 9, fill: "#6B7C79" }}>{arcs.length} categories</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: arc.fill }} />
            <span className="text-muted truncate">{arc.label}</span>
            <span className="font-mono ml-auto shrink-0">{arc.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [perPerson, setPerPerson] = useState(false);
  const [people, setPeople] = useState(2);

  useEffect(() => {
    api.get("/budgets")
      .then((res) => {
        if (res.data.budgets.length > 0) {
          setBudget(res.data.budgets[0]);
        } else {
          return api.post("/budgets", { totalInr: 15000 }).then((r) => setBudget(r.data.budget));
        }
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

  const cats = CATEGORIES.map((c) => ({ ...c, value: (budget as any)[c.key] as number ?? 0 }));
  const spent = cats.reduce((s, c) => s + c.value, 0);
  const remaining = budget.totalInr - spent;
  const pct = Math.min(100, Math.round((spent / Math.max(1, budget.totalInr)) * 100));

  const divisor = perPerson ? people : 1;
  const fmt = (v: number) => `₹${Math.round(v / divisor).toLocaleString()}`;

  return (
    <div className="pb-8">
      <TopBar title="Budget Tracker" sub="Auto-filled from your AI itinerary — edit anytime." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left: Summary */}
        <div className="space-y-5">
          <div className="card rounded-3xl p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF]">Overview</h3>
              <button
                onClick={() => setPerPerson(!perPerson)}
                data-active={perPerson}
                className="chip flex items-center gap-1.5 text-xs"
              >
                <Users size={12} /> Per person
              </button>
            </div>

            {perPerson && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-muted">People:</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPeople(p => Math.max(1, p - 1))} className="chip px-2 py-1"><Minus size={11} /></button>
                  <span className="font-mono text-sm">{people}</span>
                  <button onClick={() => setPeople(p => p + 1)} className="chip px-2 py-1"><Plus size={11} /></button>
                </div>
              </div>
            )}

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

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted">
                  <span>Spent Progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="rounded-full h-3 overflow-hidden bg-line dark:bg-[#1C2C35]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: remaining < 0 ? "#D6455D" : "#1E9E6B" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                <div className="text-center p-3 rounded-xl bg-cloud dark:bg-[#0B171E]">
                  <div className="text-xs text-muted mb-1">Spent</div>
                  <div className="font-semibold font-mono text-ink dark:text-[#EAF3EF]">{fmt(spent)}</div>
                </div>
                <div className={`text-center p-3 rounded-xl ${remaining < 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-green-soft/30 dark:bg-green/10"}`}>
                  <div className="text-xs text-muted mb-1">{remaining < 0 ? "Overdraft" : "Remaining"}</div>
                  <div className="font-semibold font-mono" style={{ color: remaining < 0 ? "#D6455D" : "#1E9E6B" }}>
                    {fmt(Math.abs(remaining))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Donut chart */}
          <div className="card rounded-3xl p-5 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={15} className="text-muted" />
              <h3 className="font-display font-bold text-sm text-ink dark:text-[#EAF3EF]">Breakdown</h3>
            </div>
            <DonutChart
              segments={cats.map((c) => ({ value: c.value, fill: c.fill, label: c.label }))}
            />
          </div>

          {remaining < 0 && (
            <div className="rounded-2xl p-4 text-xs flex items-start gap-2 bg-orange/10 border border-orange/20 text-[#FF8A3D] leading-relaxed">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Over budget:</strong> Try choosing cheaper dining options in Explore, or reduce hotel/transport spending.
              </div>
            </div>
          )}
        </div>

        {/* Right: Category Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border-b border-line dark:border-[#22333A] pb-3 mb-2">
            <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF]">Spending Categories</h3>
            <p className="text-xs text-muted mt-0.5">Click +/− to adjust. Values auto-save.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cats.map((c) => {
              const Icon = c.icon;
              const catPct = spent > 0 ? Math.round((c.value / spent) * 100) : 0;
              return (
                <div key={c.key} className="card rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-3 bg-cloud dark:bg-transparent border border-line dark:border-[#22333A] ${c.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink dark:text-[#EAF3EF]">{c.label}</div>
                      <div className="text-xs font-mono text-muted">{fmt(c.value)} spent · {catPct}%</div>
                    </div>
                  </div>

                  {/* Mini bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-line dark:bg-[#22333A] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${catPct}%`, background: c.fill }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-line/50 dark:border-[#22333A]/50">
                    <button onClick={() => updateField(c.key, -500)} className="chip rounded-xl px-2.5 py-1 flex items-center gap-1 text-xs">
                      <Minus size={11} /> 500
                    </button>
                    <button onClick={() => updateField(c.key, -100)} className="chip rounded-xl px-2.5 py-1 flex items-center gap-1 text-xs">
                      <Minus size={11} /> 100
                    </button>
                    <button onClick={() => updateField(c.key, 100)} className="chip rounded-xl px-2.5 py-1 flex items-center gap-1 text-xs">
                      <Plus size={11} /> 100
                    </button>
                    <button onClick={() => updateField(c.key, 500)} className="chip rounded-xl px-2.5 py-1 flex items-center gap-1 text-xs">
                      <Plus size={11} /> 500
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
