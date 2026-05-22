import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, Coins, HeartPulse, Sparkles, Check,
  ArrowRight, ArrowLeft, Plus, Clock,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button, Card, Input, Label, Badge } from "../components/ui/primitives";
import { cn } from "../lib/utils";

const ICONS = {
  family_relationship: Users,
  career_business: Briefcase,
  finance_money: Coins,
  health: HeartPulse,
  inner_wellness: Sparkles,
};

export default function OnboardingScreen() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=pillars, 2=goals-per-pillar, 3=done
  const [pillars, setPillars] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [activeIdx, setActiveIdx] = useState(0);

  // per-pillar goal state: { [pillarKey]: { suggestions:[], chosen:Set, custom:"", estimateUnit:"days", estimateValue:7 } }
  const [pillarGoals, setPillarGoals] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listPillars().then(setPillars);
  }, []);

  const togglePillar = (k) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelected(next);
  };

  const startGoals = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      await api.setSelectedPillars(Array.from(selected));
      // Pre-fetch suggestions for each selected pillar
      const entries = await Promise.all(
        Array.from(selected).map(async (p) => {
          const data = await api.suggestions(p);
          return [p, {
            suggestions: data.suggestions,
            chosen: new Set(),
            custom: "",
            estimateUnit: "days",
            estimateValue: 7,
          }];
        })
      );
      setPillarGoals(Object.fromEntries(entries));
      setActiveIdx(0);
      setStep(2);
    } catch (e) {
      setError(e?.message || e?.response?.data?.detail || "Could not save selection");
    } finally {
      setBusy(false);
    }
  };

  const ordered = useMemo(() => Array.from(selected), [selected]);
  const activeKey = ordered[activeIdx];
  const activeData = pillarGoals[activeKey];

  const updateActive = (patch) =>
    setPillarGoals((prev) => ({ ...prev, [activeKey]: { ...prev[activeKey], ...patch } }));

  const toggleSuggestion = (s) => {
    const chosen = new Set(activeData.chosen);
    if (chosen.has(s)) chosen.delete(s);
    else chosen.add(s);
    updateActive({ chosen });
  };

  const saveCurrentPillar = async () => {
    setError("");
    if (!activeData) return;
    const titles = Array.from(activeData.chosen);
    if (activeData.custom.trim()) titles.push(activeData.custom.trim());
    if (titles.length === 0) {
      setError("Pick at least one goal or add a custom one.");
      return;
    }
    setBusy(true);
    try {
      for (const t of titles) {
        await api.createGoal({
          pillar: activeKey,
          title: t,
          estimate_unit: activeData.estimateUnit,
          estimate_value: Number(activeData.estimateValue),
        });
      }
      if (activeIdx + 1 < ordered.length) {
        setActiveIdx(activeIdx + 1);
      } else {
        await refresh();
        navigate("/dashboard");
      }
    } catch (e) {
      setError(e?.message || e?.response?.data?.detail || "Could not save goal");
    } finally {
      setBusy(false);
    }
  };

  // ----- Step 1: pillar selector -----
  if (step === 1) {
    return (
      <div className="min-h-screen bg-psy-bg text-psy-text font-body p-6 max-w-md md:max-w-2xl mx-auto">
        <div className="pt-8 pb-6 text-center animate-fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-psy-secondary mb-3">Step 1 of 2</p>
          <h1 className="font-display text-4xl tracking-tight leading-tight">
            Where shall we tend
            <br />
            your garden?
          </h1>
          <p className="text-psy-subtext text-sm mt-3">
            Choose one or more pillars. Each becomes a living seed.
          </p>
        </div>

        <div className="space-y-3 mt-4">
          {pillars.map((p) => {
            const Icon = ICONS[p.key] || Sparkles;
            const active = selected.has(p.key);
            return (
              <button
                key={p.key}
                onClick={() => togglePillar(p.key)}
                data-testid={`pillar-${p.key}`}
                className={cn(
                  "w-full text-left transition-all duration-300 rounded-2xl border p-5 flex items-center gap-4",
                  active
                    ? "bg-psy-primary/8 border-psy-primary/50 shadow-soft"
                    : "bg-psy-card border-psy-border hover:border-psy-secondary/40 hover:shadow-soft",
                )}
              >
                <span
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center border transition",
                    active
                      ? "border-psy-primary/40 bg-psy-primary/15 text-psy-primary"
                      : "border-psy-border bg-psy-bg text-psy-secondary",
                  )}
                >
                  <Icon size={22} strokeWidth={1.5} />
                </span>
                <div className="flex-1">
                  <div className="font-display text-xl">{p.label}</div>
                  <div className="text-xs text-psy-subtext">
                    {active ? "Selected — we'll plant goals here." : "Tap to select"}
                  </div>
                </div>
                {active && <Check size={18} className="text-psy-primary" />}
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mt-4">{error}</p>}

        <Button
          onClick={startGoals}
          disabled={busy || selected.size === 0}
          className="w-full mt-6"
          data-testid="onboarding-continue-button"
        >
          Continue with {selected.size || 0} pillar{selected.size === 1 ? "" : "s"}
          <ArrowRight size={18} strokeWidth={1.5} />
        </Button>
      </div>
    );
  }

  // ----- Step 2: per-pillar goal setup -----
  const Icon = ICONS[activeKey] || Sparkles;
  return (
    <div className="min-h-screen bg-psy-bg text-psy-text font-body p-6 max-w-md md:max-w-2xl mx-auto">
      <div className="pt-6 pb-4 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-psy-subtext">
        <span>Step 2 of 2</span>
        <span data-testid="onboarding-progress">
          {activeIdx + 1} / {ordered.length}
        </span>
      </div>

      <Card className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <span className="h-10 w-10 rounded-xl bg-psy-primary/15 border border-psy-primary/40 text-psy-primary flex items-center justify-center">
            <Icon size={20} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-psy-secondary">Pillar</p>
            <h2 className="font-display text-2xl leading-tight">{pillars.find(p => p.key === activeKey)?.label}</h2>
          </div>
        </div>
        <p className="text-sm text-psy-subtext">
          Pick from <span className="text-psy-text">5 AI-curated</span> goals or write your own.
        </p>
      </Card>

      <Label>AI Suggestions</Label>
      <div className="space-y-2 mb-5">
        {activeData?.suggestions.map((s) => {
          const active = activeData.chosen.has(s);
          return (
            <button
              key={s}
              onClick={() => toggleSuggestion(s)}
              data-testid={`suggestion-${s.slice(0, 20)}`}
              className={cn(
                "w-full text-left rounded-2xl border p-4 transition flex items-start gap-3",
                active
                  ? "bg-psy-primary/8 border-psy-primary/50 shadow-soft"
                  : "bg-psy-card border-psy-border hover:border-psy-secondary/40",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition",
                  active ? "bg-psy-primary border-psy-primary text-white" : "border-psy-border bg-psy-bg",
                )}
              >
                {active && <Check size={14} strokeWidth={2.5} />}
              </div>
              <p className="text-sm leading-snug">{s}</p>
            </button>
          );
        })}
      </div>

      <Label>Or write your own</Label>
      <div className="relative mb-6">
        <Plus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-psy-subtext" />
        <Input
          value={activeData?.custom || ""}
          onChange={(e) => updateActive({ custom: e.target.value })}
          placeholder="A goal in your own words…"
          className="pl-9"
          data-testid="custom-goal-input"
        />
      </div>

      <Label>How long until completion?</Label>
      <Card className="!p-5 mb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-psy-secondary">
            <Clock size={18} strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-[0.2em]">Estimate</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={365}
              value={activeData?.estimateValue || 1}
              onChange={(e) => updateActive({ estimateValue: e.target.value })}
              className="!w-20 text-center !py-2"
              data-testid="estimate-value-input"
            />
            <div className="flex bg-psy-bg border border-psy-border rounded-xl overflow-hidden">
              {["days", "hours"].map((u) => (
                <button
                  key={u}
                  onClick={() => updateActive({ estimateUnit: u })}
                  data-testid={`estimate-unit-${u}`}
                  className={cn(
                    "px-4 py-2.5 text-xs uppercase tracking-wider transition font-medium",
                    activeData?.estimateUnit === u
                      ? "bg-psy-primary text-white"
                      : "text-psy-subtext hover:text-psy-text",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <p className="text-xs text-psy-subtext mb-6">
        We'll auto-break this into <Badge tone="sage">Daily Mini-Tasks</Badge> on your dashboard.
      </p>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{error}</p>}

      <div className="flex gap-2">
        {activeIdx > 0 && (
          <Button
            variant="secondary"
            onClick={() => setActiveIdx(activeIdx - 1)}
            data-testid="onboarding-back-button"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back
          </Button>
        )}
        <Button
          onClick={saveCurrentPillar}
          disabled={busy}
          className="flex-1"
          data-testid="save-pillar-goals-button"
        >
          {activeIdx + 1 === ordered.length ? "Plant the seeds" : "Next Pillar"}
          <ArrowRight size={18} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
