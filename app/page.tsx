'use client';

import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

const tools = [
  {
    href: '/chart',
    icon: '☯',
    no: '01',
    name: '紫微斗数',
    sub: '单人排盘',
    description: '输入出生信息，查看十二宫命盘、四化、大限流年与现有的 13 维解读。',
    action: '进入紫微斗数',
  },
  {
    href: '/heming',
    icon: '♡',
    no: '02',
    name: '双人合盘',
    sub: '双盘对照 · 基础版',
    description: '填写两个人的出生信息，生成双盘并对照重点宫位与星曜结构。',
    action: '进入双人合盘',
  },
  {
    href: '/xiaoliuren',
    icon: '✦',
    no: '03',
    name: '小六壬',
    sub: '六宫起课',
    description: '按农历月、日、时辰或三数字起课，查看落宫过程和传统象意。',
    action: '进入小六壬',
  },
] as const;

export default function HomePage() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  const color = dark
    ? {
        bg: '#020810',
        panel: '#0a1423',
        panelBorder: 'rgba(218,177,87,0.22)',
        text: '#f3e9cf',
        muted: '#a0adc2',
        faint: '#77859c',
        gold: '#d4a843',
        goldMuted: 'rgba(212,168,67,0.1)',
        line: 'rgba(212,168,67,0.2)',
      }
    : {
        bg: '#f5efe0',
        panel: '#fffaf0',
        panelBorder: 'rgba(139,100,16,0.24)',
        text: '#2c281f',
        muted: '#665f52',
        faint: '#897d6b',
        gold: '#8b6410',
        goldMuted: 'rgba(139,100,16,0.08)',
        line: 'rgba(139,100,16,0.2)',
      };

  return (
    <main
      className="toolbox-home"
      style={{
        minHeight: '100svh',
        background: color.bg,
        color: color.text,
        transition: 'background 250ms ease, color 250ms ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          top: '-170px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 850,
          height: 470,
          background: `radial-gradient(ellipse, ${dark ? 'rgba(212,168,67,0.08)' : 'rgba(210,170,78,0.12)'} 0%, transparent 70%)`,
        }}
      />

      <header
        className="toolbox-topbar"
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: '22px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: color.gold,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.24em',
          }}
        >
          紫微命盘
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={dark ? '切换亮色主题' : '切换暗色主题'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: color.goldMuted,
            color: color.gold,
            border: `1px solid ${color.line}`,
            borderRadius: 999,
            padding: '9px 15px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <span aria-hidden="true">{dark ? '☼' : '☾'}</span>
          {dark ? '切换亮色' : '切换暗色'}
        </button>
      </header>

      <section
        className="toolbox-content"
        style={{
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto',
          padding: '72px 24px 80px',
          position: 'relative',
          zIndex: 1,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p
            style={{
              color: color.gold,
              fontSize: 11,
              letterSpacing: '0.35em',
              margin: '0 0 14px',
            }}
          >
            ZI WEI DOU SHU
          </p>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 45px)',
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '0.06em',
              margin: '0 0 16px',
              color: color.text,
            }}
          >
            命理文化工具箱
          </h1>
          <p style={{ color: color.muted, fontSize: 14, margin: 0, lineHeight: 1.9 }}>
            紫微斗数 · 双人合盘 · 小六壬
          </p>
        </div>

        <div
          className="toolbox-home-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 20,
          }}
        >
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="toolbox-home-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 300,
                padding: 28,
                background: color.panel,
                border: `1px solid ${color.panelBorder}`,
                color: color.text,
                borderRadius: 18,
                textDecoration: 'none',
                boxShadow: dark
                  ? '0 14px 38px rgba(0,0,0,0.17)'
                  : '0 14px 38px rgba(100,65,20,0.06)',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: color.gold, fontSize: 35, lineHeight: 1 }} aria-hidden="true">
                  {tool.icon}
                </span>
                <span style={{ color: color.faint, fontSize: 12, letterSpacing: '0.1em' }}>
                  {tool.no}
                </span>
              </div>
              <h2 style={{ fontSize: 23, margin: '32px 0 7px', fontWeight: 650 }}>
                {tool.name}
              </h2>
              <div style={{ color: color.gold, fontSize: 12, marginBottom: 14 }}>
                {tool.sub}
              </div>
              <p style={{ color: color.muted, fontSize: 13, lineHeight: 1.9, margin: '0 0 28px' }}>
                {tool.description}
              </p>
              <span style={{ color: color.gold, fontSize: 13, marginTop: 'auto', fontWeight: 600 }}>
                {tool.action} →
              </span>
            </Link>
          ))}
        </div>

        <p
          style={{
            textAlign: 'center',
            color: color.faint,
            fontSize: 12,
            lineHeight: 1.8,
            marginTop: 38,
          }}
        >
          传统命理文化学习与娱乐参考；合盘为基础结构对照，不代表已复现全部《天纪》讲授规则。
        </p>
      </section>

      <style>{`
        .toolbox-home-card:hover { transform: translateY(-5px); }
        .toolbox-home-card:focus-visible { outline: 2px solid #d4a843; outline-offset: 4px; }
        @media (max-width: 850px) {
          .toolbox-home-grid { grid-template-columns: 1fr !important; max-width: 520px; margin: 0 auto; }
          .toolbox-home-card { min-height: 250px !important; }
          .toolbox-content { padding-top: 42px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .toolbox-home-card { transition: none !important; }
          .toolbox-home-card:hover { transform: none; }
        }
      `}</style>
    </main>
  );
}
