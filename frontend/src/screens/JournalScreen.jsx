import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, Sun, Moon } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import { Card, Button, Input, Textarea, Label, Badge, Divider } from "../components/ui/primitives";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

const FRAMES = [
  { key: "Cause & Effect", desc: "If I do X, Y follows. Trace the chain." },
  { key: "Result & Excuse", desc: "Either I produce a result, or I produce a story." },
  { key: "Mind & Body as One System", desc: "What the body holds, the mind speaks." },
  { key: "Perception is Projection", desc: "What I see in others lives also in me." },
  { key: "Responsibility", desc: "I am 100% the author of my response." },
];

const STEPS = ["Situation", "Emotion", "NLP Frame", "Transition", "End Feeling"];

export default function JournalScreen() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [entriesToday, setEntriesToday] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const morning = new Date().getHours() < 17;
  const [form, setForm] = useState({
    situation: "",
    natural_emotion: "",
    nlp_frame: "",
    ease_of_transition: 5,
    end_feeling: "",
    period: morning ? "morning" : "evening",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.stats().then((s) => {
      setEntriesToday(s.journal_entries_today || 0);
      setLoaded(true);
    });
  }, []);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 0) return form.situation.trim().length >= 2;
    if (step === 1) return form.natural_emotion.trim().length >= 1;
    if (step === 2) return !!form.nlp_frame;
    if (step === 3) return form.ease_of_transition >= 1 && form.ease_of_transition <= 10;
    if (step === 4) return form.end_feeling.trim().length >= 1;
    return true;
  };

  // Journal flow is now strictly 5 steps. The Bless-Point gratitude moved to
  // its own dedicated `/gratitude` ritual (only source of Bless Points besides tasks).
  const finalStep = 4;

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const payload = { ...form, ease_of_transition: Number(form.ease_of_transition) };
      await api.createJournal(payload);
      await refresh();
      navigate("/journal/history");
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not save journal");
    } finally {
      setBusy(false);
    }
  };

  if (loaded && entriesToday >= 2) {
    return (
      <AppShell>
        <Card className="text-center py-10">
          <Sparkles size={28} className="text-psy-primary mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="font-display text-2xl mb-2">Daily quota honored</h2>
          <p className="text-sm text-psy-subtext mb-6">
            You have completed both reframing entries today.<br />
            Rest. Integrate. Return tomorrow.
          </p>
          <Button onClick={() => navigate("/journal/history")} data-testid="quota-history-button">
            View today's entries
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Step header */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-psy-subtext mb-3">
          <span>NLP Reframing • {STEPS[step]}</span>
          <span data-testid="journal-step-indicator">
            {step + 1} / {finalStep + 1}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: finalStep + 1 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                i <= step ? "bg-psy-primary" : "bg-psy-border",
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          {form.period === "morning" ? (
            <Badge tone="primary"><Sun size={12} strokeWidth={1.5} /> Morning entry</Badge>
          ) : (
            <Badge tone="sage"><Moon size={12} strokeWidth={1.5} /> Evening entry</Badge>
          )}
          <span className="text-[11px] text-psy-subtext">
            {entriesToday}/2 logged today
          </span>
        </div>
      </div>

      {/* Steps */}
      {step === 0 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">What happened?</h2>
          <p className="text-sm text-psy-subtext mb-4">
            Describe the situation as a neutral observer.
          </p>
          <Label>Situation</Label>
          <Textarea
            value={form.situation}
            onChange={(e) => setField("situation", e.target.value)}
            placeholder="At 3pm, during the standup, my manager…"
            data-testid="journal-situation-input"
          />
        </Card>
      )}

      {step === 1 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">What did you feel?</h2>
          <p className="text-sm text-psy-subtext mb-4">
            Name the natural emotion that surfaced — without judgment.
          </p>
          <Label>Natural Emotion</Label>
          <Input
            value={form.natural_emotion}
            onChange={(e) => setField("natural_emotion", e.target.value)}
            placeholder="e.g. frustrated, anxious, dismissed…"
            data-testid="journal-emotion-input"
          />
          <Divider label="Suggested tags" />
          <div className="flex flex-wrap gap-2">
            {["Anxious", "Frustrated", "Hopeful", "Tired", "Resentful", "Grateful"].map((t) => (
              <button
                key={t}
                onClick={() => setField("natural_emotion", t)}
                data-testid={`emotion-tag-${t.toLowerCase()}`}
                className="text-xs px-3 py-1.5 rounded-full bg-psy-bg border border-psy-border text-psy-subtext hover:text-psy-primary hover:border-psy-primary/40 transition"
              >
                {t}
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">Choose a reframe</h2>
          <p className="text-sm text-psy-subtext mb-4">
            Which classic NLP lens helps you see this differently?
          </p>
          <div className="space-y-2">
            {FRAMES.map((f) => {
              const active = form.nlp_frame === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setField("nlp_frame", f.key)}
                  data-testid={`frame-${f.key.replace(/\s+/g, "-").toLowerCase()}`}
                  className={cn(
                    "w-full text-left rounded-2xl border p-4 transition",
                    active
                      ? "bg-psy-primary/8 border-psy-primary/50 shadow-soft"
                      : "bg-psy-bg border-psy-border hover:border-psy-secondary/40",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {active && <Check size={14} className="text-psy-primary" strokeWidth={2.5} />}
                    <p className="font-display text-lg leading-tight">{f.key}</p>
                  </div>
                  <p className="text-xs text-psy-subtext italic">{f.desc}</p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">How easy was the shift?</h2>
          <p className="text-sm text-psy-subtext mb-6">
            Rate the ease of transitioning from the natural emotion to the new frame.
          </p>
          <div className="text-center mb-4">
            <p className="font-display text-6xl text-psy-primary" data-testid="ease-value">
              {form.ease_of_transition}
            </p>
            <p className="text-xs text-psy-subtext uppercase tracking-[0.2em] mt-1">/ 10</p>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={form.ease_of_transition}
            onChange={(e) => setField("ease_of_transition", Number(e.target.value))}
            className="psy-slider"
            data-testid="journal-ease-slider"
          />
          <div className="flex justify-between text-[10px] text-psy-subtext mt-2 uppercase tracking-[0.2em]">
            <span>Felt forced</span>
            <span>Effortless</span>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">How do you feel now?</h2>
          <p className="text-sm text-psy-subtext mb-4">
            After the reframe — what's the end feeling?
          </p>
          <Label>End Feeling</Label>
          <Input
            value={form.end_feeling}
            onChange={(e) => setField("end_feeling", e.target.value)}
            placeholder="e.g. lighter, in control, accepting…"
            data-testid="journal-end-feeling-input"
          />
        </Card>
      )}

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mt-4" data-testid="journal-error">{error}</p>}

      <div className="flex gap-2 mt-6">
        {step > 0 && (
          <Button
            variant="secondary"
            onClick={() => setStep(step - 1)}
            data-testid="journal-back-button"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back
          </Button>
        )}
        {step < finalStep ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex-1"
            data-testid="journal-next-button"
          >
            Continue
            <ArrowRight size={16} strokeWidth={1.5} />
          </Button>
        ) : (
          <Button
            onClick={submit}
            disabled={busy}
            className="flex-1"
            data-testid="journal-submit-button"
          >
            {busy ? "Sealing…" : "Seal the entry"}
            <Check size={16} strokeWidth={1.5} />
          </Button>
        )}
      </div>
    </AppShell>
  );
}
