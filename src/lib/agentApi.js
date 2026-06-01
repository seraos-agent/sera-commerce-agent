/**
 * agentApi.js — SERA Frontend API Bridge
 *
 * Centralises all HTTP calls so the rest of the app only
 * imports from this module, never hardcodes URLs.
 *
 * Port map:
 *   5173 → Vite (frontend)
 *   3001 → Node.js Commerce Runtime (stores, analytics, campaigns, publish)
 *   8000 → Python ADK Multi-Agent Service (chat, embed)
 */

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const ADK_URL     = import.meta.env.VITE_ADK_URL     || 'http://localhost:8000'; // Python ADK service

/**
 * Sanitize history before sending to ADK to prevent token overflow.
 * Agent messages often contain giant schema JSON in `params` — strip them.
 * Keep only last 6 turns (3 user + 3 agent) of lightweight text.
 */
function sanitizeHistory(history = []) {
  // Take only last 6 messages
  const recent = history.slice(-6);
  return recent.map(m => ({
    role: m.role,
    // Only keep the text field — drop params, schema, milestones, events, tools
    text: typeof m.text === 'string' ? m.text.slice(0, 500) : '',
  }));
}

export async function sendChat({ input, history, storeContext, chatMode = 'plan', images = [] }, signal) {
  const safeHistory = sanitizeHistory(history);
  return fetch(`${ADK_URL}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ input, history: safeHistory, storeContext, chatMode, images }),
  });
}

// ── Commerce APIs (Node.js backend) ─────────────────────────────────────────

export async function getStores(sessionId) {
  const r = await fetch(`${BACKEND_URL}/api/stores?session_id=${encodeURIComponent(sessionId)}`);
  return r.json();
}

export async function publishStore(payload) {
  const r = await fetch(`${BACKEND_URL}/api/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function getAnalytics(storeId) {
  const r = await fetch(`${BACKEND_URL}/api/analytics?store_id=${encodeURIComponent(storeId)}`);
  return r.json();
}

export async function createCampaign(payload) {
  const r = await fetch(`${BACKEND_URL}/api/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function rememberAction(action, status, details) {
  return fetch(`${BACKEND_URL}/api/remember`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, status, details }),
  });
}

export async function createGuestSession() {
  const r = await fetch(`${BACKEND_URL}/api/guest/session`, { method: 'POST' });
  return r.json();
}

export async function searchProducts(query, limit = 6) {
  const r = await fetch(`${BACKEND_URL}/api/search-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  return r.json();
}

// ── Health checks ────────────────────────────────────────────────────────────

export async function checkBackendHealth() {
  try {
    const r = await fetch(`${BACKEND_URL}/health`);
    return r.json();
  } catch {
    return { status: 'unreachable' };
  }
}

export async function checkAdkHealth() {
  try {
    const r = await fetch(`${ADK_URL}/health`);
    return r.json();
  } catch {
    return { status: 'unreachable' };
  }
}
