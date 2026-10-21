const $=id=>document.getElementById(id);
const KEY='coquidoku-v1';
const defaults={theme:'night',sound:true,mapMusic:true,boardMusic:true,auto:false,relax:false,motion:false,difficulty:'calm',completed:[],dailyWins:[],character:null,earned:[],family:{pairedAt:0,bornAt:0,announced:false},decorGifts:[],decor:[null,null,null],positions:{},forestCoordinates:{},care:{},forestFood:'fly',feedings:0,behaviors:{},game:null};
let data;try{data={...JSON.parse(JSON.stringify(defaults)),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{data=JSON.parse(JSON.stringify(defaults))}
data.theme='night';
data.mapMusic=true;
data.boardMusic=data.boardMusic!==false;
data.completed=[...new Set((Array.isArray(data.completed)?data.completed:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<60))];data.dailyWins=[...new Set((Array.isArray(data.dailyWins)?data.dailyWins:[]).filter(n=>Number.isInteger(n)&&n>=0))];
data.relax=false;
// Preserve previously unlocked friends while retiring the old economy.
data.earned=[...new Set([...(Array.isArray(data.earned)?data.earned:[]),...(Array.isArray(data.purchased)?data.purchased:[])].filter(id=>['sol','menta','brisa','flor','luna','aurora'].includes(id)))];
for(const key of ['points','shields','flowerClaims','purchased','bonusClaims','bonusPending','bonusCounter'])delete data[key];
if(data.game)for(const key of ['shieldUntil','flowerAttempted','flowerCollected'])delete data.game[key];
data.family=data.family&&typeof data.family==='object'?data.family:{};
data.family={pairedAt:Number.isFinite(data.family.pairedAt)&&data.family.pairedAt>0?data.family.pairedAt:0,bornAt:Number.isFinite(data.family.bornAt)&&data.family.bornAt>0?data.family.bornAt:0,announced:data.family.announced===true};
data.decor=Array.isArray(data.decor)?[0,1,2].map(i=>['fern','flowers','log','stones','fireflies','sapling'].includes(data.decor[i])?data.decor[i]:null):[null,null,null];
data.positions=data.positions&&typeof data.positions==='object'&&!Array.isArray(data.positions)?Object.fromEntries(Object.entries(data.positions).filter(([id,z])=>['sol','menta','brisa','flor','luna','aurora','colombiana','boricua','borinbiano'].includes(id)&&Number.isInteger(z)&&z>=0&&z<3)):{};
data.forestCoordinates=data.forestCoordinates&&typeof data.forestCoordinates==='object'?Object.fromEntries(Object.entries(data.forestCoordinates).filter(([id,p])=>['sol','menta','brisa','flor','luna','aurora','colombiana','boricua','borinbiano'].includes(id)&&p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=8&&p.x<=88&&p.y>=45&&p.y<=88)):{};
data.decorGifts=(Array.isArray(data.decorGifts)?data.decorGifts:[]).filter(x=>['flowers','log','fireflies'].includes(x));
data.behaviors=data.behaviors&&typeof data.behaviors==='object'&&!Array.isArray(data.behaviors)?Object.fromEntries(Object.entries(data.behaviors).filter(([id,v])=>['sol','menta','brisa','flor','luna','aurora','colombiana','boricua','borinbiano'].includes(id)&&['rest','explore'].includes(v))):{};
if(!data.rulesV3){data.theme='night';if(data.game&&Number.isInteger(data.game.lives)&&data.game.lives>=0&&data.game.lives<=3)data.game.lives+=1;if(data.game)data.game.hints=Math.min(3,Math.max(0,Number(data.game.hints)||0));data.rulesV3=true}
// Enable the requested call once on upgrade; later manual mute choices persist.
if(!data.soundFixV141){data.sound=true;data.soundFixV141=true}
data.care=data.care&&typeof data.care==='object'&&!Array.isArray(data.care)?data.care:{};
data.forestFood=['fly','butterfly','worm','ant'].includes(data.forestFood)?data.forestFood:'fly';
data.feedings=Number.isSafeInteger(data.feedings)&&data.feedings>=0?data.feedings:0;
let puzzles=[],game,mode='coqui',undo=[],errorsTimer,errorCell=null;

const COQUIS=[
 {id:'sol',name:'Coquí Dorado',at:0,detail:'Un rayito de calidez',src:'assets/coqui.webp'},
 {id:'menta',name:'Pistoco',at:5,detail:'Fresco como una hoja nueva',src:'assets/coqui-menta.webp'},
 {id:'brisa',name:'Amapola',at:10,detail:'La calma junto al río',src:'assets/coqui-brisa.webp'},
 {id:'flor',name:'Sila',at:20,detail:'Un toque de alegría tropical',src:'assets/coqui-flor.webp'},
 {id:'luna',name:'Betances',at:35,detail:'Un amigo de las luciérnagas',src:'assets/coqui-luna.webp'},
 {id:'aurora',name:'Rita',at:50,detail:'Los colores de un nuevo día',src:'assets/coqui-aurora.webp'},
 {id:'colombiana',name:'Colombiana',at:55,detail:'Una compañera con los colores de Colombia',src:'assets/coqui-colombiana.webp'},
 {id:'boricua',name:'Boricua',at:60,detail:'El orgullo de nuestra isla',src:'assets/coqui-boricua.webp'},
 {id:'borinbiano',name:'Borinbiano',at:null,secret:true,detail:'El pequeño de Colombiana y Boricua',src:'assets/coqui-borinbiano-flag.webp'}
];
for(const c of COQUIS)c.sleepSrc=c.id==='borinbiano'?'assets/coqui-borinbiano-flag-sleep.webp':`assets/coqui-${c.id}-sleep.webp`;
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
const FAMILY_WAIT=24*60*60*1000;
function parentsTogether(){return data.completed.length===60}
function updateFamily(now=Date.now()){
 if(!parentsTogether())return false;
 if(!data.family.pairedAt){data.family.pairedAt=now;data.family.bornAt=0;data.family.announced=false}
 if(now>=data.family.pairedAt+FAMILY_WAIT&&!data.family.bornAt){data.family.bornAt=data.family.pairedAt+FAMILY_WAIT;return true}
 return false;
}
function babyUnlocked(now=Date.now()){return parentsTogether()&&data.family.pairedAt>0&&data.family.bornAt>=data.family.pairedAt+FAMILY_WAIT&&now>=data.family.bornAt}
function unlockedCoqui(c){return c.secret?babyUnlocked():c.id==='boricua'?parentsTogether():c.id==='colombiana'?data.completed.length>=55:c.at===0||data.completed.length>=c.at||data.earned.includes(c.id)}
function visibleCoquis(){return COQUIS.filter(c=>!c.secret||unlockedCoqui(c))}
function familyMessage(){
 if(babyUnlocked())return 'Borinbiano ya está en casa. ¡Tu familia está completa! Puedes seguir cuidando El Yunque.';
 if(!parentsTogether())return '';
 return 'Colombiana y Boricua son pareja. Una sorpresa llegará el '+new Intl.DateTimeFormat('es-PR',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(data.family.pairedAt+FAMILY_WAIT)+'.';
}
function paintFamily(){
 $('forest').dataset.familyComplete=String(babyUnlocked());
 $('forestFamilyStatus').hidden=!parentsTogether();$('forestFamilyStatus').textContent=familyMessage();
 for(const id of ['restartAdventureBtn','mapRestartAdventure'])$(id).hidden=!babyUnlocked();
}
function announceFamilyFinale(){
 if(!$('forest').open||!babyUnlocked()||data.family.announced)return;
 data.family.announced=true;save();cancelResidentPress?.();stopResidentHold();stopForestAmbience();stopEcosystem();
 $('familySprite').src=COQUIS.find(c=>c.id==='borinbiano').src;showDialog('familyFinale');
}
$('familyFinale').addEventListener('close',()=>{if($('forest').open){startForestAmbience();startEcosystem()}});
for(const id of ['restartAdventureBtn','mapRestartAdventure','finaleRestartBtn'])$(id).onclick=()=>{if(!babyUnlocked())return;stopForestAmbience();showDialog('restartAdventure')};
$('restartAdventure').addEventListener('close',()=>{if($('levels').open)syncMapMusic();else if(forestAudioAllowed())startForestAmbience()});
$('confirmRestartAdventure').onclick=restartAdventure;
function restartAdventure(){
 if(!babyUnlocked())return false;
 const prefs=Object.fromEntries(['sound','mapMusic','boardMusic','auto','motion'].map(k=>[k,data[k]]));
 stopResidentHold();stopEcosystem();stopMapMusic();stopBoardMusic();stopForestAmbience();
 forestReturn='game';collectionReturn='game';
 for(const id of SCENE_DIALOGS)if($(id).open)$(id).close();
 data={...JSON.parse(JSON.stringify(defaults)),...prefs,intro:true,rulesV3:true,soundFixV141:true,emptyStartV2:true,yunqueV1:true,selectionV16:true};
 insects=[];ecosystem=[];game=null;pending=null;undo=[];mapChapter=0;start(0);save();openMap();return true;
}
function forestStage(){return FOREST_STAGES.filter(s=>victories()>=s.at).at(-1)}
function activeCoqui(){return COQUIS.find(c=>c.id===data.character&&unlockedCoqui(c))||COQUIS[0]}
// Keep historical level-based unlocks when migrating an older adventure.
if(!data.yunqueV1){data.earned=[...new Set([...data.earned,...COQUIS.filter(c=>!c.secret&&c.id!=='boricua'&&c.id!=='colombiana'&&victories()>=c.at).map(c=>c.id)])];data.yunqueV1=true}
if(!data.selectionV16){if(data.character==='sol')data.character=null;data.selectionV16=true}
if(data.character&&!COQUIS.some(c=>c.id===data.character&&unlockedCoqui(c)))data.character=null;
function progression(){updateFamily();const n=victories(),next=COQUIS.find(c=>!c.secret&&!unlockedCoqui(c));return {n,next,stage:forestStage(),unlocked:COQUIS.filter(unlockedCoqui)}}
function paintCareer(){const p=progression(),active=activeCoqui();$('careerCount').textContent=`${data.completed.length}/60 niveles · ${p.n} semillas`;$('characterName').textContent=data.character?active.name:'Elige tu coquí';$('careerFrog').src=active.src;$('forestBrief').textContent=`${p.unlocked.length} coquíes en tu refugio`;for(const id of ['resultSprite','helpSprite'])$(id).src=active.src;paintFamily()}
function chooseCoqui(id){const c=COQUIS.find(c=>c.id===id);if(!c||!unlockedCoqui(c))return false;data.character=id;render();renderCollection();feedback(`${c.name} te acompaña en el tablero.`);return true}
function renderCollection(){
 const p=progression(),roster=visibleCoquis();
 $('collectionCount').textContent=p.unlocked.length+' de '+COQUIS.length+' amigos';
 $('nextCoqui').textContent=p.next?'Próximo: '+p.next.name+' · completa '+p.next.at+' niveles.':babyUnlocked()?'¡Tu familia de coquíes está completa!':'Tu personaje bonus sigue por revelar.';
 const cards=document.createDocumentFragment();
 for(const c of roster){
  const unlocked=unlockedCoqui(c),selected=c.id===data.character,card=document.createElement('article');
  card.className='coqui-card'+(unlocked?'':' locked')+(selected?' chosen':'');
  const image=document.createElement('img');image.src=c.src;image.alt=c.name;image.width=150;image.height=150;
  const title=document.createElement('h3');title.textContent=c.name;
  const desc=document.createElement('p');desc.textContent=c.detail;
  const target=document.createElement('small');target.textContent=c.secret?'Tu familia está completa':c.at===0?'Tu primer compañero':'Se desbloquea al completar '+c.at+' niveles.';
  const button=document.createElement('button');button.className=selected?'selected-coqui':'pick-coqui';button.textContent=selected?'✓ Elegido':unlocked?'Elegir':'Completa '+c.at+' niveles';button.disabled=selected||!unlocked;
  button.setAttribute('aria-label',c.name+': '+button.textContent);button.onclick=()=>chooseCoqui(c.id);
  card.append(image,title,desc,target,button);cards.append(card);
 }
 if(!babyUnlocked()){
  const card=document.createElement('article');card.className='coqui-card mystery-card';card.setAttribute('aria-label','Personaje bonus sin revelar');
  const portrait=document.createElement('div');portrait.className='mystery-portrait';
  const silhouette=document.createElement('img');silhouette.src='assets/coqui.webp';silhouette.alt='Silueta negra de un personaje bonus';silhouette.width=112;silhouette.height=112;
  const mark=document.createElement('span');mark.className='mystery-mark';mark.textContent='?';mark.setAttribute('aria-hidden','true');portrait.append(silhouette,mark);
  const title=document.createElement('h3');title.textContent='Personaje bonus';
  const description=document.createElement('p');description.textContent='Ten por más de 24 horas a Boricua y Colombiana juntos en El Yunque para revelar el personaje bonus.';
  card.append(portrait,title,description);cards.append(card);
 }
 $('coquiCards').replaceChildren(cards);save();
}
const FOREST_FOODS={
 fly:{name:'Insectos',src:'assets/insect-fly.webp',min:6,max:13},
 butterfly:{name:'Mariposas',src:'assets/bonus-butterfly.webp',min:9,max:18},
 worm:{name:'Gusanitos',src:'assets/food-worm.webp',min:13,max:23},
 ant:{name:'Hormigas',src:'assets/food-ant.webp',min:4,max:11}
};
function careRandom(min,max){return min+Math.random()*(max-min)}
const MIN_SLEEP_INTERVAL=3*60*60*1000;
function nextSleepTime(now){return now+careRandom(MIN_SLEEP_INTERVAL,4*60*60*1000)}
function residentIsSleeping(id,now=Date.now()){return (data.care[id]?.sleepUntil||0)>now}
function residentIsSleepy(id,now=Date.now()){return !residentIsSleeping(id,now)&&(data.care[id]?.nextSleepAt??Infinity)<=now}
function ensureAwakeResident(now=Date.now(),excludeId=null){
 const residents=COQUIS.filter(unlockedCoqui).map(c=>({id:c.id,care:careFor(c.id,now)}));
 if(residents.some(s=>s.care.sleepUntil<=now&&s.care.nextSleepAt>now&&data.behaviors[s.id]!=='rest'))return false;
 let candidates=residents.filter(s=>s.id!==excludeId);if(!candidates.length)candidates=residents;
 const awake=candidates.filter(s=>s.care.sleepUntil<=now&&data.behaviors[s.id]!=='rest');if(awake.length)candidates=awake;
 const chosen=candidates[Math.floor(Math.random()*candidates.length)];if(!chosen)return false;
 chosen.care.sleepUntil=0;chosen.care.sleepStartedAt=0;chosen.care.nextSleepAt=nextSleepTime(now);data.behaviors[chosen.id]='explore';
 const state=ecosystem.find(s=>s.id===chosen.id);if(state){state.started=null;state.targetFood=null;state.next=forestClock+careRandom(400,1000);resetResidentPose(state)}
 return true;
}
function careFor(id,now=Date.now()){
 let c=data.care[id];
 if(!c||typeof c!=='object'||!Number.isFinite(c.satiety)||!Number.isFinite(c.lastUpdate)||!Number.isFinite(c.nextSleepAt)||!Number.isFinite(c.sleepUntil)||!Number.isFinite(c.hungerRate)){
  c=data.care[id]={satiety:careRandom(80,95),lastUpdate:now,nextSleepAt:nextSleepTime(now),sleepUntil:0,sleepStartedAt:0,sleepCycleV2:true,hungerRate:careRandom(.45,.75)};
 }
 if(!c.sleepCycleV2){
  c.sleepStartedAt=c.sleepUntil>now?Math.max(0,Math.min(now,c.sleepUntil-25*60000)):0;
  c.nextSleepAt=Math.max(c.nextSleepAt,nextSleepTime(now));c.sleepCycleV2=true;
 }
 if(!Number.isFinite(c.sleepStartedAt)||c.sleepStartedAt<0)c.sleepStartedAt=c.sleepUntil>now?Math.max(0,Math.min(now,c.sleepUntil-25*60000)):0;
 c.satiety=Math.max(0,Math.min(100,c.satiety));c.hungerRate=Math.max(.45,Math.min(.75,c.hungerRate));
 const elapsed=Math.max(0,now-c.lastUpdate),asleep=Math.max(0,Math.min(now,c.sleepUntil)-c.lastUpdate);
 c.satiety=Math.max(0,c.satiety-((elapsed-asleep)+asleep*.2)/60000*c.hungerRate);c.lastUpdate=now;
 if(c.sleepUntil>0&&now>=c.sleepUntil){const wokeAt=c.sleepUntil;c.sleepUntil=0;c.sleepStartedAt=0;c.nextSleepAt=nextSleepTime(wokeAt)}
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
 if(COQUIS.filter(unlockedCoqui).length<2){$('residentCareText').textContent='Necesita otro compañero despierto para poder descansar.';return false}
 c.sleepStartedAt=now;c.sleepUntil=now+careRandom(15*60000,25*60000);data.behaviors[id]='explore';
 ensureAwakeResident(now,id);
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
 $('residentSleepBtn').disabled=sleeping||!sleepy||COQUIS.filter(unlockedCoqui).length<2;$('residentSleepBtn').textContent=sleeping?'Durmiendo…':'Dormir un ratito ☾';$('residentRest').checked=data.behaviors[residentId]==='rest';
}
let lastCarePaint=0,lastCareSave=0;
function tickResidentCare(now=Date.now(),force=false){
 if(!force&&now>=lastCarePaint&&now-lastCarePaint<1000)return;lastCarePaint=now;
 updateFamily(now);
 if($('forest').open&&babyUnlocked(now)&&!ecosystem.some(s=>s.id==='borinbiano')){renderForest();announceFamilyFinale();return}
 if($('forest').open){paintFamily();announceFamilyFinale()}
 ensureAwakeResident(now);
 for(const state of ecosystem){
  const c=COQUIS.find(c=>c.id===state.id),care=careFor(state.id,now),sleeping=care.sleepUntil>now,sleepy=now>=care.nextSleepAt;
  const src=sleeping?c.sleepSrc:c.src;if(state.image.dataset.careSprite!==src){state.image.src=src;state.image.dataset.careSprite=src}
  const wasSleeping=state.button.dataset.sleeping==='true';
  const value=sleeping?Math.max(0,Math.min(100,(now-care.sleepStartedAt)/Math.max(1,care.sleepUntil-care.sleepStartedAt)*100)):care.satiety;
  state.button.dataset.sleeping=String(sleeping);state.button.careFill.style.width=value+'%';
  state.button.careBar.dataset.mode=sleeping?'sleep':'hunger';
  state.button.careBar.setAttribute('aria-label',(sleeping?'Progreso del sueño de ':'Alimento de ')+c.name);
  state.button.careBar.setAttribute('aria-valuenow',String(Math.round(value)));
  state.button.careBar.setAttribute('aria-valuetext',Math.round(value)+'% '+(sleeping?'del descanso':'de alimento'));
  state.button.careBar.style.setProperty('--care-color',sleeping?'#69b4ff':'#9ac875');
  if(wasSleeping&&!sleeping){state.started=null;state.targetFood=null;state.next=forestClock+careRandom(400,1000)}
  state.button.sleepBadge.hidden=!(sleeping||sleepy);state.button.sleepBadge.textContent=sleeping?'Zz':'☾';
  state.button.setAttribute('aria-label',c.name+', alimento '+Math.round(care.satiety)+'%'+(sleeping?', durmiendo':sleepy?', tiene sueño':'')+'. Mantén pulsado para escuchar su canto.');
  if(sleeping||sleepy||data.behaviors[state.id]==='rest'){state.started=null;state.targetFood=null;state.next=Infinity;resetResidentPose(state)}
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
 const friends=document.createDocumentFragment();p.unlocked.forEach((c,i)=>{const zone=Number.isInteger(data.positions[c.id])?data.positions[c.id]:i%3,peers=p.unlocked.filter((f,j)=>(Number.isInteger(data.positions[f.id])?data.positions[f.id]:j%3)===zone),slot=peers.indexOf(c);const b=document.createElement('button');b.className='forest-friend'+(c.secret?' baby-resident':'');b.style.left=([67,18,40][zone]+(slot%3)*7)+'%';b.style.top=([53,60,66][zone]+Math.floor(slot/3)*8)+'%';if(parentsTogether()&&['colombiana','boricua','borinbiano'].includes(c.id)){b.style.left=({colombiana:53,boricua:70,borinbiano:61}[c.id])+'%';b.style.top=(c.secret?82:73)+'%'}if(data.forestCoordinates[c.id]){b.style.left=data.forestCoordinates[c.id].x+'%';b.style.top=data.forestCoordinates[c.id].y+'%'}b.style.zIndex=String(10+zone+slot);b.setAttribute('aria-label',`${c.name}, ${ZONES[zone]}. Arrastra para moverlo o toca para conocerlo.`);const img=document.createElement('img');img.src=c.src;img.alt='';b.append(img);const bar=document.createElement('span'),fill=document.createElement('i'),badge=document.createElement('span');bar.className='resident-hunger';bar.setAttribute('role','meter');bar.setAttribute('aria-label','Alimento de '+c.name);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.append(fill);badge.className='resident-sleep';badge.hidden=true;b.careBar=bar;b.careFill=fill;b.sleepBadge=badge;b.append(bar,badge);b.onclick=event=>{if(b.suppressClick){b.suppressClick=false;event.preventDefault();return}openResident(c.id)};bindResidentDrag(b,c.id);friends.append(b)});$('forestResidents').replaceChildren(friends);ecosystem=progression().unlocked.map((c,i)=>{const button=$('forestResidents').children[i];return {id:c.id,button,image:button.firstElementChild,position:{x:parseFloat(button.style.left),y:parseFloat(button.style.top)},next:null,started:null,targetFood:null,direction:i%2===0,hops:0}});$('forestMeals').textContent=data.feedings;const roster=document.createDocumentFragment();for(const c of p.unlocked){const b=document.createElement('button');b.textContent=c.name;b.onclick=()=>openResident(c.id);roster.append(b)}$('forestRoster').replaceChildren(roster);insects.forEach(b=>b.owner=null);renderInsects();$('forestInvite').textContent=p.unlocked.length<8?'Desbloquea más personajes para que vivan en El Yunque.':'¡Toda tu familia de coquíes vive en El Yunque!';tickResidentCare(Date.now(),true);save()}
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
function forestAudioAllowed(){return $('forest').open&&document.visibilityState!=='hidden'&&!['levels','collection','settings','help','familyFinale','restartAdventure'].some(id=>$(id).open)}
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
function openForest(returnTo='game'){stopBoardMusic();forestReturn=returnTo;feeding=false;$('forestFoodPicker').hidden=true;$('forestFeedBtn').setAttribute('aria-pressed','false');$('forestHint').textContent='Arrastra un coquí para moverlo. Toca Alimentar para repartir insectos.';forestTime=Math.random()<.5?'day':'night';renderForest();showDialog('forest');startForestAmbience();$('forestBack').focus({preventScroll:true});startEcosystem();announceFamilyFinale()}
function stopEcosystem(){cancelResidentPress?.();stopResidentHold();if(forestRaf!==null&&window.cancelAnimationFrame)window.cancelAnimationFrame(forestRaf);forestRaf=null}
function startEcosystem(){stopEcosystem();if(!window.requestAnimationFrame||!$('forest').open||document.visibilityState==='hidden')return;const frame=t=>{forestRaf=null;if(!$('forest').open||document.visibilityState==='hidden')return;updateEcosystem(t);forestRaf=window.requestAnimationFrame(frame)};forestRaf=window.requestAnimationFrame(frame)}
let insects=[],insectSerial=0;
function renderInsects(){const fragment=document.createDocumentFragment();for(const bug of insects){const img=document.createElement('img');img.className='food-insect';img.src=(FOREST_FOODS[bug.type]||FOREST_FOODS.fly).src;img.alt='';img.style.left=bug.x+'%';img.style.top=bug.y+'%';fragment.append(img)}$('forestFood').replaceChildren(fragment)}
const FOOD_REACH=32;
function foodDistance(s,bug){return Math.hypot(bug.x-s.position.x,(bug.y-s.position.y)*1.8)}
function closestResident(bug){
 let nearest=null,distance=FOOD_REACH;
 for(const s of ecosystem){if(s.dragging||data.behaviors[s.id]==='rest'||residentIsSleeping(s.id)||residentIsSleepy(s.id))continue;const d=foodDistance(s,bug);if(d<distance){nearest=s;distance=d}}
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
function updateEcosystem(t){forestClock=t;tickResidentCare();if(insects.length)distributeInsects(t);for(let i=0;i<ecosystem.length;i++){const s=ecosystem[i];if(s.dragging)continue;if(data.behaviors[s.id]==='rest'||residentIsSleeping(s.id)||residentIsSleepy(s.id)){insects.filter(b=>b.owner===s.id).forEach(b=>b.owner=null);s.targetFood=null;resetResidentPose(s);s.started=null;s.next=Infinity;continue}if(insects.length)claimInsect(s,t);if(s.next===null)s.next=t+800+i*1300;if(s.started===null&&t>=s.next){s.started=t;s.next=t+10000+((i*1297+s.hops*1931)%5001);s.from={...s.position};const bug=insects.find(b=>b.id===s.targetFood),goal=bug||{x:Math.max(8,Math.min(88,s.position.x+(s.direction?5:-5))),y:s.position.y},distance=Math.hypot(goal.x-s.position.x,goal.y-s.position.y),scale=distance>12?12/distance:1;s.target={x:s.position.x+(goal.x-s.position.x)*scale,y:s.position.y+(goal.y-s.position.y)*scale};s.direction=!s.direction;s.hops++}if(s.started!==null){const p=data.motion?1:Math.max(0,Math.min(1,(t-s.started)/900)),ease=p*p*(3-2*p),height=data.motion?0:36;s.position={x:s.from.x+(s.target.x-s.from.x)*ease,y:s.from.y+(s.target.y-s.from.y)*ease};s.button.style.left=s.position.x+'%';s.button.style.top=s.position.y+'%';s.button.style.setProperty('--hop-y',`${-4*height*p*(1-p)}px`);s.image.style.transform=`scale(${1+.06*Math.sin(p*Math.PI*2)},${1-.06*Math.sin(p*Math.PI*2)})`;if(p===1){s.started=null;resetResidentPose(s);eatInsect(s,t)}}}}
function distributeInsects(t){
 for(const bug of insects)bug.owner=closestResident(bug)?.id??null;
 for(const s of ecosystem){
  if(!insects.some(b=>b.id===s.targetFood&&b.owner===s.id))s.targetFood=null;
  if(!s.dragging&&data.behaviors[s.id]!=='rest'&&!residentIsSleeping(s.id)&&!residentIsSleepy(s.id))claimInsect(s,t);
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
$('residentRest').onchange=()=>{data.behaviors[residentId]=$('residentRest').checked?'rest':'explore';ensureAwakeResident(Date.now(),residentId);save();renderForest();paintResidentDetail()};
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
 updateFamily();paintFamily();$('mapProgress').textContent=current===null?(babyUnlocked()?'¡Tu familia está completa!':'¡Completaste los 60 niveles!'):`Nivel actual: ${current+1} · ${data.completed.length}/60 completados`;
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
 return data.mapMusic&&$('levels').open&&document.visibilityState!=='hidden'&&!['settings','help','result','defeat','collection','forest','forestCustomize','resident','familyFinale','restartAdventure'].some(id=>$(id).open);
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
const SCENE_DIALOGS=['levels','forest','collection','settings','help','result','defeat','familyFinale','restartAdventure','resident','forestCustomize'];
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
function render(){paintBoardAppearance();const p=puzzle();$('levelTitle').replaceChildren(document.createTextNode(game.daily?'Reto del día':`Nivel ${(game.level??game.puzzle)+1}`));const subtitle=document.createElement('span');subtitle.textContent=`· ${difficulties[game.difficulty]||'Tranquilo'}`;$('levelTitle').append(subtitle);const count=game.cells.filter(v=>v===2).length;$('progress').textContent=`${count}/8 coquíes`;$('hearts').textContent=Array.from({length:4},(_,i)=>i<game.lives?'♥':'♡').join(' ');$('hearts').setAttribute('aria-label',`${game.lives} vidas`);const board=$('board'),fresh=board.children.length!==64,frag=fresh?document.createDocumentFragment():null;for(let i=0;i<64;i++){const b=fresh?document.createElement('button'):board.children[i],r=i>>3,c=i%8;b.type='button';b.className='cell';b.style.setProperty('--tile',`var(--tile${p.regions[i]})`);b.dataset.index=i;if(c<7&&p.regions[i]!==p.regions[i+1])b.classList.add('edge-r');if(r<7&&p.regions[i]!==p.regions[i+8])b.classList.add('edge-b');if(game.cells[i]!==2&&b.children.length)b.replaceChildren();let state='vacía';if(game.cells[i]===2){if(!b.firstElementChild){const img=document.createElement('img');img.src=activeCoqui().src;img.dataset.character=activeCoqui().id;img.alt='';b.append(img)}if(b.firstElementChild.dataset.character!==activeCoqui().id){b.firstElementChild.src=activeCoqui().src;b.firstElementChild.dataset.character=activeCoqui().id}state='coquí';if(game.fixed.includes(i)){b.classList.add('fixed');state='coquí inicial'}}else if(game.cells[i]===1){b.classList.add('mark');state='marcada con X'}else if(data.auto&&isBlocked(i)){b.classList.add('mark','auto');state='bloqueada automáticamente'}b.setAttribute('aria-label',`Fila ${r+1}, columna ${c+1}, región ${p.regions[i]+1}: ${state}`);b.setAttribute('aria-pressed',String(game.cells[i]===2));if(game.hinted===i)b.classList.add('hinted');if(fresh)frag.append(b)}if(fresh)board.replaceChildren(frag);$('undoBtn').disabled=!undo.length||game.won;$('modeLabel').textContent=mode==='coqui'?'Colocar coquí':'Marcar X';$('modeIcon').textContent=mode==='coqui'?'✦':'×';$('modeBtn').setAttribute('aria-label',mode==='coqui'?'Colocar coquí activado. Cambiar a marcar X':'Marcar X activado. Cambiar a colocar coquí');$('modeBtn').setAttribute('aria-pressed',String(mode==='coqui'));const remaining=Math.max(0,3-(game.hints||0));$('hintLabel').textContent=`Pista (${remaining}/3)`;$('hintBtn').setAttribute('aria-label',`${remaining} de 3 pistas disponibles`);$('hintBtn').disabled=game.won||remaining===0||game.lives===0;paintCareer();paintMission();save()}
function start(index,daily=false,seed=0){setExtraOptions(false);const previous=game?puzzle().solution.join(','):null;let base,variant;if(daily){base=seed%puzzles.length;variant=(seed>>>6)%8}else{let candidates=[];for(let b=0;b<puzzles.length;b++)for(let v=0;v<8;v++){if(game&&b===game.puzzle)continue;if(transformPuzzle(puzzles[b],v).solution.join(',')!==previous)candidates.push([b,v])}[base,variant]=candidates[randomInt(candidates.length)]}game={level:index,puzzle:base,variant,seed,cells:Array(64).fill(0),fixed:[],lives:4,won:false,daily,difficulty:'calm',hints:0,hinted:null,mistakes:0};undo=[];mode='coqui';render();feedback('Tablero vacío. Encuentra los ocho coquíes a tu ritmo.');save();syncBoardMusic()}
function finish(){
 if(game.won)return;const before=victories(),friendsBefore=COQUIS.filter(unlockedCoqui).map(c=>c.id),oldStage=forestStage();game.won=true;
 if(game.daily){if(!data.dailyWins.includes(game.seed||0))data.dailyWins.push(game.seed||0)}else if(!data.completed.includes(game.level??game.puzzle))data.completed.push(game.level??game.puzzle);
 const added=victories()>before,newFriends=COQUIS.filter(c=>unlockedCoqui(c)&&!friendsBefore.includes(c.id));
 const giftsBefore=data.decorGifts.length;
 if(levelFeature()==='fireflies'&&!data.decorGifts.includes('fireflies'))data.decorGifts.push('fireflies');
 if(levelFeature()==='precision'&&(game.mistakes||0)===0&&game.lives===4&&game.hints===0&&!data.decorGifts.includes('log'))data.decorGifts.push('log');
 updateFamily();
 undo=[];render();chirp(true);$('resultTag').textContent='¡COQUÍ, COQUÍ!';$('resultTitle').textContent='Cada coquí en su lugar';$('resultText').textContent=levelFeature()==='encounter'?`${activeCoqui().name}: «Te espero junto al río en El Yunque. ¡Ya encontraste a los ocho!»`:'Encontraste los ocho. Tu refugio tiene un poco más de vida.';
 $('rewardText').textContent=added?`+1 semilla para El Yunque. ${newFriends.length?'¡Desbloqueaste a '+newFriends.map(c=>c.name).join(' y ')+'!':oldStage!==forestStage()?'¡El Yunque llegó a '+forestStage().name+'!':'Cada victoria cuenta.'}`:'Este nivel ya plantó su semilla. Puedes seguir explorando El Yunque.';if(data.decorGifts.length>giftsBefore)$('rewardText').textContent+=' ¡El Yunque tiene un poco más de vida!';
 $('winRewards').hidden=false;$('nextBtn').textContent='Ver mapa →';if(babyUnlocked())$('resultText').textContent='Tu aventura está completa. Borinbiano y toda su familia te esperan en El Yunque. Puedes seguir cuidándolos cuanto quieras.';else if(parentsTogether())$('resultText').textContent='¡Completaste los 60 niveles! Colombiana y Boricua ya son pareja en El Yunque. Vuelve mañana: su historia continúa.';showDialog('result');
}
function levelFeature(){return ['seed','seed','precision','fireflies','encounter'][(game.daily?game.seed:game.level||0)%5]}
function paintMission(){const messages={seed:'Cada nivel nuevo planta una semilla en El Yunque.',precision:'Sin errores ni pistas, tu victoria suma un tronco a El Yunque.',fireflies:'Una victoria nueva suma luz a El Yunque.',encounter:'Completa este nivel y visita a tus coquíes en El Yunque.'};$('levelMission').textContent=messages[levelFeature()]}

function lost(){
 if(!game||game.won||game.lives>0)return false;
 pending=null;
 if(!$('defeat').open)showDialog('defeat');return true;
}
function restartLostLevel(){if(!game||game.won||game.lives!==0)return false;return resetCurrentBoard()}
function resetCurrentBoard(){
 if(!game)return false;
 game={...game,cells:Array(64).fill(0),fixed:[],lives:4,won:false,hints:0,hinted:null,mistakes:0};
 undo=[];mode='coqui';$('defeat').close();setExtraOptions(false);render();feedback('Mismo tablero, desde cero. Tienes cuatro corazones.');syncBoardMusic();return true;
}
$('retryLevelBtn').onclick=restartLostLevel;
$('defeat').addEventListener('cancel',event=>event.preventDefault());
function play(i){
 if(game.won)return feedback('¡Tablero completado! Elige el siguiente nivel.');
 if(!Number.isInteger(i)||i<0||i>63)return;
 if(game.fixed.includes(i))return feedback('Este coquí es una pista inicial y ya está en su lugar.');
 if(game.lives<=0){lost();return}
 game.hinted=null;
 if(mode==='mark'){
  if(game.cells[i]===2)return feedback('Un coquí encontrado ya está en su lugar. Puedes deshacer tu última jugada.');
  snapshot();
  game.cells[i]=game.cells[i]===1?0:1;
  if(game.cells[i]===1)playEffect('clickAudio');
  render();feedback('Marca las casillas que puedes descartar.');return;
 }
 if(game.cells[i]===2)return feedback('¡Este coquí ya encontró su rincón!');
 if(game.cells[i]===1){snapshot();game.cells[i]=0;render();return feedback('Marca retirada. Toca otra vez para colocar un coquí.')}
 if(puzzle().solution[i>>3]!==i%8){
  playEffect('failAudio');
  game.mistakes=(game.mistakes||0)+1;game.lives=Math.max(0,game.lives-1);
  render();const b=$('board').children[i];if(errorCell)errorCell.classList.remove('error');clearTimeout(errorsTimer);
  errorCell=b;b.classList.remove('error');void b.offsetWidth;b.classList.add('error');
  $('hearts').classList.remove('heart-hit');void $('hearts').offsetWidth;$('hearts').classList.add('heart-hit');
  errorsTimer=setTimeout(()=>{b.classList.remove('error');$('hearts').classList.remove('heart-hit');if(errorCell===b)errorCell=null},550);
  feedback((isBlocked(i)?'Aquí compartiría fila, columna, color o tocaría a otro coquí.':'Ese rincón impediría completar el tablero. Prueba con otra deducción.')+' Perdiste un corazón.');
  if(game.lives===0)setTimeout(lost,350);return;
 }
 snapshot();game.cells[i]=2;
 if(game.cells.filter(v=>v===2).length<8)chirp();
 render();feedback('¡Coquí! Un rinconcito más en calma.');
 if(game.cells.filter(v=>v===2).length===8)finish();
}

function chooseNew(action,restart=false){$('winRewards').hidden=true;if((game.cells.some((v,i)=>v!==0&&!game.fixed.includes(i))||game.lives<4||game.hints>0)&&!game.won){$('resultTag').textContent='ANTES DE CAMBIAR';$('resultTitle').textContent=restart?'¿Reiniciar este tablero?':'¿Empezar otra partida?';$('resultText').textContent=restart?'Se borrarán las marcas de este tablero y recuperarás sus cuatro vidas y tres pistas. Tus niveles completados y coquíes se conservan.':'La partida actual se sustituirá. Tus niveles completados y preferencias se conservan.';$('nextBtn').textContent=restart?'Reiniciar tablero':'Empezar partida';pending=action;showDialog('result')}else action()}
let pending=null;
$('board').addEventListener('click',e=>{const b=e.target.closest('.cell');if(b)play(Number(b.dataset.index))});
$('board').addEventListener('keydown',e=>{const i=Number(e.target.dataset.index);if(!Number.isInteger(i))return;const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(delta){e.preventDefault();const next=i+delta;if(next>=0&&next<64)$('board').children[next].focus()}});
$('modeBtn').onclick=()=>{mode=mode==='coqui'?'mark':'coqui';render();feedback(mode==='mark'?'Modo X: toca para marcar o quitar una marca.':'Modo coquí: toca el rincón donde debe estar.')};
$('undoBtn').onclick=()=>{if(!undo.length||game.won)return;game.cells=undo.pop().cells;game.hinted=null;render();feedback('Jugada deshecha. Los errores consumidos no se recuperan.')};
$('hintBtn').onclick=()=>{if(game.won||game.lives<=0)return;if((game.hints||0)>=3)return feedback('Ya usaste las 3 pistas de este tablero. Sigue con tus deducciones.');const r=puzzle().solution.findIndex((c,r)=>game.cells[r*8+c]!==2);if(r<0)return;const i=r*8+puzzle().solution[r];snapshot();game.cells[i]=2;game.hints++;game.hinted=i;if(game.cells.filter(v=>v===2).length<8)chirp();render();feedback(`Pista: coquí en fila ${r+1}, columna ${i%8+1}. Desde aquí descarta su fila, columna, región y casillas vecinas.`);if(game.cells.filter(v=>v===2).length===8)finish()};
$('settingsBtn').onclick=()=>{showDialog('settings')};
function openGuide(){cancelResidentPress?.();stopResidentHold();stopForestAmbience();showDialog('help')}
for(const id of ['helpBtn','mapHelpBtn','forestHelpBtn'])$(id).onclick=openGuide;
$('help').addEventListener('close',()=>{if($('levels').open)syncMapMusic();else if($('forest').open)startForestAmbience()});
$('levelsBtn').onclick=openMap;
function setExtraOptions(open){
 $('extraOptions').hidden=!open;$('moreOptionsBtn').setAttribute('aria-expanded',String(open));$('moreOptionsBtn').textContent=open?'Ver menos':'Ver más';
}
$('moreOptionsBtn').onclick=()=>setExtraOptions($('extraOptions').hidden);
setExtraOptions(false);
$('restartBtn').onclick=()=>chooseNew(resetCurrentBoard,true);
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
