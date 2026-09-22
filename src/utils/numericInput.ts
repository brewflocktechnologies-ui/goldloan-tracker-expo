// TextInput's keyboardType only changes which on-device keyboard is shown — it never
// blocks what actually lands in the field (pasted text, a hardware keyboard, or any
// input on web). These sanitizers strip non-numeric characters as the user types.

export function sanitizeIntegerInput(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}
