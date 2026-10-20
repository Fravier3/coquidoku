const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class E{
 constructor(id=''){this.id=id;this.children=[];this.dataset={};this.style={props:{},setProperty(k,v){this.props[k]=v}};this.attrs={};this.classList={add(){},remove(){},toggle(){}};this.open=false;this.textContent='';this.hidden=false}
 get firstElementChild(){return this.children[0]||null}
 append(...xs){for(const x of xs)this.children.push(...(x.fragment?x.children:[x]))}
 replaceChildren(...xs){this.children=[];this.append(...xs)}
 play(){this.playCount=(this.playCount||0)+1;return Promise.resolve()}pause(){this.pauseCount=(this.pauseCount||0)+1}
 getBoundingClientRect(){return {left:0,top:0,width:400,height:700}}setPointerCapture(id){this.capture=id}hasPointerCapture(id){return this.capture===id}releasePointerCapture(){this.capture=null}
 setAttribute(k,v){this.attrs[k]=v}addEventListener(type,callback){(this.listeners??={})[type]??=[];this.listeners[type].push(callback)}emit(type){for(const callback of this.listeners?.[type]||[])callback()}querySelector(){return new E()}showModal(){this.open=true}close(){this.open=false}focus(){this.focused=true}
}
function boot(saved,options={}){
 const els=new Map(),themes=['leaf','night','garden'].map(t=>{const e=new E();e.dataset.pick=t;return e});
 const storage=saved?{'coquidoku-v1':JSON.stringify(saved)}:{};
 const ctx={console,Intl,Date:options.Date||Date,JSON,Math,Array,Number,String,Error,setTimeout:options.setTimeout||(()=>1),clearTimeout:options.clearTimeout||(()=>{}),location:{reload(){}},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('puzzles.json','utf8'))}),document:{body:new E(),visibilityState:'visible',getElementById:id=>{if(!els.has(id))els.set(id,new E(id));return els.get(id)},createElement:()=>new E(),createTextNode:text=>({textContent:text}),createDocumentFragment:()=>{const e=new E();e.fragment=true;return e},querySelector:()=>new E(),querySelectorAll:s=>s==='[data-pick]'?themes:[],listeners:{},addEventListener(type,callback){(this.listeners[type]??=[]).push(callback)}},window:{addEventListener(){},...(options.window||{})}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);
 return {ctx,els,storage,run:s=>vm.runInContext(s,ctx)};
}
const settle=()=>new Promise(r=>setImmediate(r));

function solveBonus(run){
 const type=run('bonusRound.type');
 if(type==='bridge')run("for(const [i,target] of [[0,6],[2,12],[5,3]])for(let n=0;n<4&&bridgeMask(bonusRound,i)!==target;n++)bonusPick(i)");
 else if(type==='leaves')run("startLeafShuffle();for(let n=0;n<4;n++)advanceLeafShuffle(bonusRound);bonusPick(bonusRound.slots[bonusRound.targetLeaf])");
 else run("for(let i=0;i<6;i++)if(bonusRound.waves[0][i]==='fly')bonusPick(i);advanceSupper(bonusRound);for(let i=0;i<6;i++)if(bonusRound.waves[1][i]==='fly')bonusPick(i)");
}

(async()=>{
 const {ctx,els,storage,run}=boot();await settle();
 assert.equal(run('game.cells.length'),64);assert.equal(els.get('board').children.length,64);
 assert.equal(run('game.cells.every(x=>x===0)'),true);assert.equal(run('game.lives'),4);
 assert.equal(run('data.character'),null);
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
 // Cosmetic progression must not alter the current puzzle or grant duplicate rewards.
 run("data.completed=[];data.dailyWins=[];data.character='sol';start(0)");
 assert.equal(run("chooseCoqui('menta')"),false);assert.equal(run('data.character'),'sol');
 for(const [n,unlocked,stage] of [[0,1,0],[5,2,0],[10,3,10],[20,4,10],[25,4,25],[35,5,25],[50,6,50],[60,7,50]]){
  run(`data.completed=Array.from({length:${n}},(_,i)=>i);renderForest();renderCollection()`);
  assert.equal(run('progression().unlocked.length'),unlocked);assert.equal(run('forestStage().at'),stage);
  assert.equal(els.get('forestPlants').children.length,n);assert.equal(els.get('coquiCards').children.length,7);
 }
 run("data.completed=Array.from({length:5},(_,i)=>i);data.dailyWins=[];start(0);play(puzzle().solution[0])");
 const boardSnapshot=run('JSON.stringify(game)'),coquiCell=els.get('board').children[run('puzzle().solution[0]')],oldImage=coquiCell.firstElementChild;
 assert.equal(run("chooseCoqui('menta')"),true);assert.equal(run('JSON.stringify(game)'),boardSnapshot);
 assert.equal(coquiCell.firstElementChild,oldImage);assert.equal(oldImage.src,'assets/coqui-menta.webp');
 assert.equal(run("chooseCoqui('aurora')"),false);assert.equal(run('data.character'),'menta');
 const careerRestored=boot(JSON.parse(storage['coquidoku-v1']));await settle();assert.equal(careerRestored.run('data.character'),'menta');assert.equal(careerRestored.run('victories()'),5);
 run("data.completed=[];data.dailyWins=[];start(0);for(let r=0;r<8;r++)game.cells[r*8+puzzle().solution[r]]=2;finish()");
 assert.equal(run('victories()'),1);run('finish()');assert.equal(run('victories()'),1);
 run("start(0);for(let r=0;r<8;r++)game.cells[r*8+puzzle().solution[r]]=2;finish()");assert.equal(run('victories()'),1);
 for(let t=0;t<2;t++){run("start(0,true,9001);for(let r=0;r<8;r++)game.cells[r*8+puzzle().solution[r]]=2;finish()");assert.equal(run('victories()'),2)}
 run("data.completed=[0,1,2,3];data.dailyWins=[];start(4);for(let r=0;r<8;r++)game.cells[r*8+puzzle().solution[r]]=2;finish()");
 assert.ok(els.get('rewardText').textContent.includes('Pistoco'));assert.equal(run('victories()'),5);
 const legacyProgress=boot({...JSON.parse(storage['coquidoku-v1']),completed:[0,0,1,-1,99,'2'],dailyWins:[42,42,-1],character:'aurora'});await settle();assert.equal(legacyProgress.run('victories()'),3);assert.equal(legacyProgress.run('data.character'),null);
 // Economy: points only from a completed inter-level minigame; never from a level.
 const economy=boot();await settle();const er=economy.run,ee=economy.els;
 assert.equal(er('data.points'),0);
 er("for(let r=0;r<8;r++)game.cells[r*8+puzzle().solution[r]]=2;finish()");
 assert.equal(er('data.points'),0);assert.ok(ee.get('bonus').open);assert.equal(er('victories()'),1);
 // Exercise all short games and one-time payouts; invalid inputs never earn points.
 for(let n=1;n<=3;n++){
  er("data.bonusCounter++;data.bonusPending=missionKey();openBonus()");
  const balance=er('data.points');assert.equal(er('completeBonus()'),false);
  assert.equal(er('bonusPick(-1)'),false);assert.equal(er('bonusPick(99)'),false);
  solveBonus(er);assert.equal(er('data.points'),balance+20);assert.equal(er('completeBonus()'),false);
 }

 er("data.points=80;data.completed=[];data.dailyWins=[];data.earned=['sol'];data.purchased=[]");
 assert.equal(er("buyCoqui('brisa')"),false);assert.equal(er('data.points'),80);
 assert.equal(er("requestPurchase('menta')"),true);assert.equal(er('data.points'),80);ee.get('purchaseConfirm').onclick();
 assert.equal(er('data.points'),0);assert.equal(er("unlockedCoqui(COQUIS[1])"),true);assert.equal(er("buyCoqui('menta')"),false);
 assert.equal(er("chooseCoqui('menta')"),true);er('renderForest()');assert.equal(ee.get('forestResidents').children.length,2);
 er("openResident('menta')");ee.get('residentZone').value='1';ee.get('residentZone').onchange();
 assert.equal(er('data.positions.menta'),1);
 assert.ok(ee.get('forestDecor').children.length>=1);
 er("data.points=99999;data.completed=Array.from({length:59},(_,i)=>i);data.dailyWins=[123,456];data.purchased.push('boricua');renderCollection()");
 assert.equal(er("unlockedCoqui(COQUIS[6])"),false);assert.equal(er("buyCoqui('boricua')"),false);assert.equal(er("chooseCoqui('boricua')"),false);
 er("start(59);for(let r=0;r<8;r++)game.cells[r*8+puzzle().solution[r]]=2;finish()");
 assert.equal(er('data.points'),99999);assert.equal(er("unlockedCoqui(COQUIS[6])"),true);assert.equal(er("chooseCoqui('boricua')"),true);
 er("data.points=12;data.bonusPending='round:123';save()");
 const savedEconomy=boot(JSON.parse(economy.storage['coquidoku-v1']));await settle();
 assert.equal(savedEconomy.run('data.points'),12);assert.equal(savedEconomy.run('data.character'),'boricua');assert.equal(savedEconomy.run('data.positions.menta'),1);assert.equal(savedEconomy.run('openBonus()'),true);
 const oldFriends=boot({rulesV3:true,completed:[],dailyWins:Array.from({length:35},(_,i)=>i+1),character:'luna'});await settle();assert.equal(oldFriends.run('data.points'),0);assert.equal(oldFriends.run('data.character'),'luna');
 assert.ok(!fs.readFileSync('index.html','utf8').includes('forestMilestones'));
 const flow=boot();await settle();const fr=flow.run;
 for(let level=0;level<6;level++){
  const balance=fr('data.points');fr(`start(${level});for(let r=0;r<8;r++)game.cells[r*8+puzzle().solution[r]]=2;finish()`);
  assert.equal(fr('data.points'),balance);assert.equal(fr('bonusRound.type'),['leaves','supper','bridge'][level%3]);
  solveBonus(fr);
  assert.equal(fr('data.points'),balance+20);
 }
 assert.equal(fr('data.bonusClaims.length'),6);assert.equal(fr('data.completed.length'),6);
 // A real, preloaded media element is invoked synchronously from a tap.
 const audible=boot();await settle();const ar=audible.run,player=audible.els.get('coquiAudio');
 ar("navigator.audioSession={type:'ambient'}");
 assert.equal(ar('data.sound'),true);ar('play(puzzle().solution[0])');assert.equal(player.playCount,1);await settle();
 assert.equal(ar('navigator.audioSession.type'),'playback');assert.equal(player.muted,false);assert.equal(player.volume,1);assert.equal(player.currentTime,0);
 ar("mode='mark';play(8)");await settle();assert.equal(player.playCount,1);
 ar("mode='coqui';play((puzzle().solution[1]+1)%8+8)");await settle();assert.equal(player.playCount,1);
 ar('data.sound=false;save()');await ar('chirp()');assert.equal(player.playCount,1);
 const muted=boot(JSON.parse(audible.storage['coquidoku-v1']));await settle();assert.equal(muted.run('data.sound'),false);
 audible.els.get('residentCall').onclick();assert.equal(player.playCount,2);await settle();
 player.play=()=>Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));
 assert.equal(await ar('chirp(false,true)'),false);assert.ok(audible.els.get('residentAudioStatus').textContent.includes('bloqueó'));assert.ok(audible.els.get('soundStatus').textContent.includes('bloqueó'));
 player.play=()=>Promise.reject(new Error('decode'));
 assert.equal(await ar('chirp(false,true)'),false);assert.ok(audible.els.get('residentAudioStatus').textContent.includes('No se pudo'));
 assert.ok(!fs.readFileSync('app.js','utf8').includes('AudioContext'));
 const wood=boot();await settle();const wr=wood.run;
 wr("globalThis.originalRandom=Math.random;Math.random=()=>.1;openForest()");assert.equal(wr('forestTime'),'day');
 for(const n of [0,10,25,50]){wr(`data.completed=Array.from({length:${n}},(_,i)=>i);renderForest()`);assert.ok(wr('forestSceneSource()').endsWith('-day.webp'))}
 wr('renderForest()');assert.equal(wr('forestTime'),'day');
 wr('Math.random=()=>.9;openForest();Math.random=originalRandom');assert.equal(wr('forestTime'),'night');assert.ok(!wr('forestSceneSource()').endsWith('-day.webp'));
 wr("data.completed=[];data.earned=['sol'];renderForest()");assert.equal(wood.els.get('forestResidents').children[0].className,'forest-friend');
 const css=fs.readFileSync('styles.css','utf8');assert.ok(!css.includes('forest-hop'));assert.ok(!css.includes('forest-stroll'));assert.ok(!fs.readFileSync('index.html','utf8').includes('residentBehavior'));
 // Drive the frame clock explicitly, including the midpoint of a hop.
 let cancelled=0,scheduled=0;
 const habitat=boot(undefined,{window:{requestAnimationFrame:()=>++scheduled,cancelAnimationFrame:()=>cancelled++}});await settle();const hr=habitat.run,he=habitat.els;
 hr('openForest();updateEcosystem(0);updateEcosystem(800)');assert.equal(hr('ecosystem[0].hops'),1);
 hr('updateEcosystem(1250)');assert.ok(he.get('forestResidents').children[0].firstElementChild.style.transform.includes('-36px'));
 hr('updateEcosystem(1700);updateEcosystem(15799)');assert.equal(hr('ecosystem[0].hops'),1);
 hr('updateEcosystem(15800)');assert.equal(hr('ecosystem[0].hops'),2);
 hr("data.behaviors.sol='rest';updateEcosystem(31250);updateEcosystem(70000)");assert.equal(hr('ecosystem[0].hops'),2);assert.equal(he.get('forestResidents').children[0].firstElementChild.style.transform,'translate3d(0,0,0)');
 const currency=hr('data.points'),seeds=hr('victories()');hr("data.behaviors.sol='explore';feedAt(60,70,71000);updateEcosystem(71100);updateEcosystem(71550)");assert.equal(hr('data.feedings'),1);assert.equal(hr('data.points'),currency);assert.equal(hr('victories()'),seeds);assert.equal(hr('feedAt(30,80,71001)'),true);
 hr('data.motion=true;updateEcosystem(90000)');assert.equal(he.get('forestResidents').children[0].firstElementChild.style.transform,'translate3d(0,0,0)');
 hr('closeForest()');assert.ok(cancelled>0);assert.equal(hr('forestRaf'),null);assert.equal(he.get('forest').open,false);
 // Map shows all sixty stops, completion status, current game, and protected future stops.
 hr("data.completed=[];data.motion=false;start(0);openMap()");assert.equal(he.get('adventureMap').children.length,1);
 const nodes=he.get('adventureMap').children.flatMap(c=>c.children.filter(e=>e.dataset.level!==undefined));assert.equal(nodes.length,10);assert.equal(nodes[0].disabled,false);assert.equal(nodes[1].disabled,true);assert.equal(hr('selectMapLevel(1)'),false);
 hr('play(puzzle().solution[0])');const retained=hr('JSON.stringify(game)');assert.equal(hr('selectMapLevel(0)'),true);assert.equal(hr('JSON.stringify(game)'),retained);
 hr("data.completed=[0,1,4];start(5);renderMap()");assert.equal(hr('unlockedThrough()'),5);assert.equal(hr('nextAdventureLevel()'),2);assert.equal(hr('selectMapLevel(6)'),false);
 hr("game.won=true;openCollection('map');$('collection').close();handleCollectionClose()");assert.equal(he.get('levels').open,true);assert.equal(he.get('collectionReturnBtn').textContent,'Volver al mapa');
 hr("data.completed=Array.from({length:60},(_,i)=>i);renderMap()");assert.ok(he.get('mapProgress').textContent.includes('Completaste'));assert.equal(hr('nextAdventureLevel()'),59);
 const crypto=require('node:crypto');assert.equal(crypto.createHash('sha256').update(fs.readFileSync('assets/coqui-user.mp3')).digest('hex'),'e3092efeaecbdb2ad01f0de6df52c20959e28ac7a961a4fab4df0dcbc880e18b');assert.ok(!fs.existsSync('assets/coqui-call.mp3'));
 // Food remains until actual arrival, then only the reached insect is consumed.
 hr("data.motion=false;data.behaviors={};insects=[];renderForest();feedAt(18,80,100000)");assert.equal(hr('insects.length'),3);
 hr('updateEcosystem(100050);renderForest()');assert.equal(hr('insects.length'),3);
 for(let t=100120;t<120000;t+=100)hr(`updateEcosystem(${t})`);
 assert.equal(hr('insects.length'),0);assert.equal(he.get('forestFood').children.length,0);
 hr("feeding=true;openForest()");assert.equal(hr('feeding'),false);assert.equal(he.get('forestFeedBtn').attrs['aria-pressed'],'false');
 hr("data.completed=Array.from({length:10},(_,i)=>i);start(10);openMap()");assert.equal(he.get('adventureMap').children.length,1);
 assert.ok(hr('mapPosition(0).y>mapPosition(1).y'));assert.ok(hr('mapPosition(8).y>mapPosition(9).y'));
 assert.equal(he.get('adventureMap').children[0].children.find(e=>e.dataset.level!==undefined).dataset.level,10);
 const mapButtons=he.get('adventureMap').children.flatMap(c=>c.children.filter(e=>e.dataset.level!==undefined));assert.ok(mapButtons.every(b=>!b.children.some(c=>String(c.textContent).includes('★')||c.textContent==='Bloqueado')));
 assert.ok(!fs.readFileSync('index.html','utf8').includes('mapContinue'));assert.ok(!fs.readFileSync('index.html','utf8').includes('forestCustomizeBtn'));
 for(let seed=1;seed<=120;seed++){
  const round=fr(`buildBonus('round:${seed}')`);assert.equal(round.tiles.length,5);assert.equal(round.tiles.filter(t=>!t.fixed).length,3);
  assert.equal(round.swaps.length,3);assert.equal(new Set(round.slots).size,3);
  for(const wave of round.waves){assert.equal(wave.filter(x=>x==='fly').length,3);assert.equal(wave.filter(x=>x==='butterfly').length,2);assert.equal(wave.filter(x=>x==='bee').length,1)}
 }

 // Check every normal progression boundary, including a replay and the finale.
 const audit=boot();await settle();const qr=audit.run,qe=audit.els;
 const mapNodes=()=>qe.get('adventureMap').children.flatMap(c=>c.children.filter(e=>e.dataset.level!==undefined));
 for(let completed=0;completed<=60;completed++){
  qr(`data.completed=Array.from({length:${completed}},(_,i)=>i);start(${Math.max(0,completed-1)});game.won=false;openMap()`);
  const all=mapNodes(),current=all.filter(b=>b.dataset.state==='current');assert.equal(current.length,completed===60?0:1);
  if(completed<60)assert.equal(current[0].dataset.level,completed);
  for(const node of all){const level=node.dataset.level,state=node.dataset.state;
   if(level<completed)assert.equal(state,'done');
   if(level>completed)assert.equal(state,'locked');
   assert.equal(node.className.split(' ').length,2);assert.equal(node.disabled,state==='locked');
   assert.equal(node.children.filter(c=>c.className==='step-lock').length,state==='locked'?1:0);
   assert.equal(node.children.filter(c=>c.textContent==='Estás aquí').length,state==='current'?1:0);
  }
 }
 qr('data.completed=[0,1,2,3,4,5];start(2);renderMap()');assert.equal(qr('mapLevelState(5)'),'done');assert.equal(qr('mapLevelState(6)'),'current');assert.equal(qr('mapLevelState(7)'),'locked');
 // Legacy gaps must never make level 1 current when the saved game is level 7.
 qr("data.completed=[1,2,3,4,5];start(6);openMap()");
 assert.equal(qr('currentAdventureLevel()'),6);assert.equal(qr('mapLevelState(0)'),'done');
 assert.equal(mapNodes().find(n=>n.dataset.state==='current').dataset.level,6);
 assert.ok(qe.get('mapProgress').textContent.startsWith('Nivel actual: 7'));
 const winsBefore=qr('data.completed.length');qr("renderMap()");assert.equal(qr('data.completed.length'),winsBefore);
 // All ten steps fit the same portrait frame, with separated hit targets, locks and label.
 for(let chapter=0;chapter<6;chapter++)for(const [width,height] of [[320,390],[375,500],[430,650],[500,700]]){
  const w=Math.min(width,height*4/7),h=w*7/4,stepW=Math.max(44,Math.min(64,w*.16)),stepH=Math.max(44,Math.min(52,w*.13));
  const rectangles=Array.from({length:10},(_,i)=>{const p=qr(`mapPosition(${i},${chapter})`);return {left:p.x/400*w-stepW/2,right:p.x/400*w+stepW/2+19,top:p.y/700*h-stepH/2,bottom:p.y/700*h+stepH/2+15}});
  assert.ok(rectangles.every(r=>r.left>=0&&r.right<=w&&r.top>=0&&r.bottom<=h));
  for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){const a=rectangles[i],b=rectangles[j];assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)}
 }
 qr('data.completed=Array.from({length:26},(_,i)=>i);start(26);openMap()');
 assert.equal(qe.get('adventureMap').children.length,1);assert.equal(qr('mapChapter'),2);
 qr('changeMapChapter(-1)');assert.equal(qr('mapChapter'),1);qr('changeMapChapter(100)');assert.equal(qr('mapChapter'),2);assert.equal(qe.get('mapNext').disabled,true);
 qr('changeMapChapter(-100)');assert.equal(qr('mapChapter'),0);assert.equal(qe.get('mapPrevious').disabled,true);
 // Finger drag follows pointer capture, pauses animation and persists without opening a resident.
 qr("data.completed=Array.from({length:10},(_,i)=>i);data.behaviors={};data.forestCoordinates={};insects=[];renderForest();openForest()");
 const frog=qe.get('forestResidents').children[0],event=(x,y,id=1)=>({pointerId:id,clientX:x,clientY:y,button:0,preventDefault(){}});
 frog.onpointerdown(event(100,400));assert.equal(qr('ecosystem[0].dragging'),true);
 const hopsBefore=qr('ecosystem[0].hops');qr('updateEcosystem(300000)');assert.equal(qr('ecosystem[0].hops'),hopsBefore);
 frog.onpointermove(event(150,450));frog.onpointerup(event(150,450));assert.equal(qr('ecosystem[0].dragging'),false);
 assert.ok(qr('data.forestCoordinates.sol.x')>0);const dragged=qr('JSON.stringify(data.forestCoordinates.sol)');
 frog.onclick(event(150,450));assert.equal(qr("$('resident').open"),false);
 qr('renderForest()');assert.equal(qr('JSON.stringify(ecosystem[0].position)'),dragged);
 const dragReload=boot(JSON.parse(audit.storage['coquidoku-v1']));await settle();assert.equal(dragReload.run('JSON.stringify(data.forestCoordinates.sol)'),dragged);
 const tap=qe.get('forestResidents').children[0];tap.onpointerdown(event(100,400));tap.onpointerup(event(100,400));tap.onclick(event(100,400));assert.equal(qe.get('resident').open,true);qe.get('resident').close();
 tap.onpointerdown(event(100,400));tap.onpointermove(event(10000,-10000));tap.onpointercancel(event(10000,-10000));
 assert.equal(qr('data.forestCoordinates.sol.x'),88);assert.equal(qr('data.forestCoordinates.sol.y'),45);
 // Multiple simultaneous food locations are matched by distance, one distinct target per coqui.
 qr("insects=[];data.behaviors={};ecosystem[0].position={x:15,y:70};ecosystem[1].position={x:80,y:70};ecosystem[2].position={x:50,y:82};feedAt(15,70,400000);feedAt(80,70,400000);feedAt(50,82,400000)");
 assert.equal(qr('insects.length'),9);assert.equal(qr('new Set(ecosystem.map(s=>s.targetFood)).size'),3);
 assert.ok(qr('ecosystem.every(s=>Math.hypot(insects.find(b=>b.id===s.targetFood).x-s.position.x,insects.find(b=>b.id===s.targetFood).y-s.position.y)<5)'));
 qr("data.behaviors.sol='rest';distributeInsects(400010)");assert.equal(qr('ecosystem[0].targetFood'),null);
 for(let i=0;i<7;i++)qr('feedAt(60,80,400010)');assert.equal(qr('insects.length'),30);assert.equal(qr('feedAt(40,70,400010)'),false);

 qr('openForest()');assert.equal(qe.get('forestBack').focused,true);assert.ok(!fs.readFileSync('index.html','utf8').includes('forest-atmosphere'));assert.ok(fs.readFileSync('index.html','utf8').includes('autofocus id="forestBack"'));
 assert.deepEqual(Array.from(qr('COQUIS.slice(0,6).map(c=>c.name)')),['Coquí Dorado','Pistoco','Amapola','Sila','Betances','Rita']);

 // Exhaustive bridge rotations: exactly one arrangement of the three corners connects.
 let working=0;
 qr("data.bonusPending='round:3';openBonus()");
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){
  const valid=qr(`bonusRound.tiles.find(t=>t.index===0).rotation=${a};bonusRound.tiles.find(t=>t.index===2).rotation=${b};bonusRound.tiles.find(t=>t.index===5).rotation=${c};bridgeConnected(bonusRound)`);
  if(valid)working++;
 }assert.equal(working,1);
 // 300 complete challenges: legal solutions, wrong choices, all stages, duplicate/stale inputs.
 const mini=boot();await settle();const mr=mini.run;
 const uniqueBridges=new Set(),uniqueLeafEnds=new Set(),uniqueDinners=new Set();
 for(let n=1;n<=300;n++){
  mr(`data.bonusPending='round:${10000+n}';openBonus()`);const balance=mr('data.points'),type=mr('bonusRound.type');
  assert.equal(mr('completeBonus()'),false);
  if(type==='bridge'){
   uniqueBridges.add(mr('JSON.stringify(bonusRound.tiles.map(t=>t.rotation))'));
   assert.equal(mr('bridgeConnected(bonusRound)'),false);
   assert.equal(mr('bonusPick(3)'),false);assert.equal(mr('bonusPick(8)'),false);
  }else if(type==='leaves'){
   assert.equal(mr('bonusPick(0)'),false);assert.equal(mr('startLeafShuffle()'),true);
   assert.equal(mr('startLeafShuffle()'),false);
   for(let step=0;step<3;step++){mr('advanceLeafShuffle(bonusRound)');assert.equal(mr('completeBonus()'),false);assert.equal(mr('bonusPick(0)'),false)}
   mr('advanceLeafShuffle(bonusRound)');uniqueLeafEnds.add(mr('bonusRound.slots[bonusRound.targetLeaf]'));
   assert.equal(mr('bonusRound.phase'),'answer');
   mr('bonusPick((bonusRound.slots[bonusRound.targetLeaf]+1)%3)');assert.equal(mr('bonusRound.phase'),'miss');assert.equal(mr('data.points'),balance);
  }else{
   uniqueDinners.add(mr('JSON.stringify(bonusRound.waves)'));
   assert.equal(mr('advanceSupper(bonusRound)'),false);
   mr("bonusPick(bonusRound.waves[0].findIndex(k=>k!=='fly'))");assert.equal(mr('bonusRound.caught.length'),0);
   mr("globalThis.oldSupper=bonusRound;globalThis.firstFly=bonusRound.waves[0].indexOf('fly');bonusPick(firstFly)");
   assert.equal(mr('bonusPick(firstFly)'),false);assert.equal(mr('completeBonus()'),false);
  }
  solveBonus(mr);
  assert.equal(mr('data.points'),balance+20);assert.equal(mr('completeBonus()'),false);assert.equal(mr('bonusPick(0)'),false);
  if(type==='bridge')assert.ok(mr('bonusRound.moves')<=9);
  if(type==='supper')assert.equal(mr('bonusPick(firstFly,oldSupper,0)'),false);
 }
 assert.ok(uniqueBridges.size>12);assert.equal(uniqueLeafEnds.size,3);assert.ok(uniqueDinners.size>50);
 // Real scheduled callbacks: 4 seconds to follow leaves; close and background cancel work.
 let clock=0,serial=0;const tasks=new Map();
 const timed=boot(null,{setTimeout:(fn,delay)=>{const id=++serial;tasks.set(id,{fn,at:clock+delay});return id},clearTimeout:id=>tasks.delete(id)});
 await settle();const tr=timed.run,te=timed.els;
 function tick(ms){const end=clock+ms;for(;;){const next=[...tasks].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;clock=next[1].at;tasks.delete(next[0]);next[1].fn()}clock=end}
 tr("data.bonusPending='round:1';openBonus();startLeafShuffle()");
 tick(699);assert.equal(tr('bonusRound.shuffleStep'),0);tick(1);assert.equal(tr('bonusRound.shuffleStep'),1);
 tick(2200);assert.equal(tr('bonusRound.shuffleStep'),3);assert.equal(tr('bonusRound.phase'),'shuffle');tick(1100);assert.equal(tr('bonusRound.phase'),'answer');assert.equal(tr('bonusTimers.size'),0);
 tr('startLeafShuffle()');tick(200);te.get('bonus').close();te.get('bonus').emit('close');assert.equal(tr('bonusTimers.size'),0);tick(10000);assert.equal(tr('data.points'),0);
 tr('openBonus();startLeafShuffle()');tick(700);
 timed.ctx.document.visibilityState='hidden';for(const fn of timed.ctx.document.listeners.visibilitychange)fn();
 assert.equal(tr('bonusRound.phase'),'peek');assert.equal(tr('bonusTimers.size'),0);tick(10000);assert.equal(tr('data.points'),0);
 timed.ctx.document.visibilityState='visible';tr('data.motion=true;startLeafShuffle()');tick(4900);assert.equal(tr('bonusRound.phase'),'answer');tr('bonusPick(bonusRound.slots[bonusRound.targetLeaf])');assert.equal(tr('data.points'),20);
 tr("data.bonusPending='round:2';openBonus();for(let i=0;i<6;i++)if(bonusRound.waves[0][i]==='fly')bonusPick(i)");
 assert.equal(tr('bonusRound.phase'),'between');tick(649);assert.equal(tr('bonusRound.wave'),0);tick(1);assert.equal(tr('bonusRound.wave'),1);
 // Old DOM callbacks cannot affect a replacement challenge or a new insect wave.
 tr("globalThis.prior=bonusRound;globalThis.stale=bonusRound.waves[0].indexOf('fly')");
 assert.equal(tr('bonusPick(stale,prior,0)'),false);tr("data.bonusPending='round:3';openBonus()");assert.equal(tr('bonusPick(0,prior,1)'),false);
 // Theme preferences and board contents survive cosmetic changes and reload.
 const palettes=new Set(),scenes=new Set();
 for(const theme of ['leaf','night','garden'])for(let level=0;level<60;level++){
  const look=mr(`boardAppearance(${level},'${theme}')`);
  assert.equal(look.palette.length,8);assert.equal(new Set(look.palette).size,8);assert.equal(look.chapter,Math.floor(level/10));
  if(theme==='night'){palettes.add(look.palette.join(','));scenes.add(look.scene)}
 }
 assert.equal(palettes.size,60);assert.ok(scenes.size>=4);
 mr("data.theme='garden';start(8);play(puzzle().solution[0]);globalThis.beforeCosmetic=JSON.stringify(game);theme();paintBoardAppearance()");
 assert.equal(mr('JSON.stringify(game)'),mr('beforeCosmetic'));assert.equal(mr('data.theme'),'garden');
 const cosmeticsSaved=boot(JSON.parse(mini.storage['coquidoku-v1']));await settle();assert.equal(cosmeticsSaved.run('data.theme'),'garden');assert.equal(cosmeticsSaved.run('JSON.stringify(game)'),mr('beforeCosmetic'));


 {
 // Exactly four seconds after a mini-game win: "Lo lograste", then close results and show map.
 let realNow=100000,nextId=0;const scheduled=new Map();
 class GameDate extends Date{constructor(...args){super(...(args.length?args:[realNow]))}static now(){return realNow}}
 const extra=boot(null,{Date:GameDate,setTimeout:(fn,delay)=>{const id=++nextId;scheduled.set(id,{fn,at:realNow+delay});return id},clearTimeout:id=>scheduled.delete(id)});
 await settle();const xr=extra.run,xe=extra.els;
 function advance(ms){const end=realNow+ms;for(;;){const next=[...scheduled].filter(([,task])=>task.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;realNow=next[1].at;scheduled.delete(next[0]);next[1].fn()}realNow=end}
 xr("data.bonusPending='round:3';openBonus();$('result').showModal()");solveBonus(xr);
 assert.equal(xe.get('bonusTitle').textContent,'Lo lograste');assert.equal(xe.get('bonus').open,true);
 advance(3999);assert.equal(xe.get('bonus').open,true);advance(1);
 assert.equal(xe.get('bonus').open,false);assert.equal(xe.get('result').open,false);assert.equal(xe.get('levels').open,true);
 // Switching apps cannot lose the pending return or create a second reward.
 xe.get('levels').close();xr("data.bonusPending='round:6';openBonus()");solveBonus(xr);const paid=xr('data.points');
 extra.ctx.document.visibilityState='hidden';for(const fn of extra.ctx.document.listeners.visibilitychange)fn();advance(6000);
 extra.ctx.document.visibilityState='visible';for(const fn of extra.ctx.document.listeners.visibilitychange)fn();advance(0);
 assert.equal(xe.get('levels').open,true);assert.equal(xr('data.points'),paid);
 // Protection is awarded once every third solved challenge, then consumed only on activation.
 xe.get('levels').close();xr("data.bonusClaims=[];data.shields=0;data.points=0");
 for(let n=1;n<=3;n++){xr(`data.bonusPending='round:${30+n}';openBonus()`);solveBonus(xr);assert.equal(xr('data.shields'),n===3?1:0)}
 assert.equal(xr('data.points'),60);assert.equal(xr('completeBonus()'),false);assert.equal(xr('data.shields'),1);
 xr("cancelBonusReturn();$('bonus').close();start(0)");
 assert.equal(xr('activateProtection()'),true);assert.equal(xr('data.shields'),0);assert.equal(xr('activateProtection()'),false);
 assert.equal(xe.get('shieldTimer').textContent,'00:30');assert.equal(xe.get('shieldTimer').hidden,false);
 const protectedCell=xr('(puzzle().solution[0]+1)%8');xr(`play(${protectedCell})`);assert.equal(xr('game.lives'),4);
 advance(29250);assert.equal(xe.get('shieldTimer').textContent,'00:01');xr(`play(${protectedCell})`);assert.equal(xr('game.lives'),4);
 advance(750);assert.equal(xr('isProtected()'),false);assert.equal(xe.get('shieldTimer').hidden,true);xr(`play(${protectedCell})`);assert.equal(xr('game.lives'),3);
 // Persisted absolute deadline survives reload; switching levels cannot replenish or carry it.
 xr("data.shields=2;activateProtection();save()");const shieldSave=JSON.parse(extra.storage['coquidoku-v1']),expires=shieldSave.game.shieldUntil;
 realNow+=10000;const shieldReload=boot(shieldSave,{Date:GameDate});await settle();
 assert.equal(shieldReload.run('protectionRemaining()'),20000);assert.equal(shieldReload.run('data.shields'),1);
 realNow=expires;assert.equal(shieldReload.run('isProtected()'),false);xr("start(2)");assert.equal(xr('isProtected()'),false);assert.equal(xr('data.shields'),1);
 // Zero lives always block input, including old relaxed preferences and owned protection.
 xr("data.points=19;data.relax=true;game.lives=0;data.shields=1;lost()");const deadCells=xr('JSON.stringify(game.cells)');
 xr('play(puzzle().solution[0])');assert.equal(xr('JSON.stringify(game.cells)'),deadCells);assert.equal(xr('activateProtection()'),false);
 assert.equal(xr('buyHearts(1)'),false);assert.equal(xr('data.points'),19);assert.equal(xr('game.lives'),0);assert.equal(xe.get('buyOneHeart').disabled,true);
 xr("data.points=40;game.cells[puzzle().solution[0]]=2;game.hints=2;save();lost()");
 const deadPuzzle=xr('game.puzzle'),deadVariant=xr('game.variant'),deadLevel=xr('game.level'),deadPosition=xr('JSON.stringify(game.cells)');
 assert.equal(xr('buyHearts(2)'),true);assert.equal(xr('data.points'),0);assert.equal(xr('game.lives'),2);
 assert.equal(xr('JSON.stringify(game.cells)'),deadPosition);assert.equal(xr('game.hints'),2);assert.equal(xr('buyHearts(2)'),false);assert.equal(xr('lost()'),false);
 xr("game.lives=0;data.points=20;lost()");assert.equal(xr('buyHearts(1)'),true);assert.equal(xr('game.lives'),1);assert.equal(xr('data.points'),0);
 xr('game.lives=0;lost()');assert.equal(xr('restartLostLevel()'),true);assert.equal(xr('game.lives'),4);assert.equal(xr('game.hints'),0);
 assert.equal(xr('game.cells.every(c=>c===0)'),true);assert.equal(xr('game.puzzle'),deadPuzzle);assert.equal(xr('game.variant'),deadVariant);assert.equal(xr('game.level'),deadLevel);
 const noRelax=boot({rulesV3:true,relax:true});await settle();assert.equal(noRelax.run('data.relax'),false);assert.ok(!fs.readFileSync('index.html','utf8').includes('relaxToggle'));
 // Flower: first correct coqui/X gets 10 points once; wrong first, undo, replay and hints cannot farm.
 const blossom=boot();await settle();const br=blossom.run;
 br("data.points=0;data.flowerClaims=[];start(1);globalThis.flowerIndex=flowerCell();mode=puzzle().solution[flowerIndex>>3]===flowerIndex%8?'coqui':'mark';play(flowerIndex)");
 assert.equal(br('data.points'),10);assert.equal(br('game.flowerCollected'),true);assert.equal(br('data.flowerClaims.length'),1);
 blossom.els.get('undoBtn').onclick();br('play(flowerIndex)');assert.equal(br('data.points'),10);
 br("start(1);flowerIndex=flowerCell();mode=puzzle().solution[flowerIndex>>3]===flowerIndex%8?'coqui':'mark';play(flowerIndex)");assert.equal(br('data.points'),10);
 br("start(6);flowerIndex=flowerCell();globalThis.flowerHasCoqui=puzzle().solution[flowerIndex>>3]===flowerIndex%8;mode=flowerHasCoqui?'mark':'coqui';play(flowerIndex);mode=flowerHasCoqui?'coqui':'mark';play(flowerIndex);play(flowerIndex)");
 assert.equal(br('data.points'),10);assert.equal(br('game.flowerCollected'),undefined);assert.equal(br('game.flowerAttempted'),true);
 br("start(0,true,12346);flowerIndex=flowerCell();mode=puzzle().solution[flowerIndex>>3]===flowerIndex%8?'coqui':'mark';play(flowerIndex);save()");
 assert.equal(br('data.points'),20);assert.ok(br("data.flowerClaims.includes('daily:12346')"));
 const flowerReload=boot(JSON.parse(blossom.storage['coquidoku-v1']));await settle();assert.equal(flowerReload.run('data.flowerClaims.length'),2);
 br("data.points=0;data.flowerClaims=[];for(let n=0;n<200;n++){start(1);if(puzzle().solution[flowerCell()>>3]===flowerCell()%8)break}for(let row=0;row<(flowerCell()>>3);row++)game.cells[row*8+puzzle().solution[row]]=2");
 assert.equal(br('puzzle().solution[flowerCell()>>3]===flowerCell()%8'),true);
 blossom.els.get('hintBtn').onclick();assert.equal(br('game.flowerAttempted'),true);assert.equal(br('data.points'),0);
 // Text surfaces have at least 4.5:1 contrast for primary and secondary copy in all three themes.
 const luminance=hex=>{const rgb=hex.match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
 for(const [surface,ink,sub] of [['fff7e7','284329','5d704e'],['153b43','f4e6c9','c3d2c5'],['fff1f1','654360','82677c']])for(const text of [ink,sub]){const x=luminance(surface),y=luminance(text);assert.ok((Math.max(x,y)+.05)/(Math.min(x,y)+.05)>=4.5)}
 console.log('PASS: 4-second mini-game return; background/resume; shield award, spending, exact 30-second expiry and reload; zero-life blocking; exact heart prices and same-board restart; first-guess flower rewards and no farming; readable text contrast.');
 }

 console.log('PASS: 300 full short mini-games, all 64 bridge orientations, 60 distinct level palettes, timed leaf shuffles, two food waves; one payout; stale callbacks rejected; close/background timer cleanup.');
 console.log('PASS: all 61 progression states; completed green/current yellow/locked gray exclusive; exactly one current and caption; locks only beside locked steps; one region per screen, all ten stops visible, no layout collisions at 320–500px; finger dragging, saved coordinates and simultaneous distributed food; replay cannot recolor completed level; finale fully green; initial focus stays off coquis; updated names; incomplete objectives cannot award points.');
 console.log('PASS: insects retained until contact and then all eaten; no preselected feeding or character; reversed ascending route; only reached chapters rendered; no stars/Continue/manual decor; 120 generated challenges have solvable bridges, three trackable swaps and two well-defined food waves.');
 console.log('PASS: real frame-clock hop at 800ms and exactly 15 seconds later; 36px apex; rest/motion pause; loop cleanup; feeding attracts without points/seeds; 10 reached-region stops; future level protection; legacy progression and in-progress game preserved; character close leads to map; exact user audio only.');
 console.log('PASS: real audio element plays directly from discovery and resident button; mute respected in game; playback session selected when supported; visible playback failures; no Web Audio dependency; native media playback and day/night preserved.');
 console.log('PASS: points from solved mini-games and first-guess flowers; no duplicate payouts; confirmed purchases with exact balance; no purchase of finale; 60 distinct normal levels for Boricua; all unlocked residents; decor and positions persist; no locked forest previews; legacy friends retained.');
 console.log('PASS: seven collectible coquis and all unlock thresholds; locked selection blocked; stable sprite replacement; progress restored; per-win plants; four forest stages; unique normal/daily rewards; existing progress migration.');
 const base=JSON.parse(fs.readFileSync('puzzles.json'))[0];
 const legacy={theme:'leaf',emptyStartV2:true,game:{puzzle:0,cells:Array(64).fill(0),fixed:[],lives:2,won:false,hints:1,daily:false}};legacy.game.cells[base.solution[0]]=2;
 const migrated=boot(legacy);await settle();assert.equal(migrated.run('data.theme'),'night');assert.equal(migrated.run('game.lives'),3);assert.equal(migrated.run('game.hints'),1);assert.equal(migrated.run('game.cells[puzzle().solution[0]]'),2);
 await migrated.run('init()');assert.equal(migrated.run('game.lives'),3);
 const untouched={game:{puzzle:0,cells:Array(64).fill(0),fixed:[base.solution[0]],lives:3,won:false,hints:0,daily:false}};untouched.game.cells[base.solution[0]]=2;
 const initial=boot(untouched);await settle();assert.equal(initial.run('game.cells.every(x=>x===0)'),true);assert.equal(initial.run('game.lives'),4);
 const capped=boot({...legacy,game:{...legacy.game,hints:5}});await settle();assert.equal(capped.run('game.hints'),3);assert.equal(capped.els.get('hintBtn').disabled,true);
 assert.ok(!fs.readFileSync('styles.css','utf8').includes('animation:pop'));
 console.log('PASS: immediate stable sprite nodes; four lives; three hints enforced including undo; counters; reset; victory; saved theme; one-time migration preserves moves and mistakes.');
 console.log('PASS: empty starts; 100 randomized boards; eight transformations; stable daily and resumed game.');
})().catch(e=>{console.error(e);process.exitCode=1});
