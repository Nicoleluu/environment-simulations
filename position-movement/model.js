// A parcel-center lattice inherited from Neighborhood: spacing = 8 model units.
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const leftOf=(a,b)=>a.x<b.x-1e-6;
export const adjacent=(a,b)=>Math.abs(Math.abs(a.x-b.x)+Math.abs(a.z-b.z)-8)<1e-6 && (Math.abs(a.x-b.x)<1e-6||Math.abs(a.z-b.z)<1e-6);
export function between(b,a,c){const ux=c.x-a.x,uz=c.z-a.z,vx=b.x-a.x,vz=b.z-a.z;const dot=ux*vx+uz*vz;return Math.abs(ux*vz-uz*vx)<1e-6&&dot>0&&dot<ux*ux+uz*uz;}
export function movement(previous,current,target){const delta=distance(current,target)-distance(previous,target);const dx=current.x-previous.x,dz=current.z-previous.z;const len=Math.hypot(dx,dz);let past=false;if(len>1e-6){const ux=dx/len,uz=dz/len;const before=(previous.x-target.x)*ux+(previous.z-target.z)*uz;const after=(current.x-target.x)*ux+(current.z-target.z)*uz;const lateral=Math.abs((previous.x-target.x)*uz-(previous.z-target.z)*ux);past=before<0&&after>=0&&lateral<=4;}return {toward:delta<-.00001,away:delta>.00001,past};}
export const scenarios={
 meeting:{title:'Meet in the middle',description:'B is between A and C. Their alignment opens a meeting signal.',a:{x:-12,z:-4},b:{x:-4,z:-4},c:{x:4,z:-4},r:{x:-12,z:12},path:[[-12,12],[-12,4],[-4,4]]},
 delivery:{title:'Deliver next door',description:'The robot approaches B, stops on a neighboring parcel, and hands off its parcel.',a:{x:-12,z:-4},b:{x:4,z:-4},c:{x:12,z:12},r:{x:-12,z:4},path:[[-12,4],[-4,4],[4,4]]},
 passing:{title:'Pass a neighbor',description:'The robot travels beside B: toward, past the crossing plane, then away.',a:{x:-12,z:-12},b:{x:0,z:-4},c:{x:12,z:12},r:{x:-12,z:0},path:[[-12,0],[12,0]]}
};
export function sample(name,t){const s=scenarios[name],path=s.path;let remaining=Math.max(0,Math.min(1,t))*path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(remaining<=d||i===path.length-1){const f=Math.min(1,remaining/d);return{x:a[0]+f*(b[0]-a[0]),z:a[1]+f*(b[1]-a[1])};}remaining-=d;}return {...s.r};}
