
'use client';

import { useEffect, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';

type Reading = {
  k: string;
  c: Record<string, string>;
};

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
        )
      )}
    </>
  );
}

export default function DatasetReading({
  chart,
}: {
  chart: ZiweiChart;
}) {
  const b = chart.birthInfo;

  const key = [
    `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`,
    b.hour,
    b.gender,
  ].join('-');

  const [reading, setReading] = useState<Reading | null>(null);
  const [topic, setTopic] = useState<TopicKey>('overview');
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'missing'
  >('loading');

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setReading(null);

    
fetch(`https://ziwei-reading-api.y1693623199.workers.dev/api/reading/${encodeURIComponent(key)}`)

      .then(async response => {
        if (!response.ok) {
          throw new Error('Reading not found');
        }
        return response.json();
      })
      .then((data: Reading) => {
        if (cancelled) return;

        if (data.k !== key || !data.c) {
          throw new Error('Invalid reading data');
        }

        setReading(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setReading(null);
          setStatus('missing');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

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
        <p>正在读取解读数据……</p>
      )}

      {status === 'missing' && (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <p>暂未收录此命盘：{key}</p>
          <p>目前仅接入一张测试命盘。</p>
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

            if (!trimmed) {
              return <div key={i} style={{ height: 9 }} />;
            }

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
                  {trimmed
                    .replace(/^#+\s*/, '')
                    .replace(/\*\*/g, '')}
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
