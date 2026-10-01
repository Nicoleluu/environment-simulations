import test from 'node:test';
import assert from 'node:assert/strict';
import {createExample, transition, summarize, projectParcels, buildingOn, residentsOf, access, parkRoute, shortestPath, assertModel, actionReason} from './model.js';

test('example has valid entities and references; derived counts agree',()=>{
  const s=createExample();assertModel(s);assert.equal(s.parcels.length,16);assert.equal(s.streets.length,40);
  assert.equal(s.buildings.length,10);assert.equal(s.residents.length,22);
  const p=projectParcels(s);assert.equal(p.reduce((n,p)=>n+p.residents,0),s.residents.length);assert.equal(summarize(s).parks,3);
});
test('development requires vacancy and a connected frontage; rejected transitions are atomic',()=>{
  const s=createExample(),before=JSON.stringify(s);assert.throws(()=>transition(s,1,'home'),/vacant/);
  const built=transition(s,6,'home');assert.equal(buildingOn(built,6).capacity,4);assert.equal(JSON.stringify(s),before);
  const closed=transition(s,6,'road');assert.equal(access(closed,6).connected,false);assert.throws(()=>transition(closed,6,'park'),/street/);
  assert.equal(transition(transition(closed,6,'road'),6,'park').parcels[5].use,'park');
});
test('capacity, height limit, and empty-home clearing are enforced',()=>{
  let s=transition(createExample(),6,'home');for(let i=0;i<4;i++)s=transition(s,6,'in');
  assert.throws(()=>transition(s,6,'in'),/full/);assert.throws(()=>transition(s,6,'clear'),/Occupied/);
  s=transition(s,6,'upgrade');for(let i=0;i<4;i++)s=transition(s,6,'in');assert.equal(buildingOn(s,6).capacity,8);
  assert.throws(()=>transition(s,6,'upgrade'),/height limit/);assert.throws(()=>transition(s,6,'in'),/full/);
  for(const r of residentsOf(s,buildingOn(s,6).id))s=transition(s,6,'out',{residentId:r.id});
  s=transition(s,6,'clear');assert.equal(buildingOn(s,6),undefined);assertModel(s);
});
test('relocation preserves identity and population, and requires available capacity',()=>{
  let s=createExample();const resident=residentsOf(s,buildingOn(s,1).id)[0],count=s.residents.length;
  s=transition(s,1,'relocate',{residentId:resident.id,targetId:7});
  assert.equal(s.residents.length,count);assert.equal(s.residents.find(r=>r.id===resident.id).name,resident.name);
  assert.equal(s.residents.find(r=>r.id===resident.id).buildingId,buildingOn(s,7).id);
  assert.throws(()=>transition(s,7,'relocate',{residentId:resident.id,targetId:4}),/full/);
  assert.throws(()=>transition(s,7,'relocate',{residentId:resident.id,targetId:3}),/different home/);
  assert.throws(()=>transition(s,1,'out',{residentId:resident.id}),/Select a resident/);
});
test('closure keeps occupants but blocks incoming movement and construction',()=>{
  const s=transition(createExample(),1,'road');assert.equal(s.residents.length,22);
  assert.throws(()=>transition(s,1,'in'),/street/);assert.throws(()=>transition(s,1,'upgrade'),/access/);
  const r=residentsOf(s,buildingOn(s,1).id)[0];assert.throws(()=>transition(s,1,'relocate',{residentId:r.id,targetId:7}),/gateway/);
  assert.equal(parkRoute(s,1),null);assert.equal(summarize(s).disconnected,1);
});
test('access follows the entire graph, not just the frontage flag',()=>{
  let s=createExample();s=transition(s,10,'road',{streetId:'H:-12:-16'});s=transition(s,10,'road',{streetId:'V:-16:-12'});assert.throws(()=>transition(s,10,'road',{streetId:'bad'}),/valid street/);
  assertModel(s);assert.equal(access(s,10).street.open,true);assert.equal(access(s,10).connected,false);
  assert.equal(summarize(s).disconnected,16);assert.equal(shortestPath(s,'-16,-16','16,16'),null);
});
test('routes only traverse open graph edges and respond to park removal',()=>{
  let s=createExample();const route=parkRoute(s,10);assert.ok(route);
  for(let i=1;i<route.nodes.length;i++)assert.ok(s.streets.some(e=>e.open&&[e.a,e.b].includes(route.nodes[i-1])&&[e.a,e.b].includes(route.nodes[i])));
  s=transition(s,route.parkId,'clear');assert.notEqual(parkRoute(s,10)?.parkId,route.parkId);
  for(const p of s.parcels.filter(p=>p.use==='park'))s=transition(s,p.id,'clear');
  assert.equal(parkRoute(s,10),null);assert.equal(summarize(s).served,0);
});
test('serialization keeps identities, graph, and journal; validator rejects corrupt data',()=>{
  const s=transition(createExample(),10,'upgrade');const loaded=JSON.parse(JSON.stringify(s));assertModel(loaded);assert.deepEqual(loaded,s);
  const bad=structuredClone(s);bad.residents[0].buildingId='missing';assert.throws(()=>assertModel(bad),/reference/);
  const duplicate=structuredClone(s);duplicate.buildings.push({...duplicate.buildings[0]});assert.throws(()=>assertModel(duplicate),/duplicate/);
  const edge=structuredClone(s);edge.streets[0].a='bad';assert.throws(()=>assertModel(edge),/graph/);
});
test('mixed action sequences preserve invariants and failed actions leave state unchanged',()=>{
  let s=createExample();let seed=17;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed;};
  const actions=['home','park','clear','in','out','upgrade','road','relocate'];
  for(let i=0;i<200;i++){
    const id=random()%16+1, action=actions[random()%actions.length],b=buildingOn(s,id);
    const options={residentId:b?residentsOf(s,b.id)[0]?.id:undefined,targetId:random()%16+1},before=JSON.stringify(s);
    if(actionReason(s,id,action,options)){assert.throws(()=>transition(s,id,action,options));assert.equal(JSON.stringify(s),before);}
    else{s=transition(s,id,action,options);assertModel(s);}
  }
});
