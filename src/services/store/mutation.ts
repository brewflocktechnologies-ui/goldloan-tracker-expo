import { api } from '../api';
import { persistAll } from './persist';
import { notify, state } from './state';
import { getSyncError, syncFromBackend } from './sync';

type MutationErrorHandler = (message: string) => void;

/** Lets the UI (toast provider) show a message when a save fails and is reverted. */
export function setMutationErrorHandler(handler: MutationErrorHandler | null) {
  state.mutationErrorHandler = handler;
}

export function reportMutationError(message: string) {
  if (state.mutationErrorHandler) state.mutationErrorHandler(message);
  else console.warn('[Store]', message);
}

export function replaceItem<T>(list: T[], item: T | undefined, key: keyof T): T[] {
  if (!item) return list;
  return list.map(x => (x[key] === item[key] ? item : x));
}

export function restoreItem<T>(list: T[], item: T | undefined, key: keyof T, index: number): T[] {
  if (!item || list.some(x => x[key] === item[key])) return list;
  const copy = [...list];
  copy.splice(Math.min(Math.max(index, 0), copy.length), 0, item);
  return copy;
}

/** Optional hooks so a screen can react to the real outcome (e.g. show "saved" only once confirmed). */
export interface SaveCallbacks {
  onSuccess?: (saved?: any) => void;
  /** If given, replaces the global error toast for this save. */
  onError?: (message: string) => void;
}

export interface MutationOptions<T> {
  callbacks?: SaveCallbacks;
  /** Shown to the user when the save fails, e.g. "Customer was not saved". */
  failureMessage: string;
  /** Runs when the backend confirms (only if it returned the saved row). */
  onSaved?: (data: T) => void;
  /** Puts the local list back the way it was. Must be safe to run twice. */
  undo: () => void;
  /** Adds: the temp row must always go, since the sheet either has the real row or nothing. */
  alwaysUndo?: boolean;
  /** Adds: finds the real row if the save actually reached the sheet (lost reply). */
  findSaved?: () => any;
  /** Called instead of the global error handler (e.g. the loan form has its own message). */
  onFailure?: (message: string) => void;
  onFound?: (row: any) => void;
}

/**
 * Runs a backend save. On any failure (rejected, `success: false`, or an unreadable reply) the
 * result is unknown, so ask the sheet what is true instead of guessing:
 *  - sheet reachable → the refreshed lists are the truth (a lost reply that did save is kept);
 *  - sheet unreachable → undo the local change so the UI never shows something that was not saved.
 * The user is always told when a change was not saved.
 */
export async function runMutation<T>(
  call: () => Promise<{ success: boolean; data?: any; error?: string }>,
  opts: MutationOptions<T>
) {
  let res: { success: boolean; data?: any; error?: string };
  try {
    res = await call();
  } catch (err: any) {
    console.warn('[Store] save failed:', err);
    res = { success: false, error: err?.message || 'Network request failed' };
  }

  try {
    if (res.success) {
      if (res.data && opts.onSaved) opts.onSaved(res.data as T);
      opts.callbacks?.onSuccess?.(res.data);
      return;
    }

    await syncFromBackend(true);
    const offline = !api.getSessionToken() || getSyncError() !== null;

    const saved = !offline && opts.findSaved ? opts.findSaved() : null;
    if (saved) {
      opts.onFound?.(saved);
      opts.callbacks?.onSuccess?.(saved);
      return;
    }

    if (offline || opts.alwaysUndo) opts.undo();
    notify();

    const detail = res.error ? `: ${res.error}` : '';
    const message = offline
      ? `${opts.failureMessage}${detail} (no connection, change undone)`
      : `${opts.failureMessage}${detail}`;
    if (opts.onFailure) opts.onFailure(res.error || opts.failureMessage);
    else if (opts.callbacks?.onError) opts.callbacks.onError(message);
    else reportMutationError(message);
  } finally {
    persistAll();
    notify();
  }
}

export function nextId(prefix: string, list: any[], key: string): string {
  const max = list.reduce((m, item) => {
    const raw = String(item[key] || '');
    const num = parseInt(raw.replace(/\D/g, ''), 10);
    return !isNaN(num) && num > m ? num : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}
