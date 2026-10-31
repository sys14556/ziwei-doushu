/**
 * 双人合盘规则增强版（兼容原有 buildStudy / digestChart / threeWay 接口）
 *
 * 本文件输出可复核的传统文化研读笔记，不是命运、婚姻或心理状态的预测。
 * 规则来源标记为「通行星曜象意」或「双盘比照」；在没有准确课程条目 ID、
 * 时间码及原文核对之前，不把内容声明为倪海厦《天纪》原话。
 * 本地纯函数，无数据库 / 账户 / 网络访问。
 */
export const TWELVE = ['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫'] as const;
export type GongName = typeof TWELVE[number];
export type Palace = { name:GongName; branch:string; stars:string[]; majors:string[]; four:string[] };
export type Finding = {
  title:string;
  evidence:string;
  reading:string;
  provenance:'课例对应'|'通行星曜象意'|'双盘比照';
  /** 可选扩展字段；旧页面只使用上面四项，因此保持兼容 */
  ruleId?:string;
  confidence?:'结构已识别'|'字段不完整';
};
export type DeepTopic = {
  id:string;
  title:string;
  evidence:string[];
  observations:string[];
  interpretation:string;
  discussion:string[];
  limitations:string[];
};
export type StudyReport = {
  a:Palace[]; b:Palace[];
  findingsA:Finding[]; findingsB:Finding[]; cross:Finding[];
  completeness:string[];
  /** 深度专题可供后续单独的页面布局使用；不影响原 UI */
  topics?:DeepTopic[];
};

const MAIN = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'] as const;
const FOUR = ['化禄','化权','化科','化忌'] as const;
const CAUTION = ['擎羊','陀罗','火星','铃星','地空','地劫'] as const;
const PALACE_KEYS = ['palaceName','gongName','name','type','palace','gong','title'];
const STAR_KEYS = ['majorStars','mainStars','mainStar','stars','major','zhuxing','主星','primaryStars','minorStars','auxiliaryStars','minor','auxStars','辅星','otherStars'];
const FOUR_KEYS = ['sihua','fourTransformations','transformations','四化'];
const LEGAL_BRANCH = /^[子丑寅卯辰巳午未申酉戌亥]$/;
type Obj = Record<string,unknown>;
const isObj=(v:unknown):v is Obj=>!!v && typeof v==='object' && !Array.isArray(v);
const textOf=(v:unknown):string=>{
  if(typeof v==='string') return v;
  if(typeof v==='number') return String(v);
  if(isObj(v)){
    for(const k of ['name','starName','label','title','value','text','transformationName']){
      if(typeof v[k]==='string') return v[k] as string;
    }
  }
  return '';
};
function normalizeName(s:string):GongName|undefined {
  let t=s.replace(/\s+/g,'').replace(/宮/g,'宫').replace(/宫位/g,'宫');
  t=t.replace(/^事业宫$/,'官禄宫').replace(/^(奴仆|仆役)宫$/,'交友宫');
  return TWELVE.find(n=>t===n || t===n.slice(0,-1) || t.startsWith(`${n}（`) || t.startsWith(`${n}(`));
}
const branchOf=(v:Obj)=>['earthlyBranch','diZhi','dizhi','zhi','地支','branch'].map(k=>textOf(v[k])).find(s=>LEGAL_BRANCH.test(s))||'';

function starsOf(v:Obj):string[] {
  const all:string[]=[];
  const push=(raw:unknown)=>{
    const s=textOf(raw).replace(/\s+/g,'');
    if(s && s.length<=40)all.push(s);
    if(isObj(raw)){
      for(const key of ['sihua','hua','transformation','fourTransformation']){
        const t=textOf(raw[key]);
        if(s && FOUR.some(h=>t.includes(h)))all.push(`${s}${t}`);
      }
    }
  };
  for(const key of STAR_KEYS){
    const value=v[key];
    if(Array.isArray(value))value.forEach(push);
    else if(value!==undefined && value!==null)push(value);
  }
  for(const key of FOUR_KEYS){
    const value=v[key];
    if(Array.isArray(value))value.forEach(push);
    else if(isObj(value))Object.entries(value).forEach(([star,hua])=>{
      // 两种常见结构：{太阳:'化禄'} 或 {禄:'太阳'}
      const h=textOf(hua), k=star.replace(/^化?/,'');
      if(FOUR.some(x=>h.includes(x))) push(`${star}${h}`);
      else if(['禄','权','科','忌'].includes(k)&&h)push(`${h}化${k}`);
      else push(hua);
    });
    else if(value!==undefined && value!==null)push(value);
  }
  return [...new Set(all)];
}
function majorOf(stars:string[]):string[]{
  return MAIN.filter(star=>stars.some(s=>{
    if(!s.startsWith(star))return false;
    const next=s.slice(star.length);
    return !next || /^(星|庙|旺|得|利|平|陷|化|\(|（|\[|【)/.test(next);
  }));
}
export function digestChart(chart:unknown):Palace[] {
  const found=new Map<GongName,Palace>();
  const seen=new WeakSet<object>();
  function walk(value:unknown,depth:number,hint=''){
    if(depth>8 || !value || typeof value!=='object'|| seen.has(value))return;
    seen.add(value);
    if(Array.isArray(value)){
      value.slice(0,100).forEach(v=>walk(v,depth+1));return;
    }
    const raw=value as Obj;
    const name=PALACE_KEYS.map(k=>normalizeName(textOf(raw[k]))).find(Boolean)||normalizeName(hint);
    if(name){
      const stars=starsOf(raw);
      const current:Palace={
        name, branch:branchOf(raw), stars,
        majors:majorOf(stars),four:FOUR.filter(h=>stars.some(s=>s.includes(h)))
      };
      const prev=found.get(name);
      // 星曜较完整的原记录优先；避免空壳宫位覆盖有效宫位
      if(!prev || current.stars.length>prev.stars.length ||
         (current.stars.length===prev.stars.length && current.branch && !prev.branch))found.set(name,current);
    }
    Object.entries(raw).forEach(([k,v])=>{
      if(v && typeof v==='object')walk(v,depth+1,k);
    });
  }
  walk(chart,0);
  return TWELVE.map(n=>found.get(n)).filter((p):p is Palace=>!!p);
}
const by=(palaces:Palace[],name:GongName)=>palaces.find(p=>p.name===name);
const ev=(p:Palace|undefined)=>p?`${p.name}${p.branch?`·${p.branch}`:''}：${p.stars.length?p.stars.join('、'):'星曜字段未提取'}`:'该宫位尚未识别';
export function threeWay(name:GongName):GongName[]{
  const i=TWELVE.indexOf(name);
  return [i,(i+4)%12,(i+8)%12,(i+6)%12].map(j=>TWELVE[j]);
}
const LENS:Record<string,GongName[]>={
  '伴侣婚恋':['命宫','夫妻宫','福德宫','官禄宫','迁移宫'],
  '朋友相处':['命宫','福德宫','交友宫','迁移宫'],
  '合伙合作':['命宫','财帛宫','官禄宫','交友宫'],
  '亲子家人':['命宫','父母宫','子女宫','福德宫']
};
const STAR_THEMES:Record<string,{theme:string;counter:string;question:string}>={
  '紫微':{theme:'自主决策与相互尊重',counter:'注意决策权不必集中于一人',question:'重要选择由谁提出、谁最终决定？'},
  '天机':{theme:'计划、思考和变化节奏',counter:'注意想法变动时的信息同步',question:'计划改变时，如何及时告知对方？'},
  '太阳':{theme:'责任承担与主动支持',counter:'关注投入工作与陪伴时间之间的平衡',question:'双方如何分配工作与相处时间？'},
  '武曲':{theme:'务实、行动及资源管理',counter:'避免把解决问题等同于表达关心',question:'遇到压力，更希望获得行动帮助还是情绪支持？'},
  '天同':{theme:'舒适、关照和和谐氛围',counter:'需要讨论如何面对而不是回避分歧',question:'不同意时，怎样表达又不压抑自己？'},
  '廉贞':{theme:'边界意识、评价与情绪张力',counter:'避免由象意直接推断猜忌或背叛',question:'哪些相处边界双方需要提前约定？'},
  '天府':{theme:'稳定安排与长期责任',counter:'稳定规划也应允许灵活调整',question:'共同生活中哪些安排需要长期固定？'},
  '太阴':{theme:'细节关怀、情绪体验和家庭氛围',counter:'避免假设对方会自动理解未说出口的需要',question:'希望被怎样倾听、照顾与回应？'},
  '贪狼':{theme:'社交、兴趣与自主空间',counter:'兴趣自由和相互承诺需要协调',question:'怎样划分社交边界与各自独处时间？'},
  '巨门':{theme:'语言表达、解释与争议处理',counter:'口才和争论象意不能等同于现实冲突',question:'争执后如何确认双方真正理解了彼此？'},
  '天相':{theme:'公平、规则和互相照应',counter:'规则应由双方共同商议，而非单方面规定',question:'怎样判断家庭分工是否对双方公平？'},
  '天梁':{theme:'照顾、责任和经验差异',counter:'照顾不应变成替他人作决定',question:'帮助对方时，如何尊重其自主性？'},
  '七杀':{theme:'独立、效率与决策速度',counter:'行动果断与是否适合相处不能直接画等号',question:'一方想快做决定时如何给另一方思考空间？'},
  '破军':{theme:'变化、重整和生活调整',counter:'改变节奏需要与对方协商',question:'面对突发变化，两人优先保证什么？'}
};
const HUA_THEME:Record<string,string>={
  '化禄':'传统上常联系资源流入、关系投入或助力；不能直接等同于财务收益。',
  '化权':'传统上常联系推动力、主导和责任；适合讨论决定方式而非断定强势。',
  '化科':'传统上常联系声誉、表达和协调；应结合具体化曜与宫位核对。',
  '化忌':'传统上常联系阻滞、在意或牵挂；不能直接推断失败、疾病或分离。'
};
const hasCaution=(p:Palace)=>p.stars.filter(s=>CAUTION.some(x=>s===x||s.startsWith(`${x}（`)||s.startsWith(`${x}(`)));
function finding(title:string,evidence:string,reading:string,provenance:Finding['provenance'],ruleId:string,complete=true):Finding{
  return {title,evidence,reading,provenance,ruleId,confidence:complete?'结构已识别':'字段不完整'};
}
function ownFindings(palaces:Palace[],who:string,focus:string):Finding[]{
  const out:Finding[]=[];
  const anchors=LENS[focus]||LENS['伴侣婚恋'];
  for(const name of anchors){
    const p=by(palaces,name);
    if(!p)continue;
    const primary=p.majors.length?`识别到主星${p.majors.join('、')}`:'没有提取到主星（可能是空宫或字段不全）';
    const hua=p.four.length?`；四化标记：${p.four.join('、')}`:'；未提取到四化标记';
    out.push(finding(`${who} · ${name}盘面`,ev(p),
      `此处${primary}${hua}。本宫应结合${threeWay(name).join('、')}查看。下列说明仅作为传统文化的讨论线索，不据单一星曜断吉凶。`,
      '通行星曜象意',`OWN-${name}`,!!p.stars.length));
  }
  const centers=focus==='伴侣婚恋'?(['命宫','夫妻宫','福德宫'] as GongName[]):(['命宫'] as GongName[]);
  for(const center of centers){
    const names=threeWay(center);
    const present=names.map(n=>by(palaces,n)).filter((p):p is Palace=>!!p);
    if(!present.length)continue;
    const missing=names.filter(n=>!by(palaces,n));
    const hua=present.flatMap(p=>p.four.map(h=>`${p.name}${h}`));
    const sha=present.flatMap(p=>hasCaution(p).map(s=>`${p.name}${s}`));
    out.push(finding(`${who} · ${center}三方四正证据`,present.map(ev).join('；'),
      `本次实际获得${present.length}/4宫：${names.join('、')}。${missing.length?`缺失：${missing.join('、')}，因此不能给出完整四宫结论。`:'四宫均已识别。'}${hua.length?`可见四化${hua.join('、')}；`:'未能确认四化；'}${sha.length?`可见传统煞曜${sha.join('、')}；`:'未明确识别到传统煞曜；'}仍需逐宫考虑主星、四化及其他配置，不作自动婚姻分数。`,
      '通行星曜象意',`THREE-${center}`,missing.length===0 && present.every(p=>p.stars.length>0)));
  }
  if(focus==='伴侣婚恋'){
    const spouse=by(palaces,'夫妻宫'),fude=by(palaces,'福德宫');
    if(spouse){
      for(const star of spouse.majors){
        const t=STAR_THEMES[star];
        if(!t)continue;
        out.push(finding(`${who} · 夫妻宫${star}的讨论主题`,ev(spouse),
          `从传统星曜象意看，可讨论「${t.theme}」。${t.counter}。可具体问：${t.question} 这只是观察角度，不表示当事人必然具备某种性格。`,
          '通行星曜象意',`SPOUSE-${star}`));
      }
      if(!spouse.majors.length)out.push(finding(`${who} · 夫妻宫主星缺失`,ev(spouse),
        '当前未提取到主星，不可直接认定为传统意义上的空宫。只有排盘字段完整且确认为空宫时，才进一步对照其对宫官禄宫、三合迁移宫与福德宫。',
        '通行星曜象意','SPOUSE-NOMAJOR',false));
      if(spouse.majors.includes('巨门') && spouse.majors.includes('天同'))out.push(finding(
        `${who} · 夫妻宫天同、巨门同见`,ev(spouse),
        '同宫两曜可分别联系照顾/舒适与表达/争议主题。二者同时出现时，需要看实际沟通方式与关系需求；不能仅因一曜就推论争吵或幸福。当前没有核对到可以证明该组合断语的《天纪》具体时间码。',
        '通行星曜象意','PAIR-TONG-JUMEN'));
    }
    if(fude?.four.includes('化忌'))out.push(finding(`${who} · 福德宫化忌的条件项`,ev(fude),
      '当前宫位确有化忌标记。在传统语境下可讨论内在牵挂、压力应对与恢复节奏；但未确认具体化曜及四化体系时，不能进一步推出关系结局。',
      '通行星曜象意','FUDE-JI'));
  }
  for(const name of anchors){
    const p=by(palaces,name);
    if(!p?.four.length)continue;
    out.push(finding(`${who} · ${name}的四化观察`,ev(p),
      `${p.four.map(h=>`${h}：${HUA_THEME[h]}`).join(' ')}本次只能确认落宫有这些标记；若没有明确对应哪一颗星和属于哪一套四化，暂不判断飞化关系。`,
      '通行星曜象意',`HUA-${name}`));
  }
  return out;
}
const PAIR_THEMES: {id:string;title:string;names:[GongName,GongName];explain:string;question:string}[]=[
  {id:'SELF-EXPECT',title:'甲方自我表达与乙方伴侣期待',names:['命宫','夫妻宫'],explain:'对照一方命宫与另一方夫妻宫，是比较传统象意中的自我表达与理想伴侣描述，不是推断实际相处质量。',question:'乙方对伴侣的期待与甲方自述有哪些一致或不同？'},
  {id:'EXPECT-SELF',title:'乙方自我表达与甲方伴侣期待',names:['夫妻宫','命宫'],explain:'该对照与上一项方向相反，不能将双方角色完全互换，也不能以相同主星数量评定关系。',question:'甲方希望获得的支持与乙方通常采用的表达方式有何差别？'}
];
function crossFindings(a:Palace[],b:Palace[],focus:string):Finding[]{
  const out:Finding[]=[];
  if(focus==='伴侣婚恋'){
    for(const pair of PAIR_THEMES){
      const pa=by(a,pair.names[0]),pb=by(b,pair.names[1]);
      if(!pa||!pb)continue;
      const same=pa.majors.filter(s=>pb.majors.includes(s));
      out.push(finding(pair.title,`甲：${ev(pa)}；乙：${ev(pb)}`,
        `${same.length?`可见双方对应宫位的同名主星：${same.join('、')}。`:'当前没有观察到对应宫位的同名主星；这不意味着不适合。'}${pair.explain}可讨论：${pair.question}`,
        '双盘比照',`CROSS-${pair.id}`,!!pa.stars.length&&!!pb.stars.length));
    }
  }
  for(const name of (LENS[focus]||LENS['伴侣婚恋'])){
    const pa=by(a,name),pb=by(b,name);
    if(!pa||!pb)continue;
    const shared=pa.majors.filter(s=>pb.majors.includes(s));
    const ah=pa.four.length?pa.four.join('、'):'未提取';
    const bh=pb.four.length?pb.four.join('、'):'未提取';
    const discussion:Record<string,string>={
      '命宫':'各自如何自我表达，以及相处时如何尊重差异',
      '夫妻宫':'对关系期待、沟通、支持与边界的具体想法',
      '福德宫':'情绪休息、压力调节与共同生活节奏',
      '官禄宫':'事业安排、工作投入及家庭时间分配',
      '迁移宫':'外出、社交、环境变化和个人空间',
      '财帛宫':'日常开销、储蓄和重大支出的协商方式',
      '交友宫':'社交圈界限、朋友支持和共同活动',
      '父母宫':'与原生家庭互动的边界和节庆安排',
      '子女宫':'家庭照护期待及重要生活选择',
      '田宅宫':'居住安排与家务责任分配'
    };
    out.push(finding(`双方${name}证据对照`,`甲：${ev(pa)}；乙：${ev(pb)}`,
      `${shared.length?`同名主星${shared.join('、')}；`:'未观察到同名主星；'}甲方四化：${ah}；乙方四化：${bh}。该组宫位用于讨论${discussion[name]||'双方安排'}。异同只属于传统星曜结构，不代表现实中必然相合或相冲。`,
      '双盘比照',`CROSS-SAME-${name}`,!!pa.stars.length&&!!pb.stars.length));
  }
  return out;
}

const TOPIC_DEFS:{id:string;title:string;names:GongName[];angle:string;questions:string[]}[]=[
  {id:'expectations',title:'伴侣期待与表达',names:['命宫','夫妻宫'],angle:'观察双方表达习惯和对伴侣支持的期望之间可能值得讨论的差异。',questions:['哪些关心方式让双方最有安全感？','面对意见分歧时，哪些表达更容易被理解？']},
  {id:'communication',title:'沟通、争议与界限',names:['夫妻宫','交友宫'],angle:'观察与语言、边界及社交有关的传统象意；冲突处理仍需依据实际经历。',questions:['分歧发生时是否约定暂停和复盘？','对社交与个人空间有没有一致的界限？']},
  {id:'recovery',title:'情绪恢复与共同节奏',names:['福德宫','命宫'],angle:'观察福德、命宫相关信息，讨论双方休息与压力调节方式。',questions:['在压力下，各自更需要倾听、陪伴还是独处？','如何在忙碌时保持固定的沟通时间？']},
  {id:'career',title:'事业、时间与责任',names:['官禄宫','夫妻宫'],angle:'观察事业投入与亲密关系日程是否存在需要协调的主题。',questions:['工作高峰期谁承担家务和事务？','大额或长期决定如何共同参与？']},
  {id:'resources',title:'财务与生活安排',names:['财帛宫','田宅宫'],angle:'将资源使用、居住安排等作为可沟通的生活专题，而不从星曜推断真实财富。',questions:['共同支出与个人支出如何划分？','对住房、储蓄和紧急支出是否达成共识？']},
  {id:'family',title:'家庭支持与边界',names:['父母宫','子女宫','田宅宫'],angle:'关注双方对长辈相处、照顾与家庭责任的表达，而非预测亲属关系或子女情况。',questions:['与双方家庭交往的频率如何协商？','照护职责和隐私边界如何约定？']},
  {id:'mobility',title:'变化、外出与个人空间',names:['迁移宫','交友宫'],angle:'观察与外界互动、环境变化和自我空间有关的传统象意。',questions:['搬迁、旅行或工作变化如何共同决策？','怎样兼顾共同活动和各自兴趣？']},
];
/**
 * 解读是基于已识别星曜的传统象意对照，不是心理诊断或婚姻预测。
 * 《天纪》索引并不等于已验证的规则集。只有人工复核原课程后才能标作课程规则。
 */
const DOMAIN_LENS:Record<string,string>={
  expectations:'自我表达与对伴侣的期待', communication:'沟通分歧及社交边界',
  recovery:'压力恢复与休息方式',career:'事业投入和家庭责任',
  resources:'金钱分工与居住安排',family:'长辈、子女和照护边界',
  mobility:'外出变化、社交与独立空间'
};
/** 相同主星可以被讨论，不代表相似人格；不同主星也不代表关系不合。 */
function topicPerson(who:string, palaces:Palace[], names:GongName[]){
  const observations:string[]=[];
  const limits:string[]=[];
  const paragraphs:string[]=[];
  const evidence:string[]=[];
  for(const name of names){
    const p=by(palaces,name);
    if(!p){limits.push(`${who}${name}尚未解析，不能补造该宫的星曜与判断。`);continue;}
    evidence.push(`${who}：${ev(p)}`);
    if(!p.majors.length){
      limits.push(`${who}${name}当前没有识别到十四主星；可能是传统空宫，也可能来自排盘字段差异，必须核对原始盘面。`);
    }else{
      const use=p.majors.slice(0,3);
      const pieces=use.map(star=>{
        const val=STAR_THEMES[star];
        return val?`${star}常被用来讨论「${val.theme}」`:`${star}需要结合辅星、四化讨论`;
      });
      observations.push(`${who}${name}：${use.join('、')}；传统象意涉及${pieces.join('；')}。`);
      // 正文不是星曜定义的重复：加入本主题与宫位的条件。
      const context=name==='命宫'?'此处作为传统自我表达的观察点':
        name==='夫妻宫'?'此处作为传统伴侣期待与关系模式的观察点':
        name==='福德宫'?'此处作为传统内在感受与休息节奏的观察点':
        name==='官禄宫'?'此处作为工作、角色承担的观察点':
        name==='田宅宫'?'此处作为居住及日常生活安排的观察点':
        name==='财帛宫'?'此处作为资源使用的观察点':
        name==='交友宫'?'此处作为社交圈与外部支持的观察点':
        name==='迁移宫'?'此处作为环境变化与外出活动的观察点':
        name==='父母宫'?'此处作为家庭背景与长辈关系的观察点':
        name==='子女宫'?'此处作为照护议题及家庭期望的观察点':'此处作为相关传统宫位的观察点';
      paragraphs.push(`${who}${name}可见${use.join('、')}。${context}，${pieces.join('；')}。这一对应只是解读视角，不能用来推定当事人的真实性格或行为。`);
    }
    if(p.four.length){
      observations.push(`${who}${name}：已识别四化${p.four.join('、')}，但未确认是哪颗星化及属于何种四化体系。`);
    }else{
      limits.push(`${who}${name}尚未提取到可核对的四化，相关飞化判断暂不启用。`);
    }
    const sha=hasCaution(p);
    if(sha.length) observations.push(`${who}${name}还可见传统辅煞星${sha.join('、')}，不能据此直接断成败。`);
  }
  // 只保留少量最有信息量的段落；原始星曜证据已经完整显示在 evidence 中。
  const brief=paragraphs.slice(0,3);
  const lead=brief.length?brief.join(' '):`${who}本专题没有充分识别的主星组合，暂不能做个人化象意解释。`;
  return {evidence,observations,limits,lead};
}
function pairDetail(a:Palace[],b:Palace[],names:GongName[]):string[]{
  const analysis:string[]=[];
  for(const name of names){
    const pa=by(a,name),pb=by(b,name);
    if(!pa?.majors.length || !pb?.majors.length)continue;
    const same=pa.majors.filter(s=>pb.majors.includes(s));
    if(same.length){
      analysis.push(`${name}对照：双方已识别的主星都包含${same.join('、')}。这是传统象意的共同参照点，不意味着两人的感受、行为或需求必然相同。`);
    }else{
      const xa=pa.majors.slice(0,2).join('、'),xb=pb.majors.slice(0,2).join('、');
      analysis.push(`${name}对照：甲方以${xa}为已识别主星，乙方以${xb}为已识别主星。两种传统象意可能提供不同的讨论角度，不能据此判断关系优劣。`);
    }
  }
  return analysis.slice(0,2);
}
function themeContrast(a:Palace[],b:Palace[],names:GongName[],topic:string):string{
  const getTheme=(ps:Palace[])=>names.flatMap(n=>by(ps,n)?.majors||[])
    .filter((s,i,all)=>all.indexOf(s)===i).slice(0,3).map(s=>STAR_THEMES[s]?.theme).filter(Boolean);
  const av=getTheme(a),bv=getTheme(b);
  if(!av.length||!bv.length)return '部分宫位缺少可用主星，暂不推断双方是否相合；应先核对源盘。';
  return `在「${DOMAIN_LENS[topic]||'关系互动'}」方面，可将甲方盘面呈现的${av.join('、')}与乙方的${bv.join('、')}作主题对照。重点是核对现实中的需求与约定，而不是用星曜代替双方的实际选择。`;
}
function buildDeepTopics(a:Palace[],b:Palace[],focus:string):DeepTopic[]{
  const selected=focus==='伴侣婚恋'?TOPIC_DEFS:TOPIC_DEFS.filter(t=>
    focus==='朋友相处'?['communication','recovery','mobility'].includes(t.id):
    focus==='合伙合作'?['communication','career','resources','mobility'].includes(t.id):
    ['recovery','resources','family'].includes(t.id));
  return selected.map(t=>{
    const ap=topicPerson('甲方',a,t.names);
    const bp=topicPerson('乙方',b,t.names);
    const cross=pairDetail(a,b,t.names);
    const evidence=[...ap.evidence,...bp.evidence];
    const observations=[...ap.observations,...bp.observations,...cross];
    const limitations=[...ap.limits,...bp.limits];
    if(!evidence.length)limitations.push('该专题没有识别到任何相关宫位，暂不生成个人化断语。');
    const scope=`专题说明：${t.angle}星曜意象仅用于传统文化研读，不构成对性格、感情或未来结局的预测。`;
    const interpretation=[scope,`甲方分析：${ap.lead}`,`乙方分析：${bp.lead}`,
      `双方合参：${cross.join(' ')||'暂缺可比较的双方主星组合。'}${themeContrast(a,b,t.names,t.id)}`].join('\n\n');
    return {id:t.id,title:t.title,evidence,observations,interpretation,
      discussion:t.questions,limitations};
  });
}
export function buildStudy(aChart:unknown,bChart:unknown,focus='伴侣婚恋'):StudyReport{
  const a=digestChart(aChart),b=digestChart(bChart);
  const completeness:string[]=[];
  for(const [who,chart] of [['甲方',a],['乙方',b]] as const){
    if(chart.length!==12)completeness.push(`${who}识别到${chart.length}/12宫；未识别宫位不补造数据。`);
    if(chart.some(p=>p.stars.length===0))completeness.push(`${who}有宫位星曜字段未提取，不能据此确认空宫。`);
    if(!chart.some(p=>p.four.length))completeness.push(`${who}未识别到四化标记，不能断言原盘没有四化。`);
    if(chart.some(p=>!p.branch))completeness.push(`${who}部分宫位未识别地支，可能影响后续进阶规则。`);
  }
  completeness.push('未提供已核对的《天纪》逐条规则与课程时间码；本报告不冒称课程原话或倪海厦个人判断。');
  return {a,b,findingsA:ownFindings(a,'甲方',focus),findingsB:ownFindings(b,'乙方',focus),
    cross:crossFindings(a,b,focus),completeness,topics:buildDeepTopics(a,b,focus)};
}
