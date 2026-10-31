'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { useTheme } from '@/components/ThemeProvider';

/**
 * Local, transparent palace-by-palace comparison. It does NOT pretend to be a
 * verified transcription of Ni Haixia's Tian Ji lectures. No AI key required.
 * Field extraction is deliberately defensive because chart schemas differ.
 */
type RecordLike = Record<string, unknown>;
type PalaceDigest = { name: string; branch: string; stars: string[] };
const PALACES = ['命宫', '夫妻宫', '福德宫', '财帛宫', '官禄宫', '迁移宫', '交友宫', '父母宫', '子女宫', '田宅宫'];
const FOCUSES: Record<string, string[]> = {
  '伴侣婚恋': ['命宫', '夫妻宫', '福德宫', '迁移宫'],
  '朋友相处': ['命宫', '福德宫', '交友宫', '迁移宫'],
  '合伙合作': ['命宫', '官禄宫', '财帛宫', '交友宫'],
  '亲子家人': ['命宫', '父母宫', '子女宫', '福德宫'],
};

function isRecord(value: unknown): value is RecordLike {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function toText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (isRecord(value)) {
    for (const key of ['name', 'starName', 'label', 'title', 'value']) {
      if (typeof value[key] === 'string') return value[key] as string;
    }
  }
  return '';
}
function lookupName(raw: RecordLike, fallback = ''): string {
  for (const key of ['palaceName', 'gongName', 'name', 'type', 'palace', 'gong', 'title']) {
    const candidate = toText(raw[key]);
    const match = PALACES.find(name => candidate === name || candidate === name.replace('宫', '') || candidate.includes(name));
    if (match) return match;
  }
  const fromKey = PALACES.find(name => fallback === name || fallback === name.replace('宫', ''));
  return fromKey || '';
}
function extractStars(raw: RecordLike): string[] {
  const results: string[] = [];
  for (const key of ['majorStars', 'mainStars', 'mainStar', 'stars', 'major', 'zhuxing', '主星', 'primaryStars']) {
    const val = raw[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        const s = toText(item);
        if (s) results.push(s);
      }
    } else {
      const s = toText(val);
      if (s) results.push(s);
    }
  }
  return Array.from(new Set(results)).slice(0, 8);
}
function digestChart(chart: ZiweiChart): PalaceDigest[] {
  const result = new Map<string, PalaceDigest>();
  const visited = new WeakSet<object>();
  function walk(value: unknown, depth: number, keyHint = ''): void {
    if (depth > 5 || !value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      value.slice(0, 100).forEach(item => walk(item, depth + 1));
      return;
    }
    const raw = value as RecordLike;
    const name = lookupName(raw, keyHint);
    if (name) {
      const branch = ['earthlyBranch', 'branch', 'diZhi', 'dizhi', 'zhi', '地支']
        .map(key => toText(raw[key])).find(Boolean) || '';
      const stars = extractStars(raw);
      const previous = result.get(name);
      if (!previous || (stars.length > previous.stars.length)) result.set(name, { name, branch, stars });
    }
    for (const [key, child] of Object.entries(raw)) {
      if (child && typeof child === 'object') walk(child, depth + 1, key);
    }
  }
  walk(chart, 0);
  return Array.from(result.values());
}
function palaceLine(label: string, p: PalaceDigest | undefined): string {
  if (!p) return `${label}：当前排盘数据结构未识别到该宫位，暂不推断。`;
  return `${label}：${p.name}${p.branch ? `（${p.branch}）` : ''}；${p.stars.length ? `可提取星曜：${p.stars.join('、')}` : '暂未提取到星曜字段'}。`;
}
function createLocalAnalysis(a: ZiweiChart, b: ZiweiChart, focus: string, question: string): string {
  const pa = new Map(digestChart(a).map(p => [p.name, p]));
  const pb = new Map(digestChart(b).map(p => [p.name, p]));
  const names = FOCUSES[focus] || FOCUSES['伴侣婚恋'];
  const paragraphs: string[] = [
    '**【分析方式】**',
    `本次是「${focus}」的双盘结构对照：分别使用网站自带排盘引擎起盘，列出双方重点宫位与可提取星曜。此版本不调用 AI、不输出虚构的缘分分数，也不声称完全复刻倪海厦老师的个人断法。`,
    '',
    '**【双方重点宫位】**',
  ];
  for (const name of names) {
    paragraphs.push(`**${name}**`, palaceLine('甲方', pa.get(name)), palaceLine('乙方', pb.get(name)), '');
  }
  paragraphs.push('**【合参说明】**');
  if (focus === '伴侣婚恋') {
    paragraphs.push('传统紫微合盘可以围绕双方命宫、夫妻宫与福德宫，对照个人表达方式、亲密关系期待及日常相处关注点；这些只是分析议题，不足以推出一定合婚或一定分离。');
  } else if (focus === '合伙合作') {
    paragraphs.push('合作关系可以重点对照命宫、官禄宫、财帛宫与交友宫，实际合作仍应以职责、财务规则和书面约定为准。');
  } else if (focus === '朋友相处') {
    paragraphs.push('朋友关系可以重点观察双方命宫、福德宫与交友宫。现实中的边界、信任与沟通更重要。');
  } else {
    paragraphs.push('家人关系可以参考命宫、父母宫、子女宫和福德宫。实际沟通与照护需求不能凭命盘代替判断。');
  }
  if (pa.size === 0 || pb.size === 0) {
    paragraphs.push('', '当前文件没有包含 ZiweiChart 的字段定义，本地对照未能完整识别所有宫位；如需精准的三方四正、跨盘四化算法，还需要核对 `lib/ziwei/types.ts` 和真实排盘数据结构。');
  }
  if (question.trim()) paragraphs.push('', '**【本次关注的问题】**', question.trim(), '以上已列出相关盘面基础信息，具体结论仍需结合实际关系背景，而不是只看星曜。');
  paragraphs.push('', '本页面用于传统文化学习与资料对照，不构成婚姻、医疗、财务或其他重要决策依据。');
  return paragraphs.join('\n');
}

function AnalysisText({ content }: { content: string }) {
  return (
    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--tx-2)', fontSize: 14, lineHeight: 1.85 }}>
      {content.split('\n').map((line, i) => {
        if (line.startsWith('**【') && line.endsWith('】**')) return <h3 key={i} style={{ margin: '18px 0 6px', color: 'var(--ac)', fontSize: 14 }}>{line.slice(2, -2)}</h3>;
        if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} style={{ display: 'block', color: 'var(--tx-0)' }}>{line.slice(2, -2)}</strong>;
        return <div key={i}>{line || '\u00a0'}</div>;
      })}
    </div>
  );
}

export default function HemingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [formA, setFormA] = useState<BirthFormState | null>(null);
  const [formB, setFormB] = useState<BirthFormState | null>(null);
  const [focus, setFocus] = useState('伴侣婚恋');
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);
  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(200,160,60,0.2)'}`,
    borderRadius: 16,
    padding: 24,
  };
  function ready(f: BirthFormState | null): f is BirthFormState {
    return !!(f && f.year && f.month && f.day && f.gender &&
      (f.unknownTime || (f.clockHour !== '' && f.clockMinute !== '')));
  }
  function runAnalysis() {
    setError('');
    if (!ready(formA) || !ready(formB)) {
      setError('请先填写双方完整出生信息（出生时辰未知时，可使用表单内的未知时辰选项）。');
      return;
    }
    setLoading(true);
    setAnalysis('');
    try {
      // Always rebuild charts; never reuse a chart after the user changes a birth form.
      const a = generateChart(formToBirthInfo(formA));
      const b = generateChart(formToBirthInfo(formB));
      setAnalysis(createLocalAnalysis(a, b, focus, question));
      requestAnimationFrame(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      setError('排盘失败。请检查日期、时辰及输入信息，必要时先分别在紫微斗数页面起盘。');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--tx-0)' }}>
      <header style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 18, padding: '16px 24px', borderBottom: '1px solid var(--bdr)' }}>
        <Link href="/gongju" style={{ color: 'var(--tx-2)', textDecoration: 'none' }}>← 全部工具</Link>
        <Link href="/chart" style={{ color: 'var(--tx-2)', textDecoration: 'none' }}>紫微排盘</Link>
        <span style={{ color: 'var(--ac)', fontWeight: 700 }}>双人合盘</span>
        <Link href="/xiaoliuren" style={{ color: 'var(--tx-2)', textDecoration: 'none' }}>小六壬</Link>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 20px 90px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 30, color: 'var(--ac)' }}>☯</div>
          <h1 style={{ fontSize: 25, margin: '12px 0' }}>紫微斗数 · 双人合盘</h1>
          <p style={{ color: 'var(--tx-3)', fontSize: 13, lineHeight: 1.75 }}>
            参考传统紫微斗数的重点宫位，先做双盘事实对照。倪海厦《天纪》专门断法尚待逐条核对，不会把通用规则冒充原讲义。
          </p>
        </div>
        <div className="heming-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 20 }}>
          <section style={cardStyle}>
            <h2 style={{ fontSize: 15, color: 'var(--ac)', marginBottom: 18 }}>甲方 · 出生信息</h2>
            <BirthForm hideSubmit onSubmit={() => {}} onFormSave={(f) => { setFormA(f); setAnalysis(''); }} />
          </section>
          <section style={cardStyle}>
            <h2 style={{ fontSize: 15, color: 'var(--ac)', marginBottom: 18 }}>乙方 · 出生信息</h2>
            <BirthForm hideSubmit onSubmit={() => {}} onFormSave={(f) => { setFormB(f); setAnalysis(''); }} />
          </section>
        </div>
        <section style={{ ...cardStyle, marginTop: 20 }}>
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>选择合参关系</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {Object.keys(FOCUSES).map(item => (
              <button type="button" key={item} onClick={() => { setFocus(item); setAnalysis(''); }}
                style={{ border: '1px solid var(--bdr)', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', background: item === focus ? 'var(--ac)' : 'var(--bg-card)', color: item === focus ? '#fff' : 'var(--tx-2)' }}>{item}</button>
            ))}
          </div>
          <label htmlFor="heming-question" style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--tx-2)' }}>想重点了解的问题（选填）</label>
          <textarea id="heming-question" value={question} onChange={e => setQuestion(e.target.value)} rows={2}
            placeholder="例如：双方在沟通方式和日常生活安排上应注意什么？"
            style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 8, border: '1px solid var(--bdr)', color: 'var(--tx-0)', background: 'var(--bg-card)', resize: 'vertical' }}/>
          <button type="button" onClick={runAnalysis} disabled={loading}
            style={{ marginTop: 16, background: 'linear-gradient(135deg,#9a6210,#c88020)', border: 0, borderRadius: 9, padding: '12px 30px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {loading ? '正在生成双盘对照…' : '开始合盘对照'}
          </button>
          {error && <div role="alert" style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}>{error}</div>}
        </section>
        <section ref={analysisRef} style={{ ...cardStyle, marginTop: 20, minHeight: 170 }}>
          <h2 style={{ fontSize: 15, marginBottom: 16, color: 'var(--ac)' }}>合盘结果 · 结构化对照</h2>
          {analysis ? <AnalysisText content={analysis}/> : <p style={{ fontSize: 13, color: 'var(--tx-3)' }}>输入两个人的出生信息后点击“开始合盘对照”，即可在本地计算，不需要 AI 密钥或额外数据库。</p>}
        </section>
      </main>
      <style>{`@media(max-width:760px){.heming-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
