#!/usr/bin/env node
/**
 * Import a LOCAL, user-obtained Tian Ji JSONL corpus.
 * No protected text is distributed with this integration package.
 * The source uses CC BY-NC-SA 4.0 for data/docs; verify your intended use.
 *
 * node scripts/import-tianji.mjs <path/to/entries.jsonl> [--include-quotes] [--acknowledge-license]
 *
 * By default, output only topic metadata and source references. To include
 * original quotation text, explicit licensing acknowledgement is required.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SOURCE = 'https://github.com/Renhuai123/nihai-tianji-corpus';
const input = process.argv[2];
const includeQuotes = process.argv.includes('--include-quotes');
const licenseAck = process.argv.includes('--acknowledge-license');
if (!input || input.startsWith('--')) {
 console.error('用法: node scripts/import-tianji.mjs <下载的entries.jsonl> [--include-quotes --acknowledge-license]');
 process.exit(1);
}
if(includeQuotes && !licenseAck) {
 console.error('拒绝嵌入原文：须先确认署名、非商业及相同方式共享许可，再加 --acknowledge-license');
 process.exit(1);
}
const sourceText = fs.readFileSync(path.resolve(input),'utf8');
const MAIN = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
const PALACES = ['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫'];
const HUAS = ['化禄','化权','化科','化忌'];
const XIAO = ['小六壬','小六任','大安','留连','流连','速喜','赤口','小吉','空亡'];
const TAGS = [...new Set([...MAIN,...PALACES,...HUAS,...XIAO,'三方四正','合婚','婚姻','夫妻','择偶','借星'])];
const data=[];
let bad=0;
for(const [i,line] of sourceText.split(/\r?\n/).entries()) {
 if(!line.trim())continue;
 try {
  const v=JSON.parse(line);
  if(typeof v!=='object'||!v||Array.isArray(v)) {bad++;continue;}
  const quote=typeof v.quote==='string'?v.quote.trim():'';
  const book=typeof v.book==='string'?v.book:'';
  const h2=typeof v.h2==='string'?v.h2:'';
  const h3=typeof v.h3==='string'?v.h3:'';
  const time=typeof v.t_hms==='string'?v.t_hms:'';
  const bvid=typeof v.bvid==='string'&&/^BV[A-Za-z0-9]{10}$/.test(v.bvid)?v.bvid:'';
  const part=Number.isInteger(v.part)&&v.part>0&&v.part<10000?v.part:undefined;
  const section=Number.isInteger(v.section)&&v.section>=0?v.section:undefined;
  const text=[book,h2,h3,quote].join(' ');
  const terms=TAGS.filter(t=>text.includes(t));
  if(!quote&&!h2&&!h3){bad++;continue;}
  const id=crypto.createHash('sha256').update(`${book}/${h2}/${h3}/${i}/${quote}`).digest('hex').slice(0,16);
  const entry={id,book,h2,h3,terms,bvid,part,section,t_hms:time};
  if(includeQuotes)entry.quote=quote;
  data.push(entry);
 } catch(e){bad++;}
}
const output=path.resolve(process.cwd(),'data/tianji/index.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({
 schema:1,
 source:SOURCE,
 license:'CC BY-NC-SA 4.0 (data/docs); underlying course rights retained by holders',
 mode:includeQuotes?'quotes':'references',
 generatedAt:new Date().toISOString(),
 count:data.length,
 entries:data
},null,2),'utf8');
console.log(`生成 ${output}; 成功${data.length}条, 跳过${bad}行；模式${includeQuotes?'引用短文（需合规）':'纯出处索引'}`);
