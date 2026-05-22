import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Calendar, X } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import { Card, Badge, Button } from "../components/ui/primitives";
import { fmtDate, fmtTime } from "../lib/utils";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function GratitudeHistoryScreen() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(""); // empty = show all

  useEffect(() => {
    api.listGratitude().then((d) => { setDays(d); setLoading(false); });
  }, []);

  // The most recent date we have an entry for — useful to bound the picker's `max`
  const latestEntryDate = days[0]?.date;
  const maxDate = todayIso();

  // Filter to the picked date (if any)
  const visibleDays = useMemo(() => {
    if (!selectedDate) return days;
    return days.filter((d) => d.date === selectedDate);
  }, [days, selectedDate]);

  const clearFilter = () => setSelectedDate("");
  const jumpToToday = () => setSelectedDate(todayIso());
  const jumpToLatest = () => latestEntryDate && setSelectedDate(latestEntryDate);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-psy-primary font-medium mb-2">Bless Ledger</p>
        <h1 className="font-display text-3xl">Gratitude Timeline</h1>
        <p className="text-sm text-psy-subtext mt-1.5 leading-relaxed">
          A trail of small graces — each one a quiet vote for who you are becoming.
        </p>
      </div>

      {/* Date picker */}
      <Card className="!p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-psy-subtext font-medium">
            <Calendar size={14} strokeWidth={1.6} />
            Jump to date
          </label>
          {selectedDate && (
            <button
              onClick={clearFilter}
              data-testid="gratitude-date-clear"
              className="inline-flex items-center gap-1 text-xs text-psy-subtext hover:text-psy-primary transition"
            >
              <X size={12} strokeWidth={1.6} /> Show all
            </button>
          )}
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={maxDate}
          data-testid="gratitude-date-picker"
          className="w-full bg-psy-bg border border-psy-border rounded-2xl px-4 py-3.5 text-psy-text focus:outline-none focus:border-psy-primary/50 focus:ring-4 focus:ring-psy-primary/10 transition appearance-none cursor-pointer"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={jumpToToday}
            data-testid="gratitude-date-today"
            className="text-xs px-3 py-1.5 rounded-full bg-psy-bg border border-psy-border text-psy-subtext hover:text-psy-primary hover:border-psy-primary/40 transition font-medium"
          >
            Today
          </button>
          {latestEntryDate && latestEntryDate !== todayIso() && (
            <button
              onClick={jumpToLatest}
              data-testid="gratitude-date-latest"
              className="text-xs px-3 py-1.5 rounded-full bg-psy-bg border border-psy-border text-psy-subtext hover:text-psy-primary hover:border-psy-primary/40 transition font-medium"
            >
              Latest entry · {fmtDate(latestEntryDate)}
            </button>
          )}
        </div>

        {selectedDate && (
          <p className="text-xs text-psy-subtext mt-3" data-testid="gratitude-date-selected">
            Showing <span className="text-psy-text font-medium">{fmtDate(selectedDate)}</span>
          </p>
        )}
      </Card>

      {loading && <Card><p className="text-psy-subtext text-sm">Loading entries…</p></Card>}

      {!loading && days.length === 0 && (
        <Card className="text-center py-10">
          <Sparkles size={28} className="text-psy-primary mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-psy-subtext text-sm mb-5">No blessings logged yet. The page awaits its first three.</p>
          <Link to="/gratitude">
            <Button data-testid="gratitude-empty-cta">
              Offer today's <ArrowRight size={16} strokeWidth={1.5} />
            </Button>
          </Link>
        </Card>
      )}

      {/* Selected date but no entries for it */}
      {!loading && days.length > 0 && selectedDate && visibleDays.length === 0 && (
        <Card className="text-center py-8" data-testid="gratitude-day-empty">
          <Sparkles size={22} className="text-psy-subtext mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-psy-subtext text-sm mb-1">
            No gratitude logged on <span className="text-psy-text font-medium">{fmtDate(selectedDate)}</span>.
          </p>
          <button
            onClick={clearFilter}
            className="text-xs text-psy-primary hover:underline mt-2"
            data-testid="gratitude-day-empty-clear"
          >
            Show all entries
          </button>
        </Card>
      )}

      <div className="space-y-6">
        {visibleDays.map((d) => (
          <section key={d.date} data-testid={`gratitude-day-${d.date}`}>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-xl text-psy-text">{fmtDate(d.date)}</h2>
              <Badge tone="primary">+15 Bless</Badge>
            </div>
            <div className="space-y-3">
              {d.entries.map((e) => (
                <Card key={e.id} data-testid={`gratitude-entry-${e.id}`}>
                  <div className="flex items-center justify-between mb-4 text-xs">
                    <span className="text-psy-subtext">{fmtTime(e.created_at)}</span>
                    <span className="inline-flex items-center gap-1.5 text-psy-primary font-medium">
                      <Sparkles size={12} strokeWidth={1.5} /> Three Blessings
                    </span>
                  </div>

                  <ol className="space-y-3">
                    {[e.point_1, e.point_2, e.point_3].map((p, i) => (
                      <li key={i} className="flex gap-3" data-testid={`gratitude-point-${i + 1}`}>
                        <span className="font-display text-psy-primary text-lg leading-none w-5 shrink-0">
                          {i + 1}.
                        </span>
                        <p className="text-sm leading-relaxed text-psy-text/90 italic">{p}</p>
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
