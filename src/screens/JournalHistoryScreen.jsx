import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Sun, Moon, BookOpen } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import { Card, Badge, Button } from "../components/ui/primitives";
import { fmtDate, fmtTime } from "../lib/utils";

export default function JournalHistoryScreen() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listJournal().then((d) => { setDays(d); setLoading(false); });
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-psy-secondary mb-2">Journal Timeline</p>
        <h1 className="font-display text-3xl">Date-wise reflections</h1>
        <p className="text-sm text-psy-subtext mt-1">
          Every entry is a sediment of your becoming.
        </p>
      </div>

      {loading && <Card><p className="text-psy-subtext text-sm">Loading entries…</p></Card>}

      {!loading && days.length === 0 && (
        <Card className="text-center py-10">
          <BookOpen size={28} className="text-psy-secondary mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-psy-subtext text-sm mb-5">No reflections yet. The page awaits.</p>
          <Link to="/journal">
            <Button data-testid="empty-write-first-button">
              Write your first <ArrowRight size={16} strokeWidth={1.5} />
            </Button>
          </Link>
        </Card>
      )}

      <div className="space-y-6">
        {days.map((d) => (
          <section key={d.date} data-testid={`journal-day-${d.date}`}>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-xl text-psy-text">{fmtDate(d.date)}</h2>
              <Badge tone="neutral">{d.entries.length} entr{d.entries.length === 1 ? "y" : "ies"}</Badge>
            </div>
            <div className="space-y-3">
              {d.entries.map((e) => (
                <Card key={e.id} data-testid={`journal-entry-${e.id}`}>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      {e.period === "morning" ? (
                        <Badge tone="primary"><Sun size={12} strokeWidth={1.5} /> Morning</Badge>
                      ) : (
                        <Badge tone="sage"><Moon size={12} strokeWidth={1.5} /> Evening</Badge>
                      )}
                      <span className="text-psy-subtext">{fmtTime(e.created_at)}</span>
                    </div>
                    {e.initial_frame ? (
                      <span className="text-psy-primary font-medium text-right leading-tight">
                        <span className="text-psy-subtext font-normal">{e.initial_frame}</span>
                        <span className="text-psy-subtext mx-1">→</span>
                        {e.nlp_frame}
                      </span>
                    ) : (
                      <span className="text-psy-primary font-medium">{e.nlp_frame}</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-psy-subtext mb-1">Situation</p>
                      <p className="text-sm leading-relaxed">{e.situation}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-psy-subtext mb-1">Started</p>
                        <p className="text-sm">{e.natural_emotion}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-psy-subtext mb-1">Ended</p>
                        <p className="text-sm">{e.end_feeling}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-psy-subtext mb-1">Ease of Transition</p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-psy-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-psy-primary"
                            style={{ width: `${e.ease_of_transition * 10}%` }}
                          />
                        </div>
                        <span className="text-xs text-psy-primary font-medium">{e.ease_of_transition}/10</span>
                      </div>
                    </div>
                    {e.bless_gratitude && (
                      <div className="bg-psy-primary/5 border border-psy-primary/30 rounded-xl p-3">
                        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-psy-primary mb-1">
                          <Sparkles size={11} strokeWidth={1.5} />
                          Bless Point Gratitude
                        </p>
                        <p className="text-sm italic text-psy-text/90">{e.bless_gratitude}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
