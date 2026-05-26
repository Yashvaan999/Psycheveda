import { useEffect, useState } from "react";
import { X, TrendingUp, Users, Briefcase, Coins, HeartPulse, Sparkles, Target } from "lucide-react";
import api from "../lib/api";
import { cn } from "../lib/utils";

const PILLAR_ICONS = {
  family_relationship: Users,
  career_business: Briefcase,
  finance_money: Coins,
  health: HeartPulse,
  inner_wellness: Sparkles,
};

function probColor(p) {
  if (p >= 70) return { bar: "bg-emerald-500", text: "text-emerald-600", ring: "border-emerald-400" };
  if (p >= 40) return { bar: "bg-amber-400",  text: "text-amber-600",  ring: "border-amber-400"  };
  return         { bar: "bg-red-400",    text: "text-red-600",    ring: "border-red-400"    };
}

function Sparkline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;
  const W = 220, H = 48, pad = 4;
  const n = timeline.length;
  const xs = (i) => pad + (i / Math.max(n - 1, 1)) * (W - pad * 2);
  const ys = (p) => pad + ((100 - p) / 100) * (H - pad * 2);

  const pastPoints = timeline.filter((t) => t.isPast);
  if (pastPoints.length < 2) {
    return (
      <div className="mt-2 text-[10px] text-psy-subtext italic">Start logging daily to see the trend.</div>
    );
  }

  const pathD = timeline
    .map((t, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(t.prob).toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${xs(n - 1).toFixed(1)} ${H - pad} L ${pad} ${H - pad} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D97B45" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#D97B45" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid line at 50% */}
      <line x1={pad} y1={ys(50)} x2={W - pad} y2={ys(50)} stroke="#E5DDD0" strokeWidth="1" strokeDasharray="3 3" />
      {/* Area fill */}
      <path d={areaD} fill="url(#sparkGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#D97B45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Day dots */}
      {timeline.map((t, i) => {
        if (!t.isPast) return null;
        return (
          <circle
            key={t.dateStr}
            cx={xs(i)}
            cy={ys(t.prob)}
            r="2.5"
            fill={t.logged ? "#5C7A5C" : "#E5DDD0"}
            stroke={t.logged ? "#5C7A5C" : "#C4B89A"}
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

function GoalTrackRow({ goal }) {
  const Icon = PILLAR_ICONS[goal.pillar] || Target;
  const color = probColor(goal.probability);

  return (
    <div className="py-4 border-b border-psy-border last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} strokeWidth={1.5} className="text-psy-secondary shrink-0" />
        <p className="text-sm text-psy-text font-medium flex-1 truncate">{goal.title}</p>
        <span className={cn("text-lg font-bold font-display tabular-nums", color.text)}>
          {goal.probability}%
        </span>
      </div>

      {/* Probability bar */}
      <div className="h-2 bg-psy-border rounded-full overflow-hidden mb-1">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color.bar)}
          style={{ width: `${goal.probability}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[10px] text-psy-subtext mb-1">
        <span>{goal.daysLogged} logged</span>
        <span>·</span>
        <span>{Math.max(0, goal.daysElapsed - goal.daysLogged)} missed</span>
        <span>·</span>
        <span>{goal.totalDays} days planned</span>
      </div>

      {/* Sparkline */}
      <Sparkline timeline={goal.timeline} />
    </div>
  );
}

export default function TrackModal({ onClose, goalId = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.goalTrackingData()
      .then((all) => setData(goalId ? all.filter((g) => g.id === goalId) : all))
      .catch((e) => setError(e?.message || "Could not load tracking data"))
      .finally(() => setLoading(false));
  }, [goalId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-psy-text/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-psy-bg rounded-3xl shadow-2xl border border-psy-border max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} strokeWidth={1.5} className="text-psy-primary" />
            <h2 className="font-display text-xl">Completion Probability</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-psy-subtext hover:text-psy-text hover:bg-psy-card transition"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Formula note */}
        <p className="px-6 text-[11px] text-psy-subtext leading-relaxed pb-3 border-b border-psy-border shrink-0">
          Each planned day = <strong className="text-psy-text">+{data?.[0] ? `${data[0].dayPoint.toFixed(1)}%` : "1/n×100%"}</strong> probability.
          Every missed day reduces it. Log daily to keep it climbing.
        </p>

        {/* Scrollable goal list */}
        <div className="overflow-y-auto flex-1 px-6">
          {loading && (
            <p className="text-psy-subtext text-sm py-8 text-center">Calculating…</p>
          )}
          {error && (
            <p className="text-red-600 text-sm py-6 text-center">{error}</p>
          )}
          {data && data.length === 0 && (
            <p className="text-psy-subtext text-sm py-8 text-center">No goals planted yet.</p>
          )}
          {data && data.map((g) => <GoalTrackRow key={g.id} goal={g} />)}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 shrink-0 border-t border-psy-border">
          <p className="text-[10px] text-psy-subtext text-center">
            Open any goal → Log Progress to record your daily work
          </p>
        </div>
      </div>
    </div>
  );
}
