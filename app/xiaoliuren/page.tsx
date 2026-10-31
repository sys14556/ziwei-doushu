'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Solar } from 'lunar-javascript';
import { useTheme } from '@/components/ThemeProvider';
import { SIX, HOURS, calculateTriple, traditionalDate, displayReading, type LeapMode, type ZiMode, type StartMode } from '@/lib/traditional/xiaoliuren';

type Mode='date'|'numbers';
type Calendar='solar'|'lunar';
type ResultState={result:ReturnType<typeof calculateTriple>;detail:string;modeLabel:string}|{error:string};
const SOURCES=[
  {label:'《天纪》六壬法教学转述（含农历四月初五戌时示例）',url:'https://www.woniuapp.cn/videos/2/4.html'},
  {label:'小六壬掌诀位置与月日时起数通行说明',url:'https://jiugongbagua.com/xueguan/bushi-xiaoliuren/xiaoliuren-zhangjue/'},
  {label:'闰月与起宫口径差异说明',url:'https://mingge.org/compendium/xiaoliuren/method'},
];
function validDate(text:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return false;
  const [y,m,d]=text.split('-').map(Number);
  const x=new Date(Date.UTC(y,m-1,d));
  return x.getUTCFullYear()===y && x.getUTCMonth()===m-1 && x.getUTCDate()===d;
}
function nextDay(text:string):string{
  const [y,m,d]=text.split('-').map(Number);
  const dt=new Date(Date.UTC(y,m-1,d+1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
}
export default function XiaoliurenPage(){
  const {theme}=useTheme();
  const dark=theme==='dark';
  const [mode,setMode]=useState<Mode>('date');
  const [calendar,setCalendar]=useState<Calendar>('solar');
  const [solarDate,setSolarDate]=useState('2026-10-31');
  const [lunarMonth,setLunarMonth]=useState(9);
  const [lunarDay,setLunarDay]=useState(22);
  const [isLeap,setIsLeap]=useState(false);
  const [hour,setHour]=useState(20);
  const [numbers,setNumbers]=useState<[number,number,number]>([1,1,1]);
  const [question,setQuestion]=useState('');
  const [topic,setTopic]=useState('一般事项');
  const [ziMode,setZiMode]=useState<ZiMode>('same-day');
  const [leapMode,setLeapMode]=useState<LeapMode>('same');
  const [startMode,setStartMode]=useState<StartMode>('daan');
  const [showVariants,setShowVariants]=useState(false);
  const [done,setDone]=useState(false);
  useEffect(()=>{
    const now=new Date();
    setSolarDate(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`);
    setHour(now.getHours());
  },[]);
  const state=useMemo<ResultState>(()=>{
    try{
      if(mode==='numbers'){
        const result=calculateTriple(...numbers,startMode);
        return {result,detail:`按顺数三数字 ${numbers.join('、')} 起课`,modeLabel:'三数字'};
      }
      if(calendar==='lunar'&&hour===23&&ziMode==='next-day')return {error:'手工农历输入时无法自动判断月末跨月。请切换公历自动换算，或将子时换日设为“不换日”。'};
      let m=lunarMonth,d=lunarDay,leap=isLeap;
      const dayUsed=hour===23&&ziMode==='next-day'?nextDay(solarDate):solarDate;
      if(calendar==='solar'){
        if(!validDate(solarDate))return {error:'公历日期无效。'};
        const [y,mo,da]=dayUsed.split('-').map(Number);
        const lunar=Solar.fromYmd(y,mo,da).getLunar();
        m=Math.abs(lunar.getMonth());d=lunar.getDay();leap=lunar.getMonth()<0;
      }
      if(!Number.isInteger(m)||m<1||m>12||!Number.isInteger(d)||d<1||d>30)return {error:'请输入有效农历月份（1–12）和日期（1–30）。'};
      const effectiveMonth=leap&&leapMode==='next'?(m%12)+1:m;
      const result=traditionalDate(effectiveMonth,d,hour,startMode);
      const note=leap?`，闰月按${leapMode==='same'?'本月序数':'下一月序数'}起数`:'';
      const dateShift=hour===23&&ziMode==='next-day'?'（23点换次日）':'';
      return {result,detail:`农历${leap?'闰':''}${m}月${d}日 · ${HOURS[Math.floor(((hour+1)%24)/2)]}时${dateShift}${note}。起数月${effectiveMonth}、日${d}、时辰序数${Math.floor(((hour+1)%24)/2)+1}。`,modeLabel:'月日时'};
    }catch(err){return {error:err instanceof Error?err.message:'计算失败，请检查输入的日期。'};}
  },[mode,calendar,solarDate,lunarMonth,lunarDay,isLeap,hour,numbers,ziMode,leapMode,startMode]);
  const current=done && 'result' in state?state:null;
  const panel={background:dark?'rgba(255,255,255,.04)':'rgba(255,255,255,.90)',border:'1px solid var(--bdr)',borderRadius:16,padding:22} as const;
  const input={background:'var(--bg-card)',border:'1px solid var(--bdr)',borderRadius:9,padding:'10px 12px',color:'var(--tx-0)',width:'100%',boxSizing:'border-box' as const};
  const btn=(active:boolean)=>({padding:'10px 15px',borderRadius:9,border:'1px solid var(--bdr)',background:active?'var(--ac)':'var(--bg-card)',color:active?'#fff':'var(--tx-2)',cursor:'pointer'}) as const;
  function changeNumber(index:number,v:number){setNumbers(p=>p.map((x,i)=>i===index?v:x) as [number,number,number]);setDone(false);}
  return <div style={{minHeight:'100vh',background:'var(--bg-0)',color:'var(--tx-0)'}}>
    <header style={{display:'flex',gap:18,flexWrap:'wrap',padding:'15px 22px',borderBottom:'1px solid var(--bdr)',fontSize:13}}><Link href="/" style={{color:'var(--tx-2)'}}>← 工具箱首页</Link><Link href="/chart" style={{color:'var(--tx-2)'}}>紫微排盘</Link><Link href="/heming" style={{color:'var(--tx-2)'}}>双人合盘</Link><b style={{color:'var(--ac)'}}>小六壬</b></header>
    <main style={{maxWidth:930,margin:'auto',padding:'32px 18px 75px'}}>
      <div style={{textAlign:'center',marginBottom:27}}><div style={{fontSize:30,color:'var(--ac)'}}>☯</div><h1 style={{fontSize:27}}>小六壬 · 掐指起课</h1><p style={{fontSize:13,lineHeight:1.9,color:'var(--tx-3)'}}>默认采用倪海厦《天纪》六壬法教学中可核对的“大安起月、月上起日、日上起时”顺数口径，保留三数字变体和流派差异说明。</p></div>
      <section style={panel}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}><button type="button" style={btn(mode==='date')} onClick={()=>{setMode('date');setDone(false);}}>农历月日时</button><button type="button" style={btn(mode==='numbers')} onClick={()=>{setMode('numbers');setDone(false);}}>三数字起课</button></div>
        {mode==='date'?<>
          <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:18,fontSize:13}}><label><input type="radio" checked={calendar==='solar'} onChange={()=>{setCalendar('solar');setDone(false);}}/> 公历自动换农历</label><label><input type="radio" checked={calendar==='lunar'} onChange={()=>{setCalendar('lunar');setDone(false);}}/> 手填农历</label></div>
          {calendar==='solar'?<label style={{display:'block',fontSize:13,marginBottom:15}}>公历日期<input type="date" value={solarDate} onChange={e=>{setSolarDate(e.target.value);setDone(false);}} style={{...input,display:'block',marginTop:7}}/></label>:
          <div className="lr-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginBottom:15}}><label style={{fontSize:13}}>农历月份<input type="number" min={1} max={12} value={lunarMonth} onChange={e=>{setLunarMonth(Number(e.target.value));setDone(false);}} style={{...input,display:'block',marginTop:7}}/></label><label style={{fontSize:13}}>农历日期<input type="number" min={1} max={30} value={lunarDay} onChange={e=>{setLunarDay(Number(e.target.value));setDone(false);}} style={{...input,display:'block',marginTop:7}}/></label><label style={{fontSize:13,alignSelf:'end',paddingBottom:12}}><input type="checkbox" checked={isLeap} onChange={e=>{setIsLeap(e.target.checked);setDone(false);}}/> 闰月</label></div>}
          <label style={{display:'block',fontSize:13}}>当地钟表时间<select value={hour} onChange={e=>{setHour(Number(e.target.value));setDone(false);}} style={{...input,display:'block',marginTop:7}}>{Array.from({length:24},(_,h)=><option key={h} value={h}>{String(h).padStart(2,'0')}:00–{String(h).padStart(2,'0')}:59（{HOURS[Math.floor(((h+1)%24)/2)]}时）</option>)}</select></label>
          <p style={{fontSize:12,color:'var(--tx-3)',lineHeight:1.8}}>默认：23:00–00:59 都属子时；公历选择的日期在 23:00 不自动加一天。需要按其他口径换日，可展开下方设置。</p>
        </>:<div className="lr-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12}}>{numbers.map((n,i)=><label key={i} style={{fontSize:13}}>第{i+1}个数字<input type="number" min={1} max={1000000} value={n} onChange={e=>changeNumber(i,Number(e.target.value))} style={{...input,display:'block',marginTop:7}}/></label>)}<p style={{fontSize:12,color:'var(--tx-3)',gridColumn:'1/-1'}}>从大安起第一数；下一数均从上一落宫起，把当前宫计作第1位。数字起课为民间变体，不等同于《天纪》月日时案例。</p></div>}
        <details style={{borderTop:'1px solid var(--bdr)',marginTop:18,paddingTop:14}} open={showVariants} onToggle={e=>setShowVariants((e.currentTarget as HTMLDetailsElement).open)}>
          <summary style={{cursor:'pointer',fontSize:13,color:'var(--ac)'}}>流派设置（默认保持《天纪》教学口径）</summary>
          <div className="lr-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginTop:14}}>
            <label style={{fontSize:12}}>起月起宫<select value={startMode} onChange={e=>{setStartMode(e.target.value as StartMode);setDone(false);}} style={{...input,display:'block',marginTop:6}}><option value="daan">正月起大安（默认）</option><option value="liulian">正月起留连（其他口传）</option></select></label>
            <label style={{fontSize:12}}>闰月口径<select value={leapMode} onChange={e=>{setLeapMode(e.target.value as LeapMode);setDone(false);}} style={{...input,display:'block',marginTop:6}}><option value="same">按本月序数（默认）</option><option value="next">按下一月序数</option></select></label>
            <label style={{fontSize:12}}>23点换日口径<select value={ziMode} onChange={e=>{setZiMode(e.target.value as ZiMode);setDone(false);}} style={{...input,display:'block',marginTop:6}}><option value="same-day">不换日（默认）</option><option value="next-day">23点进入次日（变体）</option></select></label>
          </div>
          <p style={{fontSize:12,color:'var(--tx-3)',lineHeight:1.8}}>这些不是已证实的标准统一算法；换一种口传规则，起课结果可能不同。手填闰月请自行核对实际历法。</p>
        </details>
        <label style={{display:'block',fontSize:13,marginTop:18}}>占问分类<select value={topic} onChange={e=>setTopic(e.target.value)} style={{...input,display:'block',marginTop:7}}>{['一般事项','感情沟通','工作学业','出行办事','财务合作'].map(t=><option key={t}>{t}</option>)}</select></label>
        <label style={{display:'block',fontSize:13,marginTop:14}}>所问事情（选填）<input value={question} onChange={e=>setQuestion(e.target.value)} maxLength={150} placeholder="例如：某个计划接下来如何推进？" style={{...input,display:'block',marginTop:7}}/></label>
        <button type="button" onClick={()=>setDone(true)} style={{marginTop:19,padding:'12px 30px',border:0,borderRadius:10,background:'linear-gradient(135deg,#976214,#cc9630)',color:'#fff',fontWeight:700,cursor:'pointer'}}>开始起课</button>
        {done&&'error' in state&&<p role="alert" style={{fontSize:13,color:'#c33'}}>{state.error}</p>}
      </section>
      {current&&<section style={{...panel,marginTop:18}}>
        <h2 style={{margin:'0 0 9px',fontSize:18,color:'var(--ac)'}}>本次起课 · {SIX[current.result.endIndex].name}</h2>
        <p style={{fontSize:12,color:'var(--tx-3)',lineHeight:1.8}}>{current.detail}</p>
        {question&&<p style={{fontSize:13,color:'var(--tx-2)'}}>所问：{question}</p>}
        <div className="lr-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginTop:14}}>{[current.result.monthIndex,current.result.dayIndex,current.result.endIndex].map((index,i)=><div key={i} style={{border:'1px solid var(--bdr)',borderRadius:12,padding:15,textAlign:'center',background:'var(--bg-card)'}}><div style={{fontSize:12,color:'var(--tx-3)'}}>{['起月 · 背景','起日 · 过程','起时 · 末宫'][i]}</div><div style={{fontSize:25,fontWeight:700,marginTop:7,color:SIX[index].colour}}>{SIX[index].name}</div><div style={{fontSize:12,marginTop:5,color:'var(--tx-3)'}}>{SIX[index].deity} · {SIX[index].wuxing}</div></div>)}</div>
        <h3 style={{fontSize:15,marginTop:23}}>完整顺数过程</h3><ol style={{fontSize:13,lineHeight:2,color:'var(--tx-2)'}}>{current.result.steps.map((s,i)=><li key={i}>{s}</li>)}</ol>
        <div style={{padding:16,borderLeft:`3px solid ${SIX[current.result.endIndex].colour}`,background:'var(--bg-card)',borderRadius:8}}>
          <strong>末宫：{SIX[current.result.endIndex].name} · 传统分类「{SIX[current.result.endIndex].grade}」</strong>
          <p style={{fontSize:13,color:'var(--tx-2)',lineHeight:1.8,margin:'9px 0 0'}}>传统象意：{SIX[current.result.endIndex].image}。{displayReading(current.result.endIndex,topic)}</p>
        </div>
        <p style={{fontSize:12,color:'var(--tx-3)',marginTop:16,lineHeight:1.8}}>六宫的吉阻分类是传统文化语境，不具有预测科学效力。不要将起课结果视作他人的心理、婚姻结局、疾病或财富事实。</p>
      </section>}
      <section style={{...panel,marginTop:18}}><h2 style={{fontSize:16,margin:'0 0 16px'}}>六宫 · 掌诀位置</h2><div className="lr-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>{SIX.map((p,i)=><div key={p.name} style={{padding:13,border:`1px solid ${current?.result.endIndex===i?p.colour:'var(--bdr)'}`,borderRadius:10}}><strong style={{color:p.colour}}>{i+1}. {p.name}</strong><p style={{fontSize:12,color:'var(--tx-3)',margin:'7px 0 3px'}}>{p.position} · {p.wuxing} · {p.deity}</p><p style={{fontSize:12,color:'var(--tx-2)',lineHeight:1.6,margin:0}}>{p.image}</p></div>)}</div></section>
      <section style={{...panel,marginTop:18}}><h2 style={{fontSize:15,marginTop:0}}>可复核示例与资料来源</h2><p style={{fontSize:13,lineHeight:1.85,color:'var(--tx-2)'}}>农历四月初五戌时 → 赤口、留连、空亡（末宫空亡）。农历九月廿二戌时 → 速喜、空亡、赤口。三数字 1、1、1 → 大安、大安、大安。</p>{SOURCES.map(s=><p key={s.url} style={{fontSize:12}}><a target="_blank" rel="noreferrer" href={s.url} style={{color:'var(--ac)'}}>{s.label} ↗</a></p>)}</section>
    </main>
    <style>{`@media(max-width:670px){.lr-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
