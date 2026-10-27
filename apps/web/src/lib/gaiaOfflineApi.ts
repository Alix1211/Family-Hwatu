import type { GameState } from '../engine/types';
import { settleGostopPointDeltas } from '../games/gostop/money';
import type { GameModeStatistics, GostopSettlementRequest, UserProfile } from './types';

// Android GAIA edition only. No requests leave the device and no account is needed.
const PREFIX = 'gaia-city-hwatu-offline-v1:';
const USER_KEY = `${PREFIX}user`;
const MATGO_KEY = `${PREFIX}matgo`;
const MATGO_SETTLED_KEY = `${PREFIX}matgo-settled`;
const GOSTOP_SETTLED_KEY = `${PREFIX}gostop-settled`;
const DEFAULT_BALANCE = 500_000;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function user(): UserProfile {
  return read<UserProfile>(USER_KEY, {
    id: 1, username: 'gaia-local', displayName: '케인', role: 'member',
    virtualBalance: DEFAULT_BALANCE,
    opponentBalance: DEFAULT_BALANCE,
    gostopComputerABalance: DEFAULT_BALANCE,
    gostopComputerBBalance: DEFAULT_BALANCE
  });
}

function emptyStats(gameMode: 'matgo' | 'gostop'): GameModeStatistics {
  return {
    gameMode, totalGames: 0, wins: 0, losses: 0, nagari: 0, winRate: 0,
    highestScore: 0, longestWinStreak: 0, currentWinStreak: 0,
    totalSettlement: 0, biggestWinAmount: 0, recentResults: [],
    specialStatsTrackedGames: 0, totalGoCount: 0, highestWinningGoCount: 0,
    totalSweepCount: 0, maxSweepCount: 0, totalBombCount: 0, maxBombCount: 0,
    totalShakeCount: 0, maxShakeCount: 0, totalPpeokCount: 0, maxPpeokCount: 0,
    openingPpeokCount: 0, threePpeokWins: 0, piBakWins: 0, gwangBakWins: 0
  };
}

export async function gaiaOfflineRequest<T>(path: string, options: RequestInit): Promise<T> {
  const method = options.method ?? 'GET';
  const body = typeof options.body === 'string' ? JSON.parse(options.body) as Record<string, unknown> : {};
  const account = user();
  let result: unknown;

  if (path === '/api/auth/status') result = { needsBootstrap: false, bootstrapEnabled: false };
  else if (path === '/api/auth/csrf') result = { csrfToken: 'gaia-offline' };
  else if (path === '/api/session') result = { user: account, csrfToken: 'gaia-offline', deviceId: 'gaia-offline-device' };
  else if (path === '/api/auth/login') result = account;
  else if (path === '/api/auth/logout') result = null;
  else if (path === '/api/dashboard') {
    const saved = read<{ gameUuid: string; turnNumber: number; updatedAt: string } | null>(MATGO_KEY, null);
    result = {
      user: account,
      activeSave: saved ? { gameUuid: saved.gameUuid, turnNumber: saved.turnNumber, updatedAt: saved.updatedAt } : null,
      today: { games: 0, wins: 0, settlement: 0 },
      gameStats: { matgo: emptyStats('matgo'), gostop: emptyStats('gostop') }
    };
  }
  else if (path === '/api/balance/refill') {
    account.virtualBalance = DEFAULT_BALANCE;
    write(USER_KEY, account);
    result = { balance: account.virtualBalance };
  }
  else if (path === '/api/games/matgo' && method === 'GET') result = read(MATGO_KEY, null);
  else if (path === '/api/games/matgo' && method === 'PUT') {
    const state = body.state as GameState;
    if (!state || typeof state.gameUuid !== 'string') throw new Error('게임 저장 데이터가 올바르지 않습니다.');
    const updatedAt = new Date().toISOString();
    write(MATGO_KEY, {
      gameUuid: state.gameUuid, gameMode: 'matgo', stateVersion: state.stateVersion,
      turnNumber: state.turnNumber, state, updatedAt
    });
    const settled = read<string[]>(MATGO_SETTLED_KEY, []);
    const canSettle = state.phase === 'round-ended' && state.settlement &&
      !settled.includes(state.gameUuid) && state.winner !== null;
    const amount = canSettle ? Math.max(0, Math.trunc(state.settlement!.displayAmount)) : 0;
    const delta = state.winner === 'human' ? amount : -amount;
    if (canSettle) {
      account.virtualBalance = Math.max(0, account.virtualBalance + delta);
      account.opponentBalance = Math.max(0, (account.opponentBalance ?? DEFAULT_BALANCE) - delta);
      write(USER_KEY, account);
      write(MATGO_SETTLED_KEY, [...settled.slice(-199), state.gameUuid]);
    }
    result = {
      gameUuid: state.gameUuid, turnNumber: state.turnNumber, savedAt: updatedAt,
      balance: account.virtualBalance,
      opponentBalance: account.opponentBalance ?? DEFAULT_BALANCE,
      opponentBalanceAfterSettlement: account.opponentBalance ?? DEFAULT_BALANCE,
      settlementAmount: delta, settlementApplied: Boolean(canSettle), opponentRefilled: false
    };
  }
  else if (path === '/api/games/gostop/settle') {
    const settlement = body as unknown as GostopSettlementRequest;
    const settled = read<string[]>(GOSTOP_SETTLED_KEY, []);
    const duplicate = settled.includes(settlement.gameUuid);
    const before = account.virtualBalance;
    if (!duplicate && settlement.winner !== null) {
      const balances = settleGostopPointDeltas({
        human: account.virtualBalance,
        computerA: account.gostopComputerABalance ?? DEFAULT_BALANCE,
        computerB: account.gostopComputerBBalance ?? DEFAULT_BALANCE
      }, {
        human: settlement.humanPoints ?? 0,
        computerA: settlement.computerAPoints ?? 0,
        computerB: settlement.computerBPoints ?? 0
      }, settlement.pointValue);
      account.virtualBalance = balances.human;
      account.gostopComputerABalance = balances.computerA;
      account.gostopComputerBBalance = balances.computerB;
      write(USER_KEY, account);
    }
    if (!duplicate) write(GOSTOP_SETTLED_KEY, [...settled.slice(-199), settlement.gameUuid]);
    result = {
      gameUuid: settlement.gameUuid, balance: account.virtualBalance,
      computerABalance: account.gostopComputerABalance ?? DEFAULT_BALANCE,
      computerBBalance: account.gostopComputerBBalance ?? DEFAULT_BALANCE,
      settlementAmount: account.virtualBalance - before, settlementApplied: !duplicate
    };
  }
  else throw new Error(`오프라인 앱에서 지원하지 않는 기능입니다: ${path}`);
  return result as T;
}
