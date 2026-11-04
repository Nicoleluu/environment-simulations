import {createExample} from '../model.js';
import {distance,leftOf,adjacent,between,movement,scenarios,sample} from './model.js';
const $=s=>document.querySelector(s), canvas=$('#scene'),ctx=canvas.getContext('2d'),base=createExample();
let name='meeting',state,t=0,playing=false,last=0,delivered=false,passed=false,m={toward:false,away:false,past:false};
const colors={a:'#3e746b',b:'#bd633f',c:'#747caa',r:'#d6a63e'};
function reset(n=name){name=n;state=structuredClone(scenarios[n]);t=0;playing=false;delivered=false;passed=false;m={toward:false,away:false,past:false};$('#scenario').value=n;$('#description').textContent=state.description;draw();}
const X=x=>500+x*20,Y=z=>345+z*17;
function line(a,b,color,width=3,dash=[]){ctx.beginPath();ctx.setLineDash(dash);ctx.moveTo(X(a.x),Y(a.z));ctx.lineTo(X(b.x),Y(b.z));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.setLineDash([]);}
function pill(text,x,y,color){ctx.font='16px Avenir Next, Arial';const w=ctx.measureText(text).width+24;ctx.fillStyle='#f8f6ec';ctx.fillRect(x-w/2,y-19,w,28);ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(text,x,y);}
function draw(){const left=leftOf(state.a,state.b),middle=between(state.b,state.a,state.c),near=adjacent(state.r,state.b);if(near&&!delivered)delivered=true;
ctx.fillStyle='#e4e9df';ctx.fillRect(0,0,1000,730);
for(const p of base.parcels){ctx.fillStyle=p.use==='park'?'#c6d2b6':'#d4dccf';ctx.fillRect(X(p.x)-63,Y(p.z)-52,126,104);ctx.fillStyle='#879580';ctx.font='11px Arial';ctx.textAlign='left';ctx.fillText('P'+p.id,X(p.x)-53,Y(p.z)-36);}
ctx.strokeStyle='#c0ccbc';ctx.lineWidth=1;for(let i=-16;i<=16;i+=8){line({x:i,z:-16},{x:i,z:16},'#bac8b9',1);line({x:-16,z:i},{x:16,z:i},'#bac8b9',1);}
if(middle){line(state.a,state.c,'#438976',18);pill('MEETING SIGNAL / B BETWEEN A + C',500,58,'#2c6555');}
if(left){line(state.a,state.b,'#3d7365',2,[5,6]);pill('A LEFT OF B',(X(state.a.x)+X(state.b.x))/2,Y(state.a.z)+53,'#365c50');}
for(let i=1;i<scenarios[name].path.length;i++){const a=scenarios[name].path[i-1],b=scenarios[name].path[i];line({x:a[0],z:a[1]},{x:b[0],z:b[1]},'#af9c62',3,[6,8]);}
if(name==='passing'){line({x:state.b.x,z:-10},{x:state.b.x,z:12},'#ba7657',2,[4,6]);pill("B'S CROSSING PLANE",X(state.b.x),Y(14),'#a76648');}
if(near){line(state.r,state.b,'#c07a26',8);pill('ADJACENT / HANDOFF',X(state.b.x),Y(state.b.z)-45,'#a36a22');}
for(const key of ['a','b','c','r']){const p=state[key];ctx.fillStyle=colors[key];ctx.strokeStyle='#f8f5e9';ctx.lineWidth=5;ctx.beginPath();if(key==='r')ctx.rect(X(p.x)-20,Y(p.z)-20,40,40);else ctx.arc(X(p.x),Y(p.z),24,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=key==='r'?'#3b412b':'#fff';ctx.textAlign='center';ctx.font='bold 18px Arial';ctx.fillText(key.toUpperCase(),X(p.x),Y(p.z)+6);}
ctx.font='14px Arial';ctx.textAlign='left';ctx.fillStyle='#4a6353';ctx.fillText('A + C  NEIGHBORS     B  RECIPIENT     R  DELIVERY ROBOT',42,680);ctx.fillText('R → B  '+distance(state.r,state.b).toFixed(1)+' units',42,705);
pill(passed?'PAST B / CROSSING RECORDED':m.toward?'TOWARD B':m.away?'AWAY FROM B':'ROBOT STATIONARY',730,705,'#526849');
const rules=(items)=>items.map(([label,on])=>`<div class="rule ${on?'on':''}"><span>${label}</span><b>${on?'TRUE':'FALSE'}</b></div>`).join('');
$('#position').innerHTML=rules([['A is left of B',left],['B is between A and C',middle],['Robot is adjacent to B',near]]);$('#movement').innerHTML=rules([['Toward B',m.toward],['Away from B',m.away],['Past B (recorded)',passed]]);
$('#action').textContent=delivered?'Parcel delivered. One handoff recorded.':middle?'Meeting signal on: B connects the two neighbors.':'Waiting for a meeting or a delivery condition.';
$('#time').value=Math.round(t*1000);$('#time-label').value=Math.round(t*100)+'%';$('#play').textContent=playing?'Pause':'Play scene';}
function seek(value){const old=state.r;state.r=sample(name,value);m=movement(old,state.r,state.b);passed ||=m.past;t=value;draw();}
function frame(now){if(playing){seek(Math.min(1,t+Math.min((now-last)/1000,.1)/8));if(t>=1){playing=false;draw();}}last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
$('#play').onclick=()=>{if(t>=1)reset();playing=!playing;if(!playing)m={toward:false,away:false,past:false};draw();};$('#reset').onclick=()=>reset();$('#scenario').onchange=e=>reset(e.target.value);
$('#time').oninput=e=>{playing=false;const v=Number(e.target.value)/1000;reset();for(let f=.005;f<v;f+=.005)seek(f);seek(v);};
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{playing=false;const key=$('#object').value,[dx,dz]=b.dataset.move.split(',').map(Number),prev={...state[key]};state[key]={x:Math.max(-12,Math.min(12,prev.x+dx)),z:Math.max(-12,Math.min(12,prev.z+dz))};m=key==='r'?movement(prev,state.r,state.b):{toward:false,away:false,past:false};passed ||=m.past;draw();});
// Deterministic rendering also powers the captured evidence, using the same model.
window.study={set(n,v){reset(n);for(let f=.005;f<v;f+=.005)seek(f);seek(v);},get(){return {name,t,state,delivered,passed,m};}};
const q=new URLSearchParams(location.search);reset(scenarios[q.get('scene')]?q.get('scene'):'meeting');if(q.has('play')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)playing=true;
