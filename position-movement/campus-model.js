// Fixed walkways keep ground-floor residents out of furniture and stair shafts.
export const stops={
 a:{p:[-10,0,-10],place:'Owl post'},b:{p:[0,0,-10],place:'North arcade'},c:{p:[10,0,-10],place:'Conservatory'},
 d:{p:[-10,0,0],place:'West arcade'},e:{p:[0,0,0],place:'Astrolabe court'},f:{p:[10,0,0],place:'East arcade'},
 g:{p:[-10,0,10],place:'Reading lounge'},h:{p:[0,0,10],place:'Great hall'},i:{p:[10,0,10],place:'Potion workshop'},
 j:{p:[-10,0,16],place:'South gallery'},k:{p:[0,0,16],place:'Dining hall'},l:{p:[10,0,16],place:'Workshop entrance'}
};
export const walkEdges=[['a','b'],['b','c'],['d','e'],['e','f'],['g','h'],['h','i'],['j','k'],['k','l'],['a','d'],['d','g'],['g','j'],['b','e'],['e','h'],['h','k'],['c','f'],['f','i'],['i','l']];
const names=['Mira','Elio','Jun','Sora','Iris','Theo','Nora','Felix','Ada','Rowan','Luna','Ash','Bea','Kian','Wren','Sol','Cleo','Finn','Yuna','Otis','Remy','Tess','Arlo','Esme'];
export function campusRoute(from,to){const q=[[from]],seen=new Set([from]);for(const path of q){const at=path.at(-1);if(at===to)return path;for(const edge of walkEdges){if(!edge.includes(at))continue;const next=edge.find(x=>x!==at);if(!seen.has(next)){seen.add(next);q.push([...path,next]);}}}return null;}
const len=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function createCampus(count=18){const keys=Object.keys(stops);return {time:0,deliveries:0,agents:Array.from({length:count},(_,i)=>{const at=keys[i%keys.length],destination=keys[(i*5+5)%keys.length];return {id:i,name:names[i],role:i%8===0?'Professor':i%7===0?'Caretaker':'Student',color:i%4,at,destination:destination===at?keys[(i+4)%keys.length]:destination,path:null,segment:0,t:0,p:[...stops[at].p],previous:[...stops[at].p],wait:i*.3,status:'Preparing',completed:0,speed:i%8===0?1.1:1.35+(i%3)*.2};})};}
function chooseNext(agent){const keys=Object.keys(stops),index=keys.indexOf(agent.at);agent.destination=keys[(index+3+agent.id%5)%keys.length];agent.path=campusRoute(agent.at,agent.destination);agent.segment=0;agent.t=0;}
function sampleLane(a,b,t){const dx=b[0]-a[0],dz=b[2]-a[2],d=Math.hypot(dx,dz),offset=.35*Math.sin(Math.PI*t);return[a[0]+dx*t-dz/d*offset,0,a[2]+dz*t+dx/d*offset];}
export function stepCampus(campus,dt,{paused=false,visitor=null}={}){
 if(paused||dt<=0)return;campus.time+=dt;
 for(const a of campus.agents){a.previous=[...a.p];if(a.wait>0){a.wait=Math.max(0,a.wait-dt);a.status=a.role==='Professor'?'Observing':a.at==='i'?'Collecting ingredients':a.at==='g'?'Reading':a.at==='a'?'Collecting mail':'Waiting';continue;}if(!a.path)chooseNext(a);
 const start=stops[a.path[a.segment]].p,end=stops[a.path[a.segment+1]].p,d=len(start,end),nt=Math.min(1,a.t+dt*a.speed/d),candidate=sampleLane(start,end,nt);
 // Same-direction following distance; opposite directions use separate lanes.
 const blocked=campus.agents.some(b=>b!==a&&b.path&&b.path[b.segment]===a.path[a.segment]&&b.path[b.segment+1]===a.path[a.segment+1]&&b.t>a.t&&len(candidate,b.p)<.6);
 const nearVisitor=visitor&&Math.abs(visitor[1])<1&&len(candidate,visitor)<1.4;
 if(blocked||nearVisitor){a.status=nearVisitor?'Yielding to traveler':'Giving way';continue;}
 a.t=nt;a.p=candidate;a.status='Walking';if(nt>=1){a.at=a.path[a.segment+1];a.segment++;a.t=0;if(a.segment>=a.path.length-1){a.path=null;a.completed++;a.wait=2+(a.id%4);a.status=a.at==='i'?'Collecting ingredients':a.at==='g'?'Reading':'Arrived';}}
 }
}
export function inspectAgent(a,campus,visitor){const others=campus.agents.filter(b=>b!==a).map(b=>({name:b.name,distance:len(a.p,b.p)})).sort((a,b)=>a.distance-b.distance);return {name:a.name,role:a.role,status:a.status,destination:stops[a.destination].place,nearest:others[0]||null,visitorDistance:visitor?Math.hypot(...a.p.map((v,i)=>v-visitor[i])):null};}
