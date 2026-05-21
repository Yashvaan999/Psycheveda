import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, Sun, Moon, X } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import { Card, Button, Input, Textarea, Label, Badge } from "../components/ui/primitives";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

// Five NLP frames + the new descriptions
const FRAMES = [
  { key: "Cause & Effect",            desc: "This happened because of X and that has to be blamed." },
  { key: "Result & Excuse",           desc: "Produced a story for X situation to feel mentally free." },
  { key: "Mind & Body as One System", desc: "What the mind holds, body speaks and vice versa. Nerves and cells are interdependent." },
  { key: "Perception is Projection",  desc: "People's judgement of the situation is their voice, not reality." },
  { key: "Responsibility",            desc: "Dynamic acceptance. I am aware of my thoughtful response." },
];

// Emotions — full Navarasa + modern psychological states
const NAVARASA = [
  { tag: "Love",       sanskrit: "Shringara" },
  { tag: "Joy",        sanskrit: "Hasya" },
  { tag: "Compassion", sanskrit: "Karuna" },
  { tag: "Rage",       sanskrit: "Raudra" },
  { tag: "Courage",    sanskrit: "Veera" },
  { tag: "Fear",       sanskrit: "Bhayanaka" },
  { tag: "Disgust",    sanskrit: "Bibhatsa" },
  { tag: "Wonder",     sanskrit: "Adbhuta" },
  { tag: "Peace",      sanskrit: "Shanta" },
];

const MODERN_EMOTIONS = [
  "Anxious", "Confused", "Frustrated", "Hopeful", "Tired",
  "Grateful", "Lonely", "Resentful", "Overwhelmed", "Inspired",
  "Embarrassed", "Guilty", "Proud", "Jealous", "Numb",
];

// Phrase suggestions for the end-feeling step
const END_FEELING_TAGS = [
  "Relieved", "Lighter", "In control", "Accepting", "Quiet",
  "Hopeful again", "More at peace", "Still uneasy",
  "I feel relieved but still can't forget",
  "Clearer, but tender",
  "Less heavy than before",
];

const MAX_EMOTIONS = 3;

const STEPS = ["Situation", "Emotion", "Initial Frame", "Reframe", "Transition", "End Feeling"];

export default function JournalScreen() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [entriesToday, setEntriesToday] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const morning = new Date().getHours() < 17;
  const [form, setForm] = useState({
    situation: "",
    selectedEmotions: [],  // array of strings, max 3
    natural_emotion: "",   // derived: comma-joined
    initial_frame: "",
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

  const toggleEmotion = (tag) => {
    setForm((p) => {
      const has = p.selectedEmotions.includes(tag);
      let next;
      if (has) next = p.selectedEmotions.filter((t) => t !== tag);
      else if (p.selectedEmotions.length >= MAX_EMOTIONS) return p; // capped
      else next = [...p.selectedEmotions, tag];
      return { ...p, selectedEmotions: next, natural_emotion: next.join(", ") };
    });
  };

  const canNext = () => {
    if (step === 0) return form.situation.trim().length >= 2;
    if (step === 1) return form.natural_emotion.trim().length >= 1;
    if (step === 2) return !!form.initial_frame;
    if (step === 3) return !!form.nlp_frame;
    if (step === 4) return form.ease_of_transition >= 1 && form.ease_of_transition <= 10;
    if (step === 5) return form.end_feeling.trim().length >= 1;
    return true;
  };

  const finalStep = 5;

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const payload = {
        situation: form.situation,
        natural_emotion: form.natural_emotion,
        initial_frame: form.initial_frame || null,
        nlp_frame: form.nlp_frame,
        ease_of_transition: Number(form.ease_of_transition),
        end_feeling: form.end_feeling,
        period: form.period,
      };
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

  // ------- Reusable frame selector (used in steps 2 + 3) -------
  const FrameSelector = ({ value, onChange, testidPrefix }) => (
    <div className="space-y-2">
      {FRAMES.map((f) => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            data-testid={`${testidPrefix}-${f.key.replace(/\s+/g, "-").toLowerCase()}`}
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
            <p className="text-xs text-psy-subtext italic leading-snug">{f.desc}</p>
          </button>
        );
      })}
    </div>
  );

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

      {/* Step 0: Situation */}
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

      {/* Step 1: Emotions (multi-select up to 3 from Navarasa + modern) */}
      {step === 1 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">What did you feel?</h2>
          <p className="text-sm text-psy-subtext mb-4">
            Choose up to <span className="text-psy-text font-medium">three</span> emotions. They can co-exist.
          </p>

          <div className="flex items-center justify-between mb-3">
            <Label className="!mb-0">Selected ({form.selectedEmotions.length}/{MAX_EMOTIONS})</Label>
            {form.selectedEmotions.length > 0 && (
              <button
                onClick={() => setForm((p) => ({ ...p, selectedEmotions: [], natural_emotion: "" }))}
                className="text-xs text-psy-subtext hover:text-psy-primary transition inline-flex items-center gap-1"
                data-testid="emotion-clear"
              >
                <X size={12} strokeWidth={1.5} /> Clear
              </button>
            )}
          </div>

          {form.selectedEmotions.length === 0 ? (
            <p className="text-xs text-psy-subtext italic mb-5">No emotions selected yet — tap from below.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-5">
              {form.selectedEmotions.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-psy-primary/10 border border-psy-primary/40 text-psy-primary text-xs font-medium"
                  data-testid={`emotion-chosen-${t.toLowerCase()}`}
                >
                  {t}
                  <button
                    onClick={() => toggleEmotion(t)}
                    aria-label={`Remove ${t}`}
                    className="hover:text-[#C2682E]"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-[10px] uppercase tracking-[0.22em] text-psy-secondary mb-2 font-medium">Navarasa — the nine classical emotions</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {NAVARASA.map(({ tag, sanskrit }) => {
              const active = form.selectedEmotions.includes(tag);
              const atCap = !active && form.selectedEmotions.length >= MAX_EMOTIONS;
              return (
                <button
                  key={tag}
                  onClick={() => toggleEmotion(tag)}
                  disabled={atCap}
                  data-testid={`emotion-${tag.toLowerCase()}`}
                  title={sanskrit}
                  className={cn(
                    "text-xs px-3 py-2 rounded-full border transition font-medium",
                    active
                      ? "bg-psy-primary/15 border-psy-primary/55 text-psy-primary"
                      : atCap
                        ? "bg-psy-bg border-psy-border text-psy-subtext/50 cursor-not-allowed"
                        : "bg-psy-bg border-psy-border text-psy-subtext hover:text-psy-primary hover:border-psy-primary/40 hover:bg-psy-primary/5",
                  )}
                >
                  <span>{tag}</span>
                  <span className="text-[9px] italic ml-1 opacity-70">· {sanskrit}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] uppercase tracking-[0.22em] text-psy-secondary mb-2 font-medium">Other modern states</p>
          <div className="flex flex-wrap gap-2">
            {MODERN_EMOTIONS.map((tag) => {
              const active = form.selectedEmotions.includes(tag);
              const atCap = !active && form.selectedEmotions.length >= MAX_EMOTIONS;
              return (
                <button
                  key={tag}
                  onClick={() => toggleEmotion(tag)}
                  disabled={atCap}
                  data-testid={`emotion-${tag.toLowerCase()}`}
                  className={cn(
                    "text-xs px-3 py-2 rounded-full border transition font-medium",
                    active
                      ? "bg-psy-primary/15 border-psy-primary/55 text-psy-primary"
                      : atCap
                        ? "bg-psy-bg border-psy-border text-psy-subtext/50 cursor-not-allowed"
                        : "bg-psy-bg border-psy-border text-psy-subtext hover:text-psy-primary hover:border-psy-primary/40 hover:bg-psy-primary/5",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Step 2: Initial frame */}
      {step === 2 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">Choose Initial Frame</h2>
          <p className="text-sm text-psy-subtext mb-4">
            What was the lens you were standing inside when this happened?
          </p>
          <FrameSelector
            value={form.initial_frame}
            onChange={(v) => setField("initial_frame", v)}
            testidPrefix="initial-frame"
          />
        </Card>
      )}

      {/* Step 3: Reframe */}
      {step === 3 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">Choose a reframe</h2>
          <p className="text-sm text-psy-subtext mb-4">
            Label your situation with a Psychological frame. This makes you more aware.
          </p>
          <FrameSelector
            value={form.nlp_frame}
            onChange={(v) => setField("nlp_frame", v)}
            testidPrefix="frame"
          />
        </Card>
      )}

      {/* Step 4: Ease slider — redesigned number display */}
      {step === 4 && (
        <Card>
          <h2 className="font-display text-2xl mb-1">How easy was the shift?</h2>
          <p className="text-sm text-psy-subtext mb-7">
            Rate the ease of transitioning from the initial frame to the new frame.
          </p>

          {/* Ease value display — circular tile with progress arc + scale-on-change */}
          <div className="flex flex-col items-center mb-7">
            <div className="relative h-32 w-32" data-testid="ease-display">
              {/* progress ring (background) */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#E8E2D5" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#D97736"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(form.ease_of_transition / 10) * 276.5} 276.5`}
                  style={{ transition: "stroke-dasharray 0.25s ease-out" }}
                />
              </svg>
              {/* number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  key={form.ease_of_transition}
                  className="font-display text-5xl text-psy-primary leading-none animate-fade-up tabular-nums"
                  data-testid="ease-value"
                >
                  {form.ease_of_transition}
                </span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-psy-subtext mt-1">
                  out of 10
                </span>
              </div>
            </div>
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

      {/* Step 5: End feeling with phrase tags */}
      {step === 5 && (
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

          <p className="text-[10px] uppercase tracking-[0.22em] text-psy-secondary mb-3 mt-6 font-medium">Tap to use</p>
          <div className="flex flex-wrap gap-2">
            {END_FEELING_TAGS.map((t) => {
              const active = form.end_feeling.trim() === t;
              return (
                <button
                  key={t}
                  onClick={() => setField("end_feeling", t)}
                  data-testid={`end-feeling-tag-${t.slice(0, 15).toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "text-xs px-3 py-2 rounded-full border transition font-medium",
                    active
                      ? "bg-psy-primary/15 border-psy-primary/55 text-psy-primary"
                      : "bg-psy-bg border-psy-border text-psy-subtext hover:text-psy-primary hover:border-psy-primary/40 hover:bg-psy-primary/5",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
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
            disabled={busy || !canNext()}
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
