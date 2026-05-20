import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, Sparkles, LogOut, Heart, Flame, Bell, X, Flower2,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import api from "../lib/api";
import Modal from "./ui/Modal";
import { Button } from "./ui/primitives";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home, testid: "nav-dashboard" },
  { to: "/journal", label: "Journal", icon: BookOpen, testid: "nav-journal" },
  { to: "/gratitude", label: "Gratitude", icon: Heart, testid: "nav-gratitude" },
  { to: "/hpa-axis", label: "HPA Axis", icon: Sparkles, testid: "nav-hpa-axis" },
];

const REMINDER_HOUR = 21; // 9 PM local

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [blessOpen, setBlessOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [gratitudeLoggedToday, setGratitudeLoggedToday] = useState(null);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    try {
      const s = await api.stats();
      setGratitudeLoggedToday(!!s.gratitude_logged_today);
    } catch {
      /* ignore — keep prior value */
    }
  }, [user]);

  // Pull stats every time the route changes so post-submit state updates everywhere
  useEffect(() => {
    refreshStats();
    // refresh again when the day changes / user navigates
  }, [refreshStats, loc.pathname]);

  // Was reminder already dismissed today? Use a per-day flag in localStorage.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setReminderDismissed(localStorage.getItem("psy_grat_reminder_dismissed") === today);
  }, []);

  // Fire one native browser notification per session at/after 21:00 if missing
  // and permission was previously granted. Silently noop otherwise.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (gratitudeLoggedToday === null || gratitudeLoggedToday) return;
    if (new Date().getHours() < REMINDER_HOUR) return;
    const today = new Date().toISOString().slice(0, 10);
    const sentKey = `psy_grat_push_sent_${today}`;
    if (localStorage.getItem(sentKey)) return;
    try {
      new Notification("Psycheveda", {
        body: "Pause. Name three blessings before the day folds — +15 Bless awaits.",
        icon: "/favicon.ico",
        silent: false,
      });
      localStorage.setItem(sentKey, "1");
    } catch {
      /* noop */
    }
  }, [gratitudeLoggedToday]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted" || Notification.permission === "denied") return;
    try { await Notification.requestPermission(); } catch { /* noop */ }
  };

  const dismissReminder = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("psy_grat_reminder_dismissed", today);
    setReminderDismissed(true);
  };

  const now = new Date();
  const showReminder =
    !reminderDismissed
    && gratitudeLoggedToday === false
    && now.getHours() >= REMINDER_HOUR
    && loc.pathname !== "/gratitude";

  const bless = user?.bless_points_balance ?? 0;
  const streak = user?.veda_streak ?? 0;

  return (
    <div className="min-h-screen bg-psy-bg text-psy-text font-body relative">
      <header className="sticky top-0 z-30 bg-psy-bg/85 backdrop-blur-xl border-b border-psy-border">
        <div className="max-w-md md:max-w-4xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="font-display text-2xl tracking-tight shrink-0" data-testid="brand-link">
            Psyche<span className="text-psy-primary">veda</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Bless Points pill — Lotus glyph + gentle breathing animation */}
            <button
              onClick={() => setBlessOpen(true)}
              data-testid="header-bless-pill"
              className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-psy-primary/10 border border-psy-primary/30 text-psy-primary hover:bg-psy-primary/15 hover:border-psy-primary/45 transition animate-bless-glow"
              aria-label={`Bless Points: ${bless}`}
            >
              <Flower2
                size={14}
                strokeWidth={1.7}
                className="animate-petal-breathe origin-center"
              />
              <span className="text-sm font-medium tabular-nums" data-testid="header-bless-value">{bless}</span>
            </button>

            {/* Veda Streak pill */}
            <button
              onClick={() => setStreakOpen(true)}
              data-testid="header-streak-pill"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-psy-secondary/10 border border-psy-secondary/30 text-psy-secondary hover:bg-psy-secondary/15 hover:border-psy-secondary/45 transition"
              aria-label={`Veda Streak: ${streak} days`}
            >
              <Flame size={14} strokeWidth={1.8} />
              <span className="text-sm font-medium tabular-nums" data-testid="header-streak-value">{streak}</span>
            </button>

            <button
              onClick={() => { logout(); navigate("/auth"); }}
              className="text-psy-subtext hover:text-psy-primary transition p-2 rounded-full hover:bg-psy-card"
              data-testid="logout-button"
              aria-label="Sign out"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* 9 PM Gratitude reminder — only if past 21:00 local + gratitude not logged */}
        {showReminder && (
          <div className="border-t border-psy-primary/25 bg-gradient-to-r from-psy-primary/12 via-psy-card to-psy-primary/8 animate-fade-up">
            <div className="max-w-md md:max-w-4xl mx-auto px-5 py-3 flex items-center gap-3" data-testid="gratitude-reminder">
              <span className="h-9 w-9 rounded-full bg-psy-primary/20 border border-psy-primary/35 flex items-center justify-center text-psy-primary shrink-0">
                <Bell size={15} strokeWidth={1.6} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">A gentle reminder</p>
                <p className="text-xs text-psy-subtext leading-snug mt-0.5">
                  Three blessings before the day folds — <span className="text-psy-primary font-medium">+15 Bless</span> awaits.
                </p>
              </div>
              <Link
                to="/gratitude"
                onClick={requestNotificationPermission}
                className="text-xs font-medium text-psy-primary hover:text-[#C2682E] transition px-3 py-1.5 rounded-full border border-psy-primary/40 hover:bg-psy-primary/10 shrink-0"
                data-testid="reminder-cta"
              >
                Offer now
              </Link>
              <button
                onClick={dismissReminder}
                data-testid="reminder-dismiss"
                className="text-psy-subtext hover:text-psy-text transition p-1.5 rounded-full hover:bg-psy-bg shrink-0"
                aria-label="Dismiss reminder"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-md md:max-w-4xl mx-auto px-5 pt-7 pb-32 animate-fade-up">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-psy-bg/90 backdrop-blur-xl border-t border-psy-border">
        <div className="max-w-md md:max-w-4xl mx-auto px-6 py-3 flex items-center justify-around">
          {NAV.map((item) => {
            const active = loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={item.testid}
                className={cn(
                  "flex flex-col items-center gap-1 text-[11px] tracking-wide transition px-3 py-1",
                  active ? "text-psy-primary" : "text-psy-subtext hover:text-psy-text",
                )}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bless Points modal */}
      <Modal
        open={blessOpen}
        onClose={() => setBlessOpen(false)}
        title="Bless Points"
        testid="bless-modal"
      >
        <div className="flex items-center gap-4 mb-5">
          <span className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-psy-primary/20 via-psy-primary/15 to-psy-primary/5 border border-psy-primary/40 flex items-center justify-center text-psy-primary overflow-hidden">
            {/* Soft rotating bloom backdrop */}
            <Flower2
              size={56}
              strokeWidth={0.6}
              className="absolute inset-0 m-auto text-psy-primary/15 animate-petal-spin"
            />
            <Flower2
              size={30}
              strokeWidth={1.4}
              className="relative animate-petal-breathe origin-center"
            />
          </span>
          <div>
            <p className="font-display text-4xl leading-none tabular-nums" data-testid="modal-bless-balance">{bless}</p>
            <p className="text-xs text-psy-subtext mt-1">accumulated grace</p>
          </div>
        </div>
        <p className="text-sm text-psy-text/85 leading-relaxed mb-4">
          Bless Points are earned through small, repeated devotions:
        </p>
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 font-medium text-psy-primary tabular-nums w-12 shrink-0">+15</span>
            <span className="text-psy-text/85">Daily three-blessing Gratitude ritual</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 font-medium text-psy-primary tabular-nums w-12 shrink-0">+5</span>
            <span className="text-psy-text/85">Each Daily Mini-Task completed</span>
          </li>
        </ul>
        <p className="text-xs text-psy-subtext mt-5 italic">
          Journal reframing earns no points — its reward is the clarity itself.
        </p>
        <Link to="/gratitude" onClick={() => setBlessOpen(false)} className="block mt-6">
          <Button className="w-full" data-testid="modal-bless-cta">
            Offer today's gratitude
            <Heart size={16} strokeWidth={1.5} />
          </Button>
        </Link>
      </Modal>

      {/* Veda Streak modal */}
      <Modal
        open={streakOpen}
        onClose={() => setStreakOpen(false)}
        title="Veda Streak"
        testid="streak-modal"
      >
        <div className="flex items-center gap-4 mb-5">
          <span className="h-14 w-14 rounded-2xl bg-psy-secondary/15 border border-psy-secondary/35 flex items-center justify-center text-psy-secondary">
            <Flame size={26} strokeWidth={1.5} />
          </span>
          <div>
            <p className="font-display text-4xl leading-none tabular-nums" data-testid="modal-streak-value">
              {streak}<span className="text-base text-psy-subtext ml-2">day{streak === 1 ? "" : "s"}</span>
            </p>
            <p className="text-xs text-psy-subtext mt-1">unbroken devotion</p>
          </div>
        </div>
        <p className="text-sm text-psy-text/85 leading-relaxed mb-3">
          Your streak counts consecutive days with at least one Bless-earning act —
          a completed mini-task, or the daily gratitude ritual.
        </p>
        {user?.last_activity_date && (
          <div className="bg-psy-bg border border-psy-border rounded-2xl px-4 py-3 text-sm flex items-center justify-between">
            <span className="text-psy-subtext">Last activity</span>
            <span className="font-medium text-psy-text">{user.last_activity_date}</span>
          </div>
        )}
        <p className="text-xs text-psy-subtext mt-5 italic">
          Skip a day and the count resets to one — gentle as the tide.
        </p>
      </Modal>
    </div>
  );
}
