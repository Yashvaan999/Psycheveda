// Saffron, Sage & Linen — Light Organic Token System (matches web tailwind config)
export const colors = {
  bg: '#FBF9F4',
  card: '#F3EFE6',
  cardAlt: '#EBE6DA',
  primary: '#D97736',
  primaryAlt: '#D97B45',
  primaryHover: '#C2682E',
  secondary: '#4E7065',
  sage: '#5C7A5C',
  text: '#2D3631',
  subtext: '#7A847F',
  border: '#E8E2D5',
  borderSoft: '#E5DDD0',
  white: '#FFFFFF',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  amber: '#D97706',
  orange: '#EA580C',
  emerald: '#059669',
  gold: '#E8B547',
  heart: '#E11D48',
};

export const radius = { sm: 8, md: 12, lg: 14, xl: 16, xxl: 24, pill: 999 };

export const shadows = {
  card: {
    shadowColor: '#2D3631',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  soft: {
    shadowColor: '#2D3631',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cta: {
    shadowColor: '#D97736',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const fonts = {
  display: 'Lora_500Medium',
  displayBold: 'Lora_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

// Premium HPA Axis adaptive palette
export const hpaPalettes = {
  cortisol_am: {
    bg: '#2C2A28',
    card: '#3B3632',
    primary: '#F4B371',
    secondary: '#8CAEA5',
    text: '#F9F6F0',
    subtext: '#A39E99',
    name: 'Morning',
    label: 'Cortisol Rise',
    tagline: 'Activate your biological engine.',
    description:
      'Elevate your baseline energy by aligning with your natural morning cortisol peak. This phase provides low-friction breathwork, hydration targets, and immediate sunlight exposure cues designed to banish morning brain fog, suppress residual melatonin, and set an unshakeable focus foundation for the day ahead.',
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxzdW5yaXNlJTIwbWlzdCUyMG5hdHVyZXxlbnwwfHx8fDE3NzkxNzg0NzF8MA&ixlib=rb-4.1.0&q=85',
  },
  twilight: {
    bg: '#1B1A1F',
    card: '#26252B',
    primary: '#D88B5C',
    secondary: '#6E8580',
    text: '#EFE8E0',
    subtext: '#94908B',
    name: 'Afternoon',
    label: 'Twilight Pause',
    tagline: 'Protect your energy reserves.',
    description:
      'Intentionally manage the classic mid-afternoon metabolic dip without over-relying on artificial stimulants or caffeine. Access restorative parasympathetic resets, ergonomic micro-stretches tailored to your occupation, and balanced anti-inflammatory fueling suggestions to cruise through the rest of your workday without crashing.',
    image: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxtaW5kZnVsbmVzcyUyMGNhbG0lMjBuYXR1cmV8ZW58MHx8fHwxNzc5MTc4NDcyfDA&ixlib=rb-4.1.0&q=85',
  },
  melatonin_pm: {
    bg: '#0B0E14',
    card: '#131822',
    primary: '#B27242',
    secondary: '#496875',
    text: '#E2E8F0',
    subtext: '#758498',
    name: 'Night',
    label: 'Melatonin Descent',
    tagline: 'Transition to deep recovery.',
    description:
      'Trigger your body\'s natural evening melatonin synthesis to guarantee cellular and emotional repair. Prepare your brain for sleep through a curated "digital sunset" interface, passive wind-down protocols, and your structured 5-step NLP cognitive reframing journal to close out open mental loops.',
    image: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbmlnaHQlMjBzdGFycnklMjBza3l8ZW58MHx8fHwxNzc5MTc4NDcxfDA&ixlib=rb-4.1.0&q=85',
  },
};

export function getHpaPhase(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 14) return 'cortisol_am';
  if (h >= 14 && h < 17) return 'twilight';
  return 'melatonin_pm';
}

export const withAlpha = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
