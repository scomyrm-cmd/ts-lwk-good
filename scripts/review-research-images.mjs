import sharp from 'sharp';
import fs from 'node:fs/promises';
const root=process.argv[2];
if(!root)throw Error('Pass the scratch audit directory');
const audit=JSON.parse(await fs.readFile(root+'/audit.json','utf8'));
const valid=[];
for(const item of audit.filter(r=>r.type==='image'&&r.retrieval==='retrieved')){
 try{
  const buffer=await fs.readFile(`${root}/${item.id}.raw`);const meta=await sharp(buffer).metadata();
  const data=await sharp(buffer).resize(8,8,{fit:'fill'}).greyscale().raw().toBuffer();const avg=data.reduce((a,b)=>a+b,0)/data.length;
  Object.assign(item,{width:meta.width,height:meta.height,format:meta.format,visualHash:[...data].map(x=>x>avg?'1':'0').join('')});
  valid.push(item);
 }catch{item.retrieval='not-an-image';}
}
const perPage=24;
for(let p=0;process.argv.includes('--contact-sheets') && p<Math.ceil(valid.length/perPage);p++){
 const rows=valid.slice(p*perPage,(p+1)*perPage);const composites=[];
 for(const [i,item] of rows.entries()){
  const image=await sharp(`${root}/${item.id}.raw`).resize(260,160,{fit:'contain',background:'#eeeeee'}).png().toBuffer();
  composites.push({input:image,left:(i%4)*280+10,top:Math.floor(i/4)*195+30});
  const label=Buffer.from(`<svg width="270" height="24"><text x="4" y="18" font-family="sans-serif" font-size="16">${item.id} · ${item.width} × ${item.height}</text></svg>`);
  composites.push({input:label,left:(i%4)*280+5,top:Math.floor(i/4)*195+2});
 }
 await sharp({create:{width:1120,height:Math.ceil(rows.length/4)*195,channels:3,background:'#ffffff'}}).composite(composites).png().toFile(`${root}/contact-${p+1}.png`);
}
await fs.writeFile(root+'/audit.json',JSON.stringify(audit,null,2));
console.log(JSON.stringify({images:valid.map(i=>({id:i.id,size:[i.width,i.height],type:i.format})),identical:valid.flatMap((a,i)=>valid.slice(i+1).filter(b=>a.sha256===b.sha256).map(b=>[a.id,b.id]))}));
