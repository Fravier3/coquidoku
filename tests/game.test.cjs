const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class E{
 constructor(id=''){this.id=id;this.children=[];this.dataset={};this.style={props:{},setProperty(k,v){this.props[k]=v}};this.attrs={};this.classList={add(){},remove(){},toggle(){}};this.open=false;this.textContent='';this.hidden=false}
 get firstElementChild(){return this.children[0]||null}
 append(...xs){for(const x of xs)this.children.push(...(x.fragment?x.children:[x]))}
 replaceChildren(...xs){this.children=[];this.append(...xs)}
 play(){this.playCount=(this.playCount||0)+1;return Promise.resolve()}pause(){this.pauseCount=(this.pauseCount||0)+1}
 setAttribute(k,v){this.attrs[k]=v}addEventListener(){}querySelector(){return new E()}showModal(){this.open=true}close(){this.open=false}focus(){this.focused=true}
}
function boot(saved,options={}){
 const els=new Map(),themes=['leaf','night','garden'].map(t=>{const e=new E();e.dataset.pick=t;return e});
 const storage=saved?{'coquidoku-v1':JSON.stringify(saved)}:{};
 const ctx={console,Intl,Date,JSON,Math,Array,Number,String,Error,setTimeout:()=>1,clearTimeout(){},location:{reload(){}},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('puzzles.json','utf8'))}),document:{body:new E(),visibilityState:'visible',getElementById:id=>{if(!els.has(id))els.set(id,new E(id));return els.get(id)},createElement:()=>new E(),createTextNode:text=>({textContent:text}),createDocumentFragment:()=>{const e=new E();e.fragment=true;return e},querySelector:()=>new E(),querySelectorAll:s=>s==='[data-pick]'?themes:[],addEventListener(){}},window:{addEventListener(){},...(options.window||{})}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);
 return {ctx,els,storage,run:s=>vm.runInContext(s,ctx)};
}
const settle=()=>new Promise(r=>setImmediate(r));
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
 // Exercise every challenge, including invalid answers, restart, and duplicate claim protection.
 for(const type of ['pairs','song','count']){
  er(`data.bonusCounter++;data.bonusPending=missionKey();openBonus();bonusRound.type='${type}';bonusRound.cards=[0,0,1,1,2,2];renderBonus()`);
  const balance=er('data.points');
  if(type==='pairs'){
   er("bonusRound.cards=[0,1,2,0,1,2];bonusRound.matched=[];bonusRound.revealed=[];bonusPick(0);bonusPick(1)");
   assert.equal(er('data.points'),balance);assert.equal(er('bonusPick(2)'),false);
   er("bonusRound.revealed=[];for(const [a,b] of [[0,3],[1,4],[2,5]]){bonusPick(a);bonusPick(b)}");
  }else if(type==='song'){
   er("bonusRound.phase='answer';bonusPick((bonusRound.sequence[0]+1)%3)");assert.equal(er('data.points'),balance);
   er("for(const v of bonusRound.sequence)bonusPick(v)");
  }else{
   er("bonusPick(bonusRound.options.find(v=>v!==bonusRound.answer))");assert.equal(er('data.points'),balance);
   er("bonusPick(bonusRound.answer)");
  }
  assert.equal(er('data.points'),balance+20);assert.equal(er('completeBonus()'),false);assert.equal(er('data.points'),balance+20);
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
  assert.equal(fr('data.points'),balance);assert.equal(fr('bonusRound.type'),['song','count','pairs'][level%3]);
  if(fr('bonusRound.type')==='song')fr("bonusRound.phase='answer';for(const v of bonusRound.sequence)bonusPick(v)");
  else if(fr('bonusRound.type')==='count')fr('bonusPick(bonusRound.answer)');
  else fr("for(let v=0;v<3;v++)for(let i=0;i<6;i++)if(bonusRound.cards[i]===v)bonusPick(i)");
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
 const currency=hr('data.points'),seeds=hr('victories()');hr("data.behaviors.sol='explore';feedAt(60,70,71000);updateEcosystem(71100);updateEcosystem(71550)");assert.equal(hr('data.feedings'),1);assert.equal(hr('data.points'),currency);assert.equal(hr('victories()'),seeds);assert.equal(hr('feedAt(60,70,71001)'),false);
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
 hr("data.motion=false;data.behaviors={};insects=[];renderForest();lastFeeding=-Infinity;feedAt(18,80,100000)");assert.equal(hr('insects.length'),3);
 hr('updateEcosystem(100050);renderForest()');assert.equal(hr('insects.length'),3);
 for(let t=100120;t<120000;t+=100)hr(`updateEcosystem(${t})`);
 assert.equal(hr('insects.length'),0);assert.equal(he.get('forestFood').children.length,0);
 hr("feeding=true;openForest()");assert.equal(hr('feeding'),false);assert.equal(he.get('forestFeedBtn').attrs['aria-pressed'],'false');
 hr("data.completed=Array.from({length:10},(_,i)=>i);start(10);renderMap()");assert.equal(he.get('adventureMap').children.length,2);
 assert.ok(hr('mapPosition(0).y>mapPosition(1).y'));assert.ok(hr('mapPosition(8).y>mapPosition(9).y'));
 assert.equal(he.get('adventureMap').children[0].children.find(e=>e.dataset.level!==undefined).dataset.level,10);
 const mapButtons=he.get('adventureMap').children.flatMap(c=>c.children.filter(e=>e.dataset.level!==undefined));assert.ok(mapButtons.every(b=>!b.children.some(c=>String(c.textContent).includes('★')||c.textContent==='Bloqueado')));
 assert.ok(!fs.readFileSync('index.html','utf8').includes('mapContinue'));assert.ok(!fs.readFileSync('index.html','utf8').includes('forestCustomizeBtn'));
 for(let seed=1;seed<=120;seed++){
  const round=fr(`buildBonus('round:${seed}')`);assert.equal(round.countItems.filter(x=>x==='fly').length,round.answer);assert.equal(round.options.filter(x=>x===round.answer).length,1);assert.equal(new Set(round.options).size,3);assert.equal(round.sequence.length,4);assert.ok(round.sequence.slice(1).every((v,i)=>v!==round.sequence[i]));assert.deepEqual([...round.cards].sort(),[0,0,1,1,2,2]);
 }
 // Check every normal progression boundary, including a replay and the finale.
 const audit=boot();await settle();const qr=audit.run,qe=audit.els;
 const mapNodes=()=>qe.get('adventureMap').children.flatMap(c=>c.children.filter(e=>e.dataset.level!==undefined));
 for(let completed=0;completed<=60;completed++){
  qr(`data.completed=Array.from({length:${completed}},(_,i)=>i);start(${Math.max(0,completed-1)});game.won=false;renderMap()`);
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
 for(const width of [320,375,430,500]){
  const rectangles=Array.from({length:10},(_,i)=>{const p=qr(`mapPosition(${i})`);return {left:p.x/400*width-43,right:p.x/400*width+43+26,top:p.y-34,bottom:p.y+34+24}});
  assert.ok(rectangles.every(r=>r.left>=0&&r.right<=width));
  for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){const a=rectangles[i],b=rectangles[j];assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)}
 }
 qr('openForest()');assert.equal(qe.get('forestBack').focused,true);assert.ok(!fs.readFileSync('index.html','utf8').includes('forest-atmosphere'));assert.ok(fs.readFileSync('index.html','utf8').includes('autofocus id="forestBack"'));
 assert.deepEqual(Array.from(qr('COQUIS.slice(0,6).map(c=>c.name)')),['Coquí Dorado','Pistoco','Amapola','Sila','Betances','Rita']);
 // A payout cannot be requested before any of the three objectives is solved.
 for(const type of ['pairs','song','count']){
  qr(`data.bonusCounter++;data.bonusPending=missionKey();openBonus();bonusRound.type='${type}'`);
  const balance=qr('data.points');assert.equal(qr('completeBonus()'),false);assert.equal(qr('data.points'),balance);
  if(type==='song'){qr("bonusRound.phase='answer';bonusPick((bonusRound.sequence[0]+1)%3)");assert.equal(qr('bonusRound.input.length'),0)}
  if(type==='count'){qr('bonusPick(bonusRound.answer+100)');assert.equal(qr('bonusRound.submittedAnswer'),undefined)}
 }
 // Complete every challenge type over 120 generated rounds, including wrong inputs.
 const mini=boot();await settle();const mr=mini.run;
 for(let n=1;n<=120;n++){
  mr(`data.bonusPending='round:${10000+n}';bonusRound=buildBonus(data.bonusPending);renderBonus()`);const before=mr('data.points'),type=mr('bonusRound.type');
  assert.equal(mr('completeBonus()'),false);
  if(type==='pairs'){
   mr('bonusPick(0);bonusPick(bonusRound.cards.findIndex((v,i)=>i!==0&&v!==bonusRound.cards[0]))');assert.equal(mr('data.points'),before);assert.equal(mr('bonusRound.matched.length'),0);
   mr('bonusRound.revealed=[];for(let value=0;value<3;value++)for(let i=0;i<6;i++)if(bonusRound.cards[i]===value)bonusPick(i)');
  }else if(type==='song'){
   mr("bonusRound.phase='answer';bonusPick((bonusRound.sequence[0]+1)%3)");assert.equal(mr('data.points'),before);
   const sequence=Array.from(mr('bonusRound.sequence'));for(let i=0;i<4;i++){mr(`bonusPick(${sequence[i]})`);assert.equal(mr('data.points'),before+(i===3?20:0))}
  }else{
   for(const wrong of Array.from(mr('bonusRound.options.filter(n=>n!==bonusRound.answer)'))){mr(`bonusPick(${wrong})`);assert.equal(mr('data.points'),before)}
   mr('bonusPick(bonusRound.answer)');
  }
  assert.equal(mr('data.points'),before+20);assert.equal(mr('completeBonus()'),false);assert.equal(mr('bonusPick(0)'),false);
 }
 console.log('PASS: 120 full minigame rounds, wrong answers and all intermediate memory steps; payout only at solved objective; replayed click and duplicate completion rejected.');
 console.log('PASS: all 61 progression states; completed green/current yellow/locked gray exclusive; exactly one current and caption; locks only beside locked steps; no layout collisions at 320–500px; replay cannot recolor completed level; finale fully green; initial focus stays off coquis; updated names; incomplete objectives cannot award points.');
 console.log('PASS: insects retained until contact and then all eaten; no preselected feeding or character; reversed ascending route; only reached chapters rendered; no stars/Continue/manual decor; 120 generated challenges have valid counts, unique correct option and meaningful memory sequences.');
 console.log('PASS: real frame-clock hop at 800ms and exactly 15 seconds later; 36px apex; rest/motion pause; loop cleanup; feeding attracts without points/seeds; 10 reached-region stops; future level protection; legacy progression and in-progress game preserved; character close leads to map; exact user audio only.');
 console.log('PASS: real audio element plays directly from discovery and resident button; mute respected in game; playback session selected when supported; visible playback failures; no Web Audio dependency; native media playback and day/night preserved.');
 console.log('PASS: points exclusively from all three minigames; no duplicate payouts; confirmed purchases with exact balance; no purchase of finale; 60 distinct normal levels for Boricua; all unlocked residents; decor and positions persist; no locked forest previews; legacy friends retained.');
 console.log('PASS: seven collectible coquis and all unlock thresholds; locked selection blocked; stable sprite replacement; progress restored; per-win plants; four forest stages; unique normal/daily rewards; existing progress migration.');
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
