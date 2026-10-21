const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class E{
 constructor(id=''){this.id=id;this.children=[];this.dataset={};this.style={props:{},setProperty(k,v){this.props[k]=v}};this.attrs={};this.classList={add(){},remove(){},toggle(){}};this.open=false;this.textContent='';this.hidden=false}
 get firstElementChild(){return this.children[0]||null}
 append(...xs){for(const x of xs)this.children.push(...(x.fragment?x.children:[x]))}
 replaceChildren(...xs){this.children=[];this.append(...xs)}
 play(){this.playCount=(this.playCount||0)+1;this.paused=false;return Promise.resolve()}pause(){this.pauseCount=(this.pauseCount||0)+1;this.paused=true}
 getBoundingClientRect(){return {left:0,top:0,width:400,height:700}}setPointerCapture(id){this.capture=id}hasPointerCapture(id){return this.capture===id}releasePointerCapture(){this.capture=null}
 setAttribute(k,v){this.attrs[k]=v}addEventListener(type,callback){(this.listeners??={})[type]??=[];this.listeners[type].push(callback)}emit(type){for(const callback of this.listeners?.[type]||[])callback()}querySelector(){return new E()}showModal(){this.open=true}close(){this.open=false}focus(){this.focused=true}
}
function boot(saved,options={}){
 const els=new Map(),themes=['leaf','night','garden'].map(t=>{const e=new E();e.dataset.pick=t;return e});
 const storage=saved?{'coquidoku-v1':JSON.stringify(saved)}:{};
 const ctx={console,Intl,Date:options.Date||Date,JSON,Math,Array,Number,String,Error,setTimeout:options.setTimeout||(()=>1),clearTimeout:options.clearTimeout||(()=>{}),location:{reload(){}},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('puzzles.json','utf8')),arrayBuffer:async()=>new ArrayBuffer(16)}),document:{body:new E(),visibilityState:'visible',getElementById:id=>{if(!els.has(id))els.set(id,new E(id));return els.get(id)},createElement:()=>new E(),createTextNode:text=>({textContent:text}),createDocumentFragment:()=>{const e=new E();e.fragment=true;return e},querySelector:()=>new E(),querySelectorAll:s=>s==='[data-pick]'?themes:[],listeners:{},addEventListener(type,callback){(this.listeners[type]??=[]).push(callback)}},window:{addEventListener(){},...(options.window||{})}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);
 return {ctx,els,storage,run:s=>vm.runInContext(s,ctx)};
}
const settle=()=>new Promise(r=>setImmediate(r));


(async()=>{
 const app=boot({rulesV3:true,intro:true});await settle();const r=app.run,e=app.els;
 assert.equal(e.get('levels').open,true);assert.equal(r('game.cells.length'),64);assert.equal(r('game.cells.every(x=>x===0)'),true);
 assert.equal(r('game.lives'),4);assert.equal(r('data.theme'),'night');assert.equal(r('data.character'),null);
 assert.equal(r('COQUIS.length'),9);assert.equal(r('visibleCoquis().length'),8);assert.equal(r('babyUnlocked()'),false);
 for(const name of ['openBonus','buyCoqui','buyHearts','activateProtection','recordFlowerGuess'])assert.equal(r('typeof '+name),'undefined');
 for(const key of ['points','shields','purchased','bonusClaims','bonusPending','bonusCounter'])assert.equal(r(`Object.hasOwn(data,'${key}')`),false);
 const html=fs.readFileSync('index.html','utf8');assert.ok(!/minijuego|puntos|comprar|protección/i.test(html));
 for(const id of ['bonus','purchase','boosterRow','buyOneHeart','buyTwoHearts','resultBonusBtn'])assert.ok(!html.includes('id="'+id+'"'));
 r('closeMap()');
 const correct=r('puzzle().solution[0]');r(`play(${correct})`);
 const cell=e.get('board').children[correct],sprite=cell.firstElementChild;
 r("mode='mark';play((puzzle().solution[0]+1)%8);render()");assert.equal(e.get('board').children[correct],cell);assert.equal(cell.firstElementChild,sprite);
 r("start(0);mode='coqui'");const wrong=r('(puzzle().solution[0]+1)%8');
 for(let i=3;i>=0;i--){r(`play(${wrong})`);assert.equal(r('game.lives'),i)}
 const exhausted=r('JSON.stringify(game.cells)');r('play(puzzle().solution[0])');assert.equal(r('JSON.stringify(game.cells)'),exhausted);
 r('lost()');assert.equal(e.get('defeat').open,true);const puzzleBefore=r('JSON.stringify(puzzle())');
 e.get('retryLevelBtn').onclick();assert.equal(r('game.lives'),4);assert.equal(r('game.hints'),0);assert.equal(r('JSON.stringify(puzzle())'),puzzleBefore);assert.equal(r('game.cells.every(x=>x===0)'),true);
 for(let n=1;n<=3;n++){e.get('hintBtn').onclick();assert.equal(r('game.hints'),n)}const hinted=r('game.cells.filter(x=>x===2).length');e.get('hintBtn').onclick();assert.equal(r('game.cells.filter(x=>x===2).length'),hinted);e.get('undoBtn').onclick();assert.equal(r('game.hints'),3);
 let prev='';for(let n=0;n<100;n++){r('start(0)');const next=r("puzzle().solution.join(',')");assert.notEqual(next,prev);prev=next}
 r('start(0,true,12345)');const daily=r('JSON.stringify(puzzle())');r('start(0,true,12345)');assert.equal(r('JSON.stringify(puzzle())'),daily);
 for(let n=0;n<=60;n++){
  r(`data.completed=Array.from({length:${n}},(_,i)=>i);mapChapter=Math.floor(Math.min(${n},59)/10);renderCollection();renderMap()`);
  const count=[0,5,10,20,35,50,55,60].filter(at=>n>=at).length;assert.equal(r('progression().unlocked.length'),count);
  assert.equal(r('visibleCoquis().some(c=>c.id==="borinbiano")'),false);
  assert.equal(e.get('coquiCards').children.length,9);assert.ok(!e.get('nextCoqui').textContent.includes('Borinbiano'));
  const mystery=e.get('coquiCards').children.at(-1);assert.equal(mystery.className,'coqui-card mystery-card');assert.equal(mystery.children[0].firstElementChild.src,'assets/coqui.webp');assert.equal(mystery.children[1].textContent,'Personaje bonus');assert.ok(mystery.children[2].textContent.includes('24 horas'));assert.ok(!mystery.children.some(c=>c.textContent.includes('Borinbiano')));assert.equal(r("chooseCoqui('borinbiano')"),false);
  const nodes=e.get('adventureMap').children[0].children.filter(c=>c.dataset.level!==undefined);assert.equal(nodes.length,10);
  assert.equal(nodes.filter(c=>c.dataset.state==='current').length,n===60?0:1);
  for(const node of nodes){const level=Number(node.dataset.level);assert.equal(node.dataset.state,n===60||level<n?'done':level===n?'current':'locked')}
 }
 assert.equal(r("unlockedCoqui(COQUIS.find(c=>c.id==='colombiana'))"),true);assert.equal(r('babyUnlocked()'),false);
 // No extra screen after winning; normal and daily wins do not create currency.
 r("data.completed=[];data.dailyWins=[];data.family={pairedAt:0,bornAt:0,announced:false};start(0);for(let row=0;row<8;row++)play(row*8+puzzle().solution[row])");
 assert.equal(r('game.won'),true);assert.equal(e.get('result').open,true);assert.equal(r('data.completed.length'),1);
 e.get('nextBtn').onclick();assert.equal(e.get('levels').open,true);
 const boardSaved=JSON.parse(app.storage['coquidoku-v1']);
 const legacy=boot({...boardSaved,character:'aurora',earned:[],purchased:['aurora','colombiana','borinbiano'],points:1000,shields:2,bonusPending:'round:5',yunqueV1:true,forestCoordinates:{aurora:{x:42,y:68}}});await settle();
 assert.equal(legacy.run('data.character'),'aurora');assert.equal(legacy.run("unlockedCoqui(COQUIS.find(c=>c.id==='aurora'))"),true);
 assert.equal(legacy.run("unlockedCoqui(COQUIS.find(c=>c.id==='colombiana'))"),false);assert.equal(legacy.run('babyUnlocked()'),false);
 assert.equal(legacy.run('data.forestCoordinates.aurora.x'),42);assert.equal(legacy.run('JSON.stringify(game.cells)'),JSON.stringify(boardSaved.game.cells));
 for(const key of ['points','shields','purchased','bonusPending'])assert.equal(Object.hasOwn(JSON.parse(legacy.storage['coquidoku-v1']),key),false);
 console.log('PASS: stable board sprites, randomized/daily boards, 4-life lockout and same-board restart, 3 hints; all 61 map states; eight level unlocks; no economy or minigames; legacy purchased friends and progress preserved.');

 // The family deadline uses the wall clock, never session duration or daily challenges.
 let now=1800000000000;class RealDate extends Date{static now(){return now}}
 const partial=boot({intro:true,completed:Array.from({length:59},(_,i)=>i),dailyWins:Array.from({length:50},(_,i)=>i)},{Date:RealDate});await settle();
 assert.equal(partial.run('data.family.pairedAt'),0);assert.equal(partial.run('babyUnlocked()'),false);
 const family=boot({intro:true,completed:Array.from({length:59},(_,i)=>i)},{Date:RealDate});await settle();const fr=family.run,fe=family.els;
 fr("closeMap();start(59);for(let row=0;row<8;row++)play(row*8+puzzle().solution[row])");
 assert.equal(fr('data.completed.length'),60);assert.equal(fr('data.family.pairedAt'),now);const paired=now,deadline=now+86400000;
 assert.equal(fr('progression().unlocked.length'),8);assert.equal(fr('babyUnlocked()'),false);
 fr("openCollection();renderCollection()");assert.equal(fe.get('coquiCards').children.length,9);assert.equal(fe.get('mapRestartAdventure').hidden,true);
 const parentsSave=JSON.parse(family.storage['coquidoku-v1']);
 now=deadline-1;
 const before=boot(parentsSave,{Date:RealDate});await settle();const br=before.run,be=before.els;
 br('closeMap();openForest()');assert.equal(br('data.family.pairedAt'),paired);assert.equal(br('babyUnlocked()'),false);assert.equal(be.get('forestResidents').children.length,8);
 const parentX=br("ecosystem.find(s=>s.id==='colombiana').position.x");assert.equal(parentX,53);
 now=deadline;br('tickResidentCare(Date.now(),true)');
 assert.equal(br('babyUnlocked()'),true);assert.equal(br('data.family.bornAt'),deadline);assert.equal(be.get('forestResidents').children.length,9);
 assert.equal(be.get('familyFinale').open,true);assert.equal(br('data.family.announced'),true);assert.equal(be.get('forestAmbience').paused,true);
 const baby=br("ecosystem.find(s=>s.id==='borinbiano').id");assert.equal(baby,'borinbiano');
 assert.ok(be.get('forestResidents').children[8].className.includes('baby-resident'));
 br("renderCollection()");assert.equal(be.get('coquiCards').children.length,9);assert.ok(!be.get('coquiCards').children.at(-1).className.includes('mystery-card'));assert.equal(be.get('coquiCards').children.at(-1).children[1].textContent,'Borinbiano');assert.equal(br("chooseCoqui('borinbiano')"),true);
 br("start(59);for(let row=0;row<8;row++)play(row*8+puzzle().solution[row])");assert.ok(!be.get('resultText').textContent.includes('Vuelve mañana'));assert.equal(br('data.family.bornAt'),deadline);be.get('result').close();
 be.get('familyFinale').close();be.get('familyFinale').emit('close');br('closeForest();openForest()');assert.equal(be.get('familyFinale').open,false);
 assert.equal(br('data.family.bornAt'),deadline);assert.equal(be.get('restartAdventureBtn').hidden,false);
 const bornSave=JSON.parse(before.storage['coquidoku-v1']);
 now+=2*86400000;
 const after=boot(bornSave,{Date:RealDate});await settle();after.run('closeMap();openForest()');assert.equal(after.run('data.family.bornAt'),deadline);assert.equal(after.els.get('forestResidents').children.length,9);assert.equal(after.els.get('familyFinale').open,false);
 // A whole day away before the first reveal still produces exactly one baby and one announcement.
 const offline=boot(parentsSave,{Date:RealDate});await settle();offline.run('closeMap();openForest()');assert.equal(offline.run('babyUnlocked()'),true);assert.equal(offline.els.get('familyFinale').open,true);assert.equal(offline.run('data.family.bornAt'),deadline);
 assert.equal(offline.run("progression().unlocked.filter(c=>c.id==='borinbiano').length"),1);
 // Cancelling reset leaves everything intact; only the explicit confirm erases this adventure.
 be.get('restartAdventureBtn').onclick();assert.equal(be.get('restartAdventure').open,true);const retained=br('data.completed.length');
 be.get('restartAdventure').close();assert.equal(br('data.completed.length'),retained);
 br('data.sound=false;data.motion=true');be.get('restartAdventureBtn').onclick();be.get('confirmRestartAdventure').onclick();
 assert.equal(br('data.completed.length'),0);assert.equal(br('data.family.pairedAt'),0);assert.equal(br('data.family.bornAt'),0);assert.equal(br('data.family.announced'),false);
 assert.equal(br('progression().unlocked.length'),1);assert.equal(br('game.level'),0);assert.equal(br('game.cells.every(v=>v===0)'),true);assert.equal(br('data.sound'),false);assert.equal(br('data.motion'),true);
 assert.equal(be.get('levels').open,true);assert.equal(be.get('familyFinale').open,false);assert.equal(br('Object.keys(data.care).length'),0);assert.equal(br('restartAdventure()'),false);
 console.log('PASS: Colombiana at 55 and Boricua at 60; secret baby absent before 24h; exact deadline in-session and across reload/offline; one persistent baby and one finale; continued care and confirmed optional restart.');

 // All nine characters can sleep using real deadlines, including the new sleeping sprites.
 const pets=boot(bornSave,{Date:RealDate});await settle();const pr=pets.run,pe=pets.els;pr('closeMap();openForest();Math.random=()=>.5');
 for(const id of pr('COQUIS.map(c=>c.id)')){
  pr(`data.care['${id}'].nextSleepAt=Date.now()-1`);assert.equal(pr(`putResidentToSleep('${id}')`),true);
  assert.equal(pr(`data.care['${id}'].sleepUntil`),now+20*60000);assert.equal(pr(`feedResident('${id}','worm')`),null);
 }
 assert.ok(pe.get('forestResidents').children.every(b=>b.firstElementChild.src.endsWith('-sleep.webp')));
 const sleepSave=JSON.parse(pets.storage['coquidoku-v1']);now+=15*60000;
 const sleeping=boot(sleepSave,{Date:RealDate});await settle();sleeping.run('closeMap();openForest()');assert.equal(sleeping.run('ecosystem.every(s=>residentIsSleeping(s.id))'),true);
 now+=5*60000;sleeping.run('tickResidentCare(Date.now(),true)');assert.equal(sleeping.run('ecosystem.some(s=>residentIsSleeping(s.id))'),false);
 const food=boot({intro:true},{Date:RealDate});await settle();const qr=food.run,qe=food.els;qr('closeMap();openForest();Math.random=()=>.5');
 for(const reduced of [false,true])for(const [id,type]of [['foodFly','fly'],['foodButterfly','butterfly'],['foodWorm','worm'],['foodAnt','ant']]){
  qr(`insects=[];data.motion=${reduced};data.care.sol.satiety=10;data.care.sol.nextSleepAt=Date.now()+3600000;renderForest();ecosystem[0].position={x:50,y:70}`);
  qe.get(id).onclick();for(const click of qe.get('forestScene').listeners.click)click({target:{closest:()=>null},clientX:200,clientY:490});
  assert.equal(qr('insects.length'),3);assert.equal(qr(`insects.every(b=>b.type==='${type}'&&b.owner==='sol')`),true);
  assert.equal(qr('data.care.sol.satiety'),10);const source=qr(`FOREST_FOODS.${type}.src`);assert.ok(qe.get('forestFood').children.every(img=>img.src===source));
  const t0=qr('forestClock');for(let t=t0;t<=t0+12000;t+=50)qr(`updateEcosystem(${t})`);
  assert.equal(qr('insects.length'),0);assert.ok(qr('data.care.sol.satiety')>10);
 }
 qr("data.motion=false;insects=[];renderForest();updateEcosystem(200000);updateEcosystem(200800);updateEcosystem(201250)");
 assert.equal(qe.get('forestResidents').children[0].style.props['--hop-y'],'-36px');
 assert.equal(qe.get('forestResidents').children[0].children[1],qe.get('forestResidents').children[0].careBar);
 qr("data.behaviors.sol='rest';updateEcosystem(201300)");assert.equal(qe.get('forestResidents').children[0].style.props['--hop-y'],'0px');
 qr("data.behaviors.sol='explore';data.care.sol.satiety=20;Math.random=()=>.01");assert.equal(qr("feedResident('sol','ant').after"),100);
 console.log('PASS: all nine residents with persistent 20-minute sleep across reload, automatic waking, sleepy sprites, four food pickers and consumption in normal/reduced motion; care bars travel with hops.');

 // Map and scene audio remain isolated, and Comenzar never traps the user on a media failure.
 const audio=boot({intro:true});await settle();const ar=audio.run,ae=audio.els;
 assert.equal(ae.get('mapMusic').paused,false);ar('selectMapLevel(0)');assert.equal(ae.get('mapMusic').paused,true);
 ar('openForest()');await settle();assert.equal(ae.get('forestAmbience').paused,false);
 ar('closeForest()');ar('openMap()');await settle();assert.equal(ae.get('forestAmbience').paused,true);assert.equal(ae.get('mapMusic').paused,false);
 ae.get('mapMusicBtn').onclick();assert.equal(ar('data.mapMusic'),false);assert.equal(ae.get('mapMusic').paused,true);
 const blocked=boot({intro:true}),track=blocked.els.get('mapMusic');track.play=()=>Promise.reject(new Error('blocked'));await settle();
 assert.equal(blocked.els.get('mapAudioGate').hidden,false);blocked.els.get('mapEnterMusic').onclick();await settle();assert.equal(blocked.els.get('mapAudioGate').hidden,true);
 assert.ok(html.includes('class="primary">Comenzar</button>'));assert.ok(!html.includes('mapEnterSilent'));
 ar("closeMap();data.sound=true;chirp()");assert.equal(ae.get('boardCoquiAudio').paused,false);ae.get('boardMusicBtn').onclick();assert.equal(ar('data.sound'),false);assert.equal(ae.get('boardCoquiAudio').paused,true);assert.equal(ae.get('boardMusic').paused,true);
 console.log('PASS: map-first and scene-owned music; one-button trusted entry and unavailable media recovery; board mute stops music and effects.');
})().catch(error=>{console.error(error);process.exit(1)});
