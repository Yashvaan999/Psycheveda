import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home, testid: "nav-dashboard" },
  { to: "/journal", label: "Journal", icon: BookOpen, testid: "nav-journal" },
  { to: "/hpa-axis", label: "HPA Axis", icon: Sparkles, testid: "nav-hpa-axis" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  return (
    <div className="min-h-screen bg-psy-bg text-psy-text font-body relative">
      <header className="sticky top-0 z-30 bg-psy-bg/85 backdrop-blur-xl border-b border-psy-border/60">
        <div className="max-w-md md:max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="font-display text-2xl tracking-tight" data-testid="brand-link">
            Psyche<span className="text-psy-primary">veda</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-psy-subtext" data-testid="header-user-name">
              {user?.full_name}
            </span>
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
      </header>

      <main className="max-w-md md:max-w-4xl mx-auto px-5 pt-6 pb-32 animate-fade-up">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-psy-bg/90 backdrop-blur-xl border-t border-psy-border/60">
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
                  "flex flex-col items-center gap-1 text-[11px] tracking-wide transition",
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
    </div>
  );
}
