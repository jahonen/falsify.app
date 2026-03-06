export {};
// Mocks must be declared before importing the module under test
jest.mock('firebase-functions/v2/scheduler', () => ({ onSchedule: (_opts: any, handler: any) => handler }));
jest.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_p: any, h: any) => h,
  onDocumentDeleted: (_p: any, h: any) => h,
  onDocumentWritten: (_p: any, h: any) => h,
}));
jest.mock('firebase-functions/v2/https', () => ({ onRequest: jest.fn((_opts: any, handler: any) => handler) }));
jest.mock('firebase-functions', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }, https: { onRequest: jest.fn((h: any) => h) } }));

const FieldValue = {
  serverTimestamp: () => ({ __ts: true }),
  increment: (n: number) => ({ __inc: n })
};

type Batch = { set: jest.Mock; update: jest.Mock; commit: jest.Mock };

function makeDb({ predictions, user }: { predictions: any[]; user: any }) {
  const batch: Batch = {
    set: jest.fn(),
    update: jest.fn(),
    commit: jest.fn(async () => {})
  };

  const usersDoc = {
    get: jest.fn(async () => ({ exists: true, data: () => user })),
    collection: jest.fn(() => ({ doc: jest.fn(() => ({ id: 'notif1' })) }))
  };

  const users = { doc: jest.fn(() => usersDoc) };

  const predDocs = predictions.map((d, i) => ({ id: `p${i + 1}`, data: () => d, ref: { /* unused for batch.update */ } }));
  const qs = { size: predDocs.length, docs: predDocs };
  const predictionsCol = { where: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn(async () => qs) })) })) };

  const collection = jest.fn((name: string) => (name === 'predictions' ? predictionsCol : name === 'users' ? users : null));
  const db = { collection, batch: jest.fn(() => batch), doc: jest.fn() } as any;
  return { db, batch };
}

jest.mock('firebase-admin', () => {
  const mocks: any = { _db: null };
  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(jest.fn(() => mocks._db), { FieldValue }),
    auth: jest.fn(() => ({ getUser: jest.fn(async () => ({ email: 'fallback@example.com' })) })),
    __setDb(db: any) { mocks._db = db; },
  } as any;
});

jest.mock('../src/email', () => ({ sendEmailInternal: jest.fn(async () => ({ status: 202 })) }));

// email mock is set above; we'll import admin fresh per test after resetModules

describe('notifyPredictionTerm', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('sets termReachedAt, marks termNotified, writes a notification, and sends email once', async () => {
    const past = new Date(Date.now() - 3600_000);
    const predictions = [
      { status: 'pending', timebox: past.toISOString(), authorId: 'u1', termNotified: false }
    ];
    const user = { email: 'test@example.com', consents: { termImmediateEmail: true } };
    const { db, batch } = makeDb({ predictions, user });
    const admin = require('firebase-admin');
    const { sendEmailInternal } = require('../src/email');
    admin.__setDb(db);

    const mod = await import('../src/index');
    await (mod as any).notifyPredictionTerm();

    expect(batch.update).toHaveBeenCalledTimes(1);
    const updateArgs = batch.update.mock.calls[0][1];
    expect(updateArgs.termNotified).toBe(true);
    expect(updateArgs.termReachedAt).toBeDefined();

    expect(batch.set).toHaveBeenCalledTimes(1);
    expect(batch.commit).toHaveBeenCalledTimes(1);

    expect(sendEmailInternal).toHaveBeenCalledTimes(1);
  });
});
