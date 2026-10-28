import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { enqueueEdgeCall, processEdgeQueue } from '../edgeQueue';

const STORAGE_KEY = 'edgeFunctionQueueV1';
const DAY_MS = 24 * 60 * 60 * 1000;

type StoredItem = {
  fn: string;
  body: Record<string, unknown>;
  attempts: number;
  createdAt: number;
  nextAttemptAt?: number;
  dedupeKey?: string;
};

const storedQueue = (): StoredItem[] => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

const reply = (value: { data: unknown; error: unknown }) =>
  value as Awaited<ReturnType<typeof supabase.functions.invoke>>;

describe('edge call retry queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-15T10:00:00Z'));
    localStorage.clear();
    vi.mocked(supabase.functions.invoke).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a failed write in local storage until it can be sent', () => {
    enqueueEdgeCall('save-study-data', { action: 'save_demographics', sessionId: 's-1' });

    const queue = storedQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      fn: 'save-study-data',
      attempts: 0,
      body: { action: 'save_demographics', sessionId: 's-1' },
    });
  });

  it('replaces an entry with the same dedupe key instead of sending it twice', () => {
    enqueueEdgeCall(
      'save-study-data',
      { action: 'create_session', mode: 'text', sessionId: 's-1' },
      { dedupeKey: 'create_session:s-1' },
    );
    enqueueEdgeCall(
      'save-study-data',
      { action: 'create_session', mode: 'avatar', sessionId: 's-1' },
      { dedupeKey: 'create_session:s-1' },
    );

    const queue = storedQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].body).toMatchObject({ mode: 'avatar' });
  });

  it('holds at most 200 entries and drops the oldest first', () => {
    for (let index = 0; index < 205; index++) {
      vi.setSystemTime(Date.now() + 1);
      enqueueEdgeCall('save-study-data', { action: 'save_scenario', index });
    }

    const queue = storedQueue();
    expect(queue).toHaveLength(200);
    expect(queue[0].body).toMatchObject({ index: 5 });
    expect(queue[199].body).toMatchObject({ index: 204 });
  });

  it('forgets entries older than a week', () => {
    enqueueEdgeCall('save-study-data', { action: 'save_demographics', sessionId: 'old' });
    vi.setSystemTime(Date.now() + 8 * DAY_MS);
    enqueueEdgeCall('save-study-data', { action: 'save_demographics', sessionId: 'new' });

    expect(storedQueue().map((item) => item.body.sessionId)).toEqual(['new']);
  });

  it('removes an entry once the server accepts it', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue(reply({ data: { success: true }, error: null }));
    enqueueEdgeCall('complete-session', { sessionId: 's-1' });

    await processEdgeQueue();

    expect(supabase.functions.invoke).toHaveBeenCalledWith('complete-session', { body: { sessionId: 's-1' } });
    expect(storedQueue()).toEqual([]);
  });

  it('counts an error in the response body as a failed write', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue(reply({ data: { error: 'Session not found' }, error: null }));
    enqueueEdgeCall('complete-session', { sessionId: 's-1' });

    await processEdgeQueue();

    expect(storedQueue()[0].attempts).toBe(1);
  });

  it('waits longer after each failure, up to a minute, and never retries early', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue(reply({ data: null, error: new Error('offline') }));
    enqueueEdgeCall('complete-session', { sessionId: 's-1' });

    await processEdgeQueue();
    let [item] = storedQueue();
    expect(item.attempts).toBe(1);
    expect(item.nextAttemptAt).toBe(Date.now() + 5000);

    vi.mocked(supabase.functions.invoke).mockClear();
    await processEdgeQueue();
    expect(supabase.functions.invoke).not.toHaveBeenCalled();

    for (let attempt = 2; attempt <= 14; attempt++) {
      vi.setSystemTime(item.nextAttemptAt);
      await processEdgeQueue();
      [item] = storedQueue();
      expect(item.attempts).toBe(attempt);
      expect(item.nextAttemptAt - Date.now()).toBe(Math.min(60000, 5000 * attempt));
    }
  });
});
