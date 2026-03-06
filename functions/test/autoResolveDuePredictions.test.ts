export {};

// Minimal FieldValue emulation (declare before admin mock)
const FieldValue = {
  serverTimestamp: () => ({ __ts: true }),
  increment: (n: number) => ({ __inc: n })
};

// Mock firebase-functions (logs + https.onRequest used by other exports during module init)
jest.mock('firebase-functions', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  https: { onRequest: jest.fn((handler: any) => handler) }
}));

// Mock firebase-functions v2 modules used in index.ts export declarations
jest.mock('firebase-functions/v2/https', () => ({ onRequest: jest.fn((_opts: any, handler: any) => handler) }));
jest.mock('firebase-functions/v2/scheduler', () => ({ onSchedule: (_opts: any, handler: any) => handler }));
jest.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_path: any, handler: any) => handler,
  onDocumentDeleted: (_path: any, handler: any) => handler,
  onDocumentWritten: (_path: any, handler: any) => handler,
}));

type SetCall = { data: any, options?: any };

// Build a db mock per test case
function makeDb(docDatas: Array<any>, setSpies: Array<jest.Mock> = []) {
  const docs = docDatas.map((data, i) => ({
    id: `p${i + 1}`,
    data: () => data,
    ref: { set: setSpies[i] || jest.fn() }
  }));
  const qs = { size: docs.length, docs } as any;
  const collection = jest.fn(() => ({ where: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn(async () => qs) })) })) }));
  const db = { collection, batch: jest.fn(), doc: jest.fn() } as any;
  return { db, docs };
}

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const mocks: any = { _db: null };
  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(jest.fn(() => mocks._db), { FieldValue }),
    __setDb(db: any) { mocks._db = db; },
  } as any;
});

const admin = require('firebase-admin');

import { autoResolveDuePredictions } from '../src/index';

describe('autoResolveDuePredictions', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.RESOLUTION_GRACE_DAYS = '0';
    process.env.RESOLUTION_MIN_POST_VOTES = '5';
    process.env.RESOLUTION_MIN_POST_SHARE = '0.6';
  });

  it('resolves when top outcome meets minShare and votes >= min', async () => {
    const now = new Date();
    const term = new Date(now.getTime() - 24 * 3600 * 1000);
    const setSpy = jest.fn(async (_data: SetCall['data'], _opt?: any) => {});
    const { db } = makeDb([
      { status: 'pending', termReachedAt: term, humanVotesPost: { outcome: { calledIt: 7, botched: 2, fence: 1 } } }
    ], [setSpy]);
    admin.__setDb(db);

    await (autoResolveDuePredictions as any)();

    expect(setSpy).toHaveBeenCalled();
    const call = setSpy.mock.calls[0];
    expect(call[0].status).toBe('resolved');
    expect(call[0].outcome).toBe('calledIt');
    expect(call[0].resolutionSource).toBe('auto-consensus');
  });

  it('marks disputed when not enough post votes', async () => {
    const now = new Date();
    const term = new Date(now.getTime() - 24 * 3600 * 1000);
    const setSpy = jest.fn(async (_data: SetCall['data'], _opt?: any) => {});
    const { db } = makeDb([
      { status: 'pending', termReachedAt: term, humanVotesPost: { outcome: { calledIt: 2, botched: 1, fence: 1 } } }
    ], [setSpy]);
    admin.__setDb(db);

    await (autoResolveDuePredictions as any)();

    expect(setSpy).toHaveBeenCalled();
    const call = setSpy.mock.calls[0];
    expect(call[0].status).toBe('disputed');
  });
});
