/**
 * Local, evidence-labelled Zi Wei Dou Shu double-chart study notes.
 * This module is ORIGINAL commentary, not a reproduction of Tian Ji transcripts.
 * No deterministic marriage score. No runtime API / account / DB access.
 */
export const TWELVE = ['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫'] as const;
export type GongName = typeof TWELVE[number];
export type Palace = { name:GongName; branch:string; stars:string[]; majors:string[]; four:string[] };
export type Finding = { title:string; evidence:string; reading:string; provenance:'课例对应'|'通行星曜象意'|'双盘比照' };
export type StudyReport = { a:Palace[]; b:Palace[]; findingsA:Finding[]; findingsB:Finding[]; cross:Finding[]; completeness:string[] };
const MAIN = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
const FOUR = ['化禄','化权','化科','化忌'];
const PALACE_KEYS = ['palaceName','gongName','name','type','palace','gong','title'];
const STAR_KEYS = ['majorStars','mainStars','mainStar','stars','major','zhuxing','主星','primaryStars','minorStars','auxiliaryStars','minor','auxStars','辅星','otherStars'];
const LEGAL_BRANCH = /^[子丑寅卯辰巳午未申酉戌亥]$/;
type Obj=Record<string,unknown>;
const obj=(v:unknown):v is Obj => !!v && typeof v==='object' && !Array.isArray(v);
const str=(v:unknown):string => typeof v==='string' ? v : (typeof v==='number'?String(v):obj(v) ? (['name','starName','label','title','value','text'].map(k=>v[k]).find(x=>typeof x==='string') as string || '') : '');
function normalizeName(s:string):GongName|undefined {
  const simple=s.replace(/\s+/g,'').replace(/宫位|宮位/g,'').replace(/宮/g,'宫');
  return TWELVE.find(n=>simple===n || simple===n.slice(0,-1) || simple.startsWith(`${n}（`));
}
function branchOf(v:Obj):string { return ['earthlyBranch','diZhi','dizhi','zhi','地支','branch'].map(k=>str(v[k])).find(s=>LEGAL_BRANCH.test(s)) || ''; }
function starsOf(v:Obj):string[] {
  const all:string[]=[];
  const put=(item:unknown)=>{
    const s=str(item);
    if(s && s.length<=26) all.push(s.replace(/\s+/g,''));
    if(obj(item)){
      for(const k of ['sihua','hua','transformation','fourTransformation']) {
        const m=str(item[k]);
        if(FOUR.some(x=>m.includes(x)) && s) all.push(`${s}${m}`);
      }
    }
  };
  for(const k of STAR_KEYS){ const x=v[k]; if(Array.isArray(x))x.forEach(put);else if(x!=null)put(x); }
  for(const k of ['sihua','fourTransformations','transformations','四化']) {
    const x=v[k]; if(Array.isArray(x)) x.forEach(put);else if(obj(x))Object.values(x).forEach(put);else if(x!=null)put(x);
  }
  return [...new Set(all)];
}
export function digestChart(chart:unknown):Palace[] {
  const found=new Map<GongName,Palace>();
  const seen=new WeakSet<object>();
  function walk(v:unknown,d:number,hint=''){
    if(d>7 || !v || typeof v!=='object'||seen.has(v))return;
    seen.add(v);
    if(Array.isArray(v)){ v.slice(0,100).forEach(x=>walk(x,d+1));return; }
    const raw=v as Obj;
    const name=PALACE_KEYS.map(k=>normalizeName(str(raw[k]))).find(Boolean) || normalizeName(hint);
    if(name){
      const stars=starsOf(raw);
      const majors=MAIN.filter(n=>stars.some(s=>s===n || s.startsWith(`${n}（`) || s.startsWith(`${n}(`) || s.startsWith(`${n}化`)));
      const four=FOUR.filter(x=>stars.some(s=>s.includes(x)));
      const current:Palace={name,branch:branchOf(raw),stars,majors,four};
      const prev=found.get(name);
      if(!prev || current.stars.length>prev.stars.length || (current.stars.length===prev.stars.length&&current.branch&&!prev.branch))found.set(name,current);
    }
    Object.entries(raw).forEach(([key,value])=>{if(value&&typeof value==='object')walk(value,d+1,key);});
  }
  walk(chart,0);
  return TWELVE.map(n=>found.get(n)).filter((p):p is Palace=>!!p);
}
const by=(palaces:Palace[],n:GongName)=>palaces.find(p=>p.name===n);
const evidence=(p:Palace|undefined)=>p?`${p.name}${p.branch?`·${p.branch}`:''}：${p.stars.length?p.stars.join('、'):'未提取到星曜字段'}`:'未识别宫位（不作推断）';
export function threeWay(n:GongName):GongName[] {
  const index=TWELVE.indexOf(n);
  return [index,(index+4)%12,(index+8)%12,(index+6)%12].map(i=>TWELVE[i]);
}
const SPOUSE_MEANING:Record<string,string>={
  '紫微':'重视主导权和彼此尊重，适合事先讨论家庭决策方式。',
  '天机':'沟通、变化与思考较受关注，可讨论计划调整与安全感。',
  '太阳':'责任、工作投入及主动照顾的议题突出，可协商时间分配。',
  '武曲':'务实、行动与金钱管理受到关注，应明确情感表达需求。',
  '天同':'温和、照顾与舒适感是讨论重点，也要留意回避冲突的情况。',
  '廉贞':'边界感、情绪张力和价值观协调是传统讨论重点。',
  '天府':'稳定、责任分工与生活安排是讨论重点。',
  '太阴':'细腻、情绪支持与家庭生活感受是讨论重点。',
  '贪狼':'社交、兴趣、自由度与承诺边界值得充分交流。',
  '巨门':'言语表达、理解误差和争议处理尤其需要关注。',
  '天相':'互相照应、公平感和规则一致性受到重视。',
  '天梁':'关怀、责任与双方意见差异之间的协调值得留意。',
  '七杀':'个人空间、决策效率与冲突处理方式值得明确。',
  '破军':'变化与节奏转换较突出，适合讨论调整与稳定的平衡。',
};
const CAUTION=['擎羊','陀罗','火星','铃星','地空','地劫'];
const LENS:Record<string,GongName[]>={
  '伴侣婚恋':['命宫','夫妻宫','福德宫','官禄宫','迁移宫'],
  '朋友相处':['命宫','福德宫','交友宫','迁移宫'],
  '合伙合作':['命宫','财帛宫','官禄宫','交友宫'],
  '亲子家人':['命宫','父母宫','子女宫','福德宫'],
};
function ownFindings(pp:Palace[],who:string,focus:string):Finding[]{
  const out:Finding[]=[];
  const anchors=LENS[focus]||LENS['伴侣婚恋'];
  const spouse=by(pp,'夫妻宫'),fude=by(pp,'福德宫');
  for(const gong of anchors){
    const p=by(pp,gong);
    if(!p) continue;
    out.push({title:`${who} · ${gong}盘面`, evidence:evidence(p), reading:`${gong}为本宫，建议结合其三方四正：${threeWay(gong).join('、')}。星曜和四化需合参，不因单个星作绝对断语。`,provenance:'课例对应'});
  }
  // 三方四正：实际汇总四宫而非只显示宫名，缺失时明确提示。
  for(const center of (focus==='伴侣婚恋'?['命宫','夫妻宫','福德宫']:['命宫']) as GongName[]){
    const positions=threeWay(center);
    const present=positions.map(n=>by(pp,n)).filter((x):x is Palace=>!!x);
    if(!present.length)continue;
    const hua=present.flatMap(p=>p.four.map(h=>`${p.name}${h}`));
    const sha=present.flatMap(p=>p.stars.filter(st=>CAUTION.some(c=>st===c||st.startsWith(`${c}（`))).map(st=>`${p.name}${st}`));
    out.push({title:`${who} · ${center}三方四正汇总`,evidence:present.map(evidence).join('；'),
      reading:`四宫包括${positions.join('、')}；本次实际提取${present.length}/4宫。${hua.length?`可见四化：${hua.join('、')}。`:'四化字段未能在这四宫明确提取，不判作“没有四化”。'}${sha.length?`可见传统煞曜：${sha.join('、')}，需要结合主星庙旺与整体配置。`:'尚未明确识别到煞曜，不等于现实中不存在压力。'}此处只显示证据，不设自动吉凶分数。`,provenance:'课例对应'});
  }
  if(focus==='伴侣婚恋'){
    if(spouse?.majors.includes('巨门')&&spouse.majors.includes('天同'))out.push({title:`${who} · 夫妻宫巨门与天同同见`,evidence:evidence(spouse),reading:'《天纪》案例笔记对这组星曜同时讨论沟通争执与感情照顾：不能只挑一种象意下结论，建议结合其他四宫核对。',provenance:'课例对应'});
    if(fude?.four.includes('化忌'))out.push({title:`${who} · 福德宫化忌`,evidence:evidence(fude),reading:'在课程案例中，福德宫及化忌被特别关注；但不能根据它断言夫妻生离死别。更可取的现实讨论是共同生活压力、支持网络和情绪沟通。',provenance:'课例对应'});
    for(const star of spouse?.majors||[]){
      out.push({title:`${who} · 夫妻宫${star}`,evidence:evidence(spouse),reading:SPOUSE_MEANING[star]||'结合其他星曜解释。',provenance:'通行星曜象意'});
    }
    if(spouse && spouse.majors.length===0)out.push({title:`${who} · 夫妻宫无主星`,evidence:evidence(spouse),reading:'不把空宫直接判作无缘或不婚；需看对宫官禄与迁移、福德等三方四正，辅星亦需一并参考。',provenance:'通行星曜象意'});
    if(fude)out.push({title:`${who} · 福德宫合看`,evidence:evidence(fude),reading:'《天纪》课例将福德宫作为婚姻议题的重要参照之一。这里仅描述盘面，不能据单宫断定关系结局。',provenance:'课例对应'});
  }
  for(const gong of anchors){
    const p=by(pp,gong);
    if(p?.four.length)out.push({title:`${who} · ${gong}的四化`,evidence:evidence(p),reading:`当前识别到${p.four.join('、')}；在课程案例中，科、权、禄、忌的落宫是合参要点。尚需检查星曜本体、庙旺落陷、宫位及三方四正，不能单独解释吉凶。`,provenance:'课例对应'});
  }
  return out;
}
function crossFindings(a:Palace[],b:Palace[],focus:string):Finding[]{
  const out:Finding[]=[];
  const aM=by(a,'命宫'),bM=by(b,'命宫'),aF=by(a,'夫妻宫'),bF=by(b,'夫妻宫');
  if(focus==='伴侣婚恋'){
    for(const [label,self,other] of [['甲方命宫 ↔ 乙方夫妻宫',aM,bF],['乙方命宫 ↔ 甲方夫妻宫',bM,aF]] as const){
      if(!self || !other)continue;
      const intersection=self.majors.filter(x=>other.majors.includes(x));
      out.push({title:label,evidence:`${evidence(self)}；${evidence(other)}`,reading:intersection.length?`双方可观察到相同主星：${intersection.join('、')}。这是一个用于讨论双方期待的线索，不能当作合婚吉凶分数。`:'未检测到同名主星；星曜不同不代表不合，建议分别讨论双方如何理解理想伴侣与亲密边界。',provenance:'双盘比照'});
    }
    for(const gong of ['夫妻宫','福德宫','官禄宫','迁移宫'] as GongName[]){
      const pa=by(a,gong),pb=by(b,gong);
      if(pa&&pb)out.push({title:`双方${gong}合看`,evidence:`甲：${evidence(pa)}；乙：${evidence(pb)}`,reading:gong==='夫妻宫'?'各自夫妻宫代表传统命理中“自己对关系的期待”，不能直接互换作对方命格。建议对照期待是否能够通过实际沟通协调。':gong==='福德宫'?'讨论情绪休息、压力调节和共同生活节奏，勿将命盘象意解释为必然的婚姻结果。':gong==='官禄宫'?'讨论事业投入与生活安排如何协调。':'讨论外出、环境变化、社交活动和独立空间。',provenance:'双盘比照'});
    }
  } else {
    for(const gong of LENS[focus]||LENS['朋友相处']){
      const pa=by(a,gong),pb=by(b,gong);
      if(pa&&pb)out.push({title:`双方${gong}对照`,evidence:`甲：${evidence(pa)}；乙：${evidence(pb)}`,reading:'作为彼此预期的讨论素材。实际相处效果需以具体沟通、约定和行动为准。',provenance:'双盘比照'});
    }
  }
  return out;
}
export function buildStudy(aChart:unknown,bChart:unknown,focus='伴侣婚恋'):StudyReport{
  const a=digestChart(aChart),b=digestChart(bChart);
  const completeness:string[]=[];
  for(const [who,chart] of [['甲方',a],['乙方',b]] as const){
    if(chart.length!==12)completeness.push(`${who}识别到${chart.length}/12宫；未识别宫位留空，不补造星曜。`);
    if(chart.some(p=>p.stars.length===0))completeness.push(`${who}有宫位未提取到星曜，请核对排盘字段。`);
    if(!chart.some(p=>p.four.length))completeness.push(`${who}没有识别到生年四化字段；不推断四化吉凶。`);
  }
  return {a,b,findingsA:ownFindings(a,'甲方',focus),findingsB:ownFindings(b,'乙方',focus),cross:crossFindings(a,b,focus),completeness};
}
