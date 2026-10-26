import type { GameState } from '../engine/types';
import type {
  GameModeStatistics, GostopSettlementRequest, MatchStatistics, PlayerGameStatistics,
  SaveGameResult, ServerGameSave, SessionData, UserProfile
} from './types';

// Offline storage is tied to the browser/device. No account, database or HTTP API is needed.
const PREFIX = 'family-hwatu-offline-v1:';
const START_BALANCE = 500_000;
const MAX_BALANCE = 999_999_999_999;
type Mode = 'matgo' | 'gostop';
type Result = 'win' | 'loss' | 'nagari';
type MatchRecord = {
  uuid: string; mode: Mode; result: Result; score: number; amount: number;
  statistics?: MatchStatistics;
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function put<T>(key: string, value: T): void {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

function profile(): UserProfile {
  return read<UserProfile>('profile', {
    id: 1, username: 'local', displayName: '플레이어', role: 'member',
    virtualBalance: START_BALANCE, opponentBalance: START_BALANCE,
    gostopComputerABalance: START_BALANCE, gostopComputerBBalance: START_BALANCE
  });
}

function saveProfile(user: UserProfile): void { put('profile', user); }
function history(): MatchRecord[] { return read<MatchRecord[]>('history', []); }

function emptyStats(mode: Mode): GameModeStatistics {
  return {
    gameMode: mode, totalGames: 0, wins: 0, losses: 0, nagari: 0, winRate: 0,
    highestScore: 0, longestWinStreak: 0, currentWinStreak: 0, totalSettlement: 0,
    biggestWinAmount: 0, recentResults: [], specialStatsTrackedGames: 0,
    totalGoCount: 0, highestWinningGoCount: 0, totalSweepCount: 0,
    maxSweepCount: 0, totalBombCount: 0, maxBombCount: 0,
    totalShakeCount: 0, maxShakeCount: 0, totalPpeokCount: 0,
    maxPpeokCount: 0, openingPpeokCount: 0, threePpeokWins: 0,
    piBakWins: 0, gwangBakWins: 0
  };
}

function statistics(mode: Mode): GameModeStatistics {
  const games = history().filter(record => record.mode === mode);
  const summary = emptyStats(mode);
  let streak = 0;
  for (const game of games) {
    summary.totalGames += 1;
    if (game.result === 'win') { summary.wins += 1; streak += 1; }
    else { streak = 0; if (game.result === 'loss') summary.losses += 1; else summary.nagari += 1; }
    summary.longestWinStreak = Math.max(summary.longestWinStreak, streak);
    summary.highestScore = Math.max(summary.highestScore, game.score);
    summary.totalSettlement += game.amount;
    summary.biggestWinAmount = Math.max(summary.biggestWinAmount, game.amount);
    if (game.statistics) {
      const s = game.statistics;
      summary.specialStatsTrackedGames += 1;
      summary.totalGoCount += s.goCount;
      if (game.result === 'win') summary.highestWinningGoCount = Math.max(summary.highestWinningGoCount, s.goCount);
      summary.totalSweepCount += s.sweepCount;
      summary.maxSweepCount = Math.max(summary.maxSweepCount, s.sweepCount);
      summary.totalBombCount += s.bombCount;
      summary.maxBombCount = Math.max(summary.maxBombCount, s.bombCount);
      summary.totalShakeCount += s.shakeCount;
      summary.maxShakeCount = Math.max(summary.maxShakeCount, s.shakeCount);
      summary.totalPpeokCount += s.ppeokCount;
      summary.maxPpeokCount = Math.max(summary.maxPpeokCount, s.ppeokCount);
      summary.openingPpeokCount += s.openingPpeokCount;
      if (s.threePpeokWin) summary.threePpeokWins += 1;
      if (s.piBakWin) summary.piBakWins += 1;
      if (s.gwangBakWin) summary.gwangBakWins += 1;
    }
  }
  summary.currentWinStreak = streak;
  summary.winRate = summary.wins + summary.losses ? Math.round(summary.wins * 1000 / (summary.wins + summary.losses)) / 10 : 0;
  summary.recentResults = games.slice(-5).reverse().map(game => game.result);
  return summary;
}

function addMatch(record: MatchRecord): boolean {
  const saved = history();
  if (saved.some(item => item.uuid === record.uuid && item.mode === record.mode)) return false;
  saved.push(record);
  put('history', saved);
  return true;
}

function clampBalance(value: number): number { return Math.max(0, Math.min(MAX_BALANCE, Math.trunc(value))); }

function matgoStatistics(state: GameState): MatchStatistics {
  const won = state.winner === 'human';
  return {
    version: 1, goCount: state.humanGoCount, sweepCount: state.humanSweepCount ?? 0,
    bombCount: state.humanBombCount ?? 0, shakeCount: state.humanShakeCount ?? 0,
    ppeokCount: state.humanPpeokCount, openingPpeokCount: state.humanOpeningPpeokCount ?? 0,
    threePpeokWin: won && state.humanPpeokCount >= 3,
    piBakWin: won && Boolean(state.settlement?.baks.some(bak => bak.code === 'pi-bak')),
    gwangBakWin: won && Boolean(state.settlement?.baks.some(bak => bak.code === 'gwang-bak'))
  };
}

function saveMatgo(state: GameState): SaveGameResult {
  const existing = history().find(item => item.uuid === state.gameUuid && item.mode === 'matgo');
  let user = profile();
  let amount = existing?.amount ?? 0;
  let applied = false;
  let opponentRefilled = false;
  let opponentBalanceAfterSettlement = user.opponentBalance ?? START_BALANCE;
  const settled = state.phase === 'round-ended' && (state.roundResult === 'nagari' || (state.roundResult === 'win' && state.settlement));
  if (settled && !existing) {
    const signed = state.winner === 'human' ? 1 : -1;
    const requested = state.roundResult === 'nagari' ? 0 : Math.max(0, state.settlement?.displayAmount ?? 0);
    const opponent = user.opponentBalance ?? START_BALANCE;
    amount = signed > 0 ? Math.min(requested, opponent, MAX_BALANCE - user.virtualBalance)
      : -Math.min(requested, user.virtualBalance, MAX_BALANCE - opponent);
    opponentBalanceAfterSettlement = clampBalance(opponent - amount);
    opponentRefilled = opponentBalanceAfterSettlement === 0;
    user = {
      ...user, virtualBalance: clampBalance(user.virtualBalance + amount),
      opponentBalance: opponentBalanceAfterSettlement
    };
    if (opponentRefilled) user.opponentBalance = START_BALANCE;
    const result: Result = state.roundResult === 'nagari' ? 'nagari' : state.winner === 'human' ? 'win' : 'loss';
    applied = addMatch({
      uuid: state.gameUuid, mode: 'matgo', result,
      score: state.settlement?.finalScore ?? 0, amount, statistics: matgoStatistics(state)
    });
    saveProfile(user);
  }
  const save: ServerGameSave = {
    gameUuid: state.gameUuid, gameMode: 'matgo', stateVersion: state.stateVersion,
    turnNumber: state.turnNumber, state, updatedAt: new Date().toISOString()
  };
  put('matgo', save);
  return {
    gameUuid: state.gameUuid, turnNumber: state.turnNumber, savedAt: save.updatedAt,
    balance: user.virtualBalance, opponentBalance: user.opponentBalance ?? START_BALANCE,
    settlementAmount: amount, settlementApplied: applied,
    opponentRefilled,
    opponentBalanceAfterSettlement
  };
}

function settleGostop(body: GostopSettlementRequest) {
  let user = profile();
  const existing = history().find(item => item.uuid === body.gameUuid && item.mode === 'gostop');
  if (existing) return {
    gameUuid: body.gameUuid, balance: user.virtualBalance,
    computerABalance: user.gostopComputerABalance ?? START_BALANCE,
    computerBBalance: user.gostopComputerBBalance ?? START_BALANCE,
    settlementAmount: existing.amount, settlementApplied: false
  };
  const requested = [body.humanPoints ?? 0, body.computerAPoints ?? 0, body.computerBPoints ?? 0];
  const deltas: number[] = requested.every(value => value === 0) && body.winner ? [
    body.winner === 'human' ? body.finalScore * 2 : -body.finalScore,
    body.winner === 'computerA' ? body.finalScore * 2 : -body.finalScore,
    body.winner === 'computerB' ? body.finalScore * 2 : -body.finalScore
  ] : requested;
  if (deltas.reduce((sum, value) => sum + value, 0) !== 0) throw new Error('고스톱 정산 점수가 올바르지 않습니다.');
  const balances = [user.virtualBalance, user.gostopComputerABalance ?? START_BALANCE, user.gostopComputerBBalance ?? START_BALANCE];
  const original = balances[0];
  const credits = deltas.map(value => Math.max(0, value * body.pointValue));
  for (let debtor = 0; debtor < deltas.length; debtor += 1) {
    let debt = Math.max(0, -deltas[debtor] * body.pointValue);
    for (let creditor = 0; creditor < deltas.length && debt > 0; creditor += 1) {
      if (credits[creditor] <= 0) continue;
      const payment = Math.min(debt, credits[creditor], balances[debtor], MAX_BALANCE - balances[creditor]);
      balances[debtor] -= payment; balances[creditor] += payment;
      credits[creditor] -= payment; debt -= payment;
    }
  }
  if (balances[1] === 0) balances[1] = START_BALANCE;
  if (balances[2] === 0) balances[2] = START_BALANCE;
  user = { ...user, virtualBalance: balances[0], gostopComputerABalance: balances[1], gostopComputerBBalance: balances[2] };
  saveProfile(user);
  const amount = balances[0] - original;
  addMatch({
    uuid: body.gameUuid, mode: 'gostop',
    result: body.roundResult === 'nagari' ? 'nagari' : body.winner === 'human' ? 'win' : 'loss',
    score: body.finalScore, amount, statistics: body.statistics
  });
  return {
    gameUuid: body.gameUuid, balance: balances[0], computerABalance: balances[1],
    computerBBalance: balances[2], settlementAmount: amount, settlementApplied: true
  };
}

async function readProfileImage(options: RequestInit): Promise<UserProfile> {
  const file = (options.body as FormData | null)?.get('image');
  if (!(file instanceof File)) throw new Error('이미지 파일을 선택해 주세요.');
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
    reader.readAsDataURL(file);
  });
  const updated = { ...profile(), profileImageUrl: url };
  saveProfile(updated);
  return updated;
}

export async function offlineRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) as Record<string, unknown> : {};
  const user = profile();
  let result: unknown;
  switch (`${method} ${path}`) {
    case 'GET /api/auth/status': result = { needsBootstrap: false, bootstrapEnabled: false }; break;
    case 'GET /api/auth/csrf': result = { csrfToken: 'offline-local' }; break;
    case 'POST /api/auth/login':
    case 'POST /api/auth/logout': result = user; break;
    case 'GET /api/session': result = { user, csrfToken: 'offline-local', deviceId: 'offline-device' } satisfies SessionData; break;
    case 'GET /api/dashboard': {
      const save = read<ServerGameSave | null>('matgo', null);
      const gameStats: PlayerGameStatistics = { matgo: statistics('matgo'), gostop: statistics('gostop') };
      const games = history();
      result = {
        user, activeSave: save && save.state.phase !== 'round-ended'
          ? { gameUuid: save.gameUuid, turnNumber: save.turnNumber, updatedAt: save.updatedAt } : null,
        today: { games: games.length, wins: games.filter(item => item.result === 'win').length, settlement: games.reduce((sum, item) => sum + item.amount, 0) },
        gameStats
      };
      break;
    }
    case 'POST /api/balance/refill': {
      const balance = user.virtualBalance <= 0 ? START_BALANCE : user.virtualBalance;
      saveProfile({ ...user, virtualBalance: balance });
      result = { balance };
      break;
    }
    case 'PUT /api/profile/image': result = await readProfileImage(options); break;
    case 'GET /api/games/matgo': result = read<ServerGameSave | null>('matgo', null); break;
    case 'PUT /api/games/matgo': result = saveMatgo(body.state as GameState); break;
    case 'POST /api/games/gostop/settle': result = settleGostop(body as unknown as GostopSettlementRequest); break;
    default: throw new Error(`오프라인 모드에서 지원하지 않는 작업: ${method} ${path}`);
  }
  return result as T;
}
