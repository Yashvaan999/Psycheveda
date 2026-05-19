import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Flame, Check, CircleDashed, ArrowRight, BookOpen, Target,
  Users, Briefcase, Coins, HeartPulse,
} from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import { Card, Button, Badge } from "../components/ui/primitives";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

const PILLAR_ICONS = {
  family_relationship: Users,
  career_business: Briefcase,
  finance_money: Coins,
  health: HeartPulse,
  inner_wellness: Sparkles,
};

export default function DashboardScreen() {
  const { user, refresh } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [s, t, g] = await Promise.all([api.stats(), api.tasksToday(), api.listGoals()]);
    setStats(s);
    setTasks(t);
    setGoals(g);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    const updated = await api.toggleTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    const [s] = await Promise.all([api.stats(), refresh()]);
    setStats(s);
  };

  const done = tasks.filter((t) => t.completed).length;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <AppShell>
      {/* Greeting */}
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-psy-secondary mb-2">{greeting}</p>
        <h1 className="font-display text-3xl leading-tight">
          {user?.full_name?.split(" ")[0] || "Seeker"},<br />
          <span className="text-psy-subtext italic text-2xl">tend your inner garden today.</span>
        </h1>
      </section>

      {/* Bless + Streak */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="!p-5 overflow-hidden">
          <div className="flex items-center gap-2 text-psy-primary mb-2">
            <Sparkles size={16} strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.2em]">Bless Points</span>
          </div>
          <p className="font-display text-4xl text-psy-text" data-testid="bless-points-balance">
            {stats?.bless_points_balance ?? 0}
          </p>
          <p className="text-xs text-psy-subtext mt-1">accumulated grace</p>
        </Card>
        <Card className="!p-5">
          <div className="flex items-center gap-2 text-psy-secondary mb-2">
            <Flame size={16} strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.2em]">Veda Streak</span>
          </div>
          <p className="font-display text-4xl text-psy-text" data-testid="veda-streak">
            {stats?.veda_streak ?? 0}
            <span className="text-base text-psy-subtext ml-1">days</span>
          </p>
          <p className="text-xs text-psy-subtext mt-1">unbroken devotion</p>
        </Card>
      </div>

      {/* Today's tasks */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl">Daily Mini-Tasks</h2>
          <Badge tone="sage" data-testid="tasks-progress">{done}/{tasks.length} today</Badge>
        </div>

        {loading ? (
          <Card><p className="text-psy-subtext text-sm">Gathering your tasks…</p></Card>
        ) : tasks.length === 0 ? (
          <Card>
            <p className="text-psy-subtext text-sm mb-3">No tasks scheduled today. Plant a goal to begin.</p>
            <Link to="/onboarding"><Button data-testid="empty-tasks-add-goal">Plant a goal</Button></Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => {
              const goal = goals.find((g) => g.id === t.goal_id);
              const Icon = PILLAR_ICONS[goal?.pillar] || Target;
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  data-testid={`task-toggle-${t.id}`}
                  className={cn(
                    "w-full text-left rounded-2xl border p-4 flex items-start gap-3 transition",
                    t.completed
                      ? "bg-psy-secondary/10 border-psy-secondary/40"
                      : "bg-psy-card border-psy-border/60 hover:border-psy-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full border flex items-center justify-center shrink-0 transition",
                      t.completed
                        ? "bg-psy-secondary border-psy-secondary text-psy-bg"
                        : "border-psy-border text-psy-subtext",
                    )}
                  >
                    {t.completed ? <Check size={14} strokeWidth={2.5} /> : <CircleDashed size={14} strokeWidth={1.5} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      t.completed ? "line-through text-psy-subtext" : "text-psy-text",
                    )}>
                      {t.title}
                    </p>
                    {goal && (
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-psy-subtext">
                        <Icon size={11} strokeWidth={1.5} />
                        <span className="truncate">{goal.pillar_label} • {goal.title}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Goals overview */}
      {goals.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-2xl mb-3">Your Goals</h2>
          <div className="space-y-2">
            {goals.slice(0, 4).map((g) => {
              const Icon = PILLAR_ICONS[g.pillar] || Target;
              const completedTasks = g.mini_tasks.filter((m) => m.completed).length;
              const pct = g.mini_tasks.length === 0 ? 0
                : Math.round((completedTasks / g.mini_tasks.length) * 100);
              return (
                <Card key={g.id} className="!p-4">
                  <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={1.5} className="text-psy-secondary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-psy-text truncate">{g.title}</p>
                      <p className="text-[11px] text-psy-subtext">
                        {g.pillar_label} • {g.estimate_value} {g.estimate_unit}
                      </p>
                    </div>
                    <span className="text-xs text-psy-primary font-medium" data-testid={`goal-progress-${g.id}`}>{pct}%</span>
                  </div>
                  <div className="h-1 bg-psy-bg rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-psy-primary transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Journal entrypoint */}
      <section className="mb-2">
        <Card className="bg-gradient-to-br from-psy-card to-psy-bg border-psy-primary/30">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.25em] text-psy-primary mb-1">NLP Journal</p>
              <h3 className="font-display text-xl leading-tight">Reframe a moment</h3>
              <p className="text-xs text-psy-subtext mt-1">
                {stats?.journal_entries_today || 0}/2 entries logged today
              </p>
            </div>
            <Link to="/journal">
              <Button data-testid="open-journal-button">
                Begin
                <ArrowRight size={16} strokeWidth={1.5} />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <section className="mt-3">
        <Link to="/journal/history" className="block">
          <Card className="!p-4 flex items-center justify-between hover:border-psy-primary/40 transition">
            <div className="flex items-center gap-3">
              <BookOpen size={18} strokeWidth={1.5} className="text-psy-secondary" />
              <span className="text-sm">View Journal History</span>
            </div>
            <ArrowRight size={16} strokeWidth={1.5} className="text-psy-subtext" />
          </Card>
        </Link>
      </section>

      <section className="mt-3">
        <Link to="/hpa-axis" className="block">
          <Card className="!p-4 flex items-center justify-between border-psy-primary/30 bg-gradient-to-r from-psy-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <Sparkles size={18} strokeWidth={1.5} className="text-psy-primary" />
              <div>
                <p className="text-sm">HPA Axis Fix Protocol</p>
                <p className="text-[11px] text-psy-subtext">Circadian-adaptive premium space</p>
              </div>
            </div>
            <Badge tone="primary">Premium</Badge>
          </Card>
        </Link>
      </section>
    </AppShell>
  );
}
