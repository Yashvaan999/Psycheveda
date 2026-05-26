import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check, CircleDashed, ArrowRight, BookOpen, Target, Heart, Sparkles,
  Users, Briefcase, Coins, HeartPulse, Pencil, TrendingUp,
} from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import { Card, Button, Badge } from "../components/ui/primitives";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import TrackModal from "../components/TrackModal";

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
  const [trackGoalId, setTrackGoalId] = useState(null);

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

      {/* Bless Points + Streak are now shown in the header as tappable indicators */}

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
                    "w-full text-left rounded-2xl border p-5 flex items-start gap-3 transition",
                    t.completed
                      ? "bg-psy-secondary/10 border-psy-secondary/30"
                      : "bg-psy-card border-psy-border hover:border-psy-primary/40 hover:shadow-soft",
                  )}
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full border flex items-center justify-center shrink-0 transition",
                      t.completed
                        ? "bg-psy-secondary border-psy-secondary text-white"
                        : "border-psy-border text-psy-subtext bg-psy-bg",
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl">Your Goals</h2>
            <button
              onClick={() => setTrackGoalId("all")}
              className="flex items-center gap-1.5 text-xs font-medium text-psy-primary border border-psy-primary/30 bg-psy-primary/8 px-3 py-1.5 rounded-full hover:bg-psy-primary/15 transition"
            >
              <TrendingUp size={13} strokeWidth={2} /> Track
            </button>
          </div>
          <div className="space-y-2">
            {goals.slice(0, 4).map((g) => {
              const Icon = PILLAR_ICONS[g.pillar] || Target;
              const completedTasks = g.mini_tasks.filter((m) => m.completed).length;
              const totalTasks = g.mini_tasks.length;
              const pct = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : Math.min(100, Math.round(((g.progress_log_count || 0) / (g.total_days || 1)) * 100));
              return (
                <Link key={g.id} to={`/goals/${g.id}`} className="block">
                  <Card className="!p-4 hover:border-psy-primary/40 hover:shadow-soft transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Icon size={18} strokeWidth={1.5} className="text-psy-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-psy-text truncate">{g.title}</p>
                        <p className="text-[11px] text-psy-subtext">
                          {g.pillar_label} • {g.estimate_value} {g.estimate_unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTrackGoalId(g.id); }}
                          className="p-1 rounded-lg text-psy-subtext hover:text-psy-primary hover:bg-psy-primary/10 transition"
                          title="Track probability"
                        >
                          <TrendingUp size={13} strokeWidth={1.5} />
                        </button>
                        <span className="text-xs text-psy-primary font-medium" data-testid={`goal-progress-${g.id}`}>{pct}%</span>
                        <Pencil size={13} strokeWidth={1.5} className="text-psy-subtext" />
                      </div>
                    </div>
                    <div className="h-1.5 bg-psy-border rounded-full mt-4 overflow-hidden">
                      <div
                        className="h-full bg-psy-primary transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Gratitude — primary Bless ritual entrypoint */}
      <section className="mb-3">
        <Card className="bg-gradient-to-br from-psy-primary/10 via-psy-card to-psy-card border-psy-primary/40">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.25em] text-psy-primary mb-1 font-medium inline-flex items-center gap-1.5">
                <Sparkles size={12} strokeWidth={1.5} /> Bless Ritual
              </p>
              <h3 className="font-display text-2xl leading-tight">Gratitude</h3>
              <p className="text-xs text-psy-subtext mt-1.5">
                {stats?.gratitude_logged_today
                  ? "Offered today — +15 Bless earned"
                  : "Three blessings → +15 Bless"}
              </p>
            </div>
            <Link to="/gratitude">
              <Button data-testid="open-gratitude-button">
                {stats?.gratitude_logged_today ? "View" : "Offer"}
                <Heart size={16} strokeWidth={1.5} />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Journal entrypoint */}
      <section className="mb-2">
        <Card className="bg-gradient-to-br from-psy-card to-psy-bg border-psy-border">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.25em] text-psy-secondary mb-1 font-medium">NLP Journal</p>
              <h3 className="font-display text-2xl leading-tight">Reframe a moment</h3>
              <p className="text-xs text-psy-subtext mt-1.5">
                {stats?.journal_entries_today || 0}/2 entries logged today
              </p>
            </div>
            <Link to="/journal">
              <Button variant="secondary" data-testid="open-journal-button">
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
        <Link to="/gratitude/history" className="block">
          <Card className="!p-4 flex items-center justify-between hover:border-psy-primary/40 transition">
            <div className="flex items-center gap-3">
              <Heart size={18} strokeWidth={1.5} className="text-psy-primary" />
              <span className="text-sm">View Gratitude Timeline</span>
            </div>
            <ArrowRight size={16} strokeWidth={1.5} className="text-psy-subtext" />
          </Card>
        </Link>
      </section>

      {trackGoalId && (
        <TrackModal
          onClose={() => setTrackGoalId(null)}
          goalId={trackGoalId === "all" ? null : trackGoalId}
        />
      )}
    </AppShell>
  );
}
