'use client';

import { useEffect, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';

type Reading = {
  k: string;
  c: Record<string, string>;
};

type LoadStatus = 'loading' | 'ready' | 'missing' | 'error';

const DATASET_ORIGIN = 'https://ziwei-dataset.pages.dev';
const MIN_YEAR = 1950;
const MAX_YEAR = 2026;

const TOPICS = [
  ['overview', '命格'],
  ['personality', '性格'],
  ['love', '感情'],
  ['career', '事业'],
  ['wealth', '财运'],
  ['health', '健康'],
  ['family', '兄弟'],
  ['children', '子女'],
  ['move', '迁移'],
  ['friends', '人际'],
  ['home', '田宅'],
  ['spirit', '福德'],
  ['parents', '父母'],
] as const;

type TopicKey = (typeof TOPICS)[number][0];

function isReading(value: unknown, expectedKey: string): value is Reading {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<Reading>;
  return (
    record.k === expectedKey &&
    typeof record.c === 'object' &&
    record.c !== null &&
    TOPICS.every(([topic]) => typeof record.c?.[topic] === 'string')
  );
}

/**
 * Download just one month from Cloudflare Pages, decode the zstd stream,
 * and find the requested JSONL record without retaining the entire month
 * in memory. Requires `fzstd` (npm install fzstd@0.1.1).
 *
 * The Pages _headers file published by the full deployment workflow sets
 * Access-Control-Allow-Origin: * for /data/*.
 */
async function loadMonthlyReading(
  key: string,
  year: number,
  month: number,
  signal: AbortSignal,
): Promise<Reading | null> {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < MIN_YEAR ||
    year > MAX_YEAR ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const monthName = `${year}-${String(month).padStart(2, '0')}`;
  const url = `${DATASET_ORIGIN}/data/${monthName}.jsonl.zst`;
  const response = await fetch(url, { signal, cache: 'force-cache' });
  if (response.status === 404) return null;
  if (!response.ok || !response.body) {
    throw new Error(`无法读取当月数据（HTTP ${response.status}）`);
  }

  // Lazy-load the tiny, pure-JavaScript zstd decoder only when needed.
  const { Decompress } = await import('fzstd');
  const textDecoder = new TextDecoder('utf-8');
  const reader = response.body.getReader();
  let partialLine = '';
  let found: Reading | null = null;

  function examineLine(line: string): void {
    // Fast filter: only JSON-parse lines which may contain this exact key.
    if (found || !line.includes(key)) return;
    const parsed: unknown = JSON.parse(line);
    if (isReading(parsed, key)) found = parsed;
  }

  function consumeText(text: string, final: boolean): void {
    partialLine += text;
    let newline = partialLine.indexOf('\n');
    while (newline >= 0 && !found) {
      examineLine(partialLine.slice(0, newline).trim());
      partialLine = partialLine.slice(newline + 1);
      newline = partialLine.indexOf('\n');
    }
    if (final && !found && partialLine.trim()) {
      examineLine(partialLine.trim());
    }
    if (found) partialLine = '';
  }

  const decompressor = new Decompress((chunk: Uint8Array, final: boolean) => {
    consumeText(textDecoder.decode(chunk, { stream: !final }), final);
  });

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (signal.aborted) return null;
      decompressor.push(value);
      if (found) {
        await reader.cancel();
        return found;
      }
    }
    // Finish the frame and flush the text decoder, including the final line.
    decompressor.push(new Uint8Array(0), true);
    return found;
  } finally {
    reader.releaseLock();
  }
}

function RichLine({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} style={{ color: '#e8bd60' }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function DatasetReading({ chart }: { chart: ZiweiChart }) {
  const b = chart.birthInfo;
  const year = Number(b.year);
  const month = Number(b.month);
  const key = [
    `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`,
    b.hour,
    b.gender,
  ].join('-');

  const [reading, setReading] = useState<Reading | null>(null);
  const [topic, setTopic] = useState<TopicKey>('overview');
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setReading(null);

    void loadMonthlyReading(key, year, month, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setReading(data);
        setStatus(data ? 'ready' : 'missing');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error('Ziwei dataset loading failed:', error);
        setStatus('error');
      });

    return () => controller.abort();
  }, [key, year, month, attempt]);

  const content = reading?.c[topic] || '';

  return (
    <section style={{
      background: '#0b142b',
      color: '#e5e7eb',
      border: '1px solid #29354f',
      borderRadius: 12,
      padding: 16,
      minWidth: 0,
    }}>
      <h2 style={{
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 12,
        color: '#e8bd60',
      }}>
        紫微斗数 · 13维命盘解读
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 6,
        marginBottom: 16,
      }}>
        {TOPICS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTopic(id)}
            style={{
              padding: '9px 4px',
              borderRadius: 6,
              border: '1px solid #334155',
              background: topic === id ? '#d4a843' : '#19233b',
              color: topic === id ? '#111827' : '#e5e7eb',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <p style={{ fontSize: 13, lineHeight: 1.8 }}>
          正在下载并解压当月命盘数据，首次读取可能稍慢……
        </p>
      )}

      {status === 'missing' && (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <p>暂未找到此命盘：{key}</p>
          <p>当前数据集覆盖 {MIN_YEAR}—{MAX_YEAR} 年，请检查出生日期、时辰和性别。</p>
        </div>
      )}

      {status === 'error' && (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <p>当月数据读取或解压失败，请检查网络连接后重试。</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            style={{
              marginTop: 8,
              padding: '7px 14px',
              borderRadius: 6,
              border: '1px solid #d4a843',
              background: '#19233b',
              color: '#e8bd60',
              cursor: 'pointer',
            }}
          >
            重新读取
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div style={{
          maxHeight: 650,
          overflowY: 'auto',
          lineHeight: 1.8,
          fontSize: 13,
          overflowWrap: 'anywhere',
        }}>
          {content.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} style={{ height: 9 }} />;

            if (
              trimmed.startsWith('#') ||
              /^\*\*【.*】\*\*$/.test(trimmed)
            ) {
              return (
                <h3 key={i} style={{
                  color: '#e8bd60',
                  fontWeight: 700,
                  marginTop: 12,
                }}>
                  {trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
                </h3>
              );
            }

            return (
              <p key={i} style={{ margin: 0 }}>
                <RichLine text={line} />
              </p>
            );
          })}
        </div>
      )}

      <p style={{
        marginTop: 16,
        fontSize: 11,
        color: '#94a3b8',
        lineHeight: 1.6,
      }}>
        数据来源：紫微斗数开源解读数据集 v4.0，
        Renhuai123/ziwei-doushu。
        内容仅供传统文化研究与娱乐参考，
        不作为科学预测或医疗建议。
      </p>
    </section>
  );
}
