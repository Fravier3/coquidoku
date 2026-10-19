const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class E{
 constructor(id=''){this.id=id;this.children=[];this.dataset={};this.style={setProperty(){}};this.attrs={};this.classList={add(){},remove(){},toggle(){}};this.open=false;this.textContent='';this.hidden=false}
 get firstElementChild(){return this.children[0]||null}
 append(...xs){for(const x of xs)this.children.push(...(x.fragment?x.children:[x]))}
 replaceChildren(...xs){this.children=[];this.append(...xs)}
 setAttribute(k,v){this.attrs[k]=v}addEventListener(){}querySelector(){return new E()}showModal(){this.open=true}close(){this.open=false}focus(){}
}
function boot(saved){
 const els=new Map(),themes=['leaf','night','garden'].map(t=>{const e=new E();e.dataset.pick=t;return e});
 const storage=saved?{'coquidoku-v1':JSON.stringify(saved)}:{};
 const ctx={console,Intl,Date,JSON,Math,Array,Number,String,Error,setTimeout:()=>1,clearTimeout(){},location:{reload(){}},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('puzzles.json','utf8'))}),document:{body:new E(),visibilityState:'visible',getElementById:id=>{if(!els.has(id))els.set(id,new E(id));return els.get(id)},createElement:()=>new E(),createTextNode:text=>({textContent:text}),createDocumentFragment:()=>{const e=new E();e.fragment=true;return e},querySelector:()=>new E(),querySelectorAll:s=>s==='[data-pick]'?themes:[],addEventListener(){}},window:{addEventListener(){}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);
 return {ctx,els,storage,run:s=>vm.runInContext(s,ctx)};
}
const settle=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const {ctx,els,storage,run}=boot();await settle();
 assert.equal(run('game.cells.length'),64);assert.equal(els.get('board').children.length,64);
 assert.equal(run('game.cells.every(x=>x===0)'),true);assert.equal(run('game.lives'),4);
 assert.equal(run('data.theme'),'night');assert.equal(ctx.document.body.dataset.theme,'night');
 assert.equal(els.get('hearts').textContent,'♥ ♥ ♥ ♥');assert.equal(els.get('hintLabel').textContent,'Pista (3/3)');
 const correct=run('puzzle().solution[0]');run(`play(${correct})`);
 const cell=els.get('board').children[correct],sprite=cell.firstElementChild;
 assert.ok(sprite);run("mode='mark';play((puzzle().solution[0]+1)%8)");
 assert.equal(els.get('board').children[correct],cell);assert.equal(cell.firstElementChild,sprite);
 run('render()');assert.equal(cell.firstElementChild,sprite);
 run("start(0);data.relax=false;mode='coqui'");
 const wrong=run('(puzzle().solution[0]+1)%8');
 for(let i=3;i>=0;i--){run(`play(${wrong})`);assert.equal(run('game.lives'),i)}
 const before=run('JSON.stringify(game.cells)');run('play(puzzle().solution[0])');assert.equal(run('JSON.stringify(game.cells)'),before);
 run('start(0)');assert.equal(run('game.lives'),4);
 for(let i=1;i<=3;i++){els.get('hintBtn').onclick();assert.equal(run('game.hints'),i);assert.equal(els.get('hintLabel').textContent,`Pista (${3-i}/3)`)}
 assert.equal(els.get('hintBtn').disabled,true);
 const hinted=run('game.cells.filter(x=>x===2).length');els.get('hintBtn').onclick();assert.equal(run('game.hints'),3);assert.equal(run('game.cells.filter(x=>x===2).length'),hinted);
 els.get('undoBtn').onclick();assert.equal(run('game.hints'),3);assert.equal(els.get('hintBtn').disabled,true);
 run('data.relax=true;render()');els.get('hintBtn').onclick();assert.equal(run('game.hints'),3);
 run("mode='coqui';for(let r=0;r<8;r++)if(game.cells[r*8+puzzle().solution[r]]!==2)play(r*8+puzzle().solution[r])");
 assert.equal(run('game.won'),true);assert.equal(run('data.completed.includes(game.level)'),true);
 run('start(1)');assert.equal(run('game.hints'),0);assert.equal(els.get('hintLabel').textContent,'Pista (3/3)');
 assert.equal(run('valid(game)'),true);assert.equal(run('valid({...game,cells:[0]})'),false);
 run("data.theme='garden';theme();save()");assert.equal(JSON.parse(storage['coquidoku-v1']).theme,'garden');
 const restored=boot(JSON.parse(storage['coquidoku-v1']));await settle();assert.equal(restored.run('data.theme'),'garden');assert.equal(restored.run('game.lives'),4);
 const saved=run('JSON.stringify(game)');await run('init()');assert.equal(run('JSON.stringify(game)'),saved);
 for(let v=0;v<8;v++){run(`start(0,true,${v*64})`);const p=run('puzzle()');assert.equal(new Set(p.solution).size,8);assert.equal(new Set(p.solution.map((c,r)=>p.regions[r*8+c])).size,8);for(let r=1;r<8;r++)assert.ok(Math.abs(p.solution[r]-p.solution[r-1])>1)}
 let prev='';for(let i=0;i<100;i++){run('start(0)');const sol=run("puzzle().solution.join(',')");assert.notEqual(sol,prev);assert.equal(run('game.cells.every(x=>x===0)'),true);prev=sol}
 run('start(0,true,12345)');const daily=run('JSON.stringify(puzzle())');run('start(0,true,12345)');assert.equal(run('JSON.stringify(puzzle())'),daily);
 const base=JSON.parse(fs.readFileSync('puzzles.json'))[0];
 const legacy={theme:'leaf',emptyStartV2:true,game:{puzzle:0,cells:Array(64).fill(0),fixed:[],lives:2,won:false,hints:1,daily:false}};legacy.game.cells[base.solution[0]]=2;
 const migrated=boot(legacy);await settle();assert.equal(migrated.run('data.theme'),'night');assert.equal(migrated.run('game.lives'),3);assert.equal(migrated.run('game.hints'),1);assert.equal(migrated.run('game.cells[puzzle().solution[0]]'),2);
 await migrated.run('init()');assert.equal(migrated.run('game.lives'),3);
 const untouched={game:{puzzle:0,cells:Array(64).fill(0),fixed:[base.solution[0]],lives:3,won:false,hints:0,daily:false}};untouched.game.cells[base.solution[0]]=2;
 const initial=boot(untouched);await settle();assert.equal(initial.run('game.cells.every(x=>x===0)'),true);assert.equal(initial.run('game.lives'),4);
 const capped=boot({...legacy,game:{...legacy.game,hints:5}});await settle();assert.equal(capped.run('game.hints'),3);assert.equal(capped.els.get('hintBtn').disabled,true);
 assert.ok(!fs.readFileSync('styles.css','utf8').includes('animation:pop'));
 console.log('PASS: immediate stable sprite nodes; four lives; three hints enforced including undo and relaxed mode; counters; reset; victory; saved theme; one-time migration preserves moves and mistakes.');
 console.log('PASS: empty starts; 100 randomized boards; eight transformations; stable daily and resumed game.');
})().catch(e=>{console.error(e);process.exitCode=1});
