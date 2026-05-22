import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Leaf, ArrowRight, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button, Input, Label, Divider } from "../components/ui/primitives";

export default function AuthScreen() {
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to={user.onboarding_complete ? "/dashboard" : "/onboarding"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = mode === "login"
        ? await login(form.email, form.password)
        : await register(form.email, form.password, form.full_name);
      navigate(u.onboarding_complete ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-psy-bg flex flex-col text-psy-text font-body linen-grain">
      {/* Light, organic hero */}
      <div className="relative flex-1 min-h-[42vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxtaW5kZnVsbmVzcyUyMGNhbG0lMjBuYXR1cmV8ZW58MHx8fHwxNzc5MTc4NDcyfDA&ixlib=rb-4.1.0&q=85')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-psy-bg/40 via-psy-bg/85 to-psy-bg" />
        <div className="relative h-full flex flex-col items-center justify-end pb-12 px-6 text-center">
          <div className="inline-flex items-center gap-2 text-psy-secondary text-xs uppercase tracking-[0.3em] mb-4 font-medium">
            <Leaf size={14} strokeWidth={1.5} />
            <span>Saffron, Sage & Linen</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tight text-psy-text leading-none">
            Psyche<span className="text-psy-primary">veda</span>
          </h1>
          <p className="text-psy-subtext text-sm mt-4 max-w-xs leading-relaxed">
            Conscious Wisdom, Aligned Mind.
          </p>
        </div>
      </div>

      {/* Auth form */}
      <div className="px-6 pt-2 pb-12 max-w-md w-full mx-auto">
        <div className="flex items-center justify-center gap-2 mb-7 text-xs uppercase tracking-[0.22em]">
          <button
            onClick={() => setMode("login")}
            data-testid="tab-login"
            className={`px-5 py-2 rounded-full transition font-medium ${
              mode === "login"
                ? "bg-psy-card text-psy-primary border border-psy-primary/30"
                : "text-psy-subtext hover:text-psy-text"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("register")}
            data-testid="tab-register"
            className={`px-5 py-2 rounded-full transition font-medium ${
              mode === "register"
                ? "bg-psy-card text-psy-primary border border-psy-primary/30"
                : "text-psy-subtext hover:text-psy-text"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {mode === "register" && (
            <div>
              <Label>Full Name</Label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-psy-subtext" />
                <Input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Arjun Sharma"
                  required
                  className="pl-11"
                  data-testid="register-name-input"
                />
              </div>
            </div>
          )}
          <div>
            <Label>Email</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-psy-subtext" />
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="seeker@psycheveda.app"
                required
                className="pl-11"
                data-testid="auth-email-input"
              />
            </div>
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-psy-subtext" />
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="pl-11"
                data-testid="auth-password-input"
              />
            </div>
          </div>

          {error && (
            <p
              className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3"
              data-testid="auth-error"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full" data-testid="auth-submit-button">
            {busy ? "Just a moment…" : mode === "login" ? "Sign In" : "Begin the Journey"}
            <ArrowRight size={18} strokeWidth={1.5} />
          </Button>
        </form>

        <Divider label="Tend to your inner garden" />
        <p className="text-center text-xs text-psy-subtext leading-relaxed">
          By continuing you accept the gentle responsibility to honor your own well-being.
        </p>
      </div>
    </div>
  );
}
