import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { useBotDetection } from '../useBotDetection';
import { describeSuspicionFlag, SUSPICION_RULES } from '@/lib/suspicion';

type Options = Parameters<typeof useBotDetection>[0];
type Detector = ReturnType<typeof useBotDetection>;

const SECOND = 1000;

const mount = (options: Options) => renderHook(() => useBotDetection(options)).result;

const answer = (detector: { current: Detector }, questionId: string, ms: number) => {
  detector.current.recordQuestionStart(questionId);
  vi.advanceTimersByTime(ms);
  detector.current.recordQuestionAnswer(questionId);
};

const analyze = (detector: { current: Detector }) => {
  let result: ReturnType<Detector['analyzeTimingData']>;
  act(() => {
    result = detector.current.analyzeTimingData();
  });
  return result;
};

// The dashboard explains each flag with the rule that matches it, so every flag needs exactly one rule
const pointsFromRules = (flags: string[]) =>
  flags.reduce((sum, flag) => {
    const rules = SUSPICION_RULES.filter((rule) => rule.match(flag));
    expect(rules, flag).toHaveLength(1);
    expect(describeSuspicionFlag(flag).summary).toBe(rules[0].summary);
    return sum + rules[0].points;
  }, 0);

describe('useBotDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flags a page left before its minimum time', () => {
    const detector = mount({ pageType: 'demographics' });
    vi.advanceTimersByTime(5 * SECOND);

    const result = analyze(detector);

    expect(result.flags).toEqual(['Page completed in 5s (minimum expected: 15s)']);
    expect(result.score).toBe(30);
    expect(result.suspicionLevel).toBe('low');
  });

  it('adds the timing rules up to a high-risk score and reports it', () => {
    const onSuspiciousActivity = vi.fn();
    const detector = mount({ pageType: 'pretest', onSuspiciousActivity });
    for (const id of ['pre-1', 'pre-2', 'pre-3', 'pre-4']) {
      answer(detector, id, SECOND);
    }

    const result = analyze(detector);

    expect(result.score).toBe(75);
    expect(result.suspicionLevel).toBe('high');
    expect(pointsFromRules(result.flags)).toBe(result.score);
    expect(onSuspiciousActivity).toHaveBeenCalledWith(result);
  });

  it('leaves a careful participant unflagged', () => {
    const onSuspiciousActivity = vi.fn();
    const detector = mount({ pageType: 'posttest', onSuspiciousActivity });
    for (const id of ['post-1', 'post-2', 'post-3']) {
      answer(detector, id, 20 * SECOND);
    }

    const result = analyze(detector);

    expect(result).toEqual({ suspicionLevel: 'none', flags: [], score: 0 });
    expect(onSuspiciousActivity).not.toHaveBeenCalled();
  });

  it('scales the minimum learning time with the number of slides', () => {
    const shortLesson = mount({ pageType: 'learning', learningSlidesCount: 3 });
    const longLesson = mount({ pageType: 'learning', learningSlidesCount: 6 });
    vi.advanceTimersByTime(40 * SECOND);

    expect(analyze(shortLesson).flags).toEqual([]);
    expect(analyze(longLesson).flags).toEqual(['Page completed in 40s (minimum expected: 48s)']);
  });

  it('flags slides viewed too quickly to read', () => {
    const detector = mount({ pageType: 'learning', learningSlidesCount: 3 });
    for (const slide of ['intro', 'prompts', 'parameters']) {
      detector.current.recordSlideView(slide, 2 * SECOND);
    }
    vi.advanceTimersByTime(60 * SECOND);

    const result = analyze(detector);

    expect(result.flags).toEqual(['Average slide view time: 2s (too fast to read)']);
    expect(pointsFromRules(result.flags)).toBe(result.score);
    expect(result.suspicionLevel).toBe('low');
  });

  it('starts over after a reset', () => {
    const detector = mount({ pageType: 'pretest' });
    answer(detector, 'pre-1', SECOND);
    act(() => detector.current.resetTimingData());
    answer(detector, 'pre-2', 40 * SECOND);

    expect(detector.current.getTimingSummary()).toMatchObject({ questionsAnswered: 1, fastAnswers: 0 });
    expect(analyze(detector).flags).toEqual([]);
  });
});
