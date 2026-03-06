import React from 'react';
import { render, screen } from '@testing-library/react';
import PredictionModal from './PredictionModal';
import type { Prediction } from '../../types/prediction';

jest.mock('../ConvergenceChart/ConvergenceChart', () => ({ __esModule: true, default: () => null }));

jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));

// Basic no-op Firestore mocks; individual tests can override onSnapshot behavior
jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(async () => ({ exists: () => false })),
    orderBy: jest.fn(),
    query: jest.fn((...args: any[]) => args),
    onSnapshot: jest.fn((_: any, cb: any) => { cb({ docs: [] }); return () => {}; }),
    Timestamp: { fromDate: (d: Date) => ({ toDate: () => d }) }
  } as any;
});

const basePrediction = (overrides: Partial<Prediction> = {}): Prediction => ({
  id: 'pred1',
  authorId: 'author1',
  summary: 'Will X happen by Y?',
  metric: 'price',
  referenceValue: '100',
  metrics: [{ metric: 'price', operator: '>=', target: '100' }],
  rationale: 'Because reasons',
  timebox: new Date(Date.now() - 3600_000).toISOString(),
  taxonomy: { domain: 'Markets', subcategory: 'Stocks', topic: 'Tech' },
  status: 'pending',
  aiScore: { plausibility: 5, vaguenessFlag: false, notes: [] },
  humanVotes: { outcome: { calledIt: 1, botched: 0, fence: 0 }, quality: { high: 0, low: 0 } },
  comments: [],
  createdAt: new Date(Date.now() - 7 * 24 * 3600_000),
  ...overrides,
});

function noop() {}

describe('PredictionModal – lifecycle UI', () => {
  it('shows deadline banner and AI suggestion chip when term reached and pending', () => {
    const pred = basePrediction({
      termReachedAt: new Date(Date.now() - 1000),
      aiResolution: { suggestion: 'calledIt', confidence: 72, metricResults: [], notes: [] }
    });
    render(<PredictionModal prediction={pred} onClose={noop} />);
    expect(screen.getByText(/Deadline reached/i)).toBeInTheDocument();
    // There are two occurrences: the label and the Accept button text. Ensure at least one label exists.
    const aiTexts = screen.getAllByText(/AI suggestion/i);
    expect(aiTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/calledIt/i)).toBeInTheDocument();
    expect(screen.getByText(/72%/i)).toBeInTheDocument();
  });

  it('inserts a discussion divider labeled "After deadline" when comments cross term boundary', async () => {
    const term = new Date('2024-01-01T12:00:00.000Z');
    const { onSnapshot } = jest.requireMock('firebase/firestore');
    onSnapshot.mockImplementation((_: any, cb: any) => {
      const docs = [
        { id: 'c1', data: () => ({ userId: 'u1', text: 'Before', createdAt: { toDate: () => new Date('2024-01-01T11:00:00.000Z') } }) },
        { id: 'c2', data: () => ({ userId: 'u2', text: 'After',  createdAt: { toDate: () => new Date('2024-01-01T13:00:00.000Z') } }) }
      ];
      cb({ docs });
      return () => {};
    });

    const pred = basePrediction({ termReachedAt: term });
    render(<PredictionModal prediction={pred} onClose={noop} />);

    // Divider chip
    expect(await screen.findByText(/After deadline/i)).toBeInTheDocument();
    // Both comments rendered
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });
});
