const $=id=>document.getElementById(id);
const KEY='coquidoku-v1';
const defaults={theme:'night',sound:true,mapMusic:true,boardMusic:true,auto:false,relax:false,motion:false,difficulty:'calm',completed:[],dailyWins:[],character:null,points:0,shields:0,flowerClaims:[],earned:[],purchased:[],bonusClaims:[],bonusPending:null,bonusCounter:0,decorGifts:[],decor:[null,null,null],positions:{},forestCoordinates:{},care:{},forestFood:'fly',feedings:0,behaviors:{},game:null};
let data;try{data={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{data={...defaults}}
data.theme='night';
data.mapMusic=true;
data.boardMusic=data.boardMusic!==false;
data.completed=[...new Set((Array.isArray(data.completed)?data.completed:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<60))];data.dailyWins=[...new Set((Array.isArray(data.dailyWins)?data.dailyWins:[]).filter(n=>Number.isInteger(n)&&n>=0))];
data.points=Number.isSafeInteger(data.points)&&data.points>=0?data.points:0;
data.shields=Number.isSafeInteger(data.shields)&&data.shields>=0?data.shields:0;
data.flowerClaims=[...new Set((Array.isArray(data.flowerClaims)?data.flowerClaims:[]).filter(key=>typeof key==='string'&&/^(level|daily):\d+$/.test(key)))];
data.relax=false;
for(const k of ['earned','purchased'])data[k]=[...new Set((Array.isArray(data[k])?data[k]:[]).filter(x=>['sol','menta','brisa','flor','luna','aurora'].includes(x)))];
data.bonusClaims=[...new Set((Array.isArray(data.bonusClaims)?data.bonusClaims:[]).filter(x=>typeof x==='string'&&/^(level|daily|round):\d+$/.test(x)))];
if(typeof data.bonusPending!=='string'||!/^(level|daily|round):\d+$/.test(data.bonusPending)||data.bonusClaims.includes(data.bonusPending))data.bonusPending=null;
data.decor=Array.isArray(data.decor)?[0,1,2].map(i=>['fern','flowers','log','stones','fireflies','sapling'].includes(data.decor[i])?data.decor[i]:null):[null,null,null];
data.positions=data.positions&&typeof data.positions==='object'&&!Array.isArray(data.positions)?Object.fromEntries(Object.entries(data.positions).filter(([id,z])=>['sol','menta','brisa','flor','luna','aurora','boricua'].includes(id)&&Number.isInteger(z)&&z>=0&&z<3)):{};
data.forestCoordinates=data.forestCoordinates&&typeof data.forestCoordinates==='object'?Object.fromEntries(Object.entries(data.forestCoordinates).filter(([id,p])=>['sol','menta','brisa','flor','luna','aurora','boricua'].includes(id)&&p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=8&&p.x<=88&&p.y>=45&&p.y<=88)):{};
data.bonusCounter=Number.isSafeInteger(data.bonusCounter)&&data.bonusCounter>=0?data.bonusCounter:0;
data.decorGifts=(Array.isArray(data.decorGifts)?data.decorGifts:[]).filter(x=>['flowers','log','fireflies'].includes(x));
data.behaviors=data.behaviors&&typeof data.behaviors==='object'&&!Array.isArray(data.behaviors)?Object.fromEntries(Object.entries(data.behaviors).filter(([id,v])=>['sol','menta','brisa','flor','luna','aurora','boricua'].includes(id)&&['rest','explore'].includes(v))):{};
if(!data.rulesV3){data.theme='night';if(data.game&&Number.isInteger(data.game.lives)&&data.game.lives>=0&&data.game.lives<=3)data.game.lives+=1;if(data.game)data.game.hints=Math.min(3,Math.max(0,Number(data.game.hints)||0));data.rulesV3=true}
// Enable the requested call once on upgrade; later manual mute choices persist.
if(!data.soundFixV141){data.sound=true;data.soundFixV141=true}
data.care=data.care&&typeof data.care==='object'&&!Array.isArray(data.care)?data.care:{};
data.forestFood=['fly','butterfly','worm','ant'].includes(data.forestFood)?data.forestFood:'fly';
data.feedings=Number.isSafeInteger(data.feedings)&&data.feedings>=0?data.feedings:0;
let puzzles=[],game,mode='coqui',undo=[],errorsTimer,errorCell=null;

const COQUIS=[
 {id:'sol',name:'Coquí Dorado',at:0,price:0,detail:'Un rayito de calidez',src:'assets/coqui.webp'},
 {id:'menta',name:'Pistoco',at:5,price:80,detail:'Fresco como una hoja nueva',src:'assets/coqui-menta.webp'},
 {id:'brisa',name:'Amapola',at:10,price:160,detail:'La calma junto al río',src:'assets/coqui-brisa.webp'},
 {id:'flor',name:'Sila',at:20,price:320,detail:'Un toque de alegría tropical',src:'assets/coqui-flor.webp'},
 {id:'luna',name:'Betances',at:35,price:560,detail:'Un amigo de las luciérnagas',src:'assets/coqui-luna.webp'},
 {id:'aurora',name:'Rita',at:50,price:800,detail:'Los colores de un nuevo día',src:'assets/coqui-aurora.webp'},
 {id:'boricua',name:'Boricua',at:60,price:null,detail:'El orgullo de nuestra isla',src:'assets/coqui-boricua.webp'}
];
for(const c of COQUIS)c.sleepSrc=`assets/coqui-${c.id}-sleep.webp`;
const FOREST_STAGES=[
 {at:0,name:'Un nuevo comienzo',src:'assets/forest-0.webp',description:'Un claro tranquilo espera tus primeras semillas.'},
 {at:10,name:'Primeros brotes',src:'assets/forest-1.webp',description:'Las primeras plantas ya encuentran su lugar.'},
 {at:25,name:'Jardín de vida',src:'assets/forest-2.webp',description:'Flores y árboles jóvenes llenan tu rincón.'},
 {at:50,name:'Bosque encantado',src:'assets/forest-3.webp',description:'Tu refugio se ha convertido en un bosque lleno de vida.'}
];
const DECORATIONS=[
 {id:'fern',name:'Helechos',at:0},{id:'flowers',name:'Hibiscos',at:3},
 {id:'log',name:'Tronco de descanso',at:5},{id:'stones',name:'Piedras del río',at:10},
 {id:'fireflies',name:'Luciérnagas',at:15},{id:'sapling',name:'Arbolito',at:25}
];
const ZONES=['Junto al río','Bajo el árbol','En el claro'];
function victories(){return data.completed.length+data.dailyWins.length}
function unlockedCoqui(c){return c.id==='boricua'?data.completed.length===60:c.at===0||data.completed.length>=c.at||data.earned.includes(c.id)||data.purchased.includes(c.id)}
function forestStage(){return FOREST_STAGES.filter(s=>victories()>=s.at).at(-1)}
function activeCoqui(){return COQUIS.find(c=>c.id===data.character&&unlockedCoqui(c))||COQUIS[0]}
// One-time grant honors existing friends without awarding points for levels.
if(!data.yunqueV1){data.earned=COQUIS.filter(c=>c.id!=='boricua'&&victories()>=c.at).map(c=>c.id);data.points=0;data.yunqueV1=true}
if(!data.selectionV16){if(data.character==='sol')data.character=null;data.selectionV16=true}
if(data.character&&!COQUIS.some(c=>c.id===data.character&&unlockedCoqui(c)))data.character=null;
function progression(){const n=victories(),next=COQUIS.find(c=>!unlockedCoqui(c));return {n,next,stage:forestStage(),unlocked:COQUIS.filter(unlockedCoqui)}}
function paintCareer(){const p=progression(),active=activeCoqui();$('careerCount').textContent=`${data.points} puntos · ${data.completed.length}/60 niveles · ${p.n} semillas`;$('characterName').textContent=data.character?active.name:'Elige tu coquí';$('careerFrog').src=active.src;$('forestBrief').textContent=`${p.unlocked.length} coquíes en tu refugio`;for(const id of ['resultSprite','helpSprite'])$(id).src=active.src;$('bonusBtn').hidden=!data.bonusPending;$('bonusBtn').disabled=!data.bonusPending;$('resultBonusBtn').disabled=!data.bonusPending;$('bonusBtn').textContent=data.bonusPending?'Minijuego pendiente · +20 puntos':'Retos extra al completar niveles'}
function chooseCoqui(id){const c=COQUIS.find(c=>c.id===id);if(!c||!unlockedCoqui(c))return false;data.character=id;render();renderCollection();feedback(`${c.name} te acompaña en el tablero.`);return true}
let purchaseTarget=null;
function requestPurchase(id){const c=COQUIS.find(c=>c.id===id);if(!c||!c.price||unlockedCoqui(c)||data.points<c.price)return false;purchaseTarget=id;$('purchaseText').textContent=`¿Desbloquear a ${c.name} por ${c.price} puntos? Tienes ${data.points} puntos. Estará disponible en el tablero y en El Yunque.`;showDialog('purchase');return true}
function buyCoqui(id){const c=COQUIS.find(c=>c.id===id);if(!c||!c.price||unlockedCoqui(c)||data.points<c.price)return false;data.points-=c.price;data.purchased.push(id);save();paintCareer();renderCollection();$('collectionNotice').textContent=`¡${c.name} ya vive en El Yunque!`;return true}
$('purchaseConfirm').onclick=()=>{buyCoqui(purchaseTarget);purchaseTarget=null;$('purchase').close()};
function renderCollection(){const p=progression();$('collectionCount').textContent=`${p.unlocked.length} de 7 amigos · ${data.points} puntos`;$('nextCoqui').textContent=p.next?`Próximo por niveles: ${p.next.name} · ${data.completed.length}/${p.next.at} niveles completados`:'¡Tu familia de coquíes está completa!';const cards=document.createDocumentFragment();for(const c of COQUIS){const unlocked=unlockedCoqui(c),selected=c.id===data.character;const card=document.createElement('article');card.className='coqui-card'+(unlocked?'':' locked')+(selected?' chosen':'');const image=document.createElement('img');image.src=c.src;image.alt=c.name;image.width=150;image.height=150;const title=document.createElement('h3');title.textContent=c.name;const desc=document.createElement('p');desc.textContent=c.detail;const target=document.createElement('small');target.textContent=c.id==='boricua'?`Exclusivo: completa los 60 niveles · ${data.completed.length}/60. No se compra con puntos.`:c.at===0?'Tu primer compañero':`Completa ${c.at} niveles o compra por ${c.price} puntos.`;const button=document.createElement('button');button.className=selected?'selected-coqui':'pick-coqui';button.textContent=selected?'✓ Elegido':unlocked?'Elegir':c.price?`Comprar · ${c.price} puntos`:'Completa la aventura';button.disabled=selected||(!unlocked&&(!c.price||data.points<c.price));button.setAttribute('aria-label',`${c.name}: ${button.textContent}`);button.onclick=()=>unlocked?chooseCoqui(c.id):requestPurchase(c.id);card.append(image,title,desc,target,button);cards.append(card)}$('coquiCards').replaceChildren(cards);save()}
const FOREST_FOODS={
 fly:{name:'Insectos',src:'assets/insect-fly.webp',min:6,max:13},
 butterfly:{name:'Mariposas',src:'assets/bonus-butterfly.webp',min:9,max:18},
 worm:{name:'Gusanitos',src:'assets/food-worm.webp',min:13,max:23},
 ant:{name:'Hormigas',src:'assets/food-ant.webp',min:4,max:11}
};
function careRandom(min,max){return min+Math.random()*(max-min)}
function residentIsSleeping(id,now=Date.now()){return (data.care[id]?.sleepUntil||0)>now}
function careFor(id,now=Date.now()){
 let c=data.care[id];
 if(!c||typeof c!=='object'||!Number.isFinite(c.satiety)||!Number.isFinite(c.lastUpdate)||!Number.isFinite(c.nextSleepAt)||!Number.isFinite(c.sleepUntil)||!Number.isFinite(c.hungerRate)){
  c=data.care[id]={satiety:careRandom(80,95),lastUpdate:now,nextSleepAt:now+careRandom(120000,300000),sleepUntil:0,hungerRate:careRandom(.45,.75)};
 }
 c.satiety=Math.max(0,Math.min(100,c.satiety));c.hungerRate=Math.max(.45,Math.min(.75,c.hungerRate));
 const elapsed=Math.max(0,now-c.lastUpdate),asleep=Math.max(0,Math.min(now,c.sleepUntil)-c.lastUpdate);
 c.satiety=Math.max(0,c.satiety-((elapsed-asleep)+asleep*.2)/60000*c.hungerRate);c.lastUpdate=now;
 if(c.sleepUntil>0&&now>=c.sleepUntil){c.sleepUntil=0;c.nextSleepAt=now+careRandom(180000,420000)}
 return c;
}
function feedResident(id,type,now=Date.now()){
 if(!COQUIS.some(c=>c.id===id&&unlockedCoqui(c))||residentIsSleeping(id,now)||data.behaviors[id]==='rest')return null;
 const food=FOREST_FOODS[type]||FOREST_FOODS.fly,c=careFor(id,now),before=c.satiety;
 c.satiety=Math.random()<.12?100:Math.min(100,before+careRandom(food.min,food.max));
 return {before,after:c.satiety,gain:c.satiety-before};
}
function putResidentToSleep(id,now=Date.now()){
 if(!COQUIS.some(c=>c.id===id&&unlockedCoqui(c)))return false;
 const c=careFor(id,now);if(c.sleepUntil>now||now<c.nextSleepAt)return false;
 c.sleepUntil=now+careRandom(15*60000,25*60000);data.behaviors[id]='explore';
 const state=ecosystem.find(s=>s.id===id);
 if(state){state.started=null;state.targetFood=null;state.next=Infinity;resetResidentPose(state);data.forestCoordinates[id]={...state.position}}
 insects.filter(b=>b.owner===id).forEach(b=>b.owner=null);
 tickResidentCare(now,true);save();return true;
}
function paintResidentDetail(now=Date.now()){
 if(!$('resident').open)return;
 const c=COQUIS.find(c=>c.id===residentId),care=careFor(residentId,now),sleeping=care.sleepUntil>now,sleepy=now>=care.nextSleepAt;
 $('residentImage').src=sleeping?c.sleepSrc:c.src;
 $('residentCareText').textContent='Alimento: '+Math.round(care.satiety)+'% · '+(sleeping?'Durmiendo · despierta a las '+new Intl.DateTimeFormat('es-PR',{hour:'numeric',minute:'2-digit'}).format(care.sleepUntil)+' · '+Math.ceil((care.sleepUntil-now)/60000)+' min':sleepy?'Tiene sueño. Puedes ponerlo a dormir.':'Despierto y tranquilo.');
 $('residentSleepBtn').disabled=sleeping||!sleepy;$('residentSleepBtn').textContent=sleeping?'Durmiendo…':'Dormir un ratito ☾';
}
let lastCarePaint=0,lastCareSave=0;
function tickResidentCare(now=Date.now(),force=false){
 if(!force&&now>=lastCarePaint&&now-lastCarePaint<1000)return;lastCarePaint=now;
 for(const state of ecosystem){
  const c=COQUIS.find(c=>c.id===state.id),care=careFor(state.id,now),sleeping=care.sleepUntil>now,sleepy=now>=care.nextSleepAt;
  const src=sleeping?c.sleepSrc:c.src;if(state.image.dataset.careSprite!==src){state.image.src=src;state.image.dataset.careSprite=src}
  state.button.dataset.sleeping=String(sleeping);state.button.careFill.style.width=care.satiety+'%';
  state.button.careBar.setAttribute('aria-valuenow',String(Math.round(care.satiety)));
  state.button.careBar.style.setProperty('--care-color',care.satiety>55?'#9ac875':care.satiety>25?'#efc65f':'#e78770');
  state.button.sleepBadge.hidden=!(sleeping||sleepy);state.button.sleepBadge.textContent=sleeping?'Zz':'☾';
  state.button.setAttribute('aria-label',c.name+', alimento '+Math.round(care.satiety)+'%'+(sleeping?', durmiendo':sleepy?', tiene sueño':'')+'. Mantén pulsado para escuchar su canto.');
  if(sleeping){state.started=null;state.targetFood=null;state.next=Infinity;resetResidentPose(state)}
  else if(state.next===Infinity)state.next=forestClock+careRandom(500,1500);
 }
 paintResidentDetail(now);
 if(force||now<lastCareSave||now-lastCareSave>15000){lastCareSave=now;save()}
}
function selectForestFood(type){
 if(!FOREST_FOODS[type])return false;data.forestFood=type;feeding=true;
 $('forestFoodPicker').hidden=true;$('forestFeedBtn').setAttribute('aria-pressed','true');
 $('forestFoodIcon').src=FOREST_FOODS[type].src;$('forestFoodLabel').textContent=FOREST_FOODS[type].name;
 $('forestHint').textContent='Toca el suelo cerca de un coquí para dejar alimento. Cada porción deja tres bocaditos.';save();return true;
}
$('residentSleepBtn').onclick=()=>{if(putResidentToSleep(residentId))$('resident').close()};
for(const [id,type] of [['foodFly','fly'],['foodButterfly','butterfly'],['foodWorm','worm'],['foodAnt','ant']])$(id).onclick=()=>selectForestFood(type);
$('foodPickerClose').onclick=()=>{$('forestFoodPicker').hidden=true;feeding=false;$('forestFeedBtn').setAttribute('aria-pressed','false');$('forestHint').textContent='Arrastra un coquí para moverlo o mantén pulsado para escuchar su canto.'};
let forestTime='night';
function forestSceneSource(){return `assets/yunque-${FOREST_STAGES.indexOf(forestStage())}-${forestTime}.webp`}
function renderForest(){const p=progression(),index=FOREST_STAGES.indexOf(p.stage),next=FOREST_STAGES[index+1];$('forestTitle').textContent=p.stage.name;$('forestDescription').textContent=(forestTime==='day'?'De día · ':'De noche · ')+p.stage.description;$('forestScene').style.setProperty('--forest-scene',`url('${forestSceneSource()}')`);$('forest').style.setProperty('--forest-wallpaper',`url('${forestSceneSource()}')`);$('forestWins').textContent=p.n;$('forestFriends').textContent=p.unlocked.length;$('forestProgress').max=next?next.at-p.stage.at:60;$('forestProgress').value=next?p.n-p.stage.at:Math.min(p.n,60);$('forestNext').textContent=next?`Faltan ${next.at-p.n} semillas para el próximo cambio de El Yunque.`:'El Yunque alcanzó su etapa más frondosa. Disfruta de tu refugio y de todos sus habitantes.';const plants=document.createDocumentFragment();for(let i=0;i<Math.min(60,p.n);i++){const sprout=document.createElement('span');sprout.className='forest-sprout';sprout.style.left=(12+(i*19)%63)+'%';sprout.style.top=(57+(i*11)%32)+'%';sprout.style.setProperty('--plant-scale',String(.65+(i%4)*.12));sprout.setAttribute('aria-hidden','true');plants.append(sprout)}$('forestPlants').replaceChildren(plants);
 const autoDecor=document.createDocumentFragment();DECORATIONS.filter(d=>d.id!=='fireflies'&&(p.n>=d.at||data.decorGifts.includes(d.id))).slice(-3).forEach((d,i)=>{const img=document.createElement('img');img.src=`assets/decor-${d.id}.webp`;img.alt='';img.className='forest-decoration zone-'+i;autoDecor.append(img)});$('forestDecor').replaceChildren(autoDecor);
 const friends=document.createDocumentFragment();p.unlocked.forEach((c,i)=>{const zone=Number.isInteger(data.positions[c.id])?data.positions[c.id]:i%3,peers=p.unlocked.filter((f,j)=>(Number.isInteger(data.positions[f.id])?data.positions[f.id]:j%3)===zone),slot=peers.indexOf(c);const b=document.createElement('button');b.className='forest-friend';b.style.left=([67,18,40][zone]+(slot%3)*7)+'%';b.style.top=([53,60,66][zone]+Math.floor(slot/3)*8)+'%';if(data.forestCoordinates[c.id]){b.style.left=data.forestCoordinates[c.id].x+'%';b.style.top=data.forestCoordinates[c.id].y+'%'}b.style.zIndex=String(10+zone+slot);b.setAttribute('aria-label',`${c.name}, ${ZONES[zone]}. Arrastra para moverlo o toca para conocerlo.`);const img=document.createElement('img');img.src=c.src;img.alt='';b.append(img);const bar=document.createElement('span'),fill=document.createElement('i'),badge=document.createElement('span');bar.className='resident-hunger';bar.setAttribute('role','meter');bar.setAttribute('aria-label','Alimento de '+c.name);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.append(fill);badge.className='resident-sleep';badge.hidden=true;b.careBar=bar;b.careFill=fill;b.sleepBadge=badge;b.append(bar,badge);b.onclick=event=>{if(b.suppressClick){b.suppressClick=false;event.preventDefault();return}openResident(c.id)};bindResidentDrag(b,c.id);friends.append(b)});$('forestResidents').replaceChildren(friends);ecosystem=progression().unlocked.map((c,i)=>{const button=$('forestResidents').children[i];return {id:c.id,button,image:button.firstElementChild,position:{x:parseFloat(button.style.left),y:parseFloat(button.style.top)},next:null,started:null,targetFood:null,direction:i%2===0,hops:0}});$('forestMeals').textContent=data.feedings;const roster=document.createDocumentFragment();for(const c of p.unlocked){const b=document.createElement('button');b.textContent=c.name;b.onclick=()=>openResident(c.id);roster.append(b)}$('forestRoster').replaceChildren(roster);insects.forEach(b=>b.owner=null);renderInsects();$('forestInvite').textContent=p.unlocked.length<7?'Desbloquea más personajes para que vivan en El Yunque.':'¡Toda tu familia de coquíes vive en El Yunque!';tickResidentCare(Date.now(),true);save()}
let residentId='sol';
function openResident(id){const c=COQUIS.find(c=>c.id===id);if(!c||!unlockedCoqui(c))return;residentId=id;$('residentName').textContent=c.name;$('residentImage').src=c.src;$('residentText').textContent=c.detail+'. Ya tiene un hogar en El Yunque.';$('residentZone').value=String(data.positions[id]??progression().unlocked.indexOf(c)%3);$('residentRest').checked=data.behaviors[id]==='rest';showDialog('resident');paintResidentDetail()}
$('residentZone').onchange=()=>{const z=Number($('residentZone').value);if(z>=0&&z<3){data.positions[residentId]=z;delete data.forestCoordinates[residentId];save();renderForest()}};
$('residentCall').onclick=()=>chirp(true,true);
$('collectionBtn').onclick=()=>openCollection();
$('forestBtn').onclick=openForest;
$('resultCollectionBtn').onclick=()=>{$('result').close();openCollection('map')};
$('resultForestBtn').onclick=()=>{$('result').close();openForest()};

// Immersive ecosystem. Its frame clock is independent from CSS animation rules.
let forestReturn='game',forestRaf=null,ecosystem=[],forestClock=0,feeding=false,cancelResidentPress=null;
function bindResidentDrag(button,id){
 let drag=null,holdTimer=null;
 button.onpointerdown=event=>{
  if(event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
  const s=ecosystem.find(s=>s.id===id);if(!s)return;
  cancelResidentPress?.();button.suppressClick=false;
  drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,origin:{...s.position},moved:false};
  s.dragging=true;s.started=null;resetResidentPose(s);
  button.setPointerCapture?.(event.pointerId);
  const press=drag;holdTimer=setTimeout(()=>{if(drag===press&&!drag.moved&&$('forest').open){drag.held=true;button.suppressClick=true;startResidentHold(id)}},450);
  cancelResidentPress=()=>finish({pointerId:event.pointerId});
 };
 button.onpointermove=event=>{
  if(!drag||event.pointerId!==drag.pointer)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<6)return;
  drag.moved=true;clearTimeout(holdTimer);stopResidentHold();event.preventDefault();
  const rect=$('forestResidents').getBoundingClientRect(),s=ecosystem.find(s=>s.id===id);
  if(!s||!rect.width||!rect.height)return;
  s.position={x:Math.max(8,Math.min(88,drag.origin.x+dx/rect.width*100)),y:Math.max(45,Math.min(88,drag.origin.y+dy/rect.height*100))};
  button.style.left=s.position.x+'%';button.style.top=s.position.y+'%';
 };
 const finish=event=>{
  if(!drag||event.pointerId!==drag.pointer)return;
  clearTimeout(holdTimer);stopResidentHold();cancelResidentPress=null;
  const s=ecosystem.find(s=>s.id===id);
  if(s){s.dragging=false;s.next=forestClock+10000;s.started=null;
   if(drag.moved){data.forestCoordinates[id]={...s.position};insects.filter(b=>b.owner===id).forEach(b=>b.owner=null);s.targetFood=null;save();$('forestHint').textContent='Su nuevo rincón quedó guardado. Puedes mover a otro coquí.';}
  }
  button.suppressClick=drag.moved||!!drag.held;drag=null;
  if(button.hasPointerCapture?.(event.pointerId))button.releasePointerCapture(event.pointerId);
 };
 button.onpointerup=finish;button.onpointercancel=finish;button.onlostpointercapture=finish;
 button.ondragstart=event=>event.preventDefault();button.oncontextmenu=event=>event.preventDefault();
}

let forestAudioGeneration=0,forestAudioBlocked=false;
function forestAudioAllowed(){return $('forest').open&&document.visibilityState!=='hidden'&&!['levels','collection','settings','help','bonus'].some(id=>$(id).open)}
function stopForestAmbience(){forestAudioGeneration++;const audio=$('forestAmbience');audio.pause();audio.currentTime=0}
function startForestAmbience(){
 if(!forestAudioAllowed()){stopForestAmbience();return Promise.resolve(false)}
 stopMapMusic();const audio=$('forestAmbience'),ticket=++forestAudioGeneration;
 audio.volume=.5;audio.loop=true;forestAudioBlocked=false;
 try{return Promise.resolve(audio.play()).then(()=>{
  if(!forestAudioAllowed()){audio.pause();return false}
  return ticket===forestAudioGeneration;
 }).catch(()=>{if(ticket===forestAudioGeneration)forestAudioBlocked=true;return false})}
 catch{forestAudioBlocked=true;return Promise.resolve(false)}
}
$('forestAudioBtn').onclick=()=>{const audio=$('forestAmbience');if(audio.paused||forestAudioBlocked)startForestAmbience();else stopForestAmbience()};
$('forestAmbience').addEventListener('playing',()=>{if(!forestAudioAllowed())stopForestAmbience()});
document.addEventListener('pointerdown',()=>{if(forestAudioBlocked&&forestAudioAllowed())startForestAmbience()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopForestAmbience();else if(forestAudioAllowed())startForestAmbience()});
window.addEventListener('pagehide',stopForestAmbience);
function openForest(returnTo='game'){stopBoardMusic();forestReturn=returnTo;feeding=false;$('forestFoodPicker').hidden=true;$('forestFeedBtn').setAttribute('aria-pressed','false');$('forestHint').textContent='Arrastra un coquí para moverlo. Toca Alimentar para repartir insectos.';forestTime=Math.random()<.5?'day':'night';renderForest();showDialog('forest');startForestAmbience();$('forestBack').focus({preventScroll:true});startEcosystem()}
function stopEcosystem(){cancelResidentPress?.();stopResidentHold();if(forestRaf!==null&&window.cancelAnimationFrame)window.cancelAnimationFrame(forestRaf);forestRaf=null}
function startEcosystem(){stopEcosystem();if(!window.requestAnimationFrame||!$('forest').open||document.visibilityState==='hidden')return;const frame=t=>{forestRaf=null;if(!$('forest').open||document.visibilityState==='hidden')return;updateEcosystem(t);forestRaf=window.requestAnimationFrame(frame)};forestRaf=window.requestAnimationFrame(frame)}
let insects=[],insectSerial=0;
function renderInsects(){const fragment=document.createDocumentFragment();for(const bug of insects){const img=document.createElement('img');img.className='food-insect';img.src=(FOREST_FOODS[bug.type]||FOREST_FOODS.fly).src;img.alt='';img.style.left=bug.x+'%';img.style.top=bug.y+'%';fragment.append(img)}$('forestFood').replaceChildren(fragment)}
const FOOD_REACH=32;
function foodDistance(s,bug){return Math.hypot(bug.x-s.position.x,(bug.y-s.position.y)*1.8)}
function closestResident(bug){
 let nearest=null,distance=FOOD_REACH;
 for(const s of ecosystem){if(s.dragging||data.behaviors[s.id]==='rest'||residentIsSleeping(s.id))continue;const d=foodDistance(s,bug);if(d<distance){nearest=s;distance=d}}
 return nearest;
}
function claimInsect(s,t){
 if(s.targetFood!==null&&insects.some(b=>b.id===s.targetFood&&b.owner===s.id))return;
 s.targetFood=null;
 const nearby=insects.filter(b=>(b.owner===s.id||b.owner===null)&&closestResident(b)===s).sort((a,b)=>foodDistance(s,a)-foodDistance(s,b));
 if(!nearby.length)return;
 const bug=nearby[0];bug.owner=s.id;s.targetFood=bug.id;s.next=Math.min(s.next??Infinity,t+120);
}
function eatInsect(s,t){const bug=insects.find(b=>b.id===s.targetFood);if(bug&&Math.hypot(s.position.x-bug.x,s.position.y-bug.y)<.3){const meal=feedResident(s.id,bug.type||'fly');if(!meal)return;insects=insects.filter(b=>b!==bug);s.targetFood=null;renderInsects();tickResidentCare(Date.now(),true);$('forestHint').textContent=meal.after===100?'¡Ya está satisfecho!':'¡Qué rico! Su barra de alimento subió.';claimInsect(s,t)}else if(bug)s.next=t+280}
function resetResidentPose(state){state.button.style.setProperty('--hop-y','0px');state.image.style.transform='translate3d(0,0,0)'}
function updateEcosystem(t){forestClock=t;tickResidentCare();if(insects.length)distributeInsects(t);for(let i=0;i<ecosystem.length;i++){const s=ecosystem[i];if(s.dragging)continue;if(data.behaviors[s.id]==='rest'||residentIsSleeping(s.id)){insects.filter(b=>b.owner===s.id).forEach(b=>b.owner=null);s.targetFood=null;resetResidentPose(s);s.started=null;s.next=t+15000;continue}if(insects.length)claimInsect(s,t);if(s.next===null)s.next=t+800+i*1300;if(s.started===null&&t>=s.next){s.started=t;s.next=t+10000+((i*1297+s.hops*1931)%5001);s.from={...s.position};const bug=insects.find(b=>b.id===s.targetFood),goal=bug||{x:Math.max(8,Math.min(88,s.position.x+(s.direction?5:-5))),y:s.position.y},distance=Math.hypot(goal.x-s.position.x,goal.y-s.position.y),scale=distance>12?12/distance:1;s.target={x:s.position.x+(goal.x-s.position.x)*scale,y:s.position.y+(goal.y-s.position.y)*scale};s.direction=!s.direction;s.hops++}if(s.started!==null){const p=data.motion?1:Math.max(0,Math.min(1,(t-s.started)/900)),ease=p*p*(3-2*p),height=data.motion?0:36;s.position={x:s.from.x+(s.target.x-s.from.x)*ease,y:s.from.y+(s.target.y-s.from.y)*ease};s.button.style.left=s.position.x+'%';s.button.style.top=s.position.y+'%';s.button.style.setProperty('--hop-y',`${-4*height*p*(1-p)}px`);s.image.style.transform=`scale(${1+.06*Math.sin(p*Math.PI*2)},${1-.06*Math.sin(p*Math.PI*2)})`;if(p===1){s.started=null;resetResidentPose(s);eatInsect(s,t)}}}}
function distributeInsects(t){
 for(const bug of insects)bug.owner=closestResident(bug)?.id??null;
 for(const s of ecosystem){
  if(!insects.some(b=>b.id===s.targetFood&&b.owner===s.id))s.targetFood=null;
  if(!s.dragging&&data.behaviors[s.id]!=='rest'&&!residentIsSleeping(s.id))claimInsect(s,t);
 }
}
function feedAt(x,y,t=forestClock){if(insects.length>27){$('forestHint').textContent='Todavía quedan insectos por comer.';return false}x=Math.max(10,Math.min(86,x));y=Math.max(58,Math.min(85,y));for(let i=0;i<3;i++)insects.push({id:++insectSerial,x:Math.max(8,Math.min(88,x+(i-1)*3)),y:Math.min(86,y+(i%2)*2),owner:null,type:data.forestFood});renderInsects();distributeInsects(t);data.feedings++;save();$('forestHint').textContent='Toca otros lugares para repartir insectos. Solo el coquí activo más cercano se acerca a cada insecto.';$('forestMeals').textContent=data.feedings;return true}

function closeForest(){forestReturn=forestReturn==='map'?'map':'game';$('forest').close();handleForestClose()}
function handleForestClose(){stopForestAmbience();stopEcosystem();const back=forestReturn;forestReturn='game';if(back==='map')openMap();else syncBoardMusic()}
$('forestBack').onclick=closeForest;
$('forest').addEventListener('close',handleForestClose);
$('forestStatusBtn').onclick=()=>{showDialog('forestCustomize')};
$('forestFriendsBtn').onclick=()=>openCollection('forest');
$('forestFeedBtn').onclick=()=>{$('forestFoodPicker').hidden=!$('forestFoodPicker').hidden};
$('forestScene').addEventListener('click',event=>{if(!feeding||event.target.closest('button'))return;const rect=$('forestResidents').getBoundingClientRect();feedAt((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100)});
$('residentRest').onchange=()=>{data.behaviors[residentId]=$('residentRest').checked?'rest':'explore';save();renderForest()};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopEcosystem();else if($('forest').open)startEcosystem()});
let collectionReturn='game';
function openCollection(returnTo='game'){stopForestAmbience();collectionReturn=returnTo;$('collectionReturnBtn').textContent=returnTo==='map'?'Volver al mapa':returnTo==='forest'?'Volver a El Yunque':'Volver a jugar';renderCollection();showDialog('collection')}
function handleCollectionClose(){const back=collectionReturn;collectionReturn='game';if(back==='map')openMap();else if(back==='forest')startForestAmbience()}
$('collection').addEventListener('close',handleCollectionClose);

// Sixty numbered stops, with legacy progress preserved and a visible next level.
const CHAPTERS=['Viejo San Juan','Playas de Luquillo','Senderos de El Yunque','Bahía luminosa','Montañas de Cayey','La cumbre del coquí'];
function nextAdventureLevel(){for(let i=0;i<60;i++)if(!data.completed.includes(i))return i;return 59}
function currentAdventureLevel(){
 if(data.completed.length===60)return null;
 const completedFrontier=Math.max(0,...data.completed.map(n=>n+1));
 const savedLevel=game&&!game.daily&&!game.won&&Number.isInteger(game.level)?game.level:0;
 const candidate=Math.min(59,Math.max(completedFrontier,savedLevel));
 return data.completed.includes(candidate)?Array.from({length:60},(_,i)=>59-i).find(i=>!data.completed.includes(i)):candidate;
}
function unlockedThrough(){return currentAdventureLevel()??59}
function mapLevelState(index){const current=currentAdventureLevel();if(current===null||data.completed.includes(index)||index<current)return 'done';return index===current?'current':'locked'}
const MAP_STOPS=Array.from({length:10},(_,i)=>({x:i%2?270:120,y:625-i*57}));
function mapPosition(index,chapter=mapChapter??0){if(chapter===5&&index===0)return {x:200,y:630};if(chapter===5&&index===1)return {x:320,y:568};return MAP_STOPS[index]}
let mapChapter=null;
function openMap(){data.mapMusic=true;stopBoardMusic();$('mapMusic').currentTime=0;mapChapter=Math.floor((currentAdventureLevel()??59)/10);renderMap();stopForestAmbience();if(!$('levels').open)showDialog('levels');syncMapMusic()}
function changeMapChapter(delta){mapChapter=Math.max(0,Math.min(Math.floor(unlockedThrough()/10),(mapChapter??Math.floor(unlockedThrough()/10))+delta));renderMap()}
function selectMapLevel(index){if(!Number.isInteger(index)||index<0||index>unlockedThrough())return false;closeMap();if(game&&!game.daily&&!game.won&&game.level===index){if(game.lives===0)lost();return true;}chooseNew(()=>start(index));return true}
function renderMap(){
 const current=currentAdventureLevel(),available=unlockedThrough(),lastChapter=Math.floor(available/10);
 const c=Math.max(0,Math.min(lastChapter,mapChapter??Math.floor((current??59)/10)));mapChapter=c;
 $('mapProgress').textContent=current===null?'¡Completaste Puerto Rico!':`Nivel actual: ${current+1} · ${data.completed.length}/60 completados`;
 $('mapPrevious').disabled=c===0;$('mapNext').disabled=c===lastChapter;
 $('mapRegion').textContent=`${CHAPTERS[c]} · ${c*10+1}–${c*10+10}`;
 const section=document.createElement('section');section.className='map-chapter';section.setAttribute('aria-label',`Mapa de ${CHAPTERS[c]}, niveles ${c*10+1} a ${c*10+10}`);
 $('levels').style.setProperty('--map-scene',`url('assets/map-scene-${c}.webp')`);section.dataset.region=c;
 const path=document.createElement('div');path.className='map-route';let d='';
 for(let j=0;j<10;j++){const p=mapPosition(j);if(j===0)d=`M ${p.x} ${p.y}`;else{const prev=mapPosition(j-1),mid=(prev.y+p.y)/2;d+=` C ${prev.x} ${mid}, ${p.x} ${mid}, ${p.x} ${p.y}`}}
 path.innerHTML=`<svg viewBox="0 0 400 700" aria-hidden="true"><path d="${d}" class="route-shadow"/><path d="${d}" class="route-light"/></svg>`;section.append(path);
 for(let j=0;j<10;j++){
  const i=c*10+j,p=mapPosition(j),state=mapLevelState(i),button=document.createElement('button');button.type='button';button.className='map-step '+state;
  button.style.left=p.x/4+'%';button.style.top=p.y/7+'%';button.dataset.level=i;button.dataset.state=state;button.id=i===current?'mapCurrent':`mapLevel${i}`;button.disabled=state==='locked';
  button.setAttribute('aria-label',`Nivel ${i+1}: ${{done:'completado',current:'nivel actual',locked:'bloqueado'}[state]}`);button.setAttribute('aria-current',state==='current'?'step':'false');
  const number=document.createElement('b');number.textContent=i+1;button.append(number);
  if(state==='current'){const caption=document.createElement('span');caption.className='step-caption';caption.textContent='Estás aquí';button.append(caption)}
  else if(state==='locked'){const lock=document.createElement('span');lock.className='step-lock';lock.setAttribute('aria-hidden','true');lock.innerHTML='<svg viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3"/></svg>';button.append(lock)}
  button.onclick=()=>selectMapLevel(i);section.append(button);
 }
 $('adventureMap').replaceChildren(section);
}
$('mapPrevious').onclick=()=>changeMapChapter(-1);
$('mapNext').onclick=()=>changeMapChapter(1);
let mapMusicBlocked=false,mapMusicPlaying=false,mapMusicGeneration=0,mapEntryPending=true,mapEntryGateOpen=false;
function mapMusicAllowed(){
 return data.mapMusic&&$('levels').open&&document.visibilityState!=='hidden'&&!['settings','help','result','defeat','collection','forest','forestCustomize','resident','purchase','bonus'].some(id=>$(id).open);
}
function paintMapMusic(){
 $('mapMusicToggle').checked=data.mapMusic;
 $('mapMusicBtn').setAttribute('aria-pressed',String(data.mapMusic));
 $('mapMusicBtn').setAttribute('aria-label',data.mapMusic?'Silenciar música del mapa':'Escuchar música del mapa');
 $('mapMusicBtn').title=data.mapMusic?'Silenciar música':'Escuchar música';
 $('mapMusicBtn').dataset.playing=String(data.mapMusic);
 const wasOpen=mapEntryGateOpen;
 if(mapEntryPending&&mapMusicBlocked&&data.mapMusic&&$('levels').open)mapEntryGateOpen=true;
 const gateVisible=mapEntryPending&&mapEntryGateOpen&&data.mapMusic&&$('levels').open;
 $('mapAudioGate').hidden=!gateVisible;$('levels').dataset.entryLocked=String(gateVisible);
 $('mapAudioStart').hidden=gateVisible||!(data.mapMusic&&mapMusicBlocked&&$('levels').open);
 if(gateVisible&&!wasOpen)$('mapEnterMusic').focus({preventScroll:true});
}
function stopMapMusic(){mapMusicGeneration++;$('mapMusic').autoplay=false;$('mapMusic').pause();$('mapMusic').currentTime=0;mapMusicPlaying=false;paintMapMusic()}
function syncMapMusic(){
 if(!mapMusicAllowed()){stopMapMusic();return Promise.resolve(false)}
 const player=$('mapMusic'),ticket=++mapMusicGeneration;
 // The file itself is quiet too, for devices whose media volume follows hardware volume.
 if(player.paused)player.currentTime=0;player.volume=.65;player.loop=true;player.autoplay=true;player.muted=false;mapMusicBlocked=false;setPlaybackSession();paintMapMusic();
 try{
  return Promise.resolve(player.play()).then(()=>{
   if(!mapMusicAllowed()){player.pause();return false}
   if(ticket!==mapMusicGeneration)return false;
   const enteredThroughGate=mapEntryGateOpen;
   mapMusicPlaying=true;mapEntryPending=false;mapEntryGateOpen=false;paintMapMusic();
   if(enteredThroughGate)$('mapBack').focus({preventScroll:true});return true;
  }).catch(()=>{if(ticket===mapMusicGeneration){mapMusicBlocked=true;mapMusicPlaying=false;paintMapMusic()}return false});
 }catch{mapMusicBlocked=true;mapMusicPlaying=false;paintMapMusic();return Promise.resolve(false)}
}
function closeMap(){stopMapMusic();$('levels').close();syncBoardMusic()}
$('mapMusicBtn').onclick=()=>{
 data.mapMusic=!data.mapMusic;if(data.mapMusic)syncMapMusic();else stopMapMusic();save();
};
$('mapAudioStart').onclick=()=>syncMapMusic();
$('mapEnterMusic').onclick=()=>{
 // Start playback inside the real click; entering never depends on media availability.
 syncMapMusic();
 mapEntryPending=false;mapEntryGateOpen=false;paintMapMusic();$('mapBack').focus({preventScroll:true});
};
$('levels').addEventListener('close',stopMapMusic);
$('levels').addEventListener('cancel',stopMapMusic);
$('mapMusic').addEventListener('playing',()=>{if(!mapMusicAllowed())stopMapMusic()});
$('mapMusic').addEventListener('error',()=>{mapMusicBlocked=true;mapMusicPlaying=false;paintMapMusic()});
function retryMapAudio(event){
 if(data.mapMusic&&mapMusicAllowed()&&(mapMusicBlocked||!mapMusicPlaying)&&!event.target?.closest('#mapMusicBtn,#mapAudioStart,#mapEnterMusic'))syncMapMusic();
}
for(const type of ['pointerdown','touchend','click','keydown'])document.addEventListener(type,retryMapAudio,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopMapMusic();else if($('levels').open)syncMapMusic()});
window.addEventListener('pagehide',stopMapMusic);

$('mapBack').onclick=()=>{closeMap();if(game.lives===0&&!game.won)lost()};
$('mapForestBtn').onclick=()=>{closeMap();openForest('map')};
$('resultMapBtn').onclick=()=>{$('result').close();openMap()};

// Each screen owns its music; late play promises never leak across screens.
const SCENE_DIALOGS=['levels','forest','collection','settings','help','result','defeat','bonus','purchase','resident','forestCustomize'];
let boardMusicGeneration=0,boardMusicBlocked=false;
function boardMusicAllowed(){return data.sound&&data.boardMusic&&!!game&&!game.won&&$('loading').hidden&&document.visibilityState!=='hidden'&&!SCENE_DIALOGS.some(id=>$(id).open)}
function paintBoardMusic(){
 $('boardMusicToggle').checked=data.boardMusic;
 const playing=data.sound;
 $('boardMusicBtn').setAttribute('aria-pressed',String(playing));
 $('boardMusicBtn').setAttribute('aria-label',playing?'Silenciar todos los sonidos del tablero':'Activar todos los sonidos del tablero');
 $('boardMusicBtn').dataset.playing=String(playing);
}
function stopBoardMusic(){boardMusicGeneration++;$('boardMusic').pause();paintBoardMusic()}
function syncBoardMusic(){
 if(!boardMusicAllowed()){stopBoardMusic();return Promise.resolve(false)}
 const audio=$('boardMusic');if(audio.paused===false&&!boardMusicBlocked){paintBoardMusic();return Promise.resolve(true)}
 const ticket=++boardMusicGeneration;boardMusicBlocked=false;audio.volume=.65;audio.loop=true;audio.muted=false;setPlaybackSession();
 try{return Promise.resolve(audio.play()).then(()=>{
  if(!boardMusicAllowed()){audio.pause();paintBoardMusic();return false}
  if(ticket!==boardMusicGeneration)return false;paintBoardMusic();return true;
 }).catch(()=>{if(ticket===boardMusicGeneration){boardMusicBlocked=true;paintBoardMusic()}return false})}
 catch{boardMusicBlocked=true;paintBoardMusic();return Promise.resolve(false)}
}
function showDialog(id){stopBoardMusic();if(id!=='levels')stopMapMusic();$(id).showModal()}
$('boardMusicBtn').onclick=()=>{
 setBoardSound(!data.sound);
};
$('boardMusic').addEventListener('playing',()=>{if(!boardMusicAllowed())stopBoardMusic();else paintBoardMusic()});
$('boardMusic').addEventListener('error',()=>{boardMusicBlocked=true;paintBoardMusic()});
for(const id of SCENE_DIALOGS)$(id).addEventListener('close',()=>{syncBoardMusic()});
document.addEventListener('pointerdown',event=>{if(boardMusicBlocked&&boardMusicAllowed()&&!event.target?.closest('#boardMusicBtn'))syncBoardMusic()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){stopBoardMusic();stopBoardEffects()}else syncBoardMusic()});
window.addEventListener('pagehide',()=>{stopBoardMusic();for(const id of ['clickAudio','failAudio'])$(id).pause()});
function setPlaybackSession(){try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback'}catch{}}
const EFFECT_FILES={clickAudio:'assets/click.mp3',failAudio:'assets/fail.mp3',forestHoldAudio:'assets/coqui-user.mp3'};
let fxContext=null,fxLoading=null;
const fxBuffers=new Map(),fxSources=new Set();
function prepareEffects(){
 if(fxLoading)return fxLoading;
 const Ctor=window.AudioContext||window.webkitAudioContext;
 if(!Ctor)return Promise.resolve(false);
 try{fxContext??=new Ctor({latencyHint:'interactive'})}catch{return Promise.resolve(false)}
 fxLoading=Promise.all(Object.entries(EFFECT_FILES).map(async([id,url])=>{
  try{const response=await fetch(url);if(!response.ok)return;const bytes=await response.arrayBuffer();const buffer=await fxContext.decodeAudioData(bytes);fxBuffers.set(id,buffer)}catch{}
 })).then(()=>fxBuffers.size>0);
 return fxLoading;
}
function unlockEffects(){
 setPlaybackSession();prepareEffects();
 if(fxContext&&fxContext.state!=='running')try{Promise.resolve(fxContext.resume()).catch(()=>{})}catch{}
}
document.addEventListener('pointerdown',unlockEffects,{capture:true});
document.addEventListener('keydown',unlockEffects,{capture:true});
function stopBoardEffects(){
 for(const source of fxSources)try{source.stop()}catch{}
 fxSources.clear();for(const id of ['clickAudio','failAudio','boardCoquiAudio'])$(id).pause();
}
function setBoardSound(enabled){
 data.sound=enabled;data.boardMusic=enabled;
 $('soundToggle').checked=enabled;$('boardMusicToggle').checked=enabled;
 if(enabled){unlockEffects();syncBoardMusic()}else{stopBoardMusic();stopBoardEffects()}
 paintBoardMusic();save();
}
function playEffect(id,force=false){
 if((!data.sound&&!force)||document.visibilityState==='hidden')return Promise.resolve(false);
 unlockEffects();
 const buffer=fxBuffers.get(id);
 if(fxContext&&buffer){
  try{
   const source=fxContext.createBufferSource(),gain=fxContext.createGain();
   source.buffer=buffer;source.residentHold=id==='forestHoldAudio';source.loop=source.residentHold;gain.gain.value=id==='clickAudio'?.45:.65;
   source.connect(gain);gain.connect(fxContext.destination);
   fxSources.add(source);source.onended=()=>{fxSources.delete(source);source.disconnect();gain.disconnect()};source.start(0);
   return Promise.resolve(true);
  }catch{}
 }
 const audio=$(id);try{audio.pause();audio.currentTime=0;audio.volume=id==='clickAudio'?.45:.65;audio.muted=false;return Promise.resolve(audio.play()).then(()=>true).catch(()=>false)}catch{return Promise.resolve(false)}
}
prepareEffects();
let heldResident=null;
function startResidentHold(id){if(!$('forest').open||!COQUIS.some(c=>c.id===id&&unlockedCoqui(c)))return;stopResidentHold();heldResident=id;playEffect('forestHoldAudio',true)}
function stopResidentHold(){heldResident=null;for(const source of fxSources)if(source.residentHold)try{source.stop()}catch{}$('forestHoldAudio').pause();$('forestHoldAudio').currentTime=0}

// Short mini-games: deterministic challenges, explicit goals and one payout.
const BONUS_TYPES=['bridge','leaves','supper'];
let bonusRound=null,bonusTimers=new Set(),leafButtons=[];
function missionKey(){return 'round:'+data.bonusCounter}
function roundFor(key){let seed=0;for(const c of key)seed=(seed*31+c.charCodeAt(0))>>>0;return {type:BONUS_TYPES[(Number(key.split(':')[1])||1)%3],seed}}
function rotateMask(mask,turns){for(let i=0;i<turns;i++)mask=((mask<<1)&15)|(mask>>3);return mask}
function bridgeMask(r,index){const tile=r.tiles.find(t=>t.index===index);return tile?rotateMask(tile.base,tile.rotation):0}
function bridgeConnected(r){
 if(!r||r.type!=='bridge'||r.tiles.length!==5)return false;
 let index=3,entry=3;const visited=new Set();
 for(let step=0;step<6;step++){
  const mask=bridgeMask(r,index);if(!(mask&(1<<entry))||visited.has(index))return false;
  visited.add(index);const exit=[0,1,2,3].find(d=>d!==entry&&(mask&(1<<d)));
  if(exit===undefined)return false;
  if(index===5&&exit===1)return visited.size===5;
  const row=Math.floor(index/3)+[-1,0,1,0][exit],col=index%3+[0,1,0,-1][exit];
  if(row<0||row>2||col<0||col>2)return false;
  index=row*3+col;entry=(exit+2)%4;
 }return false;
}
function buildBonus(key){
 const {type,seed}=roundFor(key);let state=seed||1;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const shuffle=items=>{for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}return items};
 const tiles=[{index:3,base:3,rotation:3,fixed:true},{index:0,base:3,rotation:1,fixed:false},{index:1,base:5,rotation:1,fixed:true},{index:2,base:3,rotation:2,fixed:false},{index:5,base:3,rotation:0,fixed:false}];
 for(const tile of tiles)if(!tile.fixed)tile.rotation=(tile.rotation+1+Math.floor(random()*3))%4;
 const targetLeaf=Math.floor(random()*3),slots=[0,1,2],swaps=[];let targetSlot=targetLeaf;
 for(let i=0;i<3;i++){const other=(targetSlot+1+Math.floor(random()*2))%3;swaps.push([targetSlot,other]);targetSlot=other}
 const waves=Array.from({length:2},()=>shuffle(['fly','fly','fly','butterfly','butterfly','bee']));
 return {key,type,seed,tiles,moves:0,targetLeaf,slots,swaps,shuffleStep:0,choice:null,waves,wave:0,caught:[],phase:type==='leaves'?'peek':'play',notice:''};
}
function stopBonusTimers(){bonusTimers.forEach(id=>clearTimeout(id));bonusTimers.clear()}
function bonusLater(r,callback,delay){
 const id=setTimeout(()=>{bonusTimers.delete(id);if(bonusRound===r&&$('bonus').open&&document.visibilityState!=='hidden')callback()},delay);bonusTimers.add(id);
}
function openBonus(){if(!data.bonusPending||data.bonusClaims.includes(data.bonusPending))return false;cancelBonusReturn();stopBonusTimers();bonusRound=buildBonus(data.bonusPending);renderBonus();showDialog('bonus');return true}
function bonusSolved(r){
 if(!r)return false;
 if(r.type==='bridge')return r.moves>0&&bridgeConnected(r);
 if(r.type==='leaves')return r.phase==='answer'&&r.shuffleStep===r.swaps.length&&Number.isInteger(r.choice)&&r.slots[r.targetLeaf]===r.choice;
 if(r.type==='supper')return r.wave===1&&r.caught.length===6&&new Set(r.caught).size===6&&r.caught.every(key=>{const [w,i]=key.split(':').map(Number);return (w===0||w===1)&&Number.isInteger(i)&&i>=0&&i<6&&r.waves[w][i]==='fly'});
 return false;
}
let bonusReturnTimer=null;
function cancelBonusReturn(){if(bonusReturnTimer!==null)clearTimeout(bonusReturnTimer);bonusReturnTimer=null}
function returnBonusToMap(r){
 if(r!==bonusRound||r.phase!=='done'||r.returned)return false;
 r.returned=true;cancelBonusReturn();stopBonusTimers();
 if($('bonus').open)$('bonus').close();
 if($('result').open)$('result').close();
 openMap();return true;
}
function armBonusReturn(r){
 cancelBonusReturn();if(r!==bonusRound||r.phase!=='done'||r.returned)return;
 bonusReturnTimer=setTimeout(()=>{bonusReturnTimer=null;returnBonusToMap(r)},Math.max(0,r.returnAt-Date.now()));
}
function completeBonus(){
 const r=bonusRound;if(!r||r.phase==='done'||!bonusSolved(r)||data.bonusPending!==r.key||data.bonusClaims.includes(r.key))return false;
 stopBonusTimers();data.bonusClaims.push(r.key);data.points+=20;
 r.grantedShield=data.bonusClaims.length%3===0;if(r.grantedShield)data.shields++;
 data.bonusPending=null;r.phase='done';r.returnAt=Date.now()+4000;
 save();paintCareer();paintProtection();renderBonus();
 $('bonusTitle').textContent='Lo lograste';
 $('bonusNotice').textContent=(r.grantedShield?'¡Ganaste una protección de 30 segundos! ':'')+'En 4 segundos vuelves al mapa.';
 armBonusReturn(r);return true;
}
function bonusImage(src,className='',alt=''){const img=document.createElement('img');img.src=src;img.alt=alt;img.className=className;img.draggable=false;return img}
function renderBonus(){
 const r=bonusRound;if(!r)return;const area=$('bonusArea');area.replaceChildren();area.className='bonus-area mini-world '+r.type;
 $('bonusReward').textContent=r.phase==='done'?`¡+20 puntos!${r.grantedShield?' +1 protección.':''} Saldo: ${data.points}`:'+20 puntos · sin reloj ni pérdida de vidas';
 $('bonusTitle').textContent={bridge:'El puente del río',leaves:'¿Dónde se escondió?',supper:'Cena de coquíes'}[r.type];
 $('bonusInstructions').textContent=r.phase==='done'?'¡Lo lograste! Tus puntos quedaron guardados.':{bridge:'Gira las tres piezas con flecha hasta conectar el coquí con la otra orilla.',leaves:'Mira bajo qué hoja se esconde. Sigue los tres cambios y toca su lugar.',supper:'Toca solo las mosquitas. Deja tranquilas a las mariposas y a la abeja.'}[r.type];
 $('bonusNotice').textContent=r.notice||'';
 if(r.phase==='done'){
  if(r.type==='bridge'){renderBridge(r,area);$('bonusNotice').textContent='¡Ya puede cruzar! Recompensa guardada.';return}
  if(r.type==='leaves'){renderLeaves(r,area);$('bonusNotice').textContent='¡Encontraste a tu coquí! Recompensa guardada.';return}
  const win=document.createElement('div');win.className='mini-victory '+r.type;
  const frog=bonusImage(activeCoqui().src,'mini-win-frog');win.append(frog);
  const caption=document.createElement('p');caption.textContent={bridge:'¡Ya puede cruzar el arroyo!',leaves:'¡Encontraste a tu coquí!',supper:'¡Seis mosquitas y una pancita feliz!'}[r.type];
  win.append(caption);area.append(win);return;
 }
 if(r.type==='bridge')renderBridge(r,area);else if(r.type==='leaves')renderLeaves(r,area);else renderSupper(r,area);
}
function renderBridge(r,area){
 const scene=document.createElement('div');scene.className='bridge-scene';
 const grid=document.createElement('div');grid.className='bridge-grid';
 for(let i=0;i<9;i++){
  const tile=r.tiles.find(t=>t.index===i),b=document.createElement(tile?'button':'div');b.className=tile?'bridge-tile'+(tile.fixed?' fixed':' turnable'):'bridge-water';
  if(tile){
   const mask=bridgeMask(r,i);b.disabled=tile.fixed||r.phase==='done';b.setAttribute('aria-label',`Pieza ${i+1}${tile.fixed?', fija':', girar un cuarto de vuelta'}`);
   for(let d=0;d<4;d++)if(mask&(1<<d)){const arm=document.createElement('span');arm.className='bridge-arm';arm.style.transform=`rotate(${d*90}deg)`;b.append(arm)}
   const center=document.createElement('span');center.className='bridge-joint';b.append(center);
   if(!tile.fixed&&r.phase!=='done'){const turn=document.createElement('span');turn.className='bridge-turn';turn.textContent='↻';b.append(turn)}
   b.onclick=()=>bonusPick(i,r);
  }grid.append(b);
 }
 scene.append(grid,bonusImage(activeCoqui().src,'bridge-waiting'+(r.phase==='done'?' crossing':'')));
 const goal=document.createElement('span');goal.className='bridge-goal';goal.textContent='META';scene.append(goal);
 area.append(scene);const progress=document.createElement('p');progress.className='mini-caption';progress.textContent=r.phase==='done'?`Puente completo en ${r.moves} giros`:`${r.moves} giros · toca las piezas ↻`;area.append(progress);
}
function renderLeaves(r,area){
 const scene=document.createElement('div');scene.className='leaf-scene';leafButtons=[];
 if(['peek','miss','done'].includes(r.phase)){const frog=bonusImage(activeCoqui().src,'shell-frog');frog.style.left=(r.slots[r.targetLeaf]*33.333+16.667)+'%';scene.append(frog)}
 for(let id=0;id<3;id++){
  const b=document.createElement('button');b.className='shell-leaf'+(['peek','miss','done'].includes(r.phase)&&id===r.targetLeaf?' lifted':'');
  b.style.left=(r.slots[id]*33.333)+'%';b.append(bonusImage('assets/bonus-leaf.webp'));
  b.disabled=r.phase!=='answer';b.setAttribute('aria-label',`Hoja en lugar ${r.slots[id]+1}`);b.onclick=()=>bonusPick(r.slots[id],r);
  leafButtons.push(b);scene.append(b);
 }
 const labels=document.createElement('div');labels.className='leaf-labels';for(let i=1;i<=3;i++){const label=document.createElement('span');label.textContent=i;labels.append(label)}scene.append(labels);area.append(scene);
 if(r.phase==='done')return;
 const watch=document.createElement('button');watch.className='primary mini-watch';watch.disabled=r.phase==='shuffle';watch.textContent=r.phase==='shuffle'?'Sigue las hojas…':r.phase==='answer'?'Verlo otra vez':r.phase==='miss'?'Intentar otra vez':'Listo · seguir las hojas';watch.onclick=()=>startLeafShuffle(r);area.append(watch);
}
function startLeafShuffle(r=bonusRound){
 if(!r||r!==bonusRound||r.type!=='leaves'||r.phase==='done'||r.phase==='shuffle'||!$('bonus').open)return false;
 stopBonusTimers();r.slots=[0,1,2];r.shuffleStep=0;r.choice=null;r.phase='shuffle';r.notice='El coquí sigue debajo de la misma hoja.';renderBonus();
 bonusLater(r,()=>advanceLeafShuffle(r),700);return true;
}
function advanceLeafShuffle(r){
 if(r!==bonusRound||r.phase!=='shuffle'||!$('bonus').open)return false;
 if(r.shuffleStep===r.swaps.length){r.phase='answer';r.notice='¿En cuál de los tres lugares quedó?';renderBonus();return true}
 const [a,b]=r.swaps[r.shuffleStep];r.slots=r.slots.map(slot=>slot===a?b:slot===b?a:slot);r.shuffleStep++;
 leafButtons.forEach((button,id)=>{button.style.left=(r.slots[id]*33.333)+'%';button.setAttribute('aria-label',`Hoja en lugar ${r.slots[id]+1}`)});
 $('bonusNotice').textContent=`Cambio ${r.shuffleStep}/3 · lugares ${a+1} y ${b+1}`;
 bonusLater(r,()=>advanceLeafShuffle(r),data.motion?1400:1100);return true;
}
function renderSupper(r,area){
 const scene=document.createElement('div');scene.className='supper-scene';
 const frog=bonusImage(activeCoqui().src,'supper-frog');scene.append(frog);
 const bugs=document.createElement('div');bugs.className='supper-bugs';
 r.waves[r.wave].forEach((kind,i)=>{
  const b=document.createElement('button'),caught=r.caught.includes(r.wave+':'+i),wave=r.wave;
  b.className='supper-bug'+(caught?' eaten':'');b.disabled=caught||r.phase!=='play';
  b.setAttribute('aria-label',caught?'Mosquita comida':{fly:'Mosquita, alimento del coquí',butterfly:'Mariposa, déjala volar',bee:'Abeja, déjala volar'}[kind]);
  b.append(bonusImage({fly:'assets/insect-fly.webp',butterfly:'assets/bonus-butterfly.webp',bee:'assets/bonus-bee.webp'}[kind]));
  b.onclick=()=>bonusPick(i,r,wave);bugs.append(b);
 });scene.append(bugs);area.append(scene);
 const caption=document.createElement('p');caption.className='mini-caption';caption.textContent=`${r.caught.length}/6 mosquitas · tanda ${r.wave+1} de 2`;area.append(caption);
}
function advanceSupper(r){if(r!==bonusRound||r.type!=='supper'||r.phase!=='between'||!$('bonus').open||r.caught.filter(key=>key.startsWith('0:')).length!==3)return false;r.wave=1;r.phase='play';r.notice='Últimas tres mosquitas.';renderBonus();return true}
function bonusPick(value,expectedRound=bonusRound,expectedWave=bonusRound?.wave){
 const r=bonusRound;if(!r||r!==expectedRound||r.phase==='done'||data.bonusPending!==r.key||!$('bonus').open||!Number.isInteger(value))return false;
 if(r.type==='bridge'){
  const tile=r.tiles.find(t=>t.index===value);if(r.phase!=='play'||!tile||tile.fixed)return false;
  tile.rotation=(tile.rotation+1)%4;r.moves++;r.notice='';if(bridgeConnected(r))return completeBonus();
 }else if(r.type==='leaves'){
  if(r.phase!=='answer'||value<0||value>2)return false;r.choice=value;
  if(r.slots[r.targetLeaf]===value)return completeBonus();r.phase='miss';r.notice='Estaba bajo la hoja levantada. Puedes repetir los tres cambios.';
 }else if(r.type==='supper'){
  if(r.phase!=='play'||expectedWave!==r.wave||value<0||value>5)return false;
  if(r.waves[r.wave][value]!=='fly'){r.notice='Esa ayuda al bosque. Busca las mosquitas de cuerpo oscuro.';$('bonusNotice').textContent=r.notice;return false}
  const key=r.wave+':'+value;if(r.caught.includes(key))return false;r.caught.push(key);r.notice='¡Ñam! Una mosquita más.';
  if(r.caught.length===6)return completeBonus();
  if(r.wave===0&&r.caught.length===3){r.phase='between';r.notice='¡Primera tanda lista! Vienen otras tres.';renderBonus();bonusLater(r,()=>advanceSupper(r),650);return true}
 }else return false;
 renderBonus();return true;
}
$('bonus').addEventListener('close',()=>{stopBonusTimers();leafButtons=[];if(bonusRound?.phase==='done')returnBonusToMap(bonusRound)});
document.addEventListener('visibilitychange',()=>{
 if(!bonusRound)return;const r=bonusRound;
 if(document.visibilityState!=='hidden'){if(r.phase==='done'&&!r.returned)armBonusReturn(r);return}
 stopBonusTimers();cancelBonusReturn();
 if(r.phase==='shuffle'){r.slots=[0,1,2];r.shuffleStep=0;r.phase='peek';r.notice='Mira otra vez. La pausa no te cuesta vidas.';renderBonus()}
 if(r.phase==='between')advanceSupper(r);
});
$('bonusBtn').onclick=openBonus;
$('resultBonusBtn').onclick=()=>{$('result').close();openBonus()};

let protectionTimer=null;
function protectionRemaining(now=Date.now()){return game&&!game.won&&game.lives>0?Math.max(0,(game.shieldUntil||0)-now):0}
function isProtected(now=Date.now()){return protectionRemaining(now)>0}
function stopProtectionTimer(){if(protectionTimer!==null)clearTimeout(protectionTimer);protectionTimer=null}
function paintProtection(){
 stopProtectionTimer();const remaining=protectionRemaining(),active=remaining>0;
 $('shieldCount').textContent=data.shields;
 $('shieldStock').textContent=`Protección de 30 segundos. ${data.shields} disponibles`;
 $('shieldBtn').hidden=data.shields===0;$('boosterRow').hidden=data.shields===0&&!active;
 $('shieldBtn').disabled=!game||game.won||game.lives<=0||data.shields===0||active;
 $('shieldBtn').setAttribute('aria-label',active?'Protección de 30 segundos activa':`Usar una protección de 30 segundos. ${data.shields} disponibles`);
 $('shieldTimer').hidden=!active;$('shieldTimer').textContent='00:'+String(Math.ceil(remaining/1000)).padStart(2,'0');
 if(!active&&game?.shieldUntil){game.shieldUntil=0;save()}
 if(active&&document.visibilityState!=='hidden')protectionTimer=setTimeout(()=>{protectionTimer=null;paintProtection()},250);
}
function activateProtection(){
 if(!game||game.won||game.lives<=0||data.shields<1||isProtected())return false;
 data.shields--;game.shieldUntil=Date.now()+30000;save();paintProtection();
 feedback('Protección activada: durante 30 segundos los errores no cuestan corazones.');return true;
}
$('shieldBtn').onclick=activateProtection;
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopProtectionTimer();else paintProtection()});

function save(){data.game=game;try{localStorage.setItem(KEY,JSON.stringify(data))}catch{feedback('El navegador no permite guardar. Puedes seguir jugando en esta sesión.')}}
function feedback(s){$('feedback').textContent=s}
const names={leaf:'AVENTURA EN LA HOJA',night:'BOSQUE ENCANTADO',garden:'NIDO TROPICAL'};
const difficulties={calm:'Tranquilo',normal:'Curioso',hard:'Experto'};

function boardAppearance(level){
 const chapter=Math.floor(Math.max(0,Math.min(59,level))/10),offset=level%10;
 const hues=[44,88,135,180,215,260,305,345];
 const palette=Array.from({length:8},(_,region)=>{const h=(hues[(region+offset)%8]+chapter*3+Math.floor(offset/8)*8)%360;return `hsl(${h} 38% 68%)`});
 return {chapter,palette,scene:'assets/night.webp',position:'center'};
}
function paintBoardAppearance(){
 if(!game)return;const level=game.daily?(game.seed||0)%60:game.level||0,look=boardAppearance(level);
 look.palette.forEach((color,i)=>document.body.style.setProperty('--tile'+i,color));
 document.body.style.setProperty('--level-scene',`url('${look.scene}')`);
 document.body.style.setProperty('--level-position',look.position);
 document.body.dataset.boardRegion=look.chapter;
}
function theme(){data.theme='night';document.body.dataset.theme='night';document.body.classList.toggle('reduced-motion',data.motion);document.querySelector('meta[name=theme-color]').content='#102f35';$('journey').textContent='BOSQUE ENCANTADO';for(const [id,key] of [['soundToggle','sound'],['autoToggle','auto'],['motionToggle','motion'],['boardMusicToggle','boardMusic'],['mapMusicToggle','mapMusic']])$(id).checked=data[key];paintBoardAppearance();}
function audioStatus(message){for(const id of ['residentAudioStatus','soundStatus'])$(id).textContent=message}
function chirp(win=false,force=false){
 if(!data.sound&&!force)return Promise.resolve(false);
 // Use a real media element, directly from the tap; no suspended synthesis engine.
 const player=$(force?'coquiAudio':'boardCoquiAudio');
 try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch{}
 try{
  player.muted=false;player.volume=1;player.pause();player.currentTime=0;
  const playing=player.play();
  return Promise.resolve(playing).then(()=>{audioStatus('Reproduciendo el canto…');return true}).catch(error=>{
   audioStatus(error.name==='NotAllowedError'?'El navegador bloqueó el audio. Prueba el reproductor en Preferencias.':'No se pudo reproducir el canto. Prueba el reproductor en Preferencias.');return false;
  });
 }catch{audioStatus('No se pudo iniciar el audio. Prueba el reproductor en Preferencias.');return Promise.resolve(false)}
}
$('coquiAudio').addEventListener('ended',()=>audioStatus('Canto finalizado.'));
$('coquiAudio').addEventListener('error',()=>audioStatus('No se pudo cargar el canto. Comprueba tu conexión y vuelve a intentarlo.'));
function transformPuzzle(base,variant=0){const regions=Array(64),solution=Array(8);for(let r=0;r<8;r++)for(let c=0;c<8;c++){let rr=r,cc=c;for(let k=0;k<variant%4;k++)[rr,cc]=[cc,7-rr];if(variant>=4)cc=7-cc;regions[rr*8+cc]=base.regions[r*8+c];if(base.solution[r]===c)solution[rr]=cc}return {regions,solution}}
let cachedLayout;
function puzzle(){const key=game.puzzle+':'+(game.variant||0);if(cachedLayout?.key!==key)cachedLayout={key,...transformPuzzle(puzzles[game.puzzle],game.variant||0)};return cachedLayout}
function randomInt(n){return Math.floor(Math.random()*n)}
function snapshot(){undo.push({cells:[...game.cells]});if(undo.length>100)undo.shift()}
function isBlocked(i){const r=i>>3,c=i%8,g=puzzle().regions;return game.cells.some((v,j)=>v===2&&j!==i&&((j>>3)===r||j%8===c||g[j]===g[i]||(Math.abs((j>>3)-r)<=1&&Math.abs(j%8-c)<=1)))}
function render(){paintBoardAppearance();const p=puzzle();$('levelTitle').replaceChildren(document.createTextNode(game.daily?'Reto del día':`Nivel ${(game.level??game.puzzle)+1}`));const subtitle=document.createElement('span');subtitle.textContent=`· ${difficulties[game.difficulty]||'Tranquilo'}`;$('levelTitle').append(subtitle);const count=game.cells.filter(v=>v===2).length;$('progress').textContent=`${count} / 8`;$('hearts').textContent=Array.from({length:4},(_,i)=>i<game.lives?'♥':'♡').join(' ');$('hearts').setAttribute('aria-label',`${game.lives} vidas`);const board=$('board'),fresh=board.children.length!==64,frag=fresh?document.createDocumentFragment():null;for(let i=0;i<64;i++){const b=fresh?document.createElement('button'):board.children[i],r=i>>3,c=i%8;b.type='button';b.className='cell';b.style.setProperty('--tile',`var(--tile${p.regions[i]})`);b.dataset.index=i;if(c<7&&p.regions[i]!==p.regions[i+1])b.classList.add('edge-r');if(r<7&&p.regions[i]!==p.regions[i+8])b.classList.add('edge-b');if(game.cells[i]!==2&&b.children.length)b.replaceChildren();let state='vacía';if(game.cells[i]===2){if(!b.firstElementChild){const img=document.createElement('img');img.src=activeCoqui().src;img.dataset.character=activeCoqui().id;img.alt='';b.append(img)}if(b.firstElementChild.dataset.character!==activeCoqui().id){b.firstElementChild.src=activeCoqui().src;b.firstElementChild.dataset.character=activeCoqui().id}state='coquí';if(game.fixed.includes(i)){b.classList.add('fixed');state='coquí inicial'}}else if(game.cells[i]===1){b.classList.add('mark');state='marcada con X'}else if(data.auto&&isBlocked(i)){b.classList.add('mark','auto');state='bloqueada automáticamente'}b.setAttribute('aria-label',`Fila ${r+1}, columna ${c+1}, región ${p.regions[i]+1}: ${state}`);b.setAttribute('aria-pressed',String(game.cells[i]===2));if(game.hinted===i)b.classList.add('hinted');if(fresh)frag.append(b)}if(fresh)board.replaceChildren(frag);$('undoBtn').disabled=!undo.length||game.won;$('modeLabel').textContent=mode==='coqui'?'Colocar coquí':'Marcar X';$('modeIcon').textContent=mode==='coqui'?'✦':'×';$('modeBtn').setAttribute('aria-label',mode==='coqui'?'Colocar coquí activado. Cambiar a marcar X':'Marcar X activado. Cambiar a colocar coquí');$('modeBtn').setAttribute('aria-pressed',String(mode==='coqui'));const remaining=Math.max(0,3-(game.hints||0));$('hintLabel').textContent=`Pista (${remaining}/3)`;$('hintBtn').setAttribute('aria-label',`${remaining} de 3 pistas disponibles`);$('hintBtn').disabled=game.won||remaining===0||game.lives===0;paintCareer();paintMission();paintProtection();save()}
function start(index,daily=false,seed=0){const previous=game?puzzle().solution.join(','):null;let base,variant;if(daily){base=seed%puzzles.length;variant=(seed>>>6)%8}else{let candidates=[];for(let b=0;b<puzzles.length;b++)for(let v=0;v<8;v++){if(game&&b===game.puzzle)continue;if(transformPuzzle(puzzles[b],v).solution.join(',')!==previous)candidates.push([b,v])}[base,variant]=candidates[randomInt(candidates.length)]}game={level:index,puzzle:base,variant,seed,cells:Array(64).fill(0),fixed:[],lives:4,won:false,daily,difficulty:'calm',hints:0,hinted:null,mistakes:0};undo=[];mode='coqui';render();feedback('Tablero vacío. Encuentra los ocho coquíes a tu ritmo.');save();syncBoardMusic()}
function finish(){
 if(game.won)return;const before=victories(),friendsBefore=COQUIS.filter(unlockedCoqui).map(c=>c.id),oldStage=forestStage();game.won=true;
 if(game.daily){if(!data.dailyWins.includes(game.seed||0))data.dailyWins.push(game.seed||0)}else if(!data.completed.includes(game.level??game.puzzle))data.completed.push(game.level??game.puzzle);
 const added=victories()>before,newFriends=COQUIS.filter(c=>unlockedCoqui(c)&&!friendsBefore.includes(c.id));
 const giftsBefore=data.decorGifts.length;
 if(levelFeature()==='fireflies'&&!data.decorGifts.includes('fireflies'))data.decorGifts.push('fireflies');
 if(levelFeature()==='precision'&&(game.mistakes||0)===0&&game.lives===4&&game.hints===0&&!data.decorGifts.includes('log'))data.decorGifts.push('log');
 if(levelFeature()==='flower'&&game.flowerCollected&&!data.decorGifts.includes('flowers'))data.decorGifts.push('flowers');
 data.bonusCounter++;data.bonusPending=missionKey();
 undo=[];render();chirp(true);$('resultTag').textContent='¡COQUÍ, COQUÍ!';$('resultTitle').textContent='Cada coquí en su lugar';$('resultText').textContent=levelFeature()==='encounter'?`${activeCoqui().name}: «Te espero junto al río en El Yunque. ¡Ya encontraste a los ocho!»`:'Encontraste los ocho. Tu refugio tiene un poco más de vida.';
 $('rewardText').textContent=added?`+1 semilla para El Yunque. ${newFriends.length?'¡Desbloqueaste a '+newFriends.map(c=>c.name).join(' y ')+'!':oldStage!==forestStage()?'¡El Yunque llegó a '+forestStage().name+'!':'Cada victoria cuenta.'}`:'Este nivel ya plantó su semilla. Te espera otro minijuego para ganar puntos.';if(data.decorGifts.length>giftsBefore)$('rewardText').textContent+=' ¡El Yunque tiene un poco más de vida!';
 $('winRewards').hidden=false;$('resultBonusBtn').hidden=false;$('nextBtn').textContent='Ver mapa →';showDialog('result');openBonus();
}
function levelFeature(){return ['seed','flower','precision','fireflies','encounter'][(game.daily?game.seed:game.level||0)%5]}
function flowerCell(){return ((game.level||0)*13+19)%64}
function paintMission(){const type=levelFeature(),messages={seed:'Semilla nueva · haz crecer El Yunque',flower:'Flor escondida · +10 puntos si a la primera decides si lleva coquí o una X (no hay coquí). Las pistas no dan el premio.',precision:'Precisión · sin errores ni pistas: un tronco para El Yunque',fireflies:'Noche de luciérnagas · una victoria nueva suma luz a El Yunque',encounter:'Encuentro · completa este nivel y visita a tus coquíes en El Yunque'};$('levelMission').textContent=messages[type];if($('board').children.length===64&&type==='flower')$('board').children[flowerCell()].classList.add('flower-cell')}

function lost(){
 if(!game||game.won||game.lives>0)return false;
 pending=null;$('defeatBalance').textContent=`Tienes ${data.points} puntos`;
 $('buyOneHeart').disabled=data.points<20;$('buyTwoHearts').disabled=data.points<40;
 if(!$('defeat').open)showDialog('defeat');return true;
}
function buyHearts(amount){
 if(![1,2].includes(amount)||!game||game.won||game.lives!==0||data.points<amount*20)return false;
 data.points-=amount*20;game.lives=amount;
 $('defeat').close();render();feedback(`Compraste ${amount===1?'un corazón':'dos corazones'}. Continúa tu tablero.`);return true;
}
function restartLostLevel(){
 if(!game||game.won||game.lives!==0)return false;
 game={...game,cells:Array(64).fill(0),fixed:[],lives:4,won:false,hints:0,hinted:null,mistakes:0,flowerAttempted:false,flowerCollected:false,shieldUntil:0};
 undo=[];mode='coqui';$('defeat').close();render();feedback('Mismo tablero, desde cero. Tienes cuatro corazones.');return true;
}
$('retryLevelBtn').onclick=restartLostLevel;
$('buyOneHeart').onclick=()=>buyHearts(1);
$('buyTwoHearts').onclick=()=>buyHearts(2);
$('defeat').addEventListener('cancel',event=>event.preventDefault());
function flowerRewardKey(){return game.daily?'daily:'+(game.seed||0):'level:'+(game.level??game.puzzle)}
function recordFlowerGuess(i,hasCoqui,fromHint=false){
 if(levelFeature()!=='flower'||i!==flowerCell()||game.flowerAttempted)return '';
 game.flowerAttempted=true;
 if(fromHint)return 'La pista resolvió la flor; el premio requiere tu primera deducción.';
 const correct=(puzzle().solution[i>>3]===i%8)===hasCoqui;
 if(!correct)return 'La primera elección en la flor no acertó. Esta vez no da puntos.';
 game.flowerCollected=true;const key=flowerRewardKey();
 if(data.flowerClaims.includes(key))return 'Ya recogiste el premio de esta flor.';
 data.flowerClaims.push(key);data.points+=10;
 return '¡Flor resuelta a la primera! +10 puntos.';
}
function play(i){
 if(game.won)return feedback('¡Tablero completado! Elige el siguiente nivel.');
 if(!Number.isInteger(i)||i<0||i>63)return;
 if(game.fixed.includes(i))return feedback('Este coquí es una pista inicial y ya está en su lugar.');
 if(game.lives<=0){lost();return}
 game.hinted=null;
 if(mode==='mark'){
  if(game.cells[i]===2)return feedback('Un coquí encontrado ya está en su lugar. Puedes deshacer tu última jugada.');
  snapshot();const flowerNotice=game.cells[i]===0?recordFlowerGuess(i,false):'';
  game.cells[i]=game.cells[i]===1?0:1;
  if(game.cells[i]===1)playEffect('clickAudio');
  render();feedback('Marca las casillas que puedes descartar.'+(flowerNotice?' '+flowerNotice:''));return;
 }
 if(game.cells[i]===2)return feedback('¡Este coquí ya encontró su rincón!');
 if(game.cells[i]===1){snapshot();game.cells[i]=0;render();return feedback('Marca retirada. Toca otra vez para colocar un coquí.')}
 const flowerNotice=recordFlowerGuess(i,true);
 if(puzzle().solution[i>>3]!==i%8){
  playEffect('failAudio');
  game.mistakes=(game.mistakes||0)+1;const protectedNow=isProtected();
  if(!protectedNow)game.lives=Math.max(0,game.lives-1);
  render();const b=$('board').children[i];if(errorCell)errorCell.classList.remove('error');clearTimeout(errorsTimer);
  errorCell=b;b.classList.remove('error');void b.offsetWidth;b.classList.add('error');
  if(!protectedNow){$('hearts').classList.remove('heart-hit');void $('hearts').offsetWidth;$('hearts').classList.add('heart-hit');}
  errorsTimer=setTimeout(()=>{b.classList.remove('error');$('hearts').classList.remove('heart-hit');if(errorCell===b)errorCell=null},550);
  feedback((protectedNow?'Protección activa: no perdiste corazón.':isBlocked(i)?'Aquí compartiría fila, columna, color o tocaría a otro coquí.':'Ese rincón impediría completar el tablero. Prueba con otra deducción.')+(!protectedNow?' Perdiste un corazón.':'')+(flowerNotice?' '+flowerNotice:''));
  if(game.lives===0)setTimeout(lost,350);return;
 }
 snapshot();game.cells[i]=2;
 if(game.cells.filter(v=>v===2).length<8)chirp();
 render();feedback('¡Coquí! Un rinconcito más en calma.'+(flowerNotice?' '+flowerNotice:''));
 if(game.cells.filter(v=>v===2).length===8)finish();
}

function chooseNew(action){$('winRewards').hidden=true;if(game.cells.some((v,i)=>v!==0&&!game.fixed.includes(i))&&!game.won){$('resultTag').textContent='ANTES DE CAMBIAR';$('resultTitle').textContent='¿Empezar otra partida?';$('resultText').textContent='La partida actual se sustituirá. Tus niveles completados y preferencias se conservan.';$('nextBtn').textContent='Empezar partida';pending=action;showDialog('result')}else action()}
let pending=null;
$('board').addEventListener('click',e=>{const b=e.target.closest('.cell');if(b)play(Number(b.dataset.index))});
$('board').addEventListener('keydown',e=>{const i=Number(e.target.dataset.index);if(!Number.isInteger(i))return;const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(delta){e.preventDefault();const next=i+delta;if(next>=0&&next<64)$('board').children[next].focus()}});
$('modeBtn').onclick=()=>{mode=mode==='coqui'?'mark':'coqui';render();feedback(mode==='mark'?'Modo X: toca para marcar o quitar una marca.':'Modo coquí: toca el rincón donde debe estar.')};
$('undoBtn').onclick=()=>{if(!undo.length||game.won)return;game.cells=undo.pop().cells;game.hinted=null;render();feedback('Jugada deshecha. Los errores consumidos no se recuperan.')};
$('hintBtn').onclick=()=>{if(game.won||game.lives<=0)return;if((game.hints||0)>=3)return feedback('Ya usaste las 3 pistas de este tablero. Sigue con tus deducciones.');const r=puzzle().solution.findIndex((c,r)=>game.cells[r*8+c]!==2);if(r<0)return;const i=r*8+puzzle().solution[r];snapshot();recordFlowerGuess(i,true,true);game.cells[i]=2;game.hints++;game.hinted=i;if(game.cells.filter(v=>v===2).length<8)chirp();render();feedback(`Pista: coquí en fila ${r+1}, columna ${i%8+1}. Desde aquí descarta su fila, columna, región y casillas vecinas.`);if(game.cells.filter(v=>v===2).length===8)finish()};
$('settingsBtn').onclick=()=>{showDialog('settings')};
function openGuide(){cancelResidentPress?.();stopResidentHold();stopForestAmbience();showDialog('help')}
for(const id of ['helpBtn','mapHelpBtn','forestHelpBtn'])$(id).onclick=openGuide;
$('help').addEventListener('close',()=>{if($('levels').open)syncMapMusic();else if($('forest').open)startForestAmbience()});
$('levelsBtn').onclick=openMap;
$('restartBtn').onclick=()=>chooseNew(()=>start(game.level??game.puzzle,game.daily,game.seed||0));
$('dailyBtn').onclick=()=>{const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Puerto_Rico',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());let hash=0;for(const c of date)hash=(hash*31+c.charCodeAt(0))>>>0;chooseNew(()=>start(0,true,hash))};
$('nextBtn').onclick=()=>{$('result').close();if(pending){const action=pending;pending=null;action();return}if(game.won)openMap()};
$('resultClose').onclick=()=>{pending=null;$('result').close();if(game.won)openMap()};
$('result').addEventListener('close',()=>{if(!$('result').open)pending=null});
document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d&&d.id!=='defeat'){const rect=d.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)(d.id==='levels'?closeMap():d.close())}}));

for(const [id,key] of [['soundToggle','sound'],['autoToggle','auto'],['motionToggle','motion'],['boardMusicToggle','boardMusic'],['mapMusicToggle','mapMusic']])$(id).onchange=()=>{data[key]=$(id).checked;theme();render();if(key==='sound')setBoardSound(data.sound);if(key==='boardMusic')syncBoardMusic();if(key==='mapMusic'){if(data.mapMusic)syncMapMusic();else stopMapMusic()}};

function valid(g){return g&&Number.isInteger(g.puzzle)&&g.puzzle>=0&&g.puzzle<puzzles.length&&(g.variant===undefined||(Number.isInteger(g.variant)&&g.variant>=0&&g.variant<8))&&Array.isArray(g.cells)&&g.cells.length===64&&g.cells.every((x,i)=>[0,1,2].includes(x)&&(x!==2||transformPuzzle(puzzles[g.puzzle],g.variant||0).solution[i>>3]===i%8))&&Array.isArray(g.fixed)&&g.fixed.every(i=>Number.isInteger(i)&&i>=0&&i<64&&g.cells[i]===2)&&Number.isInteger(g.lives)&&g.lives>=0&&g.lives<=4}
async function init(){theme();try{const response=await fetch('puzzles.json?v=14');if(!response.ok)throw Error('network');puzzles=await response.json();if(puzzles.length!==60)throw Error('data');if(!data.emptyStartV2){data.auto=false;data.emptyStartV2=true;if(data.game&&Array.isArray(data.game.cells)&&Array.isArray(data.game.fixed)){const untouched=data.game.cells.every((v,i)=>v===0||(v===2&&data.game.fixed.includes(i)));if(untouched&&data.game.lives===4&&!data.game.won){data.game.cells.fill(0);data.game.fixed=[]}}}theme();if(valid(data.game)){game=data.game;game.hints=Math.min(3,Math.max(0,Number(game.hints)||0));game.level??=game.puzzle;render()}else start(0);$('loading').hidden=true;if(!data.intro){data.intro=true;save()}openMap()}catch{$('loading').querySelector('p').textContent='No pudimos cargar los niveles. Comprueba la conexión e inténtalo otra vez.';$('retryBtn').hidden=false}}
$('retryBtn').onclick=()=>location.reload();
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
if('serviceWorker'in navigator){let refreshing=false;const wasControlled=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing||!wasControlled)return;refreshing=true;save();location.reload()});navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{reg.update();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update()})}).catch(()=>{})}
init();
