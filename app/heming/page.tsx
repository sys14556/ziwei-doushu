'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import { formToBirthInfo } from '@/lib/ziwei/share';
import { generateChart } from '@/lib/ziwei/algorithm';
import { useTheme } from '@/components/ThemeProvider';
import { buildStudy, TWELVE, threeWay, type Palace, type Finding, type StudyReport } from '@/lib/ziwei/heming-rules';

const FOCUSES = ['伴侣婚恋','朋友相处','合伙合作','亲子家人'];
const SOURCES=[
  {label:'《天纪》05案例整理：夫妻宫与三方四正',url:'https://www.nihaixiahope.com/tianji/1497.html'},
  {label:'《天纪》08案例笔记：福德宫与四化参看',url:'https://www.nihaixiahope.com/blog/76.html'},
  {label:'十四主星在夫妻宫：公开解读资料整理',url:'https://kantianji.com/zh-hans/gongwei/fuqi/'},
  {label:'原开源项目与排盘内核',url:'https://github.com/Renhuai123/ziwei-doushu'},
];
function ready(f:BirthFormState|null):f is BirthFormState {
  return !!(f && f.year && f.month && f.day && f.gender && (f.unknownTime || (f.clockHour!==''&&f.clockMinute!=='')));
}
function RuleList({items}:{items:Finding[]}){
  if(!items.length)return <p style={{color:'var(--tx-3)',fontSize:13}}>本页未提取到足以支持这部分讨论的资料，不会补造解读。</p>;
  return <div style={{display:'grid',gap:10}}>{items.map((it,i)=><article key={`${it.title}-${i}`} style={{padding:15,border:'1px solid var(--bdr)',borderRadius:12,background:'var(--bg-card)'}}>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between'}}><strong style={{fontSize:14}}>{it.title}</strong><span style={{fontSize:11,color:'var(--ac)',border:'1px solid var(--bdr)',padding:'3px 8px',borderRadius:8}}>{it.provenance}</span></div>
    <p style={{fontSize:12,lineHeight:1.8,color:'var(--tx-3)',margin:'9px 0'}}>盘面证据：{it.evidence}</p>
    <p style={{fontSize:13,lineHeight:1.9,color:'var(--tx-2)',margin:0}}>{it.reading}</p>
  </article>)}</div>;
}
function get(p:Palace[],name:string){return p.find(x=>x.name===name);}
function PalaceTable({report}:{report:StudyReport}){
  return <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:740}}>
    <thead><tr><th style={{padding:12,textAlign:'left'}}>宫位 / 三方四正</th><th style={{padding:12,textAlign:'left'}}>甲方星曜（实盘提取）</th><th style={{padding:12,textAlign:'left'}}>乙方星曜（实盘提取）</th></tr></thead>
    <tbody>{TWELVE.map(name=>{
      const a=get(report.a,name),b=get(report.b,name);
      return <tr key={name} style={{borderTop:'1px solid var(--bdr)'}}>
        <td style={{padding:'13px 10px',minWidth:115,verticalAlign:'top'}}><strong>{name}</strong><br/><span style={{color:'var(--tx-3)',fontSize:11}}>{threeWay(name).join(' · ')}</span></td>
        {[a,b].map((p,i)=><td key={i} style={{padding:'13px 10px',verticalAlign:'top',color:'var(--tx-2)',lineHeight:1.8}}>{p?.stars.length?p.stars.join('、'):'未识别，不推断'}{p?.four.length?<div style={{color:'var(--ac)'}}>识别四化：{p.four.join('、')}</div>:null}</td>)}
      </tr>;
    })}</tbody>
  </table></div>;
}
export default function HemingPage(){
  const {theme}=useTheme();
  const dark=theme==='dark';
  const [aForm,setAForm]=useState<BirthFormState|null>(null);
  const [bForm,setBForm]=useState<BirthFormState|null>(null);
  const [focus,setFocus]=useState('伴侣婚恋');
  const [question,setQuestion]=useState('');
  const [report,setReport]=useState<StudyReport|null>(null);
  const [error,setError]=useState('');
  const [tab,setTab]=useState<'overview'|'palaces'|'sources'>('overview');
  const reportRef=useRef<HTMLDivElement>(null);
  const card={background:dark?'rgba(255,255,255,.045)':'rgba(255,255,255,.9)',border:'1px solid var(--bdr)',borderRadius:16,padding:22} as const;
  function run(){
    setError('');setReport(null);
    if(!ready(aForm)||!ready(bForm)){setError('请完整填写双方出生信息；时间未知会影响宫位判断。');return;}
    try{
      const a=generateChart(formToBirthInfo(aForm));
      const b=generateChart(formToBirthInfo(bForm));
      const value=buildStudy(a,b,focus);
      if(!value.a.length || !value.b.length){setError('本地排盘成功，但未解析到宫位字段；需要核对 lib/ziwei/types.ts，暂不生成虚构的合盘结论。');return;}
      setReport(value);
      setTab('overview');
      requestAnimationFrame(()=>reportRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));
    }catch(err){setError(`生成失败：${err instanceof Error?err.message:'请检查出生日期及时辰。'}`);}
  }
  const tabBtn=(value:'overview'|'palaces'|'sources',label:string)=><button type="button" onClick={()=>setTab(value)} style={{border:'1px solid var(--bdr)',borderRadius:9,padding:'9px 14px',cursor:'pointer',background:tab===value?'var(--ac)':'var(--bg-card)',color:tab===value?'#fff':'var(--tx-2)'}}>{label}</button>;
  return <div style={{minHeight:'100vh',background:'var(--bg-0)',color:'var(--tx-0)'}}>
    <header style={{display:'flex',gap:18,flexWrap:'wrap',padding:'15px 22px',borderBottom:'1px solid var(--bdr)',fontSize:13}}>
      <Link href="/" style={{color:'var(--tx-2)'}}>← 工具箱首页</Link><Link href="/chart" style={{color:'var(--tx-2)'}}>紫微排盘</Link><b style={{color:'var(--ac)'}}>双人合盘</b><Link href="/xiaoliuren" style={{color:'var(--tx-2)'}}>小六壬</Link>
    </header>
    <main style={{maxWidth:1150,margin:'auto',padding:'32px 18px 80px'}}>
      <div style={{textAlign:'center',marginBottom:28}}><div style={{fontSize:30,color:'var(--ac)'}}>☯</div><h1 style={{fontSize:27}}>双人合盘 · 《天纪》合参学习版</h1>
        <p style={{color:'var(--tx-3)',fontSize:13,lineHeight:1.85,maxWidth:790,margin:'auto'}}>本地排两张命盘，按夫妻宫、福德宫、命宫与三方四正、四化等依据展示对照，区分课程整理、通行象意和本工具自己的双盘观察。不提供虚构的合婚百分比，也不以命盘断定婚姻必然结局。</p></div>
      <div className="h-grid" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:18}}>
        <section style={card}><h2 style={{color:'var(--ac)',fontSize:15,margin:'0 0 14px'}}>甲方 · 出生信息</h2><BirthForm hideSubmit onSubmit={()=>{}} onFormSave={f=>{setAForm(f);setReport(null);}} /></section>
        <section style={card}><h2 style={{color:'var(--ac)',fontSize:15,margin:'0 0 14px'}}>乙方 · 出生信息</h2><BirthForm hideSubmit onSubmit={()=>{}} onFormSave={f=>{setBForm(f);setReport(null);}} /></section>
      </div>
      <section style={{...card,marginTop:18}}>
        <h2 style={{fontSize:16,margin:'0 0 16px'}}>合参主题</h2>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:18}}>{FOCUSES.map(f=><button type="button" key={f} onClick={()=>{setFocus(f);setReport(null);}} style={{padding:'9px 14px',borderRadius:9,border:'1px solid var(--bdr)',background:focus===f?'var(--ac)':'var(--bg-card)',color:focus===f?'#fff':'var(--tx-2)',cursor:'pointer'}}>{f}</button>)}</div>
        <label style={{display:'block',fontSize:13,color:'var(--tx-2)'}}>你希望讨论的问题（可选）<textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={2} maxLength={300} placeholder="例如：双方的沟通习惯、生活节奏有哪些值得注意的差异？" style={{width:'100%',boxSizing:'border-box',marginTop:8,padding:12,border:'1px solid var(--bdr)',borderRadius:10,background:'var(--bg-card)',color:'var(--tx-0)',resize:'vertical'}}/></label>
        <button type="button" onClick={run} style={{marginTop:16,border:0,borderRadius:10,padding:'12px 28px',background:'linear-gradient(135deg,#976214,#d0a23b)',color:'#fff',fontWeight:700,cursor:'pointer'}}>生成双盘合参报告</button>
        {error&&<p role="alert" style={{color:'#d33',fontSize:13}}>{error}</p>}
      </section>
      <section ref={reportRef} style={{...card,marginTop:18}}>
        <h2 style={{fontSize:18,margin:'0 0 10px',color:'var(--ac)'}}>合盘报告</h2>
        {!report?<p style={{fontSize:13,color:'var(--tx-3)'}}>填好双方资料后点击生成，报告将包括：各自主盘的传统观察、跨盘对照、十二宫事实表、规则出处与数据完整性提醒。</p>:<>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:19}}>{tabBtn('overview','合参分析')}{tabBtn('palaces','十二宫完整对照')}{tabBtn('sources','规则来源与局限')}</div>
          {tab==='overview'&&<div style={{display:'grid',gap:24}}>
            {question&&<div style={{padding:'12px 14px',background:'var(--bg-card)',borderRadius:10,fontSize:13}}>本次关注：{question}。下述内容仅是围绕该主题的传统盘面参考，未对个人问题作事实预测。</div>}
            <section><h3 style={{fontSize:17,color:'var(--ac)'}}>一、甲方重点宫位及主星象意</h3><RuleList items={report.findingsA}/></section>
            <section><h3 style={{fontSize:17,color:'var(--ac)'}}>二、乙方重点宫位及主星象意</h3><RuleList items={report.findingsB}/></section>
            <section><h3 style={{fontSize:17,color:'var(--ac)'}}>三、双盘互动议题</h3><RuleList items={report.cross}/></section>
          </div>}
          {tab==='palaces'&&<PalaceTable report={report}/>}
          {tab==='sources'&&<div style={{display:'grid',gap:12,fontSize:13,lineHeight:1.8}}>
            <p>标注“课例对应”的条目，仅表示判断顺序、选宫等方法能在公开课程整理中找到类似材料，并不代表下方具体文字是倪师原话。“通行星曜象意”和“双盘比照”属编写者的解释与组织，不应冒称倪师专论。</p>
            {SOURCES.map(s=><a href={s.url} key={s.url} rel="noreferrer" target="_blank" style={{color:'var(--ac)'}}>参考：{s.label} ↗</a>)}
            <p>完整《天纪》涉及命、运、地理、人事等综合判断，现阶段仅做排盘与可核验规则合参；没有经过课程逐句对照、八字与阳宅信息核验，不能宣称百分之百复刻“完整合婚”。</p>
          </div>}
          {report.completeness.length>0&&<div style={{marginTop:20,padding:14,border:'1px solid var(--bdr)',borderRadius:10,fontSize:12,color:'var(--tx-3)'}}>数据完整性：{report.completeness.join(' ')}</div>}
          <p style={{fontSize:12,lineHeight:1.8,color:'var(--tx-3)',marginTop:18}}>供传统文化研究与娱乐参考。不可将星曜或民间断语作为感情、婚姻、健康、财务等重要事项的决定依据。</p>
        </>}
      </section>
    </main>
    <style>{`@media(max-width:800px){.h-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
