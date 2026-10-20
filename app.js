const $=id=>document.getElementById(id);
const KEY='coquidoku-v1';
const defaults={theme:'night',sound:true,auto:false,relax:false,motion:false,difficulty:'calm',completed:[],dailyWins:[],character:null,points:0,earned:[],purchased:[],bonusClaims:[],bonusPending:null,bonusCounter:0,decorGifts:[],decor:[null,null,null],positions:{},forestCoordinates:{},feedings:0,behaviors:{},game:null};
let data;try{data={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{data={...defaults}}
if(!['leaf','night','garden'].includes(data.theme))data.theme='night';
data.completed=[...new Set((Array.isArray(data.completed)?data.completed:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<60))];data.dailyWins=[...new Set((Array.isArray(data.dailyWins)?data.dailyWins:[]).filter(n=>Number.isInteger(n)&&n>=0))];
data.points=Number.isSafeInteger(data.points)&&data.points>=0?data.points:0;
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
data.feedings=Number.isSafeInteger(data.feedings)&&data.feedings>=0?data.feedings:0;
let puzzles=[],game,mode='coqui',undo=[],errorsTimer;

const COQUIS=[
 {id:'sol',name:'Coquí Dorado',at:0,price:0,detail:'Un rayito de calidez',src:'assets/coqui.webp'},
 {id:'menta',name:'Pistoco',at:5,price:80,detail:'Fresco como una hoja nueva',src:'assets/coqui-menta.webp'},
 {id:'brisa',name:'Amapola',at:10,price:160,detail:'La calma junto al río',src:'assets/coqui-brisa.webp'},
 {id:'flor',name:'Sila',at:20,price:320,detail:'Un toque de alegría tropical',src:'assets/coqui-flor.webp'},
 {id:'luna',name:'Betances',at:35,price:560,detail:'Un amigo de las luciérnagas',src:'assets/coqui-luna.webp'},
 {id:'aurora',name:'Rita',at:50,price:800,detail:'Los colores de un nuevo día',src:'assets/coqui-aurora.webp'},
 {id:'boricua',name:'Boricua',at:60,price:null,detail:'El orgullo de nuestra isla',src:'assets/coqui-boricua.webp'}
];
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
function paintCareer(){const p=progression(),active=activeCoqui();$('careerCount').textContent=`${data.points} puntos · ${data.completed.length}/60 niveles · ${p.n} semillas`;$('characterName').textContent=data.character?active.name:'Elige tu coquí';$('careerFrog').src=active.src;$('forestBrief').textContent=`${p.unlocked.length} coquíes en tu refugio`;for(const id of ['resultSprite','helpSprite'])$(id).src=active.src;$('bonusBtn').disabled=!data.bonusPending;$('resultBonusBtn').disabled=!data.bonusPending;$('bonusBtn').textContent=data.bonusPending?'Minijuego pendiente · +20 puntos':'Retos extra al completar niveles'}
function chooseCoqui(id){const c=COQUIS.find(c=>c.id===id);if(!c||!unlockedCoqui(c))return false;data.character=id;render();renderCollection();feedback(`${c.name} te acompaña en el tablero.`);return true}
let purchaseTarget=null;
function requestPurchase(id){const c=COQUIS.find(c=>c.id===id);if(!c||!c.price||unlockedCoqui(c)||data.points<c.price)return false;purchaseTarget=id;$('purchaseText').textContent=`¿Desbloquear a ${c.name} por ${c.price} puntos? Tienes ${data.points} puntos. Estará disponible en el tablero y en El Yunque.`;$('purchase').showModal();return true}
function buyCoqui(id){const c=COQUIS.find(c=>c.id===id);if(!c||!c.price||unlockedCoqui(c)||data.points<c.price)return false;data.points-=c.price;data.purchased.push(id);save();paintCareer();renderCollection();$('collectionNotice').textContent=`¡${c.name} ya vive en El Yunque!`;return true}
$('purchaseConfirm').onclick=()=>{buyCoqui(purchaseTarget);purchaseTarget=null;$('purchase').close()};
function renderCollection(){const p=progression();$('collectionCount').textContent=`${p.unlocked.length} de 7 amigos · ${data.points} puntos`;$('nextCoqui').textContent=p.next?`Próximo por niveles: ${p.next.name} · ${data.completed.length}/${p.next.at} niveles completados`:'¡Tu familia de coquíes está completa!';const cards=document.createDocumentFragment();for(const c of COQUIS){const unlocked=unlockedCoqui(c),selected=c.id===data.character;const card=document.createElement('article');card.className='coqui-card'+(unlocked?'':' locked')+(selected?' chosen':'');const image=document.createElement('img');image.src=c.src;image.alt=c.name;image.width=150;image.height=150;const title=document.createElement('h3');title.textContent=c.name;const desc=document.createElement('p');desc.textContent=c.detail;const target=document.createElement('small');target.textContent=c.id==='boricua'?`Exclusivo: completa los 60 niveles · ${data.completed.length}/60. No se compra con puntos.`:c.at===0?'Tu primer compañero':`Completa ${c.at} niveles o compra por ${c.price} puntos.`;const button=document.createElement('button');button.className=selected?'selected-coqui':'pick-coqui';button.textContent=selected?'✓ Elegido':unlocked?'Elegir':c.price?`Comprar · ${c.price} puntos`:'Completa la aventura';button.disabled=selected||(!unlocked&&(!c.price||data.points<c.price));button.setAttribute('aria-label',`${c.name}: ${button.textContent}`);button.onclick=()=>unlocked?chooseCoqui(c.id):requestPurchase(c.id);card.append(image,title,desc,target,button);cards.append(card)}$('coquiCards').replaceChildren(cards);save()}
let forestTime='night';
function forestSceneSource(){return `assets/yunque-${FOREST_STAGES.indexOf(forestStage())}-${forestTime}.webp`}
function renderForest(){const p=progression(),index=FOREST_STAGES.indexOf(p.stage),next=FOREST_STAGES[index+1];$('forestTitle').textContent=p.stage.name;$('forestDescription').textContent=(forestTime==='day'?'De día · ':'De noche · ')+p.stage.description;$('forestScene').style.setProperty('--forest-scene',`url('${forestSceneSource()}')`);$('forest').style.setProperty('--forest-wallpaper',`url('${forestSceneSource()}')`);$('forestWins').textContent=p.n;$('forestFriends').textContent=p.unlocked.length;$('forestProgress').max=next?next.at-p.stage.at:60;$('forestProgress').value=next?p.n-p.stage.at:Math.min(p.n,60);$('forestNext').textContent=next?`Faltan ${next.at-p.n} semillas para el próximo cambio de El Yunque.`:'El Yunque alcanzó su etapa más frondosa. Disfruta de tu refugio y de todos sus habitantes.';const plants=document.createDocumentFragment();for(let i=0;i<Math.min(60,p.n);i++){const sprout=document.createElement('span');sprout.className='forest-sprout';sprout.style.left=(12+(i*19)%63)+'%';sprout.style.top=(57+(i*11)%32)+'%';sprout.style.setProperty('--plant-scale',String(.65+(i%4)*.12));sprout.setAttribute('aria-hidden','true');plants.append(sprout)}$('forestPlants').replaceChildren(plants);
 const autoDecor=document.createDocumentFragment();DECORATIONS.filter(d=>d.id!=='fireflies'&&(p.n>=d.at||data.decorGifts.includes(d.id))).slice(-3).forEach((d,i)=>{const img=document.createElement('img');img.src=`assets/decor-${d.id}.webp`;img.alt='';img.className='forest-decoration zone-'+i;autoDecor.append(img)});$('forestDecor').replaceChildren(autoDecor);
 const friends=document.createDocumentFragment();p.unlocked.forEach((c,i)=>{const zone=Number.isInteger(data.positions[c.id])?data.positions[c.id]:i%3,peers=p.unlocked.filter((f,j)=>(Number.isInteger(data.positions[f.id])?data.positions[f.id]:j%3)===zone),slot=peers.indexOf(c);const b=document.createElement('button');b.className='forest-friend';b.style.left=([67,18,40][zone]+(slot%3)*7)+'%';b.style.top=([53,60,66][zone]+Math.floor(slot/3)*8)+'%';if(data.forestCoordinates[c.id]){b.style.left=data.forestCoordinates[c.id].x+'%';b.style.top=data.forestCoordinates[c.id].y+'%'}b.style.zIndex=String(10+zone+slot);b.setAttribute('aria-label',`${c.name}, ${ZONES[zone]}. Arrastra para moverlo o toca para conocerlo.`);const img=document.createElement('img');img.src=c.src;img.alt='';b.append(img);b.onclick=event=>{if(b.suppressClick){b.suppressClick=false;event.preventDefault();return}openResident(c.id)};bindResidentDrag(b,c.id);friends.append(b)});$('forestResidents').replaceChildren(friends);ecosystem=progression().unlocked.map((c,i)=>{const button=$('forestResidents').children[i];return {id:c.id,button,image:button.firstElementChild,position:{x:parseFloat(button.style.left),y:parseFloat(button.style.top)},next:null,started:null,targetFood:null,direction:i%2===0,hops:0}});$('forestMeals').textContent=data.feedings;const roster=document.createDocumentFragment();for(const c of p.unlocked){const b=document.createElement('button');b.textContent=c.name;b.onclick=()=>openResident(c.id);roster.append(b)}$('forestRoster').replaceChildren(roster);insects.forEach(b=>b.owner=null);renderInsects();$('forestInvite').textContent=p.unlocked.length<7?'Desbloquea más personajes para que vivan en El Yunque.':'¡Toda tu familia de coquíes vive en El Yunque!';save()}
let residentId='sol';
function openResident(id){const c=COQUIS.find(c=>c.id===id);if(!c||!unlockedCoqui(c))return;residentId=id;$('residentName').textContent=c.name;$('residentImage').src=c.src;$('residentText').textContent=c.detail+'. Ya tiene un hogar en El Yunque.';$('residentZone').value=String(data.positions[id]??progression().unlocked.indexOf(c)%3);$('residentRest').checked=data.behaviors[id]==='rest';$('resident').showModal()}
$('residentZone').onchange=()=>{const z=Number($('residentZone').value);if(z>=0&&z<3){data.positions[residentId]=z;delete data.forestCoordinates[residentId];save();renderForest()}};
$('residentCall').onclick=()=>chirp(true,true);
$('collectionBtn').onclick=()=>openCollection();
$('forestBtn').onclick=openForest;
$('resultCollectionBtn').onclick=()=>{$('result').close();openCollection('map')};
$('resultForestBtn').onclick=()=>{$('result').close();openForest()};

// Immersive ecosystem. Its frame clock is independent from CSS animation rules.
let forestReturn='game',forestRaf=null,ecosystem=[],forestClock=0,feeding=false;
function bindResidentDrag(button,id){
 let drag=null;
 button.onpointerdown=event=>{
  if(event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
  const s=ecosystem.find(s=>s.id===id);if(!s)return;
  button.suppressClick=false;
  drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,origin:{...s.position},moved:false};
  s.dragging=true;s.started=null;s.image.style.transform='translate3d(0,0,0)';
  button.setPointerCapture?.(event.pointerId);
 };
 button.onpointermove=event=>{
  if(!drag||event.pointerId!==drag.pointer)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<6)return;
  drag.moved=true;event.preventDefault();
  const rect=$('forestResidents').getBoundingClientRect(),s=ecosystem.find(s=>s.id===id);
  if(!s||!rect.width||!rect.height)return;
  s.position={x:Math.max(8,Math.min(88,drag.origin.x+dx/rect.width*100)),y:Math.max(45,Math.min(88,drag.origin.y+dy/rect.height*100))};
  button.style.left=s.position.x+'%';button.style.top=s.position.y+'%';
 };
 const finish=event=>{
  if(!drag||event.pointerId!==drag.pointer)return;
  const s=ecosystem.find(s=>s.id===id);
  if(s){s.dragging=false;s.next=forestClock+15000;s.started=null;
   if(drag.moved){data.forestCoordinates[id]={...s.position};insects.filter(b=>b.owner===id).forEach(b=>b.owner=null);s.targetFood=null;save();$('forestHint').textContent='Su nuevo rincón quedó guardado. Puedes mover a otro coquí.';}
  }
  button.suppressClick=drag.moved;drag=null;
  if(button.hasPointerCapture?.(event.pointerId))button.releasePointerCapture(event.pointerId);
 };
 button.onpointerup=finish;button.onpointercancel=finish;button.onlostpointercapture=finish;
 button.ondragstart=event=>event.preventDefault();
}

function openForest(returnTo='game'){forestReturn=returnTo;feeding=false;$('forestFeedBtn').setAttribute('aria-pressed','false');$('forestHint').textContent='Arrastra un coquí para moverlo. Toca Alimentar para repartir insectos.';forestTime=Math.random()<.5?'day':'night';renderForest();$('forest').showModal();$('forestBack').focus({preventScroll:true});startEcosystem()}
function stopEcosystem(){if(forestRaf!==null&&window.cancelAnimationFrame)window.cancelAnimationFrame(forestRaf);forestRaf=null}
function startEcosystem(){stopEcosystem();if(!window.requestAnimationFrame||!$('forest').open||document.visibilityState==='hidden')return;const frame=t=>{forestRaf=null;if(!$('forest').open||document.visibilityState==='hidden')return;updateEcosystem(t);forestRaf=window.requestAnimationFrame(frame)};forestRaf=window.requestAnimationFrame(frame)}
let insects=[],insectSerial=0;
function renderInsects(){const fragment=document.createDocumentFragment();for(const bug of insects){const img=document.createElement('img');img.className='food-insect';img.src='assets/insect-fly.webp';img.alt='';img.style.left=bug.x+'%';img.style.top=bug.y+'%';fragment.append(img)}$('forestFood').replaceChildren(fragment)}
function claimInsect(s,t){if(s.targetFood!==null&&insects.some(b=>b.id===s.targetFood))return;const free=insects.filter(b=>b.owner===null).sort((a,b)=>Math.hypot(a.x-s.position.x,a.y-s.position.y)-Math.hypot(b.x-s.position.x,b.y-s.position.y));if(!free.length){s.targetFood=null;return}free[0].owner=s.id;s.targetFood=free[0].id;s.next=Math.min(s.next??Infinity,t+120)}
function eatInsect(s,t){const bug=insects.find(b=>b.id===s.targetFood);if(bug&&Math.hypot(s.position.x-bug.x,s.position.y-bug.y)<.3){insects=insects.filter(b=>b!==bug);s.targetFood=null;renderInsects();$('forestHint').textContent='¡Un coquí se comió un insecto!';claimInsect(s,t)}else if(bug)s.next=t+280}
function updateEcosystem(t){forestClock=t;for(let i=0;i<ecosystem.length;i++){const s=ecosystem[i];if(s.dragging)continue;if(data.behaviors[s.id]==='rest'){insects.filter(b=>b.owner===s.id).forEach(b=>b.owner=null);s.targetFood=null;s.image.style.transform='translate3d(0,0,0)';s.started=null;s.next=t+15000;continue}if(insects.length)claimInsect(s,t);if(s.next===null)s.next=t+800+i*160;if(s.started===null&&t>=s.next){s.started=t;s.next=t+15000;s.from={...s.position};const bug=insects.find(b=>b.id===s.targetFood),goal=bug||{x:Math.max(8,Math.min(88,s.position.x+(s.direction?5:-5))),y:s.position.y},distance=Math.hypot(goal.x-s.position.x,goal.y-s.position.y),scale=distance>12?12/distance:1;s.target={x:s.position.x+(goal.x-s.position.x)*scale,y:s.position.y+(goal.y-s.position.y)*scale};s.direction=!s.direction;s.hops++}if(s.started!==null){const p=data.motion?1:Math.max(0,Math.min(1,(t-s.started)/900)),ease=p*p*(3-2*p),height=data.motion?0:36;s.position={x:s.from.x+(s.target.x-s.from.x)*ease,y:s.from.y+(s.target.y-s.from.y)*ease};s.button.style.left=s.position.x+'%';s.button.style.top=s.position.y+'%';s.image.style.transform=`translate3d(0,${-4*height*p*(1-p)}px,0) scale(${1+.06*Math.sin(p*Math.PI*2)},${1-.06*Math.sin(p*Math.PI*2)})`;if(p===1){s.started=null;s.image.style.transform='translate3d(0,0,0)';eatInsect(s,t)}}}}
function distributeInsects(t){
 insects.forEach(b=>b.owner=null);ecosystem.forEach(s=>s.targetFood=null);
 const candidates=ecosystem.filter(s=>!s.dragging&&data.behaviors[s.id]!=='rest'),free=[...insects];
 while(candidates.length&&free.length){
  let best=null;
  for(const s of candidates)for(const bug of free){const distance=Math.hypot(s.position.x-bug.x,s.position.y-bug.y);if(!best||distance<best.distance)best={s,bug,distance}}
  best.bug.owner=best.s.id;best.s.targetFood=best.bug.id;best.s.next=Math.min(best.s.next??Infinity,t+120);
  candidates.splice(candidates.indexOf(best.s),1);free.splice(free.indexOf(best.bug),1);
 }
}
function feedAt(x,y,t=forestClock){if(insects.length>27){$('forestHint').textContent='Todavía quedan insectos por comer.';return false}x=Math.max(10,Math.min(86,x));y=Math.max(58,Math.min(85,y));for(let i=0;i<3;i++)insects.push({id:++insectSerial,x:Math.max(8,Math.min(88,x+(i-1)*3)),y:Math.min(86,y+(i%2)*2),owner:null});renderInsects();distributeInsects(t);data.feedings++;save();$('forestHint').textContent='Toca otros lugares para repartir insectos. Cada coquí busca su propio alimento.';$('forestMeals').textContent=data.feedings;return true}

function closeForest(){forestReturn=forestReturn==='map'?'map':'game';$('forest').close();handleForestClose()}
function handleForestClose(){stopEcosystem();const back=forestReturn;forestReturn='game';if(back==='map')openMap()}
$('forestBack').onclick=closeForest;
$('forest').addEventListener('close',handleForestClose);
$('forestStatusBtn').onclick=()=>{$('forestCustomize').showModal()};
$('forestFriendsBtn').onclick=()=>openCollection('forest');
$('forestFeedBtn').onclick=()=>{feeding=!feeding;$('forestFeedBtn').setAttribute('aria-pressed',String(feeding));$('forestHint').textContent=feeding?'Toca varios puntos del suelo para repartir insectos.':'Arrastra un coquí para moverlo. Toca Alimentar para repartir insectos.'};
$('forestScene').addEventListener('click',event=>{if(!feeding||event.target.closest('button'))return;const rect=$('forestResidents').getBoundingClientRect();feedAt((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100)});
$('residentRest').onchange=()=>{data.behaviors[residentId]=$('residentRest').checked?'rest':'explore';save();renderForest()};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopEcosystem();else if($('forest').open)startEcosystem()});
let collectionReturn='game';
function openCollection(returnTo='game'){collectionReturn=returnTo;$('collectionReturnBtn').textContent=returnTo==='map'?'Volver al mapa':returnTo==='forest'?'Volver a El Yunque':'Volver a jugar';renderCollection();$('collection').showModal()}
function handleCollectionClose(){const back=collectionReturn;collectionReturn='game';if(back==='map')openMap()}
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
function openMap(){mapChapter=Math.floor((currentAdventureLevel()??59)/10);renderMap();$('levels').showModal()}
function changeMapChapter(delta){mapChapter=Math.max(0,Math.min(Math.floor(unlockedThrough()/10),(mapChapter??Math.floor(unlockedThrough()/10))+delta));renderMap()}
function selectMapLevel(index){if(!Number.isInteger(index)||index<0||index>unlockedThrough())return false;$('levels').close();if(game&&!game.daily&&!game.won&&game.level===index)return true;chooseNew(()=>start(index));return true}
function renderMap(){
 const current=currentAdventureLevel(),available=unlockedThrough(),lastChapter=Math.floor(available/10);
 const c=Math.max(0,Math.min(lastChapter,mapChapter??Math.floor((current??59)/10)));mapChapter=c;
 $('mapProgress').textContent=current===null?'¡Completaste Puerto Rico!':`Nivel actual: ${current+1} · ${data.completed.length}/60 completados`;
 $('mapPrevious').disabled=c===0;$('mapNext').disabled=c===lastChapter;
 $('mapRegion').textContent=`${CHAPTERS[c]} · ${c*10+1}–${c*10+10}`;
 const section=document.createElement('section');section.className='map-chapter';section.setAttribute('aria-label',`Mapa de ${CHAPTERS[c]}, niveles ${c*10+1} a ${c*10+10}`);
 section.style.setProperty('--map-art',`url('assets/map-${c}.webp?v=18')`);
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
$('mapBack').onclick=()=>$('levels').close();
$('mapForestBtn').onclick=()=>{$('levels').close();openForest('map')};
$('resultMapBtn').onclick=()=>{$('result').close();openMap()};

// Each challenge has an explicit, verifiable goal and a single payout.
const BONUS_TYPES=['pairs','song','count'];
let bonusRound=null;
function missionKey(){return 'round:'+data.bonusCounter}
function roundFor(key){let seed=0;for(const c of key)seed=(seed*31+c.charCodeAt(0))>>>0;return {type:BONUS_TYPES[(Number(key.split(':')[1])||1)%3],seed}}
function buildBonus(key){const {type,seed}=roundFor(key);let state=seed||1;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};const shuffle=items=>{for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}return items};const sequence=[];for(let i=0;i<4;i++){let note=Math.floor(random()*3);if(i&&note===sequence[i-1])note=(note+1)%3;sequence.push(note)}const answer=3+Math.floor(random()*4),countItems=shuffle([...Array(answer).fill('fly'),...Array(3).fill('flower')]);return {key,type,seed,sequence,answer,countItems,options:shuffle([answer-1,answer,answer+1]),cards:shuffle([0,0,1,1,2,2]),matched:[],revealed:[],input:[],turns:0,phase:type==='song'?'show':'play',notice:''}}
function openBonus(){if(!data.bonusPending||data.bonusClaims.includes(data.bonusPending))return false;bonusRound=buildBonus(data.bonusPending);renderBonus();$('bonus').showModal();return true}
function bonusSolved(r){if(!r)return false;if(r.type==='pairs')return new Set(r.matched).size===6&&r.matched.every(i=>Number.isInteger(i)&&i>=0&&i<6);if(r.type==='song')return r.phase==='answer'&&r.input.length===r.sequence.length&&r.input.every((value,i)=>value===r.sequence[i]);if(r.type==='count')return Number.isInteger(r.submittedAnswer)&&r.submittedAnswer===r.countItems.filter(x=>x==='fly').length;return false}
function completeBonus(){const r=bonusRound;if(!r||r.phase==='done'||!bonusSolved(r)||data.bonusPending!==r.key||data.bonusClaims.includes(r.key))return false;data.bonusClaims.push(r.key);data.points+=20;data.bonusPending=null;r.phase='done';save();paintCareer();renderBonus();return true}
function renderBonus(){const r=bonusRound;if(!r)return;const area=$('bonusArea');area.replaceChildren();$('bonusReward').textContent=r.phase==='done'?`¡+20 puntos! Saldo: ${data.points}`:'+20 puntos al completar el objetivo';$('bonusTitle').textContent={pairs:'Parejas del bosque',song:'Recuerda el sendero',count:'Cuenta los insectos'}[r.type];$('bonusInstructions').textContent=r.phase==='done'?(r.type==='count'?`Correcto: ${r.submittedAnswer} insectos. Recompensa guardada.`:r.type==='pairs'?'Encontraste las 3 parejas. Recompensa guardada.':'Repetiste los 4 símbolos en orden. Recompensa guardada.'):r.type==='pairs'?'Encuentra las 3 parejas de imágenes iguales. Cada turno permite destapar dos cartas.':r.type==='song'?'Memoriza los 4 símbolos de izquierda a derecha. Pulsa Listo y repítelos en el mismo orden.':'¿Cuántos insectos hay? Cuenta solo las mosquitas. Las flores no cuentan.';$('bonusNotice').textContent=r.notice||'';if(r.phase==='done')return;
 if(r.type==='pairs'){area.className='bonus-area pairs-grid';r.cards.forEach((v,i)=>{const b=document.createElement('button'),visible=r.matched.includes(i)||r.revealed.includes(i);if(visible){const img=document.createElement('img');img.src=['assets/decor-flowers.webp','assets/decor-fern.webp','assets/coqui.webp'][v];img.alt='';b.append(img)}else b.textContent='?';b.className=r.matched.includes(i)?'matched':r.revealed.includes(i)?'revealed':'';b.setAttribute('aria-label',`Carta ${i+1}: ${visible?['flor','hoja','coquí'][v]:'oculta'}`);b.disabled=visible;b.onclick=()=>bonusPick(i);area.append(b)});if(r.revealed.length===2){const next=document.createElement('button');next.textContent='Ocultar y seguir';next.className='primary';next.onclick=()=>{r.revealed=[];renderBonus()};area.append(next)}$('bonusNotice').textContent=`${r.matched.length/2}/3 parejas · ${r.turns} turnos${r.revealed.length===2?' · No coinciden. Ocúltalas para continuar.':''}`}
 else if(r.type==='song'){area.className='bonus-area';const symbols=['☀','☾','❀'];if(r.phase==='show'){const line=document.createElement('p');line.className='memory-sequence';r.sequence.forEach((v,i)=>{const item=document.createElement('span');item.textContent=symbols[v];item.setAttribute('aria-label',`Paso ${i+1}: ${['sol','luna','flor'][v]}`);line.append(item)});const ready=document.createElement('button');ready.className='primary';ready.textContent='Listo · ocultar símbolos';ready.onclick=()=>{r.phase='answer';r.input=[];r.notice='';renderBonus()};area.append(line,ready)}else{const text=document.createElement('p');text.textContent=`Paso ${r.input.length+1} de 4 · ${r.input.length} correctos`;const progress=document.createElement('div');progress.className='memory-progress';for(let i=0;i<4;i++){const dot=document.createElement('span');dot.textContent=i<r.input.length?'✓':String(i+1);dot.className=i<r.input.length?'correct':'';progress.append(dot)}area.append(progress);area.append(text);const choices=document.createElement('div');choices.className='bonus-choices';symbols.forEach((symbol,i)=>{const b=document.createElement('button');b.textContent=symbol;b.setAttribute('aria-label',['Sol','Luna','Flor'][i]);b.onclick=()=>bonusPick(i);choices.append(b)});const replay=document.createElement('button');replay.className='text-btn';replay.textContent='Ver el orden otra vez';replay.onclick=()=>{r.phase='show';r.input=[];r.notice='';renderBonus()};area.append(choices,replay)}}
 else{area.className='bonus-area';const picture=document.createElement('div');picture.className='count-clearing';r.countItems.forEach(type=>{const img=document.createElement('img');img.src=type==='fly'?'assets/insect-fly.webp':'assets/decor-flowers.webp';img.alt=type==='fly'?'Insecto':'Flor';picture.append(img)});const choices=document.createElement('div');choices.className='bonus-choices';for(const value of r.options){const b=document.createElement('button');b.textContent=value;b.setAttribute('aria-label',`${value} insectos`);b.onclick=()=>bonusPick(value);choices.append(b)}area.append(picture,choices)}
}
function bonusPick(value){const r=bonusRound;if(!r||r.phase==='done'||data.bonusPending!==r.key)return false;if(r.type==='pairs'){if(!Number.isInteger(value)||value<0||value>=6||r.matched.includes(value)||r.revealed.includes(value)||r.revealed.length===2)return false;r.revealed.push(value);if(r.revealed.length===2){r.turns++;if(r.cards[r.revealed[0]]===r.cards[r.revealed[1]]){r.matched.push(...r.revealed);r.revealed=[]}}if(r.matched.length===6)return completeBonus()}
 else if(r.type==='song'){if(r.phase!=='answer'||![0,1,2].includes(value))return false;if(value!==r.sequence[r.input.length]){r.input=[];r.notice='Ese símbolo no seguía en el orden. Empieza de nuevo o vuelve a verlo.'}else{r.input.push(value);r.notice='';if(r.input.length===4)return completeBonus()}}
 else{if(!r.options.includes(value))return false;if(value===r.countItems.filter(x=>x==='fly').length){r.submittedAnswer=value;return completeBonus()}r.notice='Vuelve a contar solo los insectos, sin las flores.'}renderBonus();return true}
$('bonusBtn').onclick=openBonus;
$('resultBonusBtn').onclick=()=>{$('result').close();openBonus()};

function save(){data.game=game;try{localStorage.setItem(KEY,JSON.stringify(data))}catch{feedback('El navegador no permite guardar. Puedes seguir jugando en esta sesión.')}}
function feedback(s){$('feedback').textContent=s}
const names={leaf:'AVENTURA EN LA HOJA',night:'BOSQUE ENCANTADO',garden:'NIDO TROPICAL'};
const difficulties={calm:'Tranquilo',normal:'Curioso',hard:'Experto'};
function theme(){document.body.dataset.theme=data.theme;document.body.classList.toggle('reduced-motion',data.motion);document.querySelector('meta[name=theme-color]').content={leaf:'#f6efdd',night:'#102f35',garden:'#faeee4'}[data.theme];$('journey').textContent=names[data.theme];document.querySelectorAll('[data-pick]').forEach(b=>{b.classList.toggle('selected',b.dataset.pick===data.theme);b.setAttribute('aria-pressed',String(b.dataset.pick===data.theme))});for(const [id,key] of [['soundToggle','sound'],['autoToggle','auto'],['relaxToggle','relax'],['motionToggle','motion']])$(id).checked=data[key];}
function audioStatus(message){for(const id of ['residentAudioStatus','soundStatus'])$(id).textContent=message}
function chirp(win=false,force=false){
 if(!data.sound&&!force)return Promise.resolve(false);
 // Use a real media element, directly from the tap; no suspended synthesis engine.
 const player=$('coquiAudio');
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
function render(){const p=puzzle();$('levelTitle').replaceChildren(document.createTextNode(game.daily?'Reto del día':`Nivel ${(game.level??game.puzzle)+1}`));const subtitle=document.createElement('span');subtitle.textContent=`· ${difficulties[game.difficulty]||'Tranquilo'}`;$('levelTitle').append(subtitle);const count=game.cells.filter(v=>v===2).length;$('progress').textContent=`${count} / 8`;$('hearts').textContent=data.relax?'∞':Array.from({length:4},(_,i)=>i<game.lives?'♥':'♡').join(' ');$('hearts').setAttribute('aria-label',data.relax?'Sin límite de errores':`${game.lives} vidas`);const board=$('board'),fresh=board.children.length!==64,frag=fresh?document.createDocumentFragment():null;for(let i=0;i<64;i++){const b=fresh?document.createElement('button'):board.children[i],r=i>>3,c=i%8;b.type='button';b.className='cell';b.style.setProperty('--tile',`var(--tile${p.regions[i]})`);b.dataset.index=i;if(c<7&&p.regions[i]!==p.regions[i+1])b.classList.add('edge-r');if(r<7&&p.regions[i]!==p.regions[i+8])b.classList.add('edge-b');if(game.cells[i]!==2&&b.children.length)b.replaceChildren();let state='vacía';if(game.cells[i]===2){if(!b.firstElementChild){const img=document.createElement('img');img.src=activeCoqui().src;img.dataset.character=activeCoqui().id;img.alt='';b.append(img)}if(b.firstElementChild.dataset.character!==activeCoqui().id){b.firstElementChild.src=activeCoqui().src;b.firstElementChild.dataset.character=activeCoqui().id}state='coquí';if(game.fixed.includes(i)){b.classList.add('fixed');state='coquí inicial'}}else if(game.cells[i]===1){b.classList.add('mark');state='marcada con X'}else if(data.auto&&isBlocked(i)){b.classList.add('mark','auto');state='bloqueada automáticamente'}b.setAttribute('aria-label',`Fila ${r+1}, columna ${c+1}, región ${p.regions[i]+1}: ${state}`);b.setAttribute('aria-pressed',String(game.cells[i]===2));if(game.hinted===i)b.classList.add('hinted');if(fresh)frag.append(b)}if(fresh)board.replaceChildren(frag);$('undoBtn').disabled=!undo.length||game.won;$('modeLabel').textContent=mode==='coqui'?'Colocar coquí':'Marcar X';$('modeIcon').textContent=mode==='coqui'?'✦':'×';$('modeBtn').setAttribute('aria-label',mode==='coqui'?'Colocar coquí activado. Cambiar a marcar X':'Marcar X activado. Cambiar a colocar coquí');$('modeBtn').setAttribute('aria-pressed',String(mode==='coqui'));const remaining=Math.max(0,3-(game.hints||0));$('hintLabel').textContent=`Pista (${remaining}/3)`;$('hintBtn').setAttribute('aria-label',`${remaining} de 3 pistas disponibles`);$('hintBtn').disabled=game.won||remaining===0||(!data.relax&&game.lives===0);paintCareer();paintMission();save()}
function start(index,daily=false,seed=0){const previous=game?puzzle().solution.join(','):null;let base,variant;if(daily){base=seed%puzzles.length;variant=(seed>>>6)%8}else{let candidates=[];for(let b=0;b<puzzles.length;b++)for(let v=0;v<8;v++){if(game&&b===game.puzzle)continue;if(transformPuzzle(puzzles[b],v).solution.join(',')!==previous)candidates.push([b,v])}[base,variant]=candidates[randomInt(candidates.length)]}game={level:index,puzzle:base,variant,seed,cells:Array(64).fill(0),fixed:[],lives:4,won:false,daily,difficulty:'calm',hints:0,hinted:null,mistakes:0};undo=[];mode='coqui';render();feedback('Tablero vacío. Encuentra los ocho coquíes a tu ritmo.');save()}
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
 $('winRewards').hidden=false;$('resultBonusBtn').hidden=false;$('nextBtn').textContent='Ver mapa →';$('result').showModal();openBonus();
}
function levelFeature(){return ['seed','flower','precision','fireflies','encounter'][(game.daily?game.seed:game.level||0)%5]}
function flowerCell(){return ((game.level||0)*13+19)%64}
function paintMission(){const type=levelFeature(),messages={seed:'Semilla nueva · haz crecer El Yunque',flower:'Flor escondida · deduce su casilla y consigue hibiscos',precision:'Precisión · sin errores ni pistas: un tronco para El Yunque',fireflies:'Noche de luciérnagas · una victoria nueva suma luz a El Yunque',encounter:'Encuentro · completa este nivel y visita a tus coquíes en El Yunque'};$('levelMission').textContent=messages[type];if($('board').children.length===64&&type==='flower')$('board').children[flowerCell()].classList.add('flower-cell')}

function lost(){ $('winRewards').hidden=true;$('resultTag').textContent='UN RESPIRO Y SEGUIMOS';$('resultTitle').textContent='Todo se aprende';$('resultText').textContent='Puedes continuar esta partida sin límite de errores, o volver al tablero y reiniciarla.';$('nextBtn').textContent='Continuar sin límite';$('result').showModal()}
function play(i){if(game.won)return feedback('¡Tablero completado! Elige el siguiente nivel.');if(game.fixed.includes(i))return feedback('Este coquí es una pista inicial y ya está en su lugar.');if(!data.relax&&game.lives<=0){lost();return}game.hinted=null;if(mode==='mark'){if(game.cells[i]===2)return feedback('Un coquí encontrado ya está en su lugar. Puedes deshacer tu última jugada.');snapshot();game.cells[i]=game.cells[i]===1?0:1;if(levelFeature()==='flower'&&i===flowerCell()&&game.cells[i]===1&&puzzle().solution[i>>3]!==i%8)game.flowerCollected=true;render();feedback('Marca las casillas que puedes descartar.');return}if(game.cells[i]===2)return feedback('¡Este coquí ya encontró su rincón!');if(game.cells[i]===1){snapshot();game.cells[i]=0;render();return feedback('Marca retirada. Toca otra vez para colocar un coquí.')}if(puzzle().solution[i>>3]!==i%8){game.mistakes=(game.mistakes||0)+1;if(!data.relax)game.lives=Math.max(0,game.lives-1);render();const b=$('board').children[i];b.classList.add('error');clearTimeout(errorsTimer);errorsTimer=setTimeout(()=>b.classList.remove('error'),500);feedback(isBlocked(i)?'Aquí compartiría fila, columna, color o tocaría a otro coquí.':'Ese rincón impediría completar el tablero. Prueba con otra deducción.');if(game.lives===0&&!data.relax)setTimeout(lost,350);return}snapshot();game.cells[i]=2;if(levelFeature()==='flower'&&i===flowerCell())game.flowerCollected=true;if(game.cells.filter(v=>v===2).length<8)chirp();render();feedback('¡Coquí! Un rinconcito más en calma.');if(game.cells.filter(v=>v===2).length===8)finish()}
function chooseNew(action){$('winRewards').hidden=true;if(game.cells.some((v,i)=>v!==0&&!game.fixed.includes(i))&&!game.won){$('resultTag').textContent='ANTES DE CAMBIAR';$('resultTitle').textContent='¿Empezar otra partida?';$('resultText').textContent='La partida actual se sustituirá. Tus niveles completados y preferencias se conservan.';$('nextBtn').textContent='Empezar partida';pending=action;$('result').showModal()}else action()}
let pending=null;
$('board').addEventListener('click',e=>{const b=e.target.closest('.cell');if(b)play(Number(b.dataset.index))});
$('board').addEventListener('keydown',e=>{const i=Number(e.target.dataset.index);if(!Number.isInteger(i))return;const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(delta){e.preventDefault();const next=i+delta;if(next>=0&&next<64)$('board').children[next].focus()}});
$('modeBtn').onclick=()=>{mode=mode==='coqui'?'mark':'coqui';render();feedback(mode==='mark'?'Modo X: toca para marcar o quitar una marca.':'Modo coquí: toca el rincón donde debe estar.')};
$('undoBtn').onclick=()=>{if(!undo.length||game.won)return;game.cells=undo.pop().cells;game.hinted=null;render();feedback('Jugada deshecha. Los errores consumidos no se recuperan.')};
$('hintBtn').onclick=()=>{if(game.won||(!data.relax&&game.lives<=0))return;if((game.hints||0)>=3)return feedback('Ya usaste las 3 pistas de este tablero. Sigue con tus deducciones.');const r=puzzle().solution.findIndex((c,r)=>game.cells[r*8+c]!==2);if(r<0)return;const i=r*8+puzzle().solution[r];snapshot();game.cells[i]=2;game.hints++;game.hinted=i;if(game.cells.filter(v=>v===2).length<8)chirp();render();feedback(`Pista: coquí en fila ${r+1}, columna ${i%8+1}. Desde aquí descarta su fila, columna, región y casillas vecinas.`);if(game.cells.filter(v=>v===2).length===8)finish()};
$('settingsBtn').onclick=()=>{$('settings').showModal()};$('helpBtn').onclick=()=>{$('help').showModal()};
$('levelsBtn').onclick=openMap;
$('restartBtn').onclick=()=>chooseNew(()=>start(game.level??game.puzzle,game.daily,game.seed||0));
$('dailyBtn').onclick=()=>{const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Puerto_Rico',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());let hash=0;for(const c of date)hash=(hash*31+c.charCodeAt(0))>>>0;chooseNew(()=>start(0,true,hash))};
$('nextBtn').onclick=()=>{$('result').close();if(pending){const action=pending;pending=null;action();return}if(!game.won){data.relax=true;theme();render();feedback('Modo relajado activado. Sigue a tu ritmo.');return}openMap()};
$('resultClose').onclick=()=>{pending=null;$('result').close();if(game.won)openMap()};
$('result').addEventListener('close',()=>{if(!$('result').open)pending=null});
document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const rect=d.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)d.close()}}));
document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{data.theme=b.dataset.pick;theme();save()});
for(const [id,key] of [['soundToggle','sound'],['autoToggle','auto'],['relaxToggle','relax'],['motionToggle','motion']])$(id).onchange=()=>{data[key]=$(id).checked;theme();render();if(key==='sound')chirp()};

function valid(g){return g&&Number.isInteger(g.puzzle)&&g.puzzle>=0&&g.puzzle<puzzles.length&&(g.variant===undefined||(Number.isInteger(g.variant)&&g.variant>=0&&g.variant<8))&&Array.isArray(g.cells)&&g.cells.length===64&&g.cells.every((x,i)=>[0,1,2].includes(x)&&(x!==2||transformPuzzle(puzzles[g.puzzle],g.variant||0).solution[i>>3]===i%8))&&Array.isArray(g.fixed)&&g.fixed.every(i=>Number.isInteger(i)&&i>=0&&i<64&&g.cells[i]===2)&&Number.isInteger(g.lives)&&g.lives>=0&&g.lives<=4}
async function init(){theme();try{const response=await fetch('puzzles.json?v=11');if(!response.ok)throw Error('network');puzzles=await response.json();if(puzzles.length!==60)throw Error('data');if(!data.emptyStartV2){data.auto=false;data.emptyStartV2=true;if(data.game&&Array.isArray(data.game.cells)&&Array.isArray(data.game.fixed)){const untouched=data.game.cells.every((v,i)=>v===0||(v===2&&data.game.fixed.includes(i)));if(untouched&&data.game.lives===4&&!data.game.won){data.game.cells.fill(0);data.game.fixed=[]}}}theme();if(valid(data.game)){game=data.game;game.hints=Math.min(3,Math.max(0,Number(game.hints)||0));game.level??=game.puzzle;render()}else start(0);$('loading').hidden=true;if(!data.intro){data.intro=true;save();$('help').showModal()}}catch{$('loading').querySelector('p').textContent='No pudimos cargar los niveles. Comprueba la conexión e inténtalo otra vez.';$('retryBtn').hidden=false}}
$('retryBtn').onclick=()=>location.reload();
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
if('serviceWorker'in navigator){let refreshing=false;const wasControlled=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing||!wasControlled)return;refreshing=true;save();location.reload()});navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{reg.update();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update()})}).catch(()=>{})}
init();
