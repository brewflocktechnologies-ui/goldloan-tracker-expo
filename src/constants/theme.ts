// Theme constants for Goldora app

export interface ThemeColors {
  // Brand Gold & Amber
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySubtle: string;
  amber: string;
  brand: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Backgrounds
  background: string;
  bgLight: string;
  bgSecondary: string;
  surface: string;
  surfaceSubtle: string;
  card: string;
  inputBg: string;
  modalOverlay: string;

  // Text
  textPrimary: string;
  textDark: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  placeholder: string;

  // Statuses
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  info: string;
  infoBg: string;

  // Borders & Dividers
  border: string;
  borderLight: string;
  borderDark: string;

  // Skeleton
  skeletonBase: string;
  skeletonHighlight: string;
}

export const LightColors: ThemeColors = {
  primary: "#0284c7",
  primaryDark: "#0369a1",
  primaryLight: "#38bdf8",
  primarySubtle: "#f0f9ff",
  amber: "#d97706",

  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  background: "#f8fafc",
  bgLight: "#f8fafc",
  bgSecondary: "#f1f5f9",
  surface: "#ffffff",
  surfaceSubtle: "#f1f5f9",
  card: "#ffffff",
  inputBg: "#ffffff",
  modalOverlay: "rgba(0, 0, 0, 0.5)",
  
  textPrimary: "#0f172a",
  textDark: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  textLight: "#ffffff",
  placeholder: "#94a3b8",
  
  success: "#16a34a",
  successBg: "#dcfce7",
  warning: "#ea580c",
  warningBg: "#ffedd5",
  danger: "#dc2626",
  dangerBg: "#fee2e2",
  info: "#0284c7",
  infoBg: "#e0f2fe",
  
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  borderDark: "#cbd5e1",

  skeletonBase: "#e2e8f0",
  skeletonHighlight: "#f8fafc",
};

export const DarkColors: ThemeColors = {
  primary: "#38bdf8",
  primaryDark: "#0284c7",
  primaryLight: "#7dd3fc",
  primarySubtle: "#082f49",
  amber: "#f59e0b",

  brand: {
    50: '#082f49',
    100: '#0c4a6e',
    200: '#075985',
    300: '#0369a1',
    400: '#0284c7',
    500: '#0ea5e9',
    600: '#38bdf8',
    700: '#7dd3fc',
    800: '#bae6fd',
    900: '#e0f2fe',
  },

  background: "#000000",
  bgLight: "#090d16",
  bgSecondary: "#0a0f1d",
  surface: "#0f172a",
  surfaceSubtle: "#1e293b",
  card: "#0f172a",
  inputBg: "#090d16",
  modalOverlay: "rgba(0, 0, 0, 0.8)",

  textPrimary: "#f8fafc",
  textDark: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  textLight: "#ffffff",
  placeholder: "#64748b",

  success: "#22c55e",
  successBg: "#052e16",
  warning: "#f97316",
  warningBg: "#431407",
  danger: "#ef4444",
  dangerBg: "#450a0a",
  info: "#38bdf8",
  infoBg: "#082f49",

  border: "#1e293b",
  borderLight: "#182234",
  borderDark: "#334155",

  skeletonBase: "#1e293b",
  skeletonHighlight: "#334155",
};

// Default export for backward compatibility
export const Colors = LightColors;

// Shared type scale. Page-level styles should use these instead of literals.
export const Typography = {
  pageTitle: { fontSize: 18, fontWeight: '800' as const },
  pageSubtitle: { fontSize: 11, fontWeight: '400' as const },
  sectionTitle: { fontSize: 15, fontWeight: '800' as const },
  cardTitle: { fontSize: 14, fontWeight: '800' as const },
  body: { fontSize: 13, fontWeight: '600' as const },
  label: { fontSize: 12, fontWeight: '700' as const },
  caption: { fontSize: 11, fontWeight: '600' as const },
  button: { fontSize: 15, fontWeight: '800' as const },
};
