import { SavedSession, Target, MortarState, TerrainId } from '../types';

const STORAGE_KEY = 'reforger_mortar_saved_sessions';
const LAST_STATE_KEY = 'reforger_mortar_last_state';

export function getSavedSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSession(session: SavedSession): void {
  try {
    const sessions = getSavedSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...session, updatedAt: Date.now() };
    } else {
      sessions.unshift({ ...session, updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save session to localStorage', err);
  }
}

export function deleteSession(id: string): void {
  try {
    const sessions = getSavedSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to delete session', err);
  }
}

export function saveLastActiveState(state: {
  terrain: TerrainId;
  mortar: MortarState;
  targets: Target[];
  selectedTargetId: string | null;
}): void {
  try {
    localStorage.setItem(LAST_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getLastActiveState(): {
  terrain: TerrainId;
  mortar: MortarState;
  targets: Target[];
  selectedTargetId: string | null;
} | null {
  try {
    const raw = localStorage.getItem(LAST_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Encode current mission state to URL hash query
 */
export function encodeMissionToHash(
  terrain: TerrainId,
  mortar: MortarState,
  targets: Target[],
  selectedTargetId: string | null
): string {
  try {
    const payload = {
      t: terrain,
      m: {
        x: Math.round(mortar.x),
        y: Math.round(mortar.y),
        a: Math.round(mortar.altitude),
        type: mortar.type,
        mil: mortar.milSystem,
        ch: mortar.selectedChargeOverride,
      },
      tgts: targets.map((tgt) => ({
        id: tgt.id,
        n: tgt.name,
        x: Math.round(tgt.x),
        y: Math.round(tgt.y),
        a: Math.round(tgt.altitude),
        c: tgt.color,
      })),
      sel: selectedTargetId,
    };
    const jsonStr = JSON.stringify(payload);
    // Base64 encode for clean URL hash
    return '#' + encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
  } catch {
    return '';
  }
}

/**
 * Decode mission state from URL hash
 */
export function decodeMissionFromHash(hashStr: string): {
  terrain: TerrainId;
  mortar: MortarState;
  targets: Target[];
  selectedTargetId: string | null;
} | null {
  try {
    const cleanHash = hashStr.startsWith('#') ? hashStr.slice(1) : hashStr;
    if (!cleanHash) return null;

    const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(cleanHash))));
    const parsed = JSON.parse(jsonStr);

    if (!parsed || !parsed.m) return null;

    const terrain: TerrainId = parsed.t === 'arland' ? 'arland' : 'everon';
    const mortar: MortarState = {
      x: Number(parsed.m.x) || 4500,
      y: Number(parsed.m.y) || 7200,
      altitude: Number(parsed.m.a) || 50,
      type: parsed.m.type || 'M252',
      milSystem: parsed.m.mil === '6000' ? '6000' : '6400',
      selectedChargeOverride: parsed.m.ch !== undefined ? parsed.m.ch : null,
    };

    const targets: Target[] = Array.isArray(parsed.tgts)
      ? parsed.tgts.map((tgt: any, idx: number) => ({
          id: tgt.id || `target-${Date.now()}-${idx}`,
          name: tgt.n || `Target ${idx + 1}`,
          x: Number(tgt.x) || 5000,
          y: Number(tgt.y) || 8000,
          altitude: Number(tgt.a) || 50,
          color: tgt.c || '#ef4444',
          createdAt: Date.now(),
        }))
      : [];

    return {
      terrain,
      mortar,
      targets,
      selectedTargetId: parsed.sel || (targets[0] ? targets[0].id : null),
    };
  } catch {
    return null;
  }
}
