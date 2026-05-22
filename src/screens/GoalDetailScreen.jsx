import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Check, X, Trash2, PlusCircle,
  Users, Briefcase, Coins, HeartPulse, Sparkles, Target,
  Clock, CalendarDays, TrendingUp,
} from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import { Card, Button, Input, Textarea, Label, Badge } from "../components/ui/primitives";
import { cn } from "../lib/utils";

const PILLAR_ICONS = {
  family_relationship: Users,
  career_business: Briefcase,
  finance_money: Coins,
  health: HeartPulse,
  inner_wellness: Sparkles,
};

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function GoalDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editEstimateValue, setEditEstimateValue] = useState(7);
  const [editEstimateUnit, setEditEstimateUnit] = useState("days");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Progress log state
  const [note, setNote] = useState("");
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [g, l] = await Promise.all([api.getGoal(id), api.listProgressLogs(id)]);
      setGoal(g);
      setLogs(l);
      setEditTitle(g.title);
      setEditEstimateValue(g.estimate_value);
      setEditEstimateUnit(g.estimate_unit);
      setEditNotes(g.notes || "");
    } catch (e) {
      setError(e?.message || "Could not load goal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openEdit = () => {
    setEditTitle(goal.title);
    setEditEstimateValue(goal.estimate_value);
    setEditEstimateUnit(goal.estimate_unit);
    setEditNotes(goal.notes || "");
    setEditError("");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) { setEditError("Title cannot be empty."); return; }
    if (Number(editEstimateValue) < 1) { setEditError("Estimate must be at least 1."); return; }
    setSaving(true);
    setEditError("");
    try {
      const updated = await api.updateGoal(id, {
        title: editTitle.trim(),
        notes: editNotes.trim() || null,
        estimate_value: Number(editEstimateValue),
        estimate_unit: editEstimateUnit,
      });
      setGoal((prev) => ({
        ...prev,
        ...updated,
        pillar_label: prev.pillar_label,
        mini_tasks: prev.mini_tasks,
      }));
      setEditing(false);
    } catch (e) {
      setEditError(e?.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  const submitLog = async () => {
    if (!note.trim()) return;
    setLogging(true);
    setLogError("");
    try {
      const entry = await api.logProgress(id, note.trim());
      setLogs((prev) => [entry, ...prev]);
      setNote("");
    } catch (e) {
      setLogError(e?.message || "Could not save progress entry");
    } finally {
      setLogging(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteGoal(id);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setConfirmDelete(false);
      setDeleting(false);
      setError(e?.message || "Could not delete goal");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <p className="text-psy-subtext text-sm">Loading goal…</p>
      </AppShell>
    );
  }

  if (error || !goal) {
    return (
      <AppShell>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-psy-subtext mb-6 hover:text-psy-text transition">
          <ArrowLeft size={18} strokeWidth={1.5} /> Back
        </button>
        <Card><p className="text-red-600 text-sm">{error || "Goal not found."}</p></Card>
      </AppShell>
    );
  }

  const Icon = PILLAR_ICONS[goal.pillar] || Target;
  const completedTasks = goal.mini_tasks.filter((t) => t.completed).length;
  const totalTasks = goal.mini_tasks.length;
  const pct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const daysLeft = goal.deadline_at
    ? Math.ceil((new Date(goal.deadline_at) - new Date()) / 86400000)
    : null;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-psy-subtext hover:text-psy-text transition"
        >
          <ArrowLeft size={18} strokeWidth={1.5} /> Back
        </button>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={openEdit}
              className="p-2 rounded-xl text-psy-subtext hover:text-psy-text hover:bg-psy-card/80 transition"
              title="Edit goal"
            >
              <Pencil size={16} strokeWidth={1.5} />
            </button>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-xl text-psy-subtext hover:text-red-600 hover:bg-red-50 transition"
              title="Delete goal"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-3 py-1.5 rounded-xl border border-psy-border text-psy-subtext hover:text-psy-text transition"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Goal card */}
      {editing ? (
        <Card className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-psy-subtext mb-4">Editing Goal</p>

          <div className="mb-4">
            <Label>Goal title</Label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              maxLength={240}
            />
          </div>

          <div className="mb-4">
            <Label>Notes / description (optional)</Label>
            <Textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add any context, motivation, or strategy…"
              className="min-h-[90px]"
            />
          </div>

          <div className="mb-5">
            <Label>Time estimate</Label>
            <div className="flex gap-3 items-center">
              <Input
                type="number"
                min={1}
                max={365}
                value={editEstimateValue}
                onChange={(e) => setEditEstimateValue(e.target.value)}
                className="w-28"
              />
              <div className="flex rounded-2xl border border-psy-border overflow-hidden bg-psy-bg">
                {["days", "hours"].map((u) => (
                  <button
                    key={u}
                    onClick={() => setEditEstimateUnit(u)}
                    className={cn(
                      "px-4 py-2.5 text-sm font-medium transition",
                      editEstimateUnit === u
                        ? "bg-psy-primary text-white"
                        : "text-psy-subtext hover:text-psy-text",
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-psy-subtext mt-2">Deadline will be recalculated from today.</p>
          </div>

          {editError && <p className="text-red-600 text-sm mb-3">{editError}</p>}

          <div className="flex gap-3">
            <Button onClick={saveEdit} disabled={saving} className="flex-1">
              {saving ? "Saving…" : <><Check size={16} strokeWidth={2} /> Save changes</>}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              <X size={16} strokeWidth={2} /> Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="p-2 rounded-xl bg-psy-primary/10">
              <Icon size={20} strokeWidth={1.5} className="text-psy-primary" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-psy-subtext uppercase tracking-[0.2em] mb-1">{goal.pillar_label}</p>
              <h1 className="font-display text-2xl leading-tight">{goal.title}</h1>
              {goal.notes && (
                <p className="text-sm text-psy-subtext mt-2 leading-relaxed">{goal.notes}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-1.5 text-xs text-psy-subtext">
              <Clock size={13} strokeWidth={1.5} />
              <span>{goal.estimate_value} {goal.estimate_unit}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-psy-subtext">
              <CalendarDays size={13} strokeWidth={1.5} />
              <span>Deadline {formatDate(goal.deadline_at)}</span>
            </div>
            {daysLeft !== null && (
              <Badge tone={daysLeft < 3 ? "primary" : "neutral"}>
                {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Due today" : "Overdue"}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-psy-subtext">Mini-task progress</span>
            <span className="text-sm font-medium text-psy-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-psy-border rounded-full overflow-hidden">
            <div
              className="h-full bg-psy-primary transition-all duration-700 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-psy-subtext mt-1.5">{completedTasks}/{totalTasks} daily tasks completed</p>
        </Card>
      )}

      {/* Progress entry form */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} strokeWidth={1.5} className="text-psy-secondary" />
          <h2 className="font-display text-xl">Log Progress</h2>
        </div>
        <Card>
          <Label>What did you work on today?</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe what you did toward this goal — even a small step counts…"
            className="mb-4 min-h-[110px]"
            maxLength={2000}
          />
          {logError && <p className="text-red-600 text-sm mb-3">{logError}</p>}
          <Button
            onClick={submitLog}
            disabled={logging || !note.trim()}
            className="w-full"
          >
            {logging ? "Saving…" : <><PlusCircle size={16} strokeWidth={1.5} /> Add entry</>}
          </Button>
        </Card>
      </section>

      {/* Progress history */}
      {logs.length > 0 && (
        <section className="mb-4">
          <h2 className="font-display text-xl mb-3">Progress History</h2>
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id} className="!p-4">
                <p className="text-sm text-psy-text leading-relaxed whitespace-pre-wrap">{log.note}</p>
                <p className="text-[11px] text-psy-subtext mt-2">{formatTime(log.logged_at)}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {logs.length === 0 && !loading && (
        <p className="text-center text-psy-subtext text-sm py-4">
          No progress entries yet — log your first one above.
        </p>
      )}
    </AppShell>
  );
}
