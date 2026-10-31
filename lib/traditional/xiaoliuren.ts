/** Traditional finger-counting study engine. Original notes, not a transcript. */
export const SIX = [
  { name:'大安',wuxing:'木',deity:'青龙',position:'食指下节',grade:'吉',image:'安稳、守成、平和',reading:'宜先安顿基础、稳住节奏；传统上以静守和耐心为主。',colour:'#2c8b73' },
  { name:'留连',wuxing:'水',deity:'玄武',position:'食指上节',grade:'偏阻',image:'牵绊、迟滞、反复',reading:'事情可能需要多次确认；现实中可检查沟通与流程环节。',colour:'#5280ad' },
  { name:'速喜',wuxing:'火',deity:'朱雀',position:'中指上节',grade:'吉',image:'消息、转机、较快进展',reading:'传统上偏向消息与迅速变化，仍应核实具体条件。',colour:'#bd792b' },
  { name:'赤口',wuxing:'金',deity:'白虎',position:'无名指上节',grade:'偏阻',image:'口舌、争议、误解',reading:'先核对事实，再讨论敏感问题；避免因措辞产生冲突。',colour:'#c0524d' },
  { name:'小吉',wuxing:'木',deity:'六合',position:'无名指下节',grade:'吉',image:'小成、协作、和合',reading:'关注细小进展和互相支持，避免将良好象意当作现实保证。',colour:'#268b85' },
  { name:'空亡',wuxing:'土',deity:'勾陈',position:'中指下节',grade:'偏阻',image:'未明、落空、暂缺条件',reading:'先补齐信息、确认资源；不可据此预测不可逆的结果。',colour:'#77778a' },
] as const;
export const HOURS=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const;
export type LeapMode='same'|'next';
export type ZiMode='same-day'|'next-day';
export type StartMode='daan'|'liulian';
export type Result={monthIndex:number;dayIndex:number;endIndex:number;stepValues:[number,number,number];steps:string[]};
export const norm=(n:number)=>((n%6)+6)%6;
/** Inclusive finger-counting: at the starting location the number 1 is counted. */
export function calculateTriple(x:number,y:number,z:number,start:StartMode='daan'):Result {
  if(![x,y,z].every(n=>Number.isSafeInteger(n)&&n>=1&&n<=1000000))throw new Error('三项均须为1至1000000的正整数');
  const first=norm((start==='daan'?0:1)+x-1);
  const second=norm(first+y-1);
  const third=norm(second+z-1);
  return {monthIndex:first,dayIndex:second,endIndex:third,stepValues:[x,y,z],steps:[
    `从${SIX[start==='daan'?0:1].name}数第${x}位，落${SIX[first].name}。`,
    `以${SIX[first].name}为第1位数${y}位，落${SIX[second].name}。`,
    `以${SIX[second].name}为第1位数${z}位，落${SIX[third].name}。`,
  ]};
}
/** 0:00-0:59 and 23:00-23:59 both correspond to 子; all else are two-hour blocks. */
export const hourIndex=(hour:number)=>Math.floor(((hour+1)%24)/2);
export function traditionalDate(month:number,day:number,clockHour:number,start:StartMode='daan'):Result{
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||day<1||day>30||!Number.isInteger(clockHour)||clockHour<0||clockHour>23)
    throw new Error('月为1–12，日为1–30，小时为0–23。');
  return calculateTriple(month,day,hourIndex(clockHour)+1,start);
}
export function displayReading(index:number,subject:string):string {
  const base=SIX[index].reading;
  const subjectNote:Record<string,string>={
    '感情沟通':'先对照双方说法和需要，避免把占课当成判断他人心意的证据。',
    '工作学业':'把准备、进度、外部反馈分别核对，下一步以能执行的事项为准。',
    '出行办事':'留意路线、时间、材料与实际天气交通状况。',
    '财务合作':'重点查看合同、预算、成本和风险，不以占课代替财务决定。',
    '一般事项':'结合现实信息做出安排；传统象意不具有验证未来的能力。',
  };
  return `${base}${subjectNote[subject]||subjectNote['一般事项']}`;
}
