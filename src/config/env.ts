/**
 * Global Environment & Configuration Service
 * 
 * Safely parses and exposes all environment variables defined in .env
 * All client-accessible variables must have the EXPO_PUBLIC_ prefix.
 */

export const Env = {
  // Google Apps Script & Google Sheets
  GAS_API_URL: process.env.EXPO_PUBLIC_GAS_API_URL || "",
  SPREADSHEET_ID: process.env.EXPO_PUBLIC_SPREADSHEET_ID || "",

  // Branding & Regional
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || "Goldora",
  APP_SUBTITLE: process.env.EXPO_PUBLIC_APP_SUBTITLE || "Bangalore Gold Valuation System",
  LOCATION_BENCHMARK: process.env.EXPO_PUBLIC_LOCATION_BENCHMARK || "Bangalore",

  // Baseline Gold Rates (₹ per 1g)
  FALLBACK_24K_RATE: Number(process.env.EXPO_PUBLIC_FALLBACK_24K_RATE) || 8850,
  FALLBACK_22K_RATE: Number(process.env.EXPO_PUBLIC_FALLBACK_22K_RATE) || 8115,
  FALLBACK_18K_RATE: Number(process.env.EXPO_PUBLIC_FALLBACK_18K_RATE) || 6640,

  // Loan Financial Defaults
  DEFAULT_INTEREST_RATE: Number(process.env.EXPO_PUBLIC_DEFAULT_INTEREST_RATE) || 1.5,
  DEFAULT_LOAN_PERIOD: process.env.EXPO_PUBLIC_DEFAULT_LOAN_PERIOD || "12 Months",
  MAX_LTV_PERCENT: Number(process.env.EXPO_PUBLIC_MAX_LTV_PERCENT) || 75,
} as const;
