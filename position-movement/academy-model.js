export const landings={
 entry:{name:'Entrance hall',p:[-5,0,5],level:'Ground floor'},
 archive:{name:'Astral archive',p:[-5,5,-5],level:'First gallery'},
 alchemy:{name:'Alchemy room',p:[5,5,5],level:'First gallery'},
 observatory:{name:'Observatory',p:[-5,10,-15],level:'Upper gallery'},
 library:{name:'Moon library',p:[-15,10,-5],level:'Upper gallery'},
 east:{name:'Portrait gallery',p:[5,10,-5],level:'Upper gallery'},
 garden:{name:'Winter garden',p:[15,10,5],level:'Upper gallery'}
};
export const flights=[{name:'The Grand Stair',from:'entry',to:['archive','alchemy'],angles:[0,-Math.PI/2]},{name:'The Astral Stair',from:'archive',to:['observatory','library'],angles:[0,Math.PI/2]},{name:'The East Stair',from:'alchemy',to:['east','garden'],angles:[0,-Math.PI/2]}];
export const initial=()=>({config:[0,0,0],at:'entry',destination:'observatory',travel:null,passed:false,arrived:false});
export function edges(config){return flights.map((f,i)=>[f.from,f.to[config[i]]]);}
export function route(config,from,to){const queue=[[from]],seen=new Set([from]);for(const path of queue){const a=path.at(-1);if(a===to)return path;for(const [u,v] of edges(config)){const b=u===a?v:v===a?u:null;if(b&&!seen.has(b)){seen.add(b);queue.push([...path,b]);}}}return null;}
export function alignment(from,to,current){let best=null;for(let n=0;n<8;n++){const c=[n&1,(n>>1)&1,(n>>2)&1],path=route(c,from,to);if(path){const cost=c.reduce((s,v,i)=>s+(v!==current[i]),0);if(!best||cost<best.cost)best={config:c,path,cost};}}return best;}
export const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export function positionOn(path,t){const lengths=path.slice(1).map((id,i)=>dist(landings[path[i]].p,landings[id].p));let length=lengths.reduce((a,b)=>a+b,0),d=Math.max(0,Math.min(1,t))*length;for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){let f=d/lengths[i],a=landings[path[i]].p,b=landings[path[i+1]].p;return a.map((v,j)=>v+(b[j]-v)*f);}d-=lengths[i];}return [...landings[path[0]].p];}
export function conditions(state,p,previous){const target=landings[state.destination].p;const path=state.travel?.path||route(state.config,state.at,state.destination);return {adjacent:state.at!==state.destination&&edges(state.config).some(e=>e.includes(state.at)&&e.includes(state.destination))&&!state.travel,above:p[1]>landings.entry.p[1]+.1,between:!!state.travel&&state.travel.t>0&&state.travel.t<1,toward:previous?dist(p,target)<dist(previous,target)-1e-5:false,ascending:previous?p[1]>previous[1]+1e-5:false,past:state.passed,reachable:!!path};}
