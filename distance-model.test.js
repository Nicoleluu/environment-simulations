import test from 'node:test';
import assert from 'node:assert/strict';
import {createExample} from './model.js';
import {distanceBetween,applyScenario} from './distance-model.js';
test('counts access legs and split frontage edges without overshooting',()=>{
 const s=createExample(); const d=distanceBetween(s,'P:1','P:2');
 assert.equal(d.direct,8);assert.equal(d.walking,16);
 assert.equal(distanceBetween(s,'P:1','P:5').walking,24);
});
test('road detour changes route while retaining geometric separation and state',()=>{
 const s=createExample(),before=JSON.stringify(s); const d=distanceBetween(applyScenario(s,'detour'),'P:1','P:5');
 assert.equal(d.direct,8);assert.equal(d.walking,40);assert.equal(JSON.stringify(s),before);
 assert.equal(d.points.reduce((sum,p,i)=>i?sum+Math.hypot(p[0]-d.points[i-1][0],p[1]-d.points[i-1][1]):sum,0),d.walking);
});
test('unreachable and co-located endpoints are explicit',()=>{
 const s=createExample();assert.equal(distanceBetween(applyScenario(s,'isolated'),'P:1','P:5').walking,Infinity);
 const residents=s.residents.filter(r=>r.buildingId===s.buildings[0].id);
 assert.equal(distanceBetween(s,residents[0].id,residents[1].id).walking,0);
 assert.equal(distanceBetween(s,'missing','P:1'),null);
});
test('all parcel pairs satisfy symmetry and walking >= straight distance',()=>{
 for(const scenario of ['existing','detour','isolated']){
 const s=applyScenario(createExample(),scenario);
 for(const a of s.parcels)for(const b of s.parcels){const d=distanceBetween(s,'P:'+a.id,'P:'+b.id),r=distanceBetween(s,'P:'+b.id,'P:'+a.id);assert.equal(d.walking,r.walking);assert.ok(d.walking>=d.direct-1e-9);}
 }
});
test('custom closures reroute other pairs and reopening restores access',()=>{
 const state=createExample();
 const route=()=>distanceBetween(state,'P:2','P:10');
 assert.equal(route().walking,32);
 for(const id of ['V:-8:-4','V:0:-4'])state.streets.find(s=>s.id===id).open=false;
 assert.ok(route().walking>32 && Number.isFinite(route().walking));
 assert.equal(route().direct,16);
 assert.ok(route().streetIds.every(id=>state.streets.find(s=>s.id===id).open));
 state.streets.find(s=>s.id==='H:-4:-8').open=false;
 assert.equal(route().walking,Infinity);assert.deepEqual(route().streetIds,[]);
 state.streets.forEach(s=>s.open=true);assert.equal(route().walking,32);
});
test('scenario closures follow the selected pair and occupant home',()=>{
 const state=createExample(),original=JSON.stringify(state);
 const selected=applyScenario(state,'detour','P:2','P:10');
 assert.equal(selected.streets.filter(s=>!s.open).length,2);
 assert.ok(distanceBetween(selected,'P:2','P:10').walking>32);
 assert.notDeepEqual(selected.streets.filter(s=>!s.open).map(s=>s.id),applyScenario(state,'detour').streets.filter(s=>!s.open).map(s=>s.id));
 assert.equal(distanceBetween(applyScenario(state,'isolated','P:2','P:10'),'P:2','P:10').walking,Infinity);
 const occupant=state.residents.find(r=>state.buildings.find(b=>b.id===r.buildingId).parcelId===10);
 assert.equal(distanceBetween(applyScenario(state,'isolated','P:2',occupant.id),'P:2',occupant.id).walking,Infinity);
 assert.equal(JSON.stringify(state),original);
});
