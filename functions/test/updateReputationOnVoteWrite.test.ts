export {};
// Mock firebase-functions v2 wrappers used in module init
jest.mock('firebase-functions/v2/https', () => ({ onRequest: jest.fn((_opts: any, handler: any) => handler) }));
jest.mock('firebase-functions/v2/scheduler', () => ({ onSchedule: (_opts: any, handler: any) => handler }));
// Unwrap Firestore trigger to handler
jest.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: (_path: any, handler: any) => handler,
  onDocumentCreated: (_p: any, h: any) => h,
  onDocumentDeleted: (_p: any, h: any) => h,
}));
// Silence logs and mock https.onRequest used by other exports
jest.mock('firebase-functions', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }, https: { onRequest: jest.fn((h: any) => h) } }));

const FieldValue = {
  serverTimestamp: () => ({ __ts: true }),
  increment: (n: number) => ({ __inc: n })
};

type PredRef = { get: jest.Mock; set: jest.Mock };

type UserRef = { set: jest.Mock };

function makeDb(predData: any, userRefSpy?: jest.Mock, predRefSpy?: jest.Mock) {
  const predRef: PredRef = {
    get: jest.fn(async () => ({ exists: true, data: () => predData })),
    set: predRefSpy || jest.fn(async (_: any, __?: any) => {})
  };
  const userRef: UserRef = { set: userRefSpy || jest.fn(async (_: any, __?: any) => {}) };
  const doc = jest.fn((path: string) => {
    if (path.startsWith('predictions/')) return predRef as any;
    if (path.startsWith('users/')) return userRef as any;
    return {} as any;
  });
  const db = { doc } as any;
  return { db, predRef, userRef };
}

jest.mock('firebase-admin', () => {
  const mocks: any = { _db: null };
  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(jest.fn(() => mocks._db), { FieldValue }),
    __setDb(db: any) { mocks._db = db; },
  } as any;
});

describe('updateReputationOnVoteWrite', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('increments pre-term aggregate and reputation on create calledIt', async () => {
    const predData = { authorId: 'author1', termReachedAt: null };
    const { db, predRef, userRef } = makeDb(predData);
    const admin = require('firebase-admin');
    admin.__setDb(db);

    const mod = await import('../src/index');
    const handler = (mod as any).updateReputationOnVoteWrite as Function;

    await handler({
      params: { predictionId: 'p1', voterId: 'v1' },
      data: {
        before: { data: () => undefined },
        after: { data: () => ({ type: 'calledIt', createdAt: new Date() }) }
      }
    });

    expect(userRef.set).toHaveBeenCalled();
    const inc = userRef.set.mock.calls[0][0].reputation;
    expect(inc.__inc).toBe(1);

    expect(predRef.set).toHaveBeenCalled();
    const updates = predRef.set.mock.calls[0][0];
    expect(updates['humanVotesPre.outcome.calledIt'].__inc).toBe(1);
  });

  it('moves from pre calledIt to post botched and applies delta -2 on type change', async () => {
    const term = new Date('2024-01-01T12:00:00.000Z');
    const predData = { authorId: 'author1', termReachedAt: term };
    const { db, predRef, userRef } = makeDb(predData);
    const admin = require('firebase-admin');
    admin.__setDb(db);

    const mod = await import('../src/index');
    const handler = (mod as any).updateReputationOnVoteWrite as Function;

    await handler({
      params: { predictionId: 'p1', voterId: 'v2' },
      data: {
        before: { data: () => ({ type: 'calledIt', createdAt: '2024-01-01T11:00:00.000Z' }) },
        after: { data: () => ({ type: 'botched',  createdAt: '2024-01-01T13:00:00.000Z' }) }
      }
    });

    expect(userRef.set).toHaveBeenCalled();
    const inc = userRef.set.mock.calls[0][0].reputation;
    expect(inc.__inc).toBe(-2);

    expect(predRef.set).toHaveBeenCalled();
    const updates = predRef.set.mock.calls[0][0];
    expect(updates['humanVotesPre.outcome.calledIt'].__inc).toBe(-1);
    expect(updates['humanVotesPost.outcome.botched'].__inc).toBe(1);
  });

  it('skips self-vote (no reputation or aggregate write)', async () => {
    const predData = { authorId: 'self', termReachedAt: null };
    const userSet = jest.fn();
    const predSet = jest.fn();
    const { db } = makeDb(predData, userSet, predSet);
    const admin = require('firebase-admin');
    admin.__setDb(db);

    const mod = await import('../src/index');
    const handler = (mod as any).updateReputationOnVoteWrite as Function;

    await handler({
      params: { predictionId: 'p1', voterId: 'self' },
      data: {
        before: { data: () => undefined },
        after: { data: () => ({ type: 'calledIt', createdAt: new Date() }) }
      }
    });

    expect(userSet).not.toHaveBeenCalled();
    expect(predSet).not.toHaveBeenCalled();
  });
});
