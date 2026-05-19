import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import api from "../lib/api";
import AppShell from "../components/AppShell";
import { Card, Badge, Button } from "../components/ui/primitives";
import { fmtDate, fmtTime } from "../lib/utils";

export default function GratitudeHistoryScreen() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listGratitude().then((d) => { setDays(d); setLoading(false); });
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-psy-primary font-medium mb-2">Bless Ledger</p>
        <h1 className="font-display text-3xl">Gratitude Timeline</h1>
        <p className="text-sm text-psy-subtext mt-1.5 leading-relaxed">
          A trail of small graces — each one a quiet vote for who you are becoming.
        </p>
      </div>

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

      <div className="space-y-6">
        {days.map((d) => (
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
                        <span className="font-display text-psy-primary text-lg leading-none w-7 shrink-0">
                          {String(i + 1).padStart(2, "0")}
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
