const assert=require('node:assert/strict');
require('../variants.js');
const V=globalThis.CoquiVariants;
const kinds=Array.from({length:30},(_,i)=>V.kind(i));
assert.equal(kinds.filter(k=>k==='classic').length,20);
assert.equal(kinds.filter(k=>k==='road').length,5);
assert.equal(kinds.filter(k=>k==='food').length,5);
assert.equal(kinds[0],'classic');assert.equal(kinds[29],'classic');
const signatures=new Set();
for(let level=0;level<30;level++){
 const s=V.spec(level);if(!s)continue;
 const state=V.initial(level);assert.equal(V.validState(level,state),true);
 assert.equal(V.trace(s,state).ok,false);
 if(s.type==='road'){
  const solved={rotations:Array(25).fill(0),route:[]};
  const result=V.trace(s,solved);assert.equal(result.ok,true);assert.deepEqual(result.path,s.solution);
  assert.ok(s.solution.length>=15);assert.equal(result.collected,3);
  assert.ok(s.tiles.filter((tile,i)=>!tile.fixed&&V.ports(tile,state.rotations[i]).sort().join()!==tile.ports.slice().sort().join()).length>=10);
  const broken={...solved,rotations:solved.rotations.slice()};broken.rotations[s.solution[5]]=1;assert.equal(V.trace(s,broken).ok,false);
  broken.rotations[s.start]=1;assert.equal(V.validState(level,broken),false);
  const bypass=V.trace({...s,waypoints:[s.tiles.findIndex(t=>!t.ports.length)]},solved);assert.equal(bypass.ok,false);
 }else{
  const all=V.solveFood(s,[s.start],100);assert.ok(all.length>=1&&all.length<=18);
  const min=Math.min(...all.map(path=>path.length));assert.ok(min>=15);
  for(const path of all){assert.equal(V.validRoute(s,path),true);assert.equal(V.trace(s,{route:path}).ok,true);assert.equal(new Set(path).size,path.length)}
  assert.equal(V.trace(s,{route:s.solution.slice(0,-1)}).ok,false);
  assert.equal(V.validRoute(s,[s.start,s.start]),false);
  assert.equal(V.validRoute(s,[s.start,s.walls[0]]),false);
  assert.equal(V.validRoute(s,[s.start,16]),false);
  assert.equal(V.validRoute(s,[-1]),false);
  assert.equal(V.validRoute(s,[s.start,NaN]),false);
  const prefix=s.solution.slice(0,6),hint=V.solveFood(s,prefix)[0];assert.deepEqual(hint.slice(0,6),prefix);
  const withoutABug={...s,bugs:[s.walls[0]]};assert.equal(V.trace(withoutABug,{route:s.solution}).ok,false);
  assert.deepEqual(V.solveFood(s,[s.start,s.start]),[]);
 }
 signatures.add(s.type+':'+s.solution.join(','));
}
assert.equal(signatures.size,10);
console.log('PASS: 20 classic + 5 road + 5 insect levels; ten unsolved initial states and verified solutions; roads require all three lights; exhaustive insect search (1–18 solutions, at least 15 steps), no repeats, diagonals, walls or early exit.');
