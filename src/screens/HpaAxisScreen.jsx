import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sun, Sunset, Moon, Activity, Wind, Sparkles, Clock } from "lucide-react";
import { hpaPalettes, getHpaPhase } from "../theme/tokens";

const PHASE_ICON = {
  cortisol_am: Sun,
  twilight: Sunset,
  melatonin_pm: Moon,
};

// Protocol cards adapt their copy slightly to the phase
const PROTOCOLS = {
  cortisol_am: [
    { icon: Activity, title: "Cold Exposure", desc: "60-second cold rinse to spike cortisol cleanly." },
    { icon: Sun, title: "Sunlight 10m", desc: "Direct sunlight to anchor the suprachiasmatic clock." },
    { icon: Wind, title: "Box Breathing", desc: "4-4-4-4 for 5 minutes — sharpen the prefrontal cortex." },
  ],
  twilight: [
    { icon: Wind, title: "Bilateral Walk", desc: "20-minute walk; alternate left/right gaze every breath." },
    { icon: Activity, title: "Mobility Reset", desc: "Hips, spine, neck — release stored sympathetic load." },
    { icon: Sparkles, title: "Hydration Cue", desc: "Warm water with lemon to bridge the dip." },
  ],
  melatonin_pm: [
    { icon: Moon, title: "Dim All Light", desc: "Drop ambient lux to <50; let melatonin pour in." },
    { icon: Wind, title: "Physiological Sigh", desc: "Two inhales + long exhale, repeated for 3 minutes." },
    { icon: Activity, title: "Body Scan", desc: "10-minute lying body scan from crown to soles." },
  ],
};

export default function HpaAxisScreen() {
  // Live-update every 60s so the palette can transition naturally across phases.
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const phase = useMemo(() => getHpaPhase(now), [now]);
  const palette = hpaPalettes[phase];
  const PhaseIcon = PHASE_ICON[phase];
  const protocols = PROTOCOLS[phase];

  const timeStr = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div
      className="min-h-screen relative font-body transition-colors duration-1000"
      style={{ backgroundColor: palette.bg, color: palette.text }}
    >
      {/* Hero image */}
      <div className="relative h-64 sm:h-72 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${palette.image})` }}
        />
        <div
          className="absolute inset-0 transition-colors duration-1000"
          style={{
            background: `linear-gradient(180deg, ${palette.bg}00 0%, ${palette.bg}AA 60%, ${palette.bg} 100%)`,
          }}
        />
        <Link
          to="/dashboard"
          className="absolute top-5 left-5 z-10 rounded-full p-2.5 border backdrop-blur-md transition"
          style={{ backgroundColor: `${palette.card}AA`, borderColor: `${palette.subtext}40`, color: palette.text }}
          data-testid="hpa-back-button"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <div
          className="absolute top-5 right-5 z-10 rounded-full px-3 py-1.5 border backdrop-blur-md text-[10px] uppercase tracking-[0.25em]"
          style={{ backgroundColor: `${palette.card}AA`, borderColor: `${palette.primary}55`, color: palette.primary }}
          data-testid="hpa-phase-badge"
        >
          {palette.label}
        </div>
      </div>

      <div className="max-w-md md:max-w-2xl mx-auto px-5 -mt-12 relative z-10">
        {/* Phase card */}
        <div
          className="rounded-2xl p-6 border transition-all duration-1000 animate-fade-up"
          style={{
            backgroundColor: palette.card,
            borderColor: `${palette.subtext}30`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `${palette.primary}1A`,
                color: palette.primary,
                border: `1px solid ${palette.primary}40`,
              }}
            >
              <PhaseIcon size={20} strokeWidth={1.5} />
            </span>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: palette.subtext }}>
                HPA Axis Fix Protocol
              </p>
              <h1 className="font-display text-3xl leading-tight">{palette.label}</h1>
            </div>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: palette.subtext }} data-testid="hpa-local-time">
              <Clock size={12} strokeWidth={1.5} />
              {timeStr}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: palette.subtext }}>
            {palette.description}
          </p>
        </div>

        {/* Protocols */}
        <div className="mt-6 mb-4">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: palette.primary }}>
            Tonight's Practice
          </p>
          <div className="space-y-3">
            {protocols.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl p-5 border flex items-start gap-4 transition-all duration-700"
                  style={{
                    backgroundColor: palette.card,
                    borderColor: `${palette.subtext}30`,
                  }}
                  data-testid={`hpa-protocol-${p.title.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <span
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${palette.secondary}20`,
                      color: palette.secondary,
                      border: `1px solid ${palette.secondary}40`,
                    }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl leading-tight">{p.title}</h3>
                    <p className="text-sm mt-1" style={{ color: palette.subtext }}>{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note about chronobiology */}
        <div
          className="rounded-2xl p-5 mt-6 mb-12 border text-center"
          style={{
            backgroundColor: `${palette.primary}0A`,
            borderColor: `${palette.primary}30`,
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: palette.primary }}>
            Why this changes
          </p>
          <p className="text-xs leading-relaxed" style={{ color: palette.subtext }}>
            This screen reads your <span style={{ color: palette.text }}>device local time</span> and adapts its palette to your
            HPA axis: <span style={{ color: palette.text }}>cortisol-warm</span> in the morning, <span style={{ color: palette.text }}>twilight-neutral</span> midday,
            and <span style={{ color: palette.text }}>melatonin-cool</span> at night.
          </p>
        </div>
      </div>
    </div>
  );
}
