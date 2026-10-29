import {frontageId} from './model.js';

// Both metrics use the same parcel-centre locations and schematic coordinate units.
// Each open street is split at its midpoint so frontage access is counted exactly.
export function locationFor(state, key) {
  if (key.startsWith('P:')) return state.parcels.find(p=>p.id===Number(key.slice(2)));
  const resident=state.residents.find(r=>r.id===key);
  const building=resident && state.buildings.find(b=>b.id===resident.buildingId);
  return building && state.parcels.find(p=>p.id===building.parcelId);
}
export function distanceBetween(state, fromKey, toKey) {
  const a=locationFor(state,fromKey), b=locationFor(state,toKey);
  if(!a||!b) return null;
  const direct=Math.hypot(a.x-b.x,a.z-b.z);
  if(a.id===b.id) return {direct:0,walking:0,points:[[a.x,a.z]],a,b,ratio:null};
  const graph=new Map(), positions=new Map();
  function node(id,x,z){if(!graph.has(id))graph.set(id,[]);positions.set(id,[x,z]);}
  function edge(a,b){const p=positions.get(a),q=positions.get(b),w=Math.hypot(p[0]-q[0],p[1]-q[1]);graph.get(a).push([b,w]);graph.get(b).push([a,w]);}
  for(const s of state.streets.filter(s=>s.open)) {
    const [ax,az]=s.a.split(',').map(Number),[bx,bz]=s.b.split(',').map(Number);
    node(s.a,ax,az);node(s.b,bx,bz);node(s.id,(ax+bx)/2,(az+bz)/2);
    edge(s.a,s.id);edge(s.id,s.b);
  }
  for(const p of state.parcels) {const id='P:'+p.id;node(id,p.x,p.z);if(graph.has(frontageId(p)))edge(id,frontageId(p));}
  const start='P:'+a.id,target='P:'+b.id,dist=new Map([[start,0]]),prev=new Map(),visited=new Set();
  while(true){
    let u=null,best=Infinity;
    for(const [id,d] of dist)if(!visited.has(id)&&d<best){best=d;u=id;}
    if(u===null||u===target)break;
    visited.add(u);
    for(const [v,w] of graph.get(u))if(best+w<(dist.get(v)??Infinity)){dist.set(v,best+w);prev.set(v,u);}
  }
  const walking=dist.get(target)??Infinity,ids=[];
  if(Number.isFinite(walking)){let u=target;while(u){ids.unshift(u);u=prev.get(u);}}
  return {direct,walking,points:ids.map(id=>positions.get(id)),a,b,ratio:direct?walking/direct:null};
}

export function applyScenario(state,scenario){
  // Demonstration closures are a view overlay: the saved neighborhood stays intact.
  const copy=structuredClone(state);
  if(scenario==='detour')for(const id of ['V:-16:-4','V:-8:-4']){const s=copy.streets.find(s=>s.id===id);if(s)s.open=false;}
  if(scenario==='isolated'){const s=copy.streets.find(s=>s.id==='H:-12:0');if(s)s.open=false;}
  return copy;
}
