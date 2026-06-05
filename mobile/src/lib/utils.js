import { colors } from './theme';

export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  });
}

export function formatDateLong(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Completion-probability badge colors (UI only; score comes from goalTrackingData). */
export function probColorForScore(p) {
  if (p >= 75) return { text: colors.emerald };
  if (p >= 50) return { text: colors.amber };
  if (p >= 30) return { text: colors.orange };
  return { text: colors.danger };
}
