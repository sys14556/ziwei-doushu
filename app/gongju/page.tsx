import Link from 'next/link';

const tools = [
  { name: '紫微斗数', href: '/chart', mark: '☯', status: '现有功能', summary: '单人命盘、四化、大限流年和 13 维解读。' },
  { name: '双人合盘', href: '/heming', mark: '♡', status: '基础对照版', summary: '双人起盘，按关系类型对照关键宫位；更深入的倪海厦《天纪》规则尚待核验。' },
  { name: '小六壬', href: '/xiaoliuren', mark: '✦', status: '新增', summary: '农历月日时与三数字起课；展示月、日、时三宫和六宫传统象意。' },
];

export default function ToolsPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '60px 22px', background: 'var(--bg-0)', color: 'var(--tx-0)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--tx-2)', textDecoration: 'none' }}>← 返回首页</Link>
        <header style={{ textAlign: 'center', padding: '35px 0 36px' }}>
          <div style={{ color: 'var(--ac)', fontSize: 36 }}>☯</div>
          <h1 style={{ fontSize: 30, margin: '12px 0' }}>命理文化工具</h1>
          <p style={{ color: 'var(--tx-3)', fontSize: 14 }}>紫微排盘 · 双人合盘 · 小六壬</p>
        </header>
        <div className="ziwei-tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 18 }}>
          {tools.map(tool => <Link key={tool.href} href={tool.href} style={{ display: 'block', border: '1px solid var(--bdr)', borderRadius: 18, background: 'var(--bg-card)', color: 'inherit', padding: 25, textDecoration: 'none' }}>
            <div style={{ color: 'var(--ac)', fontSize: 30, marginBottom: 14 }}>{tool.mark}</div>
            <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 7 }}>{tool.status}</div>
            <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>{tool.name}</h2>
            <p style={{ color: 'var(--tx-3)', fontSize: 13, lineHeight: 1.8, minHeight: 74 }}>{tool.summary}</p>
            <div style={{ color: 'var(--ac)', fontSize: 13, marginTop: 16 }}>进入功能 →</div>
          </Link>)}
        </div>
        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--tx-3)' }}>传统文化学习和娱乐参考，不宜作为婚姻、健康、财务等重大决策的唯一依据。</p>
      </div>
      <style>{`@media(max-width:760px){.ziwei-tools-grid{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}
