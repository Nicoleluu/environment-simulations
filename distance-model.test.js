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
