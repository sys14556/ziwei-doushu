'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Solar } from 'lunar-javascript';
import { useTheme } from '@/components/ThemeProvider';

type NumberMode = 'date' | 'number';
type Palace = { name: string; element: string; meaning: string; hint: string; color: string };
const PALACES: Palace[] = [
  { name: '大安', element: '木', meaning: '安稳、守成、平和', hint: '适合先稳定节奏、理顺当前的安排。', color: '#26826a' },
  { name: '留连', element: '水', meaning: '拖延、牵绊、反复', hint: '提醒耐心核实进展，不必急于求结果。', color: '#487cac' },
  { name: '速喜', element: '火', meaning: '消息、转机、迅速', hint: '可以留意进展和及时沟通的机会。', color: '#b76839' },
  { name: '赤口', element: '金', meaning: '争执、口舌、分歧', hint: '注意表达方式，重要沟通尽量确认事实。', color: '#b04a4a' },
  { name: '小吉', element: '木', meaning: '和合、助力、小成', hint: '适合把任务拆小、借助合作逐步推进。', color: '#2f9186' },
  { name: '空亡', element: '土', meaning: '落空、未明、不确定', hint: '先核对条件和信息，不宜只凭期待作决定。', color: '#79738d' },
];
const HOUR_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const CYCLE = PALACES.length;
function calculate(month: number, day: number, hourIndex: number) {
  const start = (month - 1) % CYCLE;
  const middle = (start + day - 1) % CYCLE;
  const finish = (middle + hourIndex) % CYCLE;
  return [start, middle, finish] as const;
}
function isValidDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [y, m, d] = text.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export default function XiaoliurenPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<NumberMode>('date');
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar');
  const [solarDate, setSolarDate] = useState('');
  const [lunarMonth, setLunarMonth] = useState(9);
  const [lunarDay, setLunarDay] = useState(1);
  const [hour, setHour] = useState(9);
  const [num1, setNum1] = useState(1);
  const [num2, setNum2] = useState(1);
  const [num3, setNum3] = useState(1);
  const [question, setQuestion] = useState('');
  const [computed, setComputed] = useState(false);
  // Resolve the visitor's local calendar date on the client to avoid a stale hard-coded default.
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSolarDate(`${y}-${m}-${d}`);
    setHour(now.getHours());
  }, []);
  const state = useMemo(() => {
    try {
      if (mode === 'number') {
        if (![num1, num2, num3].every(n => Number.isInteger(n) && n > 0 && n <= 9999)) return { error: '请输入 1–9999 的三个正整数。' } as const;
        const [a, b, c] = calculate(num1, num2, num3 - 1);
        return { a, b, c, summary: `三数字起课：${num1}、${num2}、${num3}` } as const;
      }
      let month = lunarMonth;
      let day = lunarDay;
      let leapNotice = '';
      if (calendar === 'solar') {
        if (!isValidDate(solarDate)) return { error: '请选择有效的公历日期。' } as const;
        const [y, m, d] = solarDate.split('-').map(Number);
        const lunar = Solar.fromYmd(y, m, d).getLunar();
        const lunarMonthSigned = lunar.getMonth();
        month = Math.abs(lunarMonthSigned);
        day = lunar.getDay();
        if (lunarMonthSigned < 0) leapNotice = '（闰月按同月序号计算；其他传承可能采用不同取法）';
      }
      if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 30)
        return { error: '农历月份请输入 1–12，日期请输入 1–30。' } as const;
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) return { error: '请选择正确小时。' } as const;
      const hourIndex = Math.floor(((hour + 1) % 24) / 2); // 23:00~00:59 = 子时
      const [a, b, c] = calculate(month, day, hourIndex);
      return { a, b, c, summary: `农历${month}月${day}日 · ${HOUR_NAMES[hourIndex]}时${leapNotice}` } as const;
    } catch {
      return { error: '日期换算失败，请改用手动输入农历月、日。' } as const;
    }
  }, [mode, calendar, solarDate, lunarMonth, lunarDay, hour, num1, num2, num3]);
  const show = computed && !('error' in state);
  const panel = {
    background: isDark ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.88)',
    border: '1px solid var(--bdr)', borderRadius: 16, padding: 22,
  };
  const formInput = { border: '1px solid var(--bdr)', borderRadius: 9, padding: '10px 12px', color: 'var(--tx-0)', background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box' as const };
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--tx-0)' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 18, padding: '16px 24px', borderBottom: '1px solid var(--bdr)' }}>
        <Link href="/gongju" style={{ color: 'var(--tx-2)' }}>← 全部工具</Link>
        <Link href="/chart" style={{ color: 'var(--tx-2)' }}>紫微排盘</Link>
        <Link href="/heming" style={{ color: 'var(--tx-2)' }}>双人合盘</Link>
        <span style={{ color: 'var(--ac)', fontWeight: 700 }}>小六壬</span>
      </header>
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '35px 20px 85px' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 32, color: 'var(--ac)' }}>☯</div>
          <h1 style={{ fontSize: 28, margin: '10px 0' }}>小六壬 · 六宫起课</h1>
          <p style={{ fontSize: 13, color: 'var(--tx-3)', lineHeight: 1.8 }}>采用常见的“大安起正月、月上起日、日上起时”算法，展示月宫、日宫和时宫全过程。</p>
        </div>
        <section style={panel}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
            {([['date','月日时起课'],['number','三数字起课']] as const).map(([value,label]) => (
              <button key={value} type="button" onClick={() => { setMode(value); setComputed(false); }}
                style={{ border: '1px solid var(--bdr)', padding: '10px 17px', borderRadius: 9, background: mode === value ? 'var(--ac)' : 'var(--bg-card)', color: mode === value ? '#fff' : 'var(--tx-2)', cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
          {mode === 'date' ? <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
              <label style={{ fontSize: 13 }}><input type="radio" checked={calendar === 'solar'} onChange={() => { setCalendar('solar'); setComputed(false); }}/> 公历日期自动换算</label>
              <label style={{ fontSize: 13 }}><input type="radio" checked={calendar === 'lunar'} onChange={() => { setCalendar('lunar'); setComputed(false); }}/> 手动输入农历</label>
            </div>
            {calendar === 'solar' ? <label style={{ display: 'block', fontSize: 13, marginBottom: 16 }}>公历日期<input type="date" value={solarDate} onChange={e => { setSolarDate(e.target.value); setComputed(false); }} style={{ ...formInput, marginTop: 7 }}/></label>
              : <div className="xlr-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <label style={{ fontSize: 13 }}>农历月（1–12）<input type="number" min={1} max={12} value={lunarMonth} onChange={e => { setLunarMonth(Number(e.target.value)); setComputed(false); }} style={{ ...formInput, marginTop: 7 }}/></label>
                <label style={{ fontSize: 13 }}>农历日（1–30）<input type="number" min={1} max={30} value={lunarDay} onChange={e => { setLunarDay(Number(e.target.value)); setComputed(false); }} style={{ ...formInput, marginTop: 7 }}/></label>
              </div>}
            <label style={{ display: 'block', fontSize: 13 }}>当地钟表时间（24 小时制）<select value={hour} onChange={e => { setHour(Number(e.target.value)); setComputed(false); }} style={{ ...formInput, marginTop: 7 }}>
              {Array.from({ length: 24 }, (_, h) => <option value={h} key={h}>{String(h).padStart(2,'0')}:00–{String(h).padStart(2,'0')}:59</option>)}
            </select></label>
            <p style={{ fontSize: 12, marginTop: 12, color: 'var(--tx-3)' }}>子时按 23:00–00:59；本版使用输入的公历日期换算农历日，不自动执行“23 点换次日”的其他流派规则。</p>
          </> : <div className="xlr-three" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[[num1,setNum1,'第一数'],[num2,setNum2,'第二数'],[num3,setNum3,'第三数']].map(([num,setter,label]) => (
              <label key={String(label)} style={{ fontSize: 13 }}>{String(label)}<input type="number" min={1} max={9999} value={num as number} onChange={e => { (setter as (v:number)=>void)(Number(e.target.value)); setComputed(false); }} style={{ ...formInput, marginTop: 7 }}/></label>
            ))}
          </div>}
          <label style={{ display: 'block', fontSize: 13, marginTop: 18 }}>所问事情（选填）<input type="text" maxLength={120} placeholder="例如：某项计划推进得如何？" value={question} onChange={e => setQuestion(e.target.value)} style={{ ...formInput, marginTop: 7 }}/></label>
          <button type="button" onClick={() => setComputed(true)} style={{ marginTop: 20, padding: '12px 34px', border: 0, borderRadius: 10, background: 'linear-gradient(135deg,#9a6210,#c88020)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>开始起课</button>
          {computed && 'error' in state && <p role="alert" style={{ color: '#dc2626', fontSize: 13 }}>{state.error}</p>}
        </section>
        {show && !('error' in state) && <section style={{ ...panel, marginTop: 18 }}>
          <h2 style={{ fontSize: 17, marginTop: 0, color: 'var(--ac)' }}>本次起课结果</h2>
          <p style={{ fontSize: 13, color: 'var(--tx-3)' }}>{state.summary}</p>
          {question && <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>所问：{question}</p>}
          <div className="xlr-three" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 16 }}>
            {([state.a,state.b,state.c] as const).map((index, step) => <div key={step} style={{ border: '1px solid var(--bdr)', borderRadius: 12, padding: 17, textAlign: 'center', background: 'var(--bg-card)' }}>
              <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{['起月 · 背景','起日 · 过程','起时 · 结果'][step]}</div>
              <div style={{ fontSize: 24, fontWeight: 700, padding: '8px 0', color: PALACES[index].color }}>{PALACES[index].name}</div>
              <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>五行：{PALACES[index].element}</div>
            </div>)}
          </div>
          <div style={{ borderLeft: `3px solid ${PALACES[state.c].color}`, marginTop: 22, paddingLeft: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>末宫：{PALACES[state.c].name}</div>
            <p style={{ margin: '4px 0', fontSize: 14, lineHeight: 1.8 }}>{PALACES[state.c].meaning}</p>
            <p style={{ margin: '4px 0', fontSize: 13, lineHeight: 1.8, color: 'var(--tx-3)' }}>{PALACES[state.c].hint}</p>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.8, marginTop: 18, color: 'var(--tx-3)' }}>计算说明：三个数分别在上次落点所在宫起数，第一数从大安起；每一步都将起点视为“1”，顺排六宫。各派闰月和子时换日存在分歧，本版使用上方注明的规则。结果仅供传统文化学习，不应替代现实判断。</p>
        </section>}
        <section style={{ ...panel, marginTop: 18 }}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>六宫顺序</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
            {PALACES.map((p, i) => <div key={p.name} style={{ padding: 12, border: '1px solid var(--bdr)', borderRadius: 10, fontSize: 12 }}><strong style={{ color: p.color }}>{i+1}. {p.name}</strong><div style={{ color: 'var(--tx-3)', marginTop: 5 }}>{p.meaning}</div></div>)}
          </div>
        </section>
      </main>
      <style>{`@media(max-width:620px){.xlr-three{grid-template-columns:1fr!important}.xlr-two{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
