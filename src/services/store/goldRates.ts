import { GoldRateData } from '../../types';
import { api } from '../api';
import { notify, state } from './state';

/**
 * Directly refresh Bangalore live gold rates from Google Apps Script web scraper
 */
export async function refreshGoldRates(force: boolean = false): Promise<GoldRateData> {
  if (state.isFetchingGoldRates) return state.goldRates;
  state.isFetchingGoldRates = true;
  notify();
  try {
    const res = await api.getGoldRates(force);
    if (res && res.data) {
      state.goldRates = res.data;
      notify();
      return res.data;
    }
  } catch (err) {
    console.warn('[Store] refreshGoldRates error:', err);
  } finally {
    state.isFetchingGoldRates = false;
    notify();
  }
  return state.goldRates;
}
