<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEMS, splitTicket, type Problem } from '#lib/kb/problems';
  import type { Report } from '#lib/kb/causes';

  // issues: where each problem is tracked now, problem → issue URL.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
  const issueNo = (url: string) => `#${url.split('/').pop()}`;
</script>

<p class="sum">
  <strong>{split.unique}</strong> reports in #{ticket} ·
  <strong>{split.rows.length}</strong>
  {split.rows.length === 1 ? 'problem' : 'problems'}
  {#if split.exported !== split.unique}
    <span class="muted">({split.exported} rows in the export; {split.exported - split.unique} are the same report twice)</span>
  {/if}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>intake tag wrong</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.rows as row (row.problem)}
      <tr>
        <td><code>{row.problem}</code><br /><span class="muted">{PROBLEMS[row.problem]}</span></td>
        <td><strong>{row.reports.length}</strong></td>
        <td title={row.tenants.join(', ')}>{row.tenants.length}</td>
        <td class="muted">{channels(row.channels)}</td>
        <td>{row.mistagged}</td>
        <td class="muted">{row.firstSeen} → {row.lastSeen}</td>
        <td>
          {#if issues[row.problem]}<a href={issues[row.problem]}>{issueNo(issues[row.problem] ?? '')}</a>{:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
