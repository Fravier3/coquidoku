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
 saved={adventure30V1:true,...saved};
 const els=new Map(),themes=['leaf','night','garden'].map(t=>{const e=new E();e.dataset.pick=t;return e});
 const storage=saved?{'coquidoku-v1':JSON.stringify(saved)}:{};
 const ctx={console,Intl,Date:options.Date||Date,JSON,Math,Array,Number,String,Error,setTimeout:options.setTimeout||(()=>1),clearTimeout:options.clearTimeout||(()=>{}),location:{reload(){}},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('puzzles.json','utf8')),arrayBuffer:async()=>new ArrayBuffer(16)}),document:{body:new E(),visibilityState:'visible',getElementById:id=>{if(!els.has(id))els.set(id,new E(id));return els.get(id)},createElement:()=>new E(),createTextNode:text=>({textContent:text}),createDocumentFragment:()=>{const e=new E();e.fragment=true;return e},querySelector:()=>new E(),querySelectorAll:s=>s==='[data-pick]'?themes:[],listeners:{},addEventListener(type,callback){(this.listeners[type]??=[]).push(callback)}},window:{addEventListener(){},...(options.window||{})}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('variants.js','utf8'),ctx);vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);
 vm.runInContext(`function completeTestBoard(){if(isVariant()){game.challenge=game.kind==='road'?{rotations:Array(25).fill(0),route:[]}:{route:V.spec(game.level).solution.slice(),rotations:[]};finish()}else for(let row=0;row<8;row++)play(row*8+puzzle().solution[row])}`,ctx);
 return {ctx,els,storage,run:s=>vm.runInContext(s,ctx)};
}
const settle=()=>new Promise(r=>setImmediate(r));


(async()=>{
 const app=boot({rulesV3:true,intro:true});await settle();const r=app.run,e=app.els;
 assert.equal(e.get('levels').open,true);assert.equal(r('game.cells.length'),64);assert.equal(r('game.fixed.length===1&&game.cells.filter(x=>x===2).length===1&&game.cells[game.fixed[0]]===2'),true);
 assert.equal(r('game.lives'),3);assert.equal(r('data.theme'),'night');assert.equal(r('data.character'),null);
 assert.equal(e.get('progress').textContent,'0/7 coquíes');assert.equal(e.get('extraOptions').hidden,true);assert.equal(e.get('moreOptionsBtn').attrs['aria-expanded'],'false');e.get('moreOptionsBtn').onclick();assert.equal(e.get('extraOptions').hidden,false);assert.equal(e.get('moreOptionsBtn').textContent,'Ver menos');e.get('moreOptionsBtn').onclick();assert.equal(e.get('extraOptions').hidden,true);
 assert.equal(r('COQUIS.length'),9);assert.equal(r('visibleCoquis().length'),8);assert.equal(r('babyUnlocked()'),false);
 for(const name of ['openBonus','buyCoqui','buyHearts','activateProtection','recordFlowerGuess'])assert.equal(r('typeof '+name),'undefined');
 for(const key of ['points','shields','purchased','bonusClaims','bonusPending','bonusCounter'])assert.equal(r(`Object.hasOwn(data,'${key}')`),false);
 const html=fs.readFileSync('index.html','utf8');assert.ok(!/minijuego|monedas|comprar|protección/i.test(html));
 for(const id of ['bonus','purchase','boosterRow','buyOneHeart','buyTwoHearts','resultBonusBtn'])assert.ok(!html.includes('id="'+id+'"'));
 r('closeMap()');
 const correct=r('puzzle().solution[0]');r(`play(${correct})`);
 const cell=e.get('board').children[correct],sprite=cell.firstElementChild;
 r("mode='mark';play((puzzle().solution[0]+1)%8);render()");assert.equal(e.get('board').children[correct],cell);assert.equal(cell.firstElementChild,sprite);
 r("start(0);mode='coqui'");const wrong=r('(puzzle().solution[0]+1)%8');
 for(let i=2;i>=0;i--){r(`play(${wrong})`);assert.equal(r('game.lives'),i)}
 const exhausted=r('JSON.stringify(game.cells)');r('play(puzzle().solution[0])');assert.equal(r('JSON.stringify(game.cells)'),exhausted);
 r('lost()');assert.equal(e.get('defeat').open,true);const puzzleBefore=r('JSON.stringify(puzzle())');
 e.get('retryLevelBtn').onclick();assert.equal(r('game.lives'),3);assert.equal(r('game.hints'),0);assert.equal(r('JSON.stringify(puzzle())'),puzzleBefore);assert.equal(r('game.fixed.length===1&&game.cells.filter(x=>x===2).length===1&&game.cells[game.fixed[0]]===2'),true);
 for(let n=1;n<=1;n++){e.get('hintBtn').onclick();assert.equal(r('game.hints'),n)}const hinted=r('game.cells.filter(x=>x===2).length');e.get('hintBtn').onclick();assert.equal(r('game.cells.filter(x=>x===2).length'),hinted);e.get('undoBtn').onclick();assert.equal(r('game.hints'),1);
 const restartPuzzle=r('JSON.stringify(puzzle())'),restartLevel=r('game.level');e.get('moreOptionsBtn').onclick();e.get('restartBtn').onclick();assert.equal(e.get('resultTitle').textContent,'¿Reiniciar este tablero?');e.get('nextBtn').onclick();assert.equal(r('JSON.stringify(puzzle())'),restartPuzzle);assert.equal(r('game.level'),restartLevel);assert.equal(r('game.lives'),3);assert.equal(r('game.hints'),0);assert.equal(r('game.fixed.length===1&&game.cells.filter(x=>x===2).length===1'),true);assert.equal(e.get('extraOptions').hidden,true);
 let prev='';for(let n=0;n<100;n++){r('start(0)');const next=r("puzzle().solution.join(',')");assert.notEqual(next,prev);prev=next}
 r('start(0,true,12345)');const daily=r('JSON.stringify(puzzle())');r('start(0,true,12345)');assert.equal(r('JSON.stringify(puzzle())'),daily);
 for(let n=0;n<=30;n++){
  r(`data.completed=Array.from({length:${n}},(_,i)=>i);mapChapter=Math.floor(Math.min(${n},29)/5);renderCollection();renderMap()`);
  const count=[0,3,5,10,18,25,28,30].filter(at=>n>=at).length;assert.equal(r('progression().unlocked.length'),count);
  assert.equal(r('visibleCoquis().some(c=>c.id==="borinbiano")'),false);
  assert.equal(e.get('coquiCards').children.length,9);assert.ok(!e.get('nextCoqui').textContent.includes('Borinbiano'));
  const mystery=e.get('coquiCards').children.at(-1);assert.equal(mystery.className,'coqui-card mystery-card');assert.equal(mystery.children[0].firstElementChild.src,'assets/coqui.webp');assert.equal(mystery.children[1].textContent,'Personaje bonus');assert.ok(mystery.children[2].textContent.includes('24 horas'));assert.ok(!mystery.children.some(c=>c.textContent.includes('Borinbiano')));assert.equal(r("chooseCoqui('borinbiano')"),false);
  const nodes=e.get('adventureMap').children[0].children.filter(c=>c.dataset.level!==undefined);assert.equal(nodes.length,5);
  assert.equal(nodes.filter(c=>c.dataset.state==='current').length,n===30?0:1);
  for(const node of nodes){const level=Number(node.dataset.level);assert.equal(node.dataset.state,n===30||level<n?'done':level===n?'current':'locked')}
 }
 assert.equal(r("unlockedCoqui(COQUIS.find(c=>c.id==='colombiana'))"),true);assert.equal(r('babyUnlocked()'),false);
 // No extra screen after winning; normal and daily wins do not create currency.
 r("data.completed=[];data.dailyWins=[];data.family={pairedAt:0,bornAt:0,announced:false};start(0);completeTestBoard()");
 assert.equal(r('game.won'),true);assert.equal(e.get('result').open,true);assert.equal(r('data.completed.length'),1);
 e.get('nextBtn').onclick();assert.equal(e.get('levels').open,true);
 const boardSaved=JSON.parse(app.storage['coquidoku-v1']);
 const legacy=boot({...boardSaved,character:'aurora',earned:[],purchased:['aurora','colombiana','borinbiano'],points:1000,shields:2,bonusPending:'round:5',yunqueV1:true,forestCoordinates:{aurora:{x:42,y:68}}});await settle();
 assert.equal(legacy.run('data.character'),'aurora');assert.equal(legacy.run("unlockedCoqui(COQUIS.find(c=>c.id==='aurora'))"),true);
 assert.equal(legacy.run("unlockedCoqui(COQUIS.find(c=>c.id==='colombiana'))"),false);assert.equal(legacy.run('babyUnlocked()'),false);
 assert.equal(legacy.run('data.forestCoordinates.aurora.x'),42);assert.equal(legacy.run('JSON.stringify(game.cells)'),JSON.stringify(boardSaved.game.cells));
 for(const key of ['points','shields','purchased','bonusPending'])assert.equal(Object.hasOwn(JSON.parse(legacy.storage['coquidoku-v1']),key),false);
 console.log('PASS: stable board sprites, randomized/daily boards, 3-life lockout and same-board restart, 1 hint; all 31 map states; eight level unlocks; no economy or minigames; legacy purchased friends and progress preserved.');

 // The family deadline uses the wall clock, never session duration or daily challenges.
 let now=1800000000000;class RealDate extends Date{static now(){return now}}
 const partial=boot({intro:true,completed:Array.from({length:29},(_,i)=>i),dailyWins:Array.from({length:50},(_,i)=>i)},{Date:RealDate});await settle();
 assert.equal(partial.run('data.family.pairedAt'),0);assert.equal(partial.run('babyUnlocked()'),false);
 const family=boot({intro:true,completed:Array.from({length:29},(_,i)=>i)},{Date:RealDate});await settle();const fr=family.run,fe=family.els;
 fr("closeMap();start(29);completeTestBoard()");
 assert.equal(fr('data.completed.length'),30);assert.equal(fr('data.family.pairedAt'),now);const paired=now,deadline=now+86400000;
 assert.equal(fr('progression().unlocked.length'),8);assert.equal(fr('babyUnlocked()'),false);
 fr("openCollection();renderCollection()");assert.equal(fe.get('coquiCards').children.length,9);assert.equal(fe.get('mapRestartAdventure').hidden,true);
 const parentsSave=JSON.parse(family.storage['coquidoku-v1']);
 now=deadline-1;
 const before=boot(parentsSave,{Date:RealDate});await settle();const br=before.run,be=before.els;
 br('closeMap();openForest()');assert.equal(br('data.family.pairedAt'),paired);assert.equal(br('babyUnlocked()'),false);assert.equal(be.get('forestResidents').children.length,8);
 const parentX=br("ecosystem.find(s=>s.id==='colombiana').position.x");assert.equal(parentX,53);
 now=deadline;br('tickResidentCare(Date.now(),true)');
 assert.equal(br('babyUnlocked()'),true);assert.equal(br('data.family.bornAt'),deadline);assert.equal(be.get('forestResidents').children.length,9);
 assert.equal(be.get('familyFinale').open,true);assert.equal(br('data.family.announced'),true);assert.equal(br('data.character'),'borinbiano');assert.equal(be.get('forestAmbience').paused,true);
 const baby=br("ecosystem.find(s=>s.id==='borinbiano').id");assert.equal(baby,'borinbiano');
 assert.ok(be.get('forestResidents').children[8].className.includes('baby-resident'));
 br("renderCollection()");assert.equal(be.get('coquiCards').children.length,9);assert.ok(!be.get('coquiCards').children.at(-1).className.includes('mystery-card'));assert.equal(be.get('coquiCards').children.at(-1).children[1].textContent,'Borinbiano');assert.equal(br("chooseCoqui('borinbiano')"),true);
 br("start(29);completeTestBoard()");assert.ok(!be.get('resultText').textContent.includes('Vuelve mañana'));assert.equal(br('data.family.bornAt'),deadline);be.get('result').close();
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
 assert.equal(br('progression().unlocked.length'),1);assert.equal(br('game.level'),0);assert.equal(br('game.fixed.length===1&&game.cells.filter(x=>x===2).length===1'),true);assert.equal(br('data.sound'),false);assert.equal(br('data.motion'),true);
 assert.equal(be.get('levels').open,true);assert.equal(be.get('familyFinale').open,false);assert.equal(br('Object.keys(data.care).length'),0);assert.equal(br('restartAdventure()'),false);
 console.log('PASS: Colombiana at 28 and Boricua at 30; secret baby absent before 24h; exact deadline in-session and across reload/offline; one persistent baby and one finale; continued care and confirmed optional restart.');

 // All nine characters can sleep using real deadlines, including the new sleeping sprites.
 const pets=boot(bornSave,{Date:RealDate});await settle();const pr=pets.run,pe=pets.els;pr('closeMap();openForest();Math.random=()=>.5');
 for(const id of pr('COQUIS.map(c=>c.id)')){
  pr(`data.care['${id}'].nextSleepAt=Date.now()-1`);assert.equal(pr(`putResidentToSleep('${id}')`),true);
  assert.equal(pr(`data.care['${id}'].sleepUntil`),now+20*60000);assert.equal(pr(`feedResident('${id}','worm')`),null);
 }
 assert.equal(pe.get('forestResidents').children.filter(b=>b.firstElementChild.src.endsWith('-sleep.webp')).length,8);assert.equal(pr("ecosystem.filter(s=>!residentIsSleeping(s.id)&&data.care[s.id].nextSleepAt>Date.now()&&data.behaviors[s.id]!=='rest').length"),1);
 const sleepSave=JSON.parse(pets.storage['coquidoku-v1']);now+=15*60000;
 const sleeping=boot(sleepSave,{Date:RealDate});await settle();sleeping.run('closeMap();openForest()');assert.equal(sleeping.run('ecosystem.filter(s=>residentIsSleeping(s.id)).length'),8);assert.equal(sleeping.els.get('forestResidents').children[0].careBar.dataset.mode,'sleep');assert.equal(sleeping.els.get('forestResidents').children[0].careBar.style.props['--care-color'],'#69b4ff');assert.equal(sleeping.els.get('forestResidents').children[0].careFill.style.width,'75%');
 now+=5*60000;sleeping.run('tickResidentCare(Date.now(),true)');assert.equal(sleeping.run('ecosystem.some(s=>residentIsSleeping(s.id))'),false);assert.equal(sleeping.els.get('forestResidents').children[0].careBar.dataset.mode,'hunger');assert.equal(sleeping.els.get('forestResidents').children[0].careBar.style.props['--care-color'],'#9ac875');assert.ok(sleeping.run('data.care.sol.nextSleepAt-Date.now()')>=3*60*60*1000);sleeping.run('updateEcosystem(0);updateEcosystem(1200)');assert.ok(sleeping.run('ecosystem[0].hops')>0);
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


 // Sleep cadence, pausing while sleepy, blue progress, guardian rotation and old-data migration.
 {
 const active=boot({intro:true,completed:Array.from({length:10},(_,i)=>i)},{Date:RealDate});await settle();const tr=active.run,te=active.els;
 tr('closeMap();openForest();Math.random=()=>.5');
 assert.ok(tr('data.care.sol.nextSleepAt-Date.now()')>=3*60*60*1000);assert.ok(tr('data.care.sol.nextSleepAt-Date.now()')<=4*60*60*1000);
 assert.equal(tr("putResidentToSleep('sol')"),false);
 tr("data.care.sol.nextSleepAt=Date.now()-1;tickResidentCare(Date.now(),true);updateEcosystem(0);updateEcosystem(800);updateEcosystem(1250)");
 assert.equal(te.get('forestResidents').children[0].sleepBadge.textContent,'☾');assert.equal(tr('ecosystem[0].hops'),0);assert.ok(tr("ecosystem.slice(1).some(s=>!residentIsSleepy(s.id))"));
 const appetite=tr('data.care.sol.satiety');assert.equal(tr("putResidentToSleep('sol')"),true);const sleepStart=now,sleepEnd=tr('data.care.sol.sleepUntil');
 assert.equal(sleepEnd-sleepStart,20*60000);assert.equal(te.get('forestResidents').children[0].careFill.style.width,'0%');assert.equal(te.get('forestResidents').children[0].style.props['--hop-y'],'0px');
 now+=10*60000;tr('tickResidentCare(Date.now(),true)');assert.equal(te.get('forestResidents').children[0].careFill.style.width,'50%');assert.ok(tr('data.care.sol.satiety')<appetite);
 const middleSave=JSON.parse(active.storage['coquidoku-v1']),resumed=boot(middleSave,{Date:RealDate});await settle();resumed.run('closeMap();openForest()');assert.equal(resumed.run('data.care.sol.sleepStartedAt'),sleepStart);assert.equal(resumed.run('data.care.sol.sleepUntil'),sleepEnd);assert.equal(resumed.els.get('forestResidents').children[0].careFill.style.width,'50%');
 now=sleepEnd;tr('tickResidentCare(Date.now(),true);updateEcosystem(2000);updateEcosystem(3200)');assert.ok(tr('ecosystem[0].hops')>=1);assert.equal(te.get('forestResidents').children[0].careBar.dataset.mode,'hunger');
 const next=tr('data.care.sol.nextSleepAt');assert.ok(next-now>=3*60*60*1000);now=next-1;assert.equal(tr("putResidentToSleep('sol')"),false);
 // Even when all become sleepy together, at least one random resident stays healthy and active.
 tr("for(const s of ecosystem)data.care[s.id].nextSleepAt=Date.now()-1;tickResidentCare(Date.now(),true)");
 assert.ok(tr("ecosystem.some(s=>!residentIsSleeping(s.id)&&data.care[s.id].nextSleepAt>Date.now()&&data.behaviors[s.id]!=='rest')"));
 // Sleeping the current last awake resident rotates the role to another, without erasing food.
 tr("for(const s of ecosystem){data.care[s.id].nextSleepAt=Date.now()-1;putResidentToSleep(s.id)}");
 assert.ok(tr("ecosystem.some(s=>!residentIsSleeping(s.id)&&data.care[s.id].nextSleepAt>Date.now()&&data.behaviors[s.id]!=='rest')"));
 tr("for(const s of ecosystem)data.behaviors[s.id]='rest';tickResidentCare(Date.now(),true)");
 assert.ok(tr("ecosystem.some(s=>!residentIsSleeping(s.id)&&data.behaviors[s.id]==='explore')"));
 const guardian=tr("ecosystem.find(s=>!residentIsSleeping(s.id)&&!residentIsSleepy(s.id)&&data.behaviors[s.id]==='explore').id"),guardHops=tr(`ecosystem.find(s=>s.id==='${guardian}').hops`);tr('updateEcosystem(4000);updateEcosystem(4450)');assert.ok(tr(`ecosystem.find(s=>s.id==='${guardian}').hops`)>guardHops);
 const alone=boot({intro:true},{Date:RealDate});await settle();alone.run("closeMap();openForest();data.care.sol.nextSleepAt=Date.now()-1");assert.equal(alone.run("putResidentToSleep('sol')"),false);alone.run("data.behaviors.sol='rest';tickResidentCare(Date.now(),true)");assert.equal(alone.run('data.behaviors.sol'),'explore');assert.equal(alone.run("residentIsSleeping('sol')"),false);
 const oldCare={sol:{satiety:80,lastUpdate:now,nextSleepAt:now+60000,sleepUntil:now+600000,hungerRate:.5},menta:{satiety:75,lastUpdate:now,nextSleepAt:now+60000,sleepUntil:0,hungerRate:.5}};
 const migrated=boot({intro:true,yunqueV1:true,completed:[0,1,2,3,4],care:oldCare},{Date:RealDate});await settle();migrated.run('closeMap();openForest()');
 assert.equal(migrated.run('data.care.sol.sleepUntil'),oldCare.sol.sleepUntil);assert.equal(migrated.run('data.care.menta.satiety'),75);assert.ok(migrated.run('data.care.menta.nextSleepAt-Date.now()')>=3*60*60*1000);assert.equal(migrated.run('data.care.sol.sleepCycleV2'),true);
 console.log('PASS: Ver más defaults collapsed and toggles; n/7 coquíes; confirmed same-board reset; no sleep before 3h; sleepy residents pause until their nap; blue real-time sleep progress survives reload; wake resumes hops; a random healthy resident always stays active, including legacy/rest states.');
 }


 // Seven searches plus one immutable clue, including updates, retries and daily boards.
 const clue=r('game.fixed[0]');r('play(game.fixed[0])');assert.equal(r('game.cells[game.fixed[0]]'),2);
 r("mode='mark';play(game.fixed[0]);mode='coqui'");assert.equal(r('game.cells[game.fixed[0]]'),2);assert.equal(r('game.hints'),0);
 const migrating=JSON.parse(app.storage['coquidoku-v1']);migrating.game.fixed=[];migrating.game.cells.fill(0);migrating.game.cells[(migrating.game.cells.indexOf(0))]=1;migrating.game.lives=2;migrating.game.hints=1;
 const migratedBoard=boot(migrating);await settle();assert.equal(migratedBoard.run('game.fixed.length'),1);assert.equal(migratedBoard.run('game.lives'),2);assert.equal(migratedBoard.run('game.hints'),1);assert.equal(migratedBoard.run('game.cells[0]'),1);
 for(const at of [3,5,10,18,25,28,30]){
  const unlocked=boot({intro:true,completed:Array.from({length:at-1},(_,i)=>i)});await settle();const ur=unlocked.run,ue=unlocked.els;
  ur(`closeMap();start(${at-1});completeTestBoard()`);
  const id=ur('COQUIS.find(c=>c.at===data.completed.length).id');assert.equal(ue.get('characterUnlock').open,true);assert.equal(ur('data.character'),id);assert.equal(ue.get('progress').textContent,ur('isVariant()')?(ur('game.kind')==='road'?'3/3 luces':'4/4 insectos'):'7/7 coquíes');assert.ok(ue.get('unlockTitle').textContent.includes(ur('activeCoqui().name')));
  ue.get('unlockContinue').onclick();assert.equal(ue.get('characterUnlock').open,false);
  ur(`start(${Math.min(at,29)})`);assert.equal(ur('isVariant()')?ue.get('variantActor').src:ue.get('board').children[ur('game.fixed[0]')].firstElementChild.src,ur('activeCoqui().src'));
  ur("chooseCoqui('sol');completeTestBoard()");
  // A manual choice persists when this next win does not unlock another friend.
  assert.equal(ur('data.character'),'sol');assert.equal(ue.get('characterUnlock').open,false);
 }
 console.log('PASS: immutable initial clue, seven-search progress, saved-board migration, all seven level unlock popups, automatic next-board selection and manual override.');

 // Legacy frontier repair is persistent and replaying earlier levels cannot move it backwards.
 const oldMapGame=JSON.parse(app.storage['coquidoku-v1']).game;oldMapGame.level=17;oldMapGame.won=false;oldMapGame.lives=4;oldMapGame.hints=3;
 const gap=boot({intro:true,rulesV3:true,completed:Array.from({length:17},(_,i)=>i).filter(i=>i!==6),game:oldMapGame});await settle();
 assert.equal(gap.run('data.completed.length'),17);assert.equal(gap.run('currentAdventureLevel()'),17);
 assert.equal(gap.els.get('mapProgress').textContent,'Nivel actual: 18 · 17/30 completados');
 assert.equal(gap.run('game.lives'),3);assert.equal(gap.run('game.hints'),1);assert.equal(gap.els.get('hintLabel').textContent,'Pista (0/1)');
 assert.equal(gap.els.get('hearts').textContent,'♥ ♥ ♥');
 const gapReload=boot(JSON.parse(gap.storage['coquidoku-v1']));await settle();assert.equal(gapReload.run('data.completed.length'),17);
 gap.run("closeMap();start(0);completeTestBoard();openMap()");assert.equal(gap.run('currentAdventureLevel()'),17);assert.equal(gap.run('data.completed.length'),17);
 const dailyGap=boot({intro:true,completed:[0,1],game:{...oldMapGame,daily:true}});await settle();assert.equal(dailyGap.run('data.completed.length'),2);
 // Both audio paths play a single pass per hold. Ending a source does not retrigger it.
 const single=boot({intro:true});await settle();single.run("closeMap();openForest()");single.els.get('forestHoldAudio').loop=true;single.run("startResidentHold('sol')");
 assert.equal(single.els.get('forestHoldAudio').loop,false);assert.equal(single.els.get('forestHoldAudio').playCount,1);single.run('stopResidentHold()');
 const sources=[];class FXContext{
  constructor(){this.state='running';this.destination={}}
  decodeAudioData(){return Promise.resolve({})}
  createBufferSource(){const s={connect(){},disconnect(){},start(){sources.push(this)},stop(){}};return s}
  createGain(){return {gain:{value:1},connect(){},disconnect(){}}}
 }
 const web=boot({intro:true},{window:{AudioContext:FXContext}});await settle();web.run("closeMap();openForest();startResidentHold('sol')");await settle();
 assert.equal(sources.length,1);assert.equal(sources[0].loop,false);sources[0].onended();assert.equal(web.run('fxSources.size'),0);assert.equal(sources.length,1);web.run('stopResidentHold()');
 console.log('PASS: old level-18 save repairs to 17 completed across reload and replay; daily board cannot advance adventure; three-heart/one-hint migration; single-pass resident calls in Web Audio and fallback.');

 // Exercise the real route controls, scoring, timers, cancellation and reload for all ten variants.
 const timers=new Map();let timerId=0;
 const challenge=boot({intro:true},{setTimeout:callback=>{timers.set(++timerId,callback);return timerId},clearTimeout:id=>timers.delete(id)});await settle();
 const cr=challenge.run,ce=challenge.els;cr('closeMap()');
 const drain=()=>{let count=0;while(timers.size){assert.ok(++count<300);const [id,callback]=timers.entries().next().value;timers.delete(id);callback()}};
 for(const level of [2,5,8,11,14,17,20,23,26,28]){
  cr(`start(${level})`);assert.equal(ce.get('classicBoardWrap').hidden,true);assert.equal(ce.get('variantStage').hidden,false);assert.equal(ce.get('variantGrid').children.length,25);
  assert.equal(cr('runVariant()'),false);assert.equal(cr('game.lives'),2);
  ce.get('hintBtn').onclick();assert.equal(cr('game.hints'),1);const afterHint=cr('JSON.stringify(game.challenge)');ce.get('hintBtn').onclick();assert.equal(cr('JSON.stringify(game.challenge)'),afterHint);
  ce.get('undoBtn').onclick();assert.equal(cr('game.hints'),1);assert.equal(cr('game.lives'),2);
  cr('resetCurrentBoard()');assert.equal(cr('game.lives'),3);assert.equal(cr('game.hints'),0);
  if(cr('game.kind')==='road'){
   cr('for(let i=0;i<25;i++)while(game.challenge.rotations[i]!==0)variantTap(i)');
  }else{
   const path=Array.from(cr('V.spec(game.level).solution'));
   assert.equal(cr('variantTap(V.spec(game.level).walls[0])'),false);assert.equal(cr('game.lives'),3);
   for(const cell of path.slice(1,4))assert.equal(cr(`variantTap(${cell})`),true);
   assert.equal(cr(`variantTap(${path[0]})`),false);assert.equal(cr(`variantTap(${path[2]})`),true);
   const partialRoute=cr('JSON.stringify(game.challenge.route)');
   const reload=boot(JSON.parse(challenge.storage['coquidoku-v1']));await settle();assert.equal(reload.run('game.kind'),'food');assert.equal(reload.run('JSON.stringify(game.challenge.route)'),partialRoute);
   cr('resetCurrentBoard()');for(const cell of path.slice(1))assert.equal(cr(`variantTap(${cell})`),true);
  }
  assert.equal(cr('V.trace(V.spec(game.level),game.challenge).ok'),true);
  assert.equal(cr('runVariant()'),true);assert.equal(cr('variantBusy'),true);
  const beforeTravel=cr('JSON.stringify(game.challenge)');cr('variantTap(7);variantHint()');assert.equal(cr('JSON.stringify(game.challenge)'),beforeTravel);
  drain();assert.equal(cr('game.won'),true);assert.equal(cr('variantBusy'),false);assert.equal(ce.get('resultTitle').textContent,'¡Lo lograste!');
  const completed=cr('data.completed.length');cr('finish()');assert.equal(cr('data.completed.length'),completed);
  ce.get('characterUnlock').close();ce.get('result').close();
 }
 cr('start(2)');for(let tries=0;tries<3;tries++)cr('runVariant()');
 assert.equal(cr('game.lives'),0);const defeated=cr('JSON.stringify(game.challenge)');cr('variantTap(5);variantHint();runVariant()');assert.equal(cr('JSON.stringify(game.challenge)'),defeated);assert.equal(ce.get('defeat').open,true);
 cr('resetCurrentBoard();game.challenge.rotations.fill(0);runVariant()');const stale=[...timers.values()];
 cr('openMap()');for(const callback of stale)callback();assert.equal(cr('game.won'),false);assert.equal(cr('variantBusy'),false);
 cr('closeMap();runVariant()');drain();assert.equal(cr('game.won'),true);
 cr('start(0)');assert.equal(ce.get('classicBoardWrap').hidden,false);assert.equal(ce.get('variantStage').hidden,true);assert.equal(cr('game.fixed.length'),1);assert.equal(ce.get('modeBtn').disabled,false);
 // Real 60-level saves retain their reached level, historical friends, seeds, care and family deadline.
 for(let n=0;n<=60;n++){
  const oldGame={...oldMapGame,cells:Array(64).fill(0),fixed:[],level:Math.min(n,59),won:n===60,lives:2,hints:1};
  const old=boot({intro:true,adventure30V1:false,yunqueV1:true,selectionV16:true,completed:Array.from({length:n},(_,i)=>i),game:oldGame,character:n>=50?'aurora':null,care:{sol:{satiety:73,sleepUntil:now+600000}},forestCoordinates:{sol:{x:40,y:70}},family:n===60?{pairedAt:now-86400000,bornAt:now,announced:true}:{pairedAt:0,bornAt:0,announced:false}},{Date:RealDate});await settle();
  assert.equal(old.run('data.completed.length'),Math.min(n,30));assert.equal(old.run('victories()'),n);assert.equal(old.run('data.forestCoordinates.sol.x'),40);assert.equal(old.run('data.care.sol.satiety'),73);assert.equal(old.run('data.care.sol.sleepUntil'),now+600000);assert.equal(old.run('data.adventure30V1'),true);
  assert.equal(old.run('game.level'),Math.min(n,29));assert.equal(old.run('game.kind'),'classic');assert.equal(old.run('game.lives'),2);assert.equal(old.run('game.hints'),1);
  if(n>=50)assert.equal(old.run('data.character'),'aurora');
  if(n===60){assert.equal(old.run('data.family.pairedAt'),now-86400000);assert.equal(old.run('babyUnlocked()'),true)}
  const second=boot(JSON.parse(old.storage['coquidoku-v1']),{Date:RealDate});await settle();assert.equal(second.run('data.completed.length'),Math.min(n,30));assert.equal(second.run('victories()'),n);
 }
 console.log('PASS: ten variants played through actual tile actions and animation timers; one hint and three-life lockout; undo/restart, saved insect route, cancelled travel and stale callbacks; return to classic; migration of every old progress from 0 to 60 without losing care, friends or seeds.');

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
