import { useState } from 'react';
import { db } from '../../../db/db';
import { addDaysISO } from '../../../domain/dates';
import { trendWeight } from '../../../domain/body';
import { totalsByDate } from '../../../domain/nutrition';
import { foodContext, foodDay } from '../../../services/food';
import { Chart, ChartBox } from '../../components/charts';
import { fmtDate, Seg } from '../../components/common';
import { useLive, useSettings, useToday } from '../../hooks';

// ---------------------------------------------------------------- charts (in the nutrition screen, not the dashboard)
export function FoodCharts() {
  const today = useToday();
  const s = useSettings();
  const [days, setDays] = useState<'14' | '28' | '56'>('28');
  const data = useLive(async () => {
    if (!s) return null;
    const n = Number(days);
    const from = addDaysISO(today, -(n - 1));
    const ctx = await foodContext(s, today);
    const logs = await db.foodLogs.where('date').between(from, today, true, true).toArray();
    const totals = totalsByDate(logs);
    const rows = Array.from({ length: n }, (_, i) => {
      const d = addDaysISO(from, i);
      const fd = foodDay(d, ctx);
      const tot = totals.get(d);
      return {
        d: fmtDate(d),
        kcal: tot ? Math.round(tot.kcal) : null,
        kcalT: fd.targets?.kcal ?? null,
        protein: tot ? Math.round(tot.protein) : null,
        proteinT: fd.targets?.protein ?? null,
        carbs: tot ? Math.round(tot.carbs) : null,
        carbsT: fd.targets?.carbs ?? null,
        maint: fd.maintenance,
        weight: trendWeight(ctx.weighIns, d),
        deficit: tot && fd.maintenance ? tot.kcal < fd.maintenance : null,
      };
    });
    return rows;
  }, [s, today, days]);
  if (!data) return null;
  const logged = data.filter((r) => r.kcal != null);
  const inDeficit = logged.filter((r) => r.deficit).length;
  const avg = (k: 'kcal' | 'protein' | 'carbs') => (logged.length ? Math.round(logged.reduce((a, r) => a + (r[k] ?? 0), 0) / logged.length) : null);
  return (
    <>
      <Seg value={days} onChange={setDays} options={[{ v: '14', label: '14 יום' }, { v: '28', label: '28 יום' }, { v: '56', label: '8 שבועות' }]} />
      <div className="tiles mt">
        <div className="tile">
          <b>{avg('kcal') ?? '—'}</b>
          <span>קק"ל ממוצע</span>
        </div>
        <div className="tile l">
          <b>{avg('protein') ?? '—'}</b>
          <span>חלבון ממוצע</span>
        </div>
        <div className="tile l">
          <b>
            {inDeficit}/{logged.length}
          </b>
          <span>ימים בגירעון</span>
        </div>
      </div>
      <ChartBox title="קלוריות מול יעד" legend={[{ label: 'אכלתי', color: '#1f7a3a' }, { label: 'יעד', color: '#c0392b' }, { label: 'תחזוקה', color: '#9aa59d' }]}>
        <Chart data={data} x="d" series={[{ key: 'kcal', label: 'אכלתי', type: 'bar' }, { key: 'kcalT', label: 'יעד', type: 'line', color: '#c0392b' }, { key: 'maint', label: 'תחזוקה', type: 'line', color: '#9aa59d' }]} />
      </ChartBox>
      <ChartBox title="חלבון מול יעד (1.8 ג'/ק&quot;ג)" legend={[{ label: 'אכלתי', color: '#2a6fb5' }, { label: 'יעד', color: '#c0392b' }]}>
        <Chart data={data} x="d" series={[{ key: 'protein', label: 'חלבון', type: 'bar', color: '#2a6fb5' }, { key: 'proteinT', label: 'יעד', type: 'line', color: '#c0392b' }]} />
      </ChartBox>
      <ChartBox title="פחמימות מול יעד לפי סוג היום" insight="היעד עולה בימים עצימים, ב-24 שעות לפני משחק וביום המשחק (R-NUT-2).">
        <Chart data={data} x="d" series={[{ key: 'carbs', label: 'פחמימות', type: 'bar', color: '#8a5a00' }, { key: 'carbsT', label: 'יעד', type: 'line', color: '#c0392b' }]} />
      </ChartBox>
      <ChartBox title="משקל מגמה מול קלוריות" legend={[{ label: 'משקל מגמה', color: '#7a4bb3' }, { label: 'קלוריות', color: '#1f7a3a' }]}>
        <Chart data={data} x="d" series={[{ key: 'kcal', label: 'קלוריות', type: 'bar' }, { key: 'weight', label: 'משקל', type: 'line', color: '#7a4bb3', right: true }]} />
      </ChartBox>
    </>
  );
}
