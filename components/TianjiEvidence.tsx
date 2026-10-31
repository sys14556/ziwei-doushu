 'use client';
import { useEffect, useMemo, useState } from 'react';
type Hit={id:string;book:string;heading:string;terms:string[];reason:string;url:string;quote?:string;score:number};
type SearchResponse={configured:boolean;source:string;license:string;count:number;hits:Hit[];notice:string};
export default function TianjiEvidence({mode,terms}:{mode:'heming'|'xiaoliuren';terms:string[]}){
 const stable=useMemo(()=>[...new Set(terms)].filter(Boolean).slice(0,24).join('|'),[terms.join('|')]);
 const [data,setData]=useState<SearchResponse|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();setData(null);setError('');
  fetch('/api/tianji/search',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({mode,terms:stable.split('|')}),signal:controller.signal
  }).then(async r=>{if(!r.ok)throw new Error('检索服务不可用');return r.json() as Promise<SearchResponse>})
    .then(v=>{if(!controller.signal.aborted)setData(v)}).catch(e=>{if(!controller.signal.aborted)setError(e.message)});
  return ()=>controller.abort();
 },[mode,stable]);
 return <section style={{marginTop:20,padding:18,border:'1px solid var(--bdr)',borderRadius:12,background:'var(--bg-card)'}}>
  <h3 style={{margin:'0 0 10px',fontSize:17,color:'var(--ac)'}}>《天纪》课程数据库关联资料</h3>
  <p style={{fontSize:12,lineHeight:1.8,color:'var(--tx-3)'}}>按照当前宫位、星曜或起课名称检索可追溯资料，单纯关键词匹配不是合盘预测，也不是课程已明确讲过该组合的证明。页面不会上传双方出生资料。</p>
  {error?<p role="alert" style={{color:'#c44'}}>{error}</p>:!data?<p>检索课程出处中…</p>:<>
    <p style={{fontSize:12,color:'var(--tx-3)'}}>数据库：{data.configured?`已接入 ${data.count} 条`:'未导入'} · {data.license}</p>
    {data.hits.length?<div style={{display:'grid',gap:10}}>{data.hits.map(h=><article key={h.id} style={{border:'1px solid var(--bdr)',borderRadius:9,padding:13}}>
      <strong style={{fontSize:13}}>{h.heading}</strong>
      <p style={{fontSize:12,color:'var(--tx-3)'}}>{h.book} · {h.reason}</p>
      {h.quote?<p style={{fontSize:13,lineHeight:1.8}}>{h.quote}{h.quote.length===90?'…':''}</p>:null}
      <a href={h.url} target="_blank" rel="noreferrer" style={{fontSize:13,color:'var(--ac)'}}>打开原课程时间码核对 ↗</a>
    </article>)}</div>:<p style={{fontSize:13,color:'var(--tx-3)'}}>没有检索到可信的对应条目。本页不会编造“倪海厦专论”。</p>}
    <p style={{fontSize:12,color:'var(--tx-3)',marginTop:12}}>{data.notice} 来源：<a href={data.source} target="_blank" rel="noreferrer">Renhuai123/nihai-tianji-corpus</a></p>
  </>}
 </section>;
}
