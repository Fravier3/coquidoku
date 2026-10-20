const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function verifyAudio(path){
 const bytes=fs.readFileSync(path),events={};let online=false;
 const ctx={URL,Request,Response,Number,fetch:async()=>{online=true;return new Response(bytes)},caches:{match:async()=>new Response(bytes,{headers:{'Content-Type':'audio/mpeg'}})},self:{location:{origin:'https://fravier3.github.io'},addEventListener:(name,fn)=>events[name]=fn}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
 async function request(range){let promise;const req=new Request('https://fravier3.github.io/coquidoku/'+path,{headers:range?{Range:range}:{}});events.fetch({request:req,respondWith:r=>promise=r});return await promise}
 for(const [range,start,end] of [['bytes=0-1',0,1],['bytes=100-',100,bytes.length-1],['bytes=-50',bytes.length-50,bytes.length-1],['bytes=10-9999999',10,bytes.length-1]]){
  const r=await request(range);assert.equal(r.status,206);assert.equal(r.headers.get('content-type'),'audio/mpeg');assert.equal(r.headers.get('content-range'),`bytes ${start}-${end}/${bytes.length}`);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes.subarray(start,end+1));
 }
 for(const range of [`bytes=${bytes.length+100}-`,'bytes=20-10','bytes=-','bytes=0-1,4-5'])assert.equal((await request(range)).status,416);
 const full=await request();assert.equal(full.status,200);assert.deepEqual(Buffer.from(await full.arrayBuffer()),bytes);assert.equal(online,false);
}
(async()=>{
 await verifyAudio('assets/coqui-user.mp3');await verifyAudio('assets/map-aguinaldo.mp3');
 console.log('PASS: both MP3s served offline; Safari byte probe, open/suffix/clamped ranges, exact bytes and invalid ranges handled.');
})().catch(e=>{console.error(e);process.exitCode=1});
