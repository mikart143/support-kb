// What #4471 holds, problem by problem. causes.ts tells parser from hint by tenant; it files the
// one-day moves the desk noted (desk-notes.json) under the tenant's cause. They are not a day/month
// swap at all, so here they count as their own problem.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export const PROBLEMS: Record<Problem, string> = {
  parser: 'Shared parser reads day-first dates month first: day and month swap',
  hint: 'booking-v3 form hints MM/DD/YYYY but reads the date day first',
  shift: 'Invite lands one day off: no swap, a one-day move',
  unplaced: 'No tenant on file, or a month-first tenant: not placed',
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemRow = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  // Intake tagged these as something other than their problem.
  mistagged: number;
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: ProblemRow[]; exported: number; unique: number } {
  const merged = all.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(merged);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of unique) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const rows = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows, exported: merged.length, unique: unique.length };
}
