/* Deterministic puzzle rules shared by the app and solver tests. No DOM or timers. */
(() => {
 'use strict';
 const ROAD_LEVELS=[3,9,15,21,27],FOOD_LEVELS=[6,12,18,24,29];
 const layouts=[
  {walls:[0,1,2,9,11,18],bugs:[6,7,13,14],solution:[20,15,10,5,6,7,12,17,22,23,24,19,14,13,8,3,4]},
  {walls:[0,1,8,11,16],bugs:[12,15,22,23],solution:[20,15,10,5,6,7,12,17,22,23,18,13,14,9,4]},
  {walls:[1,3,7,8,12,19,24],bugs:[5,21,22,23],solution:[20,15,10,5,6,11,16,21,22,23,18,13,14,9,4]},
  {walls:[5,10,11,12,16],bugs:[3,6,9,22],solution:[20,21,22,17,18,13,14,9,8,7,6,1,2,3,4]},
  {walls:[3,11,16,23,24],bugs:[1,10,14,18],solution:[20,15,10,5,0,1,6,7,12,17,18,13,14,9,4]}
 ];
 const adjacent=(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<25&&b<25&&Math.abs((a/5|0)-(b/5|0))+Math.abs(a%5-b%5)===1;
 const neighbors=i=>[i-5,i+1,i+5,i-1].filter(j=>adjacent(i,j));
 const direction=(a,b)=>b===a-5?0:b===a+1?1:b===a+5?2:3;
 const kind=level=>ROAD_LEVELS.includes(level+1)?'road':FOOD_LEVELS.includes(level+1)?'food':'classic';
 const label=k=>k==='road'?'Camino a casa':k==='food'?'Hora de comer':'Coquídoku';
 function spec(level){
  const type=kind(level),index=(type==='road'?ROAD_LEVELS:FOOD_LEVELS).indexOf(level+1);
  if(index<0)return null;
  const source=layouts[index],solution=source.solution.slice(),start=solution[0],goal=solution.at(-1);
  if(type==='food')return {type,size:5,start,goal,walls:source.walls.slice(),bugs:source.bugs.slice(),solution};
  const tiles=Array.from({length:25},(_,i)=>({ports:(i+index)%2?[0,1]:[0,2],fixed:false}));
  source.walls.forEach(i=>tiles[i]={ports:[],fixed:true});
  solution.forEach((i,p)=>{tiles[i]={ports:[p>0?direction(i,solution[p-1]):null,p<solution.length-1?direction(i,solution[p+1]):null].filter(d=>d!==null),fixed:p===0||p===solution.length-1}});
  return {type,size:5,start,goal,tiles,waypoints:[solution[4],solution[8],solution[12]],solution};
 }
 const ports=(tile,rotation)=>tile.ports.map(d=>(d+rotation)%4);
 function initial(level){const s=spec(level);if(!s)return null;return s.type==='food'?{route:[s.start],rotations:[]}:{route:[],rotations:s.tiles.map((t,i)=>t.fixed?0:1+(i+level)%3)}}
 function validRoute(s,route){return Array.isArray(route)&&route.length>0&&route.length<=25&&route[0]===s.start&&new Set(route).size===route.length&&route.every((i,p)=>Number.isInteger(i)&&i>=0&&i<25&&!s.walls.includes(i)&&(p===0||(route[p-1]!==s.goal&&adjacent(route[p-1],i))))}
 function validState(level,state){const s=spec(level);if(!s||!state)return false;if(s.type==='food')return validRoute(s,state.route);return Array.isArray(state.rotations)&&state.rotations.length===25&&state.rotations.every((r,i)=>Number.isInteger(r)&&r>=0&&r<4&&(!s.tiles[i].fixed||r===0))}
 function trace(s,state){
  if(s.type==='food'){
   const path=state.route,valid=validRoute(s,path),collected=valid?s.bugs.filter(i=>path.includes(i)).length:0;
   return {ok:valid&&path.at(-1)===s.goal&&collected===s.bugs.length,path:valid?path:[],collected,reason:!valid?'Ruta inválida':collected<s.bugs.length?'Todavía faltan insectos en tu ruta.':'Termina en la hoja del refugio.'};
  }
  let i=s.start,previous=-1;const path=[];
  while(!path.includes(i)&&path.length<25){
   path.push(i);
   if(i===s.goal){const collected=s.waypoints.filter(j=>path.includes(j)).length;return {ok:collected===s.waypoints.length,path,collected,reason:'El camino debe pasar por los tres puntos de luz.'}}
   const openings=ports(s.tiles[i],state.rotations[i]),next=neighbors(i).find(j=>j!==previous&&openings.includes(direction(i,j))&&ports(s.tiles[j],state.rotations[j]).includes(direction(j,i)));
   if(next===undefined)break;
   previous=i;i=next;
  }
  return {ok:false,path,collected:s.waypoints.filter(j=>path.includes(j)).length,reason:'Hay tramos desconectados. Gira las piezas para unirlos.'};
 }
 function solveFood(s,prefix=[s.start],limit=1){
  if(!validRoute(s,prefix))return [];
  const solutions=[];
  function visit(path,seen){
   if(solutions.length>=limit)return;
   const current=path.at(-1);
   if(current===s.goal){if(s.bugs.every(i=>seen.has(i)))solutions.push(path.slice());return}
   for(const next of neighbors(current))if(!seen.has(next)&&!s.walls.includes(next)){seen.add(next);path.push(next);visit(path,seen);path.pop();seen.delete(next)}
  }
  visit(prefix.slice(),new Set(prefix));return solutions;
 }
 globalThis.CoquiVariants={ROAD_LEVELS,FOOD_LEVELS,kind,label,spec,initial,ports,adjacent,neighbors,validState,validRoute,trace,solveFood};
})();
