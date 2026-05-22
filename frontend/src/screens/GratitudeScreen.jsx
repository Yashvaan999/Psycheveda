import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Check, ArrowRight, ArrowLeft, History } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import AppShell from "../components/AppShell";
import { Card, Button, Input, Label } from "../components/ui/primitives";

const PROMPTS = [
  "Something small you noticed today",
  "Someone who softened your day",
  "A grace within yourself",
];

export default function GratitudeScreen() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [points, setPoints] = useState(["", "", ""]);
  const [loggedToday, setLoggedToday] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.stats().then((s) => {
      setLoggedToday(!!s.gratitude_logged_today);
      setLoaded(true);
    });
  }, []);

  const setPoint = (i, v) => setPoints((p) => p.map((x, idx) => (idx === i ? v : x)));
  const canSubmit = points.every((p) => p.trim().length > 0);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await api.createGratitude({
        point_1: points[0],
        point_2: points[1],
        point_3: points[2],
      });
      await refresh();
      navigate("/gratitude/history");
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not save gratitude");
    } finally {
      setBusy(false);
    }
  };

  if (loaded && loggedToday) {
    return (
      <AppShell>
        <Card className="text-center py-12">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-psy-primary/10 border border-psy-primary/30 mx-auto mb-4">
            <Sparkles size={26} className="text-psy-primary" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-3xl mb-2">Gratitude received</h2>
          <p className="text-sm text-psy-subtext mb-7 max-w-xs mx-auto leading-relaxed">
            You've already offered three blessings today.<br />
            Let them settle. Return tomorrow.
          </p>
          <div className="flex flex-col gap-2 items-center">
            <Link to="/gratitude/history">
              <Button data-testid="gratitude-view-history-button">
                View past blessings
                <ArrowRight size={16} strokeWidth={1.5} />
              </Button>
            </Link>
            <Link to="/dashboard" className="text-sm text-psy-subtext hover:text-psy-text transition">
              Back to dashboard
            </Link>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.25em] text-psy-primary font-medium">Bless Point Ritual</p>
          <Link
            to="/gratitude/history"
            className="text-xs text-psy-subtext hover:text-psy-primary transition inline-flex items-center gap-1"
            data-testid="gratitude-history-link"
          >
            <History size={13} strokeWidth={1.5} /> History
          </Link>
        </div>
        <h1 className="font-display text-4xl leading-tight">
          Three blessings <br />
          <span className="text-psy-subtext italic text-3xl">for this day</span>
        </h1>
        <p className="text-sm text-psy-subtext mt-3 leading-relaxed">
          Daily gratitude journaling retrains your brain to focus on positivity, reduces
          stress and overthinking, strengthens emotional resilience, and creates a calmer,
          more balanced mindset over time.
        </p>
      </div>

      <Card>
        <div className="space-y-5">
          {points.map((value, i) => (
            <div key={i} data-testid={`gratitude-field-${i + 1}`}>
              <Label>
                <span className="text-psy-primary mr-2">{String(i + 1).padStart(2, "0")}</span>
                {PROMPTS[i]}
              </Label>
              <Input
                value={value}
                onChange={(e) => setPoint(i, e.target.value)}
                placeholder="In your own words…"
                data-testid={`gratitude-input-${i + 1}`}
                maxLength={240}
              />
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <p
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mt-4"
          data-testid="gratitude-error"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-6">
        <Button
          variant="secondary"
          onClick={() => navigate("/dashboard")}
          data-testid="gratitude-back-button"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back
        </Button>
        <Button
          onClick={submit}
          disabled={!canSubmit || busy}
          className="flex-1"
          data-testid="gratitude-submit-button"
        >
          {busy ? "Offering…" : "Offer Gratitude"}
          <Check size={16} strokeWidth={1.5} />
        </Button>
      </div>
    </AppShell>
  );
}
