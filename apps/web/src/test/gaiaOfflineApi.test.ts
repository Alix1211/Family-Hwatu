import { beforeEach, describe, expect, it } from 'vitest';
import { gaiaOfflineRequest } from '../lib/gaiaOfflineApi';
import type { GameState } from '../engine/types';
import type { UserProfile, SaveGameResult, GostopSettlementResult } from '../lib/types';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
      removeItem: (key: string) => { memory.delete(key); }
    }
  });
});

describe('GAIA Android local-only API', () => {
  it('opens without a server account and creates a persistent local profile', async () => {
    const session = await gaiaOfflineRequest<{ user: UserProfile }>('/api/session', {});
    expect(session.user.displayName).toBe('케인');
    expect(session.user.virtualBalance).toBe(500_000);
    const dashboard = await gaiaOfflineRequest<{ user: UserProfile }>('/api/dashboard', {});
    expect(dashboard.user.id).toBe(session.user.id);
  });

  it('applies a match settlement once, then restores its saved state', async () => {
    const state = {
      gameUuid: 'round-1', gameMode: 'matgo', turnNumber: 10, stateVersion: 3,
      phase: 'round-ended', winner: 'human', settlement: { displayAmount: 2400 }
    } as GameState;
    const request = { method: 'PUT', body: JSON.stringify({ state }) };
    const first = await gaiaOfflineRequest<SaveGameResult>('/api/games/matgo', request);
    const second = await gaiaOfflineRequest<SaveGameResult>('/api/games/matgo', request);
    expect(first.balance).toBe(502_400);
    expect(first.settlementApplied).toBe(true);
    expect(second.balance).toBe(502_400);
    expect(second.settlementApplied).toBe(false);
    const saved = await gaiaOfflineRequest<{ state: GameState }>('/api/games/matgo', {});
    expect(saved.state.gameUuid).toBe('round-1');
  });

  it('settles the three-person game exactly once', async () => {
    const request = {
      method: 'POST',
      body: JSON.stringify({
        gameUuid: 'gostop-1', winner: 'human', finalScore: 4, pointValue: 100,
        humanPoints: 4, computerAPoints: -2, computerBPoints: -2
      })
    };
    const first = await gaiaOfflineRequest<GostopSettlementResult>('/api/games/gostop/settle', request);
    const second = await gaiaOfflineRequest<GostopSettlementResult>('/api/games/gostop/settle', request);
    expect(first.balance).toBe(500_400);
    expect(first.computerABalance).toBe(499_800);
    expect(second.balance).toBe(first.balance);
    expect(second.settlementApplied).toBe(false);
  });
});
