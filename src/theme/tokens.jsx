// Sacred Earth & Slate theme tokens — mirrors design_guidelines.json
// Used by every screen except the premium HPA Axis Fix, which has its own provider.
export const tokens = {
  bg: "#161B22",
  card: "#21262D",
  primary: "#E58A44",
  secondary: "#52796F",
  text: "#F0F4F8",
  subtext: "#8B949E",
  border: "#30363D",
};

export const hpaPalettes = {
  cortisol_am: {
    bg: "#2C2A28",
    card: "#3B3632",
    primary: "#F4B371",
    secondary: "#8CAEA5",
    text: "#F9F6F0",
    subtext: "#A39E99",
    label: "Cortisol Rise",
    description:
      "Morning surge — high-clarity warmth to honor the awakening HPA axis.",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxzdW5yaXNlJTIwbWlzdCUyMG5hdHVyZXxlbnwwfHx8fDE3NzkxNzg0NzF8MA&ixlib=rb-4.1.0&q=85",
  },
  twilight: {
    bg: "#1B1A1F",
    card: "#26252B",
    primary: "#D88B5C",
    secondary: "#6E8580",
    text: "#EFE8E0",
    subtext: "#94908B",
    label: "Twilight Pause",
    description:
      "Midday-to-dusk transition — softened tones for grounded reset.",
    image:
      "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxtaW5kZnVsbmVzcyUyMGNhbG0lMjBuYXR1cmV8ZW58MHx8fHwxNzc5MTc4NDcyfDA&ixlib=rb-4.1.0&q=85",
  },
  melatonin_pm: {
    bg: "#0B0E14",
    card: "#131822",
    primary: "#B27242",
    secondary: "#496875",
    text: "#E2E8F0",
    subtext: "#758498",
    label: "Melatonin Descent",
    description:
      "Evening fall — cool, sub-luminal hues that invite parasympathetic rest.",
    image:
      "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbmlnaHQlMjBzdGFycnklMjBza3l8ZW58MHx8fHwxNzc5MTc4NDcxfDA&ixlib=rb-4.1.0&q=85",
  },
};

// Reads the user's *device local* time to compute the active circadian palette.
export function getHpaPhase(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 14) return "cortisol_am";
  if (h >= 14 && h < 17) return "twilight";
  return "melatonin_pm";
}

export const pillarMeta = {
  family_relationship: { label: "Family & Relationship", glyph: "Users" },
  career_business: { label: "Career & Business", glyph: "Briefcase" },
  finance_money: { label: "Finance & Money", glyph: "Coins" },
  health: { label: "Health", glyph: "HeartPulse" },
  inner_wellness: { label: "Inner Wellness", glyph: "Sparkles" },
};
