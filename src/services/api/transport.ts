import { ApiConfig } from '../../config/api';
import { ApiResponse } from '../../types';

/** What the HTTP layer needs from the ApiService instance (read at call time). */
export interface ApiContext {
  sessionToken: string | null;
  getOnUnauthorized(): (() => void) | null;
}

/** The transport surface the domain modules call back into (kept as instance methods so spies still work). */
export interface ApiTransport {
  callGas<T>(action: string, payload?: any, preferredMethod?: 'POST' | 'GET'): Promise<ApiResponse<T>>;
  postToGas<T>(action: string, payload?: any): Promise<ApiResponse<T>>;
  getFromGas<T>(action: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
  getSessionToken(): string | null;
}

/**
 * Universal HTTP request to Google Apps Script Web App
 * Always appends action query parameter to preserve action during Google redirects.
 * Uses GET for queries and POST for mutations with automatic fallback.
 */
export async function callGas<T>(ctx: ApiContext, action: string, payload: any = {}, preferredMethod: 'POST' | 'GET' = 'GET'): Promise<ApiResponse<T>> {
  const baseUrl = ApiConfig.getApiUrl();
  if (!baseUrl) {
    return { success: false, error: "Google Apps Script Web App URL not configured." };
  }

  // Mutations must never fall back to GET: GET drops object payloads (accountData, userData, ...)
  // and, if the POST already ran server-side, would create a blank/duplicate row.
  const methods: ('GET' | 'POST')[] =
    preferredMethod === 'GET' ? ['GET', 'POST'] : ['POST'];

  // Automatically attach active session token if present
  const token = ctx.sessionToken;
  const enrichedPayload = token && !payload.token ? { token, ...payload } : payload;

  for (const method of methods) {
    try {
      let response: Response;
      const separator = baseUrl.includes('?') ? '&' : '?';

      if (method === 'POST') {
        // Always keep action and token in URL query so Google 302 redirect preserves them
        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
        const urlWithAction = `${baseUrl}${separator}action=${encodeURIComponent(action)}${tokenParam}`;
        response = await fetch(urlWithAction, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({ action, ...enrichedPayload }),
        });
      } else {
        // For GET, append action and any scalar payload properties as query parameters
        const queryParams: Record<string, string> = { action };
        for (const [k, v] of Object.entries(enrichedPayload)) {
          if (v !== undefined && v !== null && typeof v !== 'object') {
            queryParams[k] = String(v);
          }
        }
        const query = new URLSearchParams(queryParams).toString();
        response = await fetch(`${baseUrl}${separator}${query}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          // Check for unauthorized / expired session token
          if (token && parsed.code === 401 && action !== 'login' && action !== 'logout') {
            console.warn(`[API] 401 Unauthorized encountered on action "${action}".`);
            const onUnauthorized = ctx.getOnUnauthorized();
            if (onUnauthorized) {
              onUnauthorized();
            }
          }

          // If response indicates action was dropped on redirect, try the fallback method!
          if (parsed.success === false && parsed.error === 'No action specified in request') {
            console.warn(`[API] ${method} returned 'No action specified in request', attempting fallback method...`);
            continue;
          }
          return parsed;
        }
      } catch {
        if (text.includes('Success') || text.includes('success')) {
          return { success: true, data: text as any };
        }
        if (method === methods[methods.length - 1]) {
          return { success: false, error: `Invalid server response: ${text.slice(0, 100)}` };
        }
      }
    } catch (err: any) {
      if (method === methods[methods.length - 1]) {
        return { success: false, error: err.message || 'Network request failed.' };
      }
    }
  }

  return { success: false, error: 'Failed to communicate with Google Sheets backend.' };
}
