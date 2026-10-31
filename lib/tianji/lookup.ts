import indexData from '@/data/tianji/index.json';

export type EvidenceEntry={
 id:string; book:string; h2:string; h3:string; terms:string[];
 bvid:string; part?:number; section?:number; t_hms?:string; quote?:string;
};
type CorpusIndex={schema:number;source:string;license:string;mode:'references'|'quotes';count:number;entries:EvidenceEntry[]};
export type SearchInput={mode:'heming'|'xiaoliuren';terms:string[]};
export type Hit={id:string; book:string; heading:string; terms:string[]; reason:string; url:string; quote?:string; score:number};
// Static import ensures the generated citation index is included in the
// Vercel server bundle. This file stays server-side through the API route.
const index = indexData as unknown as CorpusIndex;
async function corpus():Promise<CorpusIndex|null>{
 return index.schema===1 && Array.isArray(index.entries) ? index : null;
}
function seconds(hms:string|undefined):number {
 if(!hms||!/^\d{2,3}:\d{2}:\d{2}$/.test(hms))return 0;
 const [h,m,s]=hms.split(':').map(Number);return h*3600+m*60+s;
}
function sourceUrl(e:EvidenceEntry):string{
 if(!/^BV[A-Za-z0-9]{10}$/.test(e.bvid))return 'https://github.com/Renhuai123/nihai-tianji-corpus';
 const query=new URLSearchParams();
 if(e.part&&Number.isInteger(e.part))query.set('p',String(e.part));
 query.set('t',String(seconds(e.t_hms)));
 return `https://www.bilibili.com/video/${e.bvid}?${query.toString()}`;
}
const ALLOWED=/^[\p{Script=Han}\d\p{Script=Latin}\s·（）()]+$/u;
function normalizeTerms(terms:unknown):string[]{
 if(!Array.isArray(terms))return [];
 return [...new Set(terms.filter((v):v is string=>typeof v==='string').map(t=>t.trim()).filter(t=>t.length>=2&&t.length<=12&&ALLOWED.test(t)))].slice(0,24);
}
export async function searchTianji(input:SearchInput):Promise<{configured:boolean;source:string;license:string;count:number;hits:Hit[];notice:string}>{
 const db=await corpus();
 const source='https://github.com/Renhuai123/nihai-tianji-corpus';
 if(!db)return {configured:false,source,license:'CC BY-NC-SA 4.0',count:0,hits:[],notice:'尚未导入课程 JSONL 数据；没有真实课程命中，不能将默认文案当作倪师原话。'};
 const terms=normalizeTerms(input.terms);
 const xiao=input.mode==='xiaoliuren';
 const results:Hit[]=[];
 for(const e of db.entries){
  if(!e||typeof e.book!=='string')continue;
  const text=[e.h2,e.h3,e.quote,...(Array.isArray(e.terms)?e.terms:[])].join(' ');
  const matches=terms.filter(t=>text.includes(t));
  // The corpus files the relevant p25 teaching under the h2 title “六壬”,
  // not “小六壬”. Require an exact section heading so that “六神”,
  // “金钱卦”, “测字”, etc. cannot leak into this mode.
  const taggedXiao=[e.h2,e.h3].some(v=>/^(?:六壬|六壬法|小六壬|小六任|小六壬法)$/.test((v||'').trim()));
  const mentionedXiao=/小六壬|小六任/.test(text) && !/金钱卦|测字|六神|铁板/.test(`${e.h2} ${e.h3}`);
  const isXiao=/^10-/.test(e.book)&&(taggedXiao||mentionedXiao);
  // This is course-reference retrieval, not proof that a particular reading
  // (especially a three-number variant) is taught in the cited lesson.
  if(xiao&&!isXiao)continue;
  if(!xiao&&!/^(01-|02-|03-|04-|07-)/.test(e.book))continue;
  if(!matches.length && !(xiao&&isXiao))continue;
  const matchesText=matches.slice(0,4).join('、');
  const score=matches.length*10+(xiao?40: /^02-/.test(e.book)?5:0);
  results.push({
   id:e.id, book:e.book, heading:[e.h2,e.h3].filter(Boolean).join(' / ')||e.book,
   terms:matches,score,
   reason:matchesText?`材料文字命中：${matchesText}`:'《天纪》占断·六壬章节关联（需核对起课方法）',
   url:sourceUrl(e),
   ...(typeof e.quote==='string'?{quote:e.quote.slice(0,90)}:{})
  });
 }
 results.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 return {configured:true,source:db.source,license:db.license,count:db.count,hits:results.slice(0,8),
  notice:'仅为关键词检索结果，不代表该课例的完整适用条件已满足；请点击课程时间码人工核对。'};
}
