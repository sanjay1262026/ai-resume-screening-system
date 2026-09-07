import { Candidate, ScoringWeights, ScreeningSession, User } from '../types';

export interface UserDataPayload {
  jdTitle: string;
  jdText: string;
  weights: ScoringWeights;
  candidates: Candidate[];
  sessions: ScreeningSession[];
}

export async function loginUser(username: string, password?: string): Promise<User> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (err) {
    console.warn('Backend login fallback to local:', err);
  }

  // Local fallback
  const clean = username.trim().toLowerCase();
  return {
    id: 1,
    username: clean,
    full_name: clean === 'admin' ? 'Lead Recruiter' : clean.charAt(0).toUpperCase() + clean.slice(1),
  };
}

export async function fetchUserCloudData(username: string): Promise<UserDataPayload | null> {
  try {
    const res = await fetch(`/api/user-data/${encodeURIComponent(username)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.exists && json.data) {
        return {
          jdTitle: json.data.jdTitle || '',
          jdText: json.data.jdText || '',
          weights: json.data.weights,
          candidates: json.data.candidates || [],
          sessions: json.data.sessions || [],
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch user cloud data:', err);
  }

  // Fallback to local storage
  try {
    const local = localStorage.getItem(`resume_app_user_${username}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch {
    // ignore
  }

  return null;
}

let saveTimeout: any = null;

export function autoSaveUserCloudData(username: string, payload: UserDataPayload) {
  if (!username) return;

  // Always save to localStorage immediately
  try {
    localStorage.setItem(`resume_app_user_${username}`, JSON.stringify(payload));
  } catch (e) {
    // ignore
  }

  // Debounce backend save
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      await fetch(`/api/user-data/${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Auto-save to server failed:', err);
    }
  }, 600);
}
