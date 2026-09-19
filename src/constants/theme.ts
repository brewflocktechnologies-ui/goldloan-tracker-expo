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
  primary: "#ca8a04",
  primaryDark: "#a16207",
  primaryLight: "#facc15",
  primarySubtle: "#fefce8",
  amber: "#d97706",

  brand: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
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
  primary: "#f59e0b",
  primaryDark: "#d97706",
  primaryLight: "#fbbf24",
  primarySubtle: "#261a02",
  amber: "#f59e0b",

  brand: {
    50: '#261a02',
    100: '#382504',
    200: '#4f3405',
    300: '#784e08',
    400: '#a16207',
    500: '#ca8a04',
    600: '#eab308',
    700: '#facc15',
    800: '#fde047',
    900: '#fef08a',
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

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};
