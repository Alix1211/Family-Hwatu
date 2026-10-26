import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialGame } from '../engine/gameState';
import { offlineRequest } from '../lib/offlineApi';
import type { GostopSettlementRequest, SaveGameResult, SessionData } from '../lib/types';

const saved = new Map<string, string>();
const storage = {
  getItem: (key: string) => saved.get(key) ?? null,
  setItem: (key: string, value: string) => { saved.set(key, String(value)); },
  removeItem: (key: string) => { saved.delete(key); },
  clear: () => saved.clear()
};

beforeEach(() => {
  saved.clear();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Offline mode must not make network requests'); }));
});
afterEach(() => vi.unstubAllGlobals());

describe('개인용 오프라인 API', () => {
  it('서버 통신 없이 자동 로그인하고 기본 게임머니를 제공합니다', async () => {
    const session = await offlineRequest<SessionData>('/api/session');
    expect(session.user.displayName).toBe('플레이어');
    expect(session.user.virtualBalance).toBe(500_000);
    const dashboard = await offlineRequest<{ gameStats: { matgo: { totalGames: number } } }>('/api/dashboard');
    expect(dashboard.gameStats.matgo.totalGames).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('맞고 승리 금액과 전적을 한 번만 저장하고 재접속 때 이어받습니다', async () => {
    const state = createInitialGame(1234);
    state.phase = 'round-ended'; state.roundResult = 'win'; state.winner = 'human';
    state.computerCaptured = ['m01-1'];
    state.settlement = {
      baseScore: 7, goBonus: 0, goMultiplier: 1, shakeMultiplier: 1,
      missionMultiplier: 1, baks: [], bakMultiplier: 1, finalScore: 7,
      pointValue: 1000, displayAmount: 7000, isRealCurrency: false,
      isExchangeable: false, steps: []
    };
    const options = { method: 'PUT', body: JSON.stringify({ state }) };
    const first = await offlineRequest<SaveGameResult>('/api/games/matgo', options);
    const second = await offlineRequest<SaveGameResult>('/api/games/matgo', options);
    expect(first.balance).toBe(507_000);
    expect(first.opponentBalance).toBe(493_000);
    expect(first.settlementApplied).toBe(true);
    expect(second.balance).toBe(507_000);
    expect(second.settlementApplied).toBe(false);
    const game = await offlineRequest<{ state: typeof state }>('/api/games/matgo');
    expect(game.state.gameUuid).toBe(state.gameUuid);
    const dashboard = await offlineRequest<{ gameStats: { matgo: { wins: number } } }>('/api/dashboard');
    expect(dashboard.gameStats.matgo.wins).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('고스톱 3인 정산을 중복 적용하지 않습니다', async () => {
    const request: GostopSettlementRequest = {
      gameUuid: 'test-gostop-1', roundResult: 'win', winner: 'human',
      finalScore: 5, pointValue: 1000, humanPoints: 10,
      computerAPoints: -5, computerBPoints: -5
    };
    const options = { method: 'POST', body: JSON.stringify(request) };
    const first = await offlineRequest<{ balance: number; computerABalance: number }>('/api/games/gostop/settle', options);
    const second = await offlineRequest<{ balance: number; computerABalance: number; settlementApplied: boolean }>('/api/games/gostop/settle', options);
    expect(first.balance).toBe(510_000);
    expect(first.computerABalance).toBe(495_000);
    expect(second.balance).toBe(first.balance);
    expect(second.settlementApplied).toBe(false);
  });

  it('서버 없는 환경에서도 게임머니를 리필합니다', async () => {
    saved.set('family-hwatu-offline-v1:profile', JSON.stringify({
      id: 1, username: 'local', displayName: '플레이어', role: 'member', virtualBalance: 0
    }));
    const result = await offlineRequest<{ balance: number }>('/api/balance/refill', { method: 'POST' });
    expect(result.balance).toBe(500_000);
  });
});
