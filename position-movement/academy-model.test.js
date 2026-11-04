import test from 'node:test';import assert from 'node:assert/strict';import {initial,route,alignment,positionOn,conditions,landings,edges} from './academy-model.js';
test('rotating a flight removes one adjacency and creates another',()=>{assert.deepEqual(route([0,0,0],'entry','observatory'),['entry','archive','observatory']);assert.equal(route([1,0,0],'entry','observatory'),null);assert.deepEqual(route([1,0,1],'entry','garden'),['entry','alchemy','garden']);});
test('alignment minimizes changes and preserves unrelated stairs',()=>{const a=alignment('entry','library',[0,0,1]);assert.deepEqual(a.config,[0,1,1]);assert.equal(a.cost,1);assert.equal(alignment('entry','garden',[0,0,0]).cost,2);});
test('travel follows the full polyline and supports reverse descent',()=>{const p=['entry','archive','observatory'];assert.deepEqual(positionOn(p,0),landings.entry.p);assert.deepEqual(positionOn(p,.5),landings.archive.p);assert.deepEqual(positionOn(p,1),landings.observatory.p);assert.deepEqual(positionOn([...p].reverse(),.5),landings.archive.p);});
test('position and movement conditions depend on geometry and history',()=>{const s=initial();s.travel={path:['entry','archive','observatory'],t:.6};s.passed=true;const c=conditions(s,positionOn(s.travel.path,.6),positionOn(s.travel.path,.59));assert(c.above&&c.between&&c.toward&&c.ascending&&c.past);assert(!c.adjacent);s.travel=null;s.destination='archive';assert(conditions(s,landings.entry.p,null).adjacent);const rest=conditions(s,landings.entry.p,landings.entry.p);assert(!rest.toward&&!rest.ascending);});
test('every active edge is reversible and every found route uses active edges',()=>{for(let n=0;n<8;n++){const c=[n&1,n>>1&1,n>>2&1],es=edges(c);for(const a of Object.keys(landings))for(const b of Object.keys(landings)){const r=route(c,a,b);assert.equal(!!r,!!route(c,b,a));if(r)r.slice(1).forEach((v,i)=>assert(es.some(e=>e.includes(v)&&e.includes(r[i]))));}}});

test('co-location is not adjacency',()=>{const s=initial();s.destination='entry';assert(!conditions(s,landings.entry.p,null).adjacent);});

import {alignmentPlan,lanternActive,flights,dist} from './academy-model.js';
test('every destination pair has an actionable alignment plan, possibly via entrance',()=>{
 for(let bits=0;bits<8;bits++)for(const at of Object.keys(landings))for(const destination of Object.keys(landings)){
  const s={...initial(),at,destination,config:[bits&1,bits>>1&1,bits>>2&1]},plan=alignmentPlan(s);
  assert(plan,`${at} to ${destination}`);
  assert(route(plan.config,at,plan.kind==='via-entry'?'entry':destination));
  if(plan.kind==='via-entry')assert(alignment('entry',destination,plan.config));
 }
 const s={...initial(),at:'observatory',destination:'garden'};
 assert.equal(alignment(s.at,s.destination,s.config),null);
 assert.equal(alignmentPlan(s).kind,'via-entry');
});
test('rotating stairs are not adjacent or reachable until settled',()=>{
 const s={...initial(),destination:'archive'};
 const settled=conditions(s,landings.entry.p,null),turning=conditions(s,landings.entry.p,null,{rotating:true});
 assert(settled.adjacent&&settled.reachable);assert(!turning.adjacent&&!turning.reachable);
});
test('lantern activation requires capability, a journey, and strict distance threshold',()=>{
 const p=landings.garden.p;
 assert(lanternActive(p,'garden',true,true));
 assert(!lanternActive(p,'garden',false,true));
 assert(!lanternActive(p,'garden',true,false));
 assert(!lanternActive([p[0],p[1],p[2]+1.3],'garden',true,true));
 assert(lanternActive([p[0],p[1],p[2]+1.1],'garden',true,true));
});
test('descent moves toward the entrance without claiming ascent; endpoints are not between',()=>{
 const s={...initial(),at:'observatory',destination:'entry',travel:{path:['observatory','archive','entry'],t:.6}};
 const p=positionOn(s.travel.path,.6),previous=positionOn(s.travel.path,.59),c=conditions(s,p,previous);
 assert(c.toward);assert(!c.ascending);assert(c.between);
 for(const t of [0,1]){s.travel.t=t;assert(!conditions(s,positionOn(s.travel.path,t),null).between);}
});
test('rendered flight endpoints match graph coordinates at both rotation stops',()=>{
 for(const flight of flights)for(let k=0;k<2;k++){
  const [x,y,z]=landings[flight.from].p,angle=flight.angles[k];
  const tip=[x-10*Math.sin(angle),y+5,z-10*Math.cos(angle)];
  assert(dist(tip,landings[flight.to[k]].p)<1e-8);
 }
});

test('between is strict 3D betweenness on a flight, not occupancy of a landing',()=>{
 const s={...initial(),travel:{path:['entry','archive','observatory'],t:.5}};
 assert(!conditions(s,landings.archive.p,null).between);
 s.travel.t=.25;const p=positionOn(s.travel.path,.25);assert(conditions(s,p,null).between);
 assert(!conditions(s,[p[0]+1,p[1],p[2]],null).between);
});
