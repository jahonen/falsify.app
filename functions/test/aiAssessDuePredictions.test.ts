export {};

// FieldValue mock
const FieldValue = {
  serverTimestamp: () => ({ __ts: true }),
  increment: (n: number) => ({ __inc: n })
};

// Mock logging and onRequest to satisfy other exports during module init
jest.mock('firebase-functions', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  https: { onRequest: jest.fn((h: any) => h) }
}));
jest.mock('firebase-functions/v2/https', () => ({ onRequest: jest.fn((_opts: any, handler: any) => handler) }));
jest.mock('firebase-functions/v2/scheduler', () => ({ onSchedule: (_opts: any, handler: any) => handler }));
jest.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_p: any, h: any) => h,
  onDocumentDeleted: (_p: any, h: any) => h,
  onDocumentWritten: (_p: any, h: any) => h,
}));

// Mock VertexAI to return a model with a deterministic JSON response in text
jest.mock('@google-cloud/vertexai', () => {
  return {
    VertexAI: class VertexAIMock {
      constructor(_opts: any) {}
      getGenerativeModel(_cfg: any) {
        return {
          generateContent: async (_req: any) => ({
            response: {
              candidates: [
                {
                  content: {
                    parts: [
                      { text: '{"suggestion":"calledIt","confidence":88,"metricResults":[],"notes":["n1"]}' }
                    ]
                  }
                }
              ]
            }
          })
        };
      }
    }
  } as any;
});

// Firestore admin mock
jest.mock('firebase-admin', () => {
  const mocks: any = { _db: null };
  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(jest.fn(() => mocks._db), { FieldValue }),
    __setDb(db: any) { mocks._db = db; },
  } as any;
});

function makeDb(docDatas: Array<any>, setSpies: Array<jest.Mock> = []) {
  const docs = docDatas.map((data, i) => ({
    id: `p${i + 1}`,
    data: () => data,
    ref: { set: setSpies[i] || jest.fn() }
  }));
  const qs = { size: docs.length, docs } as any;
  const collection = jest.fn(() => ({ where: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn(async () => qs) })) })) }));
  const db = { collection } as any;
  return { db, docs };
}


describe('aiAssessDuePredictions', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('writes aiResolution only for due predictions with termReachedAt and no aiResolution', async () => {
    const term = new Date('2024-01-01T00:00:00.000Z');
    const setSpy = jest.fn(async () => {});
    const { db } = makeDb([
      { status: 'pending', termReachedAt: term, summary: 'S', rationale: 'R', metrics: [], timebox: term.toISOString() },
      { status: 'pending', termReachedAt: null }
    ], [setSpy, jest.fn()]);
    const admin = require('firebase-admin');
    admin.__setDb(db);

    const mod = await import('../src/index');
    await (mod as any).aiAssessDuePredictions();

    expect(setSpy).toHaveBeenCalled();
    const call = setSpy.mock.calls[0] as any[];
    expect(call[0].aiResolution).toBeDefined();
    expect(call[0].aiResolution.suggestion).toBe('calledIt');
    expect(call[0].aiResolution.confidence).toBe(88);
    // Ensure no status write
    expect(call[0].status).toBeUndefined();
  });
});
