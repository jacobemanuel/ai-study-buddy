import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import jsPDF from 'jspdf';

// A small in-memory backend: four completed sessions, two per condition, with answers and timings
const backend = vi.hoisted(() => {
  type Row = Record<string, unknown>;

  const sessions = [
    { n: 1, mode: 'text', start: '2026-05-04T10:00:00Z', end: '2026-05-04T10:24:00Z', age: '24', education: "Bachelor's degree", experience: 'Intermediate', pre: ['A', 'C'], post: ['A', 'C'], likert: '4' },
    { n: 2, mode: 'text', start: '2026-05-05T10:00:00Z', end: '2026-05-05T10:31:00Z', age: '31', education: "Master's degree", experience: 'Advanced', pre: ['B', 'B'], post: ['A', 'D'], likert: '3' },
    { n: 3, mode: 'avatar', start: '2026-05-05T12:00:00Z', end: '2026-05-05T12:28:00Z', age: '45', education: "Bachelor's degree", experience: 'Beginner', pre: ['A', 'B'], post: ['A', 'C'], likert: '5' },
    { n: 4, mode: 'avatar', start: '2026-05-06T09:00:00Z', end: '2026-05-06T09:35:00Z', age: '28', education: 'High school', experience: 'Intermediate', pre: ['C', 'C'], post: ['A', 'D'], likert: '4' },
  ];
  const internalId = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  const sessionId = (n: number) => `a1b2c3d${n}-5e6f-4a7b-8c9d-0e1f2a3b4c5d`;

  const tables: Record<string, Row[]> = {
    study_sessions: sessions.map((s) => ({
      id: internalId(s.n),
      session_id: sessionId(s.n),
      mode: s.mode,
      modes_used: [s.mode],
      status: 'completed',
      validation_status: 'pending',
      suspicion_score: 0,
      suspicious_flags: [],
      started_at: s.start,
      completed_at: s.end,
      created_at: s.start,
      last_activity_at: s.end,
      validated_at: null,
      validated_by: null,
      browser_fingerprint: null,
    })),
    study_questions: [
      { question_id: 'pre-1', question_type: 'pre_test', category: 'knowledge', correct_answer: 'A', question_text: 'Which input does a text-to-image model take?' },
      { question_id: 'pre-2', question_type: 'pre_test', category: 'knowledge', correct_answer: 'B', question_text: 'What does the seed control?' },
      { question_id: 'knowledge-1', question_type: 'post_test', category: 'knowledge', correct_answer: 'A', question_text: 'Which input does a text-to-image model take?' },
      { question_id: 'knowledge-2', question_type: 'post_test', category: 'knowledge', correct_answer: 'C', question_text: 'What does a negative prompt do?' },
    ].map((q, i) => ({ ...q, id: `q${i + 1}`, is_active: true, sort_order: i + 1, options: [] })),
    study_slides: [
      { slide_id: 'slide-1', title: 'How image generators work', sort_order: 1, is_active: true },
      { slide_id: 'slide-2', title: 'Writing a good prompt', sort_order: 2, is_active: true },
    ],
    demographic_responses: sessions.flatMap((s) => [
      { question_id: 'demo-age', answer: s.age },
      { question_id: 'demo-education', answer: s.education },
      { question_id: 'demo-digital-experience', answer: s.experience },
    ].map((r, i) => ({ ...r, id: `d${s.n}-${i}`, session_id: internalId(s.n), created_at: s.start }))),
    pre_test_responses: sessions.flatMap((s) => s.pre.map((answer, i) => ({
      id: `pre${s.n}-${i}`, session_id: internalId(s.n), question_id: `pre-${i + 1}`, answer, created_at: s.start,
    }))),
    post_test_responses: sessions.flatMap((s) => [
      ...s.post.map((answer, i) => ({ question_id: `knowledge-${i + 1}`, answer })),
      { question_id: 'trust-1', answer: s.likert },
      { question_id: 'engagement-1', answer: s.likert },
      { question_id: 'satisfaction-1', answer: s.likert },
    ].map((r, i) => ({ ...r, id: `post${s.n}-${i}`, session_id: internalId(s.n), created_at: s.end }))),
    avatar_time_tracking: sessions.flatMap((s) => [
      { slide_id: 'slide-1', slide_title: 'How image generators work', duration_seconds: 240 + s.n * 60 },
      { slide_id: 'slide-2', slide_title: 'Writing a good prompt', duration_seconds: 300 + s.n * 45 },
      { slide_id: 'page:pre-test', slide_title: 'Page: Pre-test', duration_seconds: 120 },
    ].map((r, i) => ({ ...r, id: `t${s.n}-${i}`, session_id: internalId(s.n), mode: s.mode, started_at: s.start, ended_at: null, created_at: s.start }))),
  };

  // Enough of the query builder for reads: filters by eq/in, pages by range, ignores ordering
  const query = (table: string) => {
    let rows = [...(tables[table] ?? [])];
    const chain: unknown = new Proxy({}, {
      get(_target, prop) {
        if (typeof prop === 'symbol') return undefined;
        switch (prop) {
          case 'eq':
            return (column: string, value: unknown) => {
              rows = rows.filter((row) => row[column] === value);
              return chain;
            };
          case 'in':
            return (column: string, values: unknown[]) => {
              rows = rows.filter((row) => values.includes(row[column]));
              return chain;
            };
          case 'range':
            return (from: number, to: number) => {
              rows = rows.slice(from, to + 1);
              return chain;
            };
          case 'single':
          case 'maybeSingle':
            return () => Promise.resolve({ data: rows[0] ?? null, error: null });
          case 'then':
            return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
              Promise.resolve({ data: rows, error: null, count: rows.length }).then(resolve, reject);
          default:
            return () => chain;
        }
      },
    });
    return chain;
  };

  const channel = { on: () => channel, subscribe: () => channel, unsubscribe: () => Promise.resolve('ok') };

  return {
    supabase: {
      from: query,
      channel: () => channel,
      removeChannel: () => Promise.resolve('ok'),
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
    },
    sessionId,
  };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: backend.supabase }));

import AdminOverview from '@/components/admin/AdminOverview';
import AdminSessions from '@/components/admin/AdminSessions';

type SavedPdf = { filename: string; source: string; pages: number };
let saved: SavedPdf[] = [];

// jsPDF applies anything on jsPDF.API over its built-ins, so a save here catches doc.save() instead of a download
const pluginApi = jsPDF.API as unknown as { save?: (this: jsPDF, filename: string) => jsPDF };

describe('PDF export', () => {
  beforeEach(() => {
    saved = [];
    pluginApi.save = function (filename) {
      saved.push({ filename, source: this.output(), pages: this.getNumberOfPages() });
      return this;
    };
  });

  afterEach(() => {
    delete pluginApi.save;
    cleanup();
  });

  it('builds the publication report from the overview stats', async () => {
    render(<AdminOverview userEmail="owner@example.com" />);

    fireEvent.click(await screen.findByRole('button', { name: /pdf report/i }, { timeout: 5000 }));
    await waitFor(() => expect(saved).toHaveLength(1));

    const [pdf] = saved;
    expect(pdf.filename).toMatch(/^publication_report_\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(pdf.source.startsWith('%PDF-')).toBe(true);
    expect(pdf.source.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(pdf.pages).toBeGreaterThan(1);
    expect(pdf.source).toContain('(Comprehensive Research Report)');
    // Tables drawn by jspdf-autotable
    expect(pdf.source).toContain('(Total Participants)');
    expect(pdf.source).toContain('(Avatar Mode)');
    expect(pdf.source).toContain("(Cohen's d)");
    // Charts drawn with the plain jsPDF shape calls
    expect(pdf.source).toContain('(Avatar Slide Time vs Knowledge Gain)');
    expect(pdf.source).toContain('(Perception Scores \\(% of max\\))');
    expect(pdf.source).toContain(`(Page ${pdf.pages} of ${pdf.pages})`);
  });

  it('builds the per-session report from the session details', async () => {
    render(<AdminSessions userEmail="owner@example.com" />);

    const idCell = await screen.findByText(backend.sessionId(3), {}, { timeout: 5000 });
    const viewButton = idCell.closest('tr')?.querySelector('.lucide-eye')?.closest('button');
    expect(viewButton).toBeTruthy();
    fireEvent.click(viewButton as HTMLButtonElement);

    fireEvent.click(await screen.findByRole('button', { name: /export pdf/i }, { timeout: 5000 }));
    await waitFor(() => expect(saved).toHaveLength(1));

    const [pdf] = saved;
    expect(pdf.filename).toBe('session_a1b2c3d3_report.pdf');
    expect(pdf.source.startsWith('%PDF-')).toBe(true);
    expect(pdf.source).toContain('(Session Report)');
    expect(pdf.source).toContain(`(Session ID: ${backend.sessionId(3)})`);
    expect(pdf.source).toContain('(PRE-TEST RESPONSES)');
    expect(pdf.source).toContain('(Which input does a text-to-image model take?: A)');
    expect(pdf.source).toContain('(SLIDE TIME BREAKDOWN)');
  });
});
