import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {prediction,sample,decision,THRESHOLD} from './model.js';
const $=s=>document.querySelector(s), mount=$('#scene');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e9e8f1');
const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(9,10,14);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#e9e8f1');mount.append(renderer.domElement);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,0,0);orbit.enableDamping=true;orbit.minDistance=8;orbit.maxDistance=27;orbit.maxPolarAngle=Math.PI*.47;orbit.enablePan=false;
scene.add(new THREE.HemisphereLight(0xffffff,0x9394bb,2.4));const sun=new THREE.DirectionalLight(0xfff8ef,3.5);sun.position.set(-6,14,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13});sun.shadow.normalBias=.025;scene.add(sun);
const mats={};function mat(c){return mats[c]??=new THREE.MeshStandardMaterial({color:c,roughness:.78});}
function mesh(geo,c,parent=scene){const o=new THREE.Mesh(geo,mat(c));o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(w,h,d,x,y,z,c,p=scene){const o=mesh(new THREE.BoxGeometry(w,h,d),c,p);o.position.set(x,y,z);return o;}
function sphere(r,x,y,z,c,p=scene){const o=mesh(new THREE.SphereGeometry(r,16,12),c,p);o.position.set(x,y,z);return o;}
function rod(a,b,r,c,p=scene){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const o=mesh(new THREE.CylinderGeometry(r,r,v.length(),10),c,p);o.position.copy(new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}
const blue='#3659cf',coral='#da624f',dark='#303649';
// A finite street section, framed as a physical study model.
box(11,.3,18,0,-.22,0,'#d0d0e0');box(6.4,.08,18,0,-.025,0,'#bfc4d2');
for(const x of [-4.35,4.35]){box(2.3,.14,18,x,.02,0,'#ebeaf0');box(.16,.2,18,Math.sign(x)*3.25,.02,0,'#fafaff');for(let z=-8.5;z<9;z+=.9)box(2.2,.006,.012,x,.095,z,'#d1d2dd');}
for(let z=-8;z<9;z+=2)box(.055,.008,.9,-1.5,.024,z,'#f8f8fc');
// Crosswalk and utility details.
for(let x=-2.8;x<3;x+=.65)box(.36,.01,1.05,x,.03,-6.9,'#eeeef6');
function tree(x,z){rod([x,.1,z],[x,1.6,z],.075,'#989b9a');sphere(.55,x,1.85,z,'#849e99');sphere(.4,x-.25,1.65,z+.15,'#9eb4a7');box(1,.08,1,x,.1,z,'#c4c8c4');}
[-7,-2,3,7].forEach(z=>tree(-4.4,z));[-4,4,8].forEach(z=>tree(4.5,z));
function bench(x,z){box(.55,.08,1.5,x,.48,z,'#b5a499');box(.08,.48,1.5,x+.24,.65,z,'#b5a499');for(const zz of [-.55,.55])box(.4,.45,.06,x,.25,z+zz,'#777f8e');}
bench(4.4,-.6);bench(-4.4,5.3);
for(const z of [-5.4,5.5]){rod([3.8,.1,z],[3.8,3.5,z],.035,'#8790a6');rod([3.8,3.5,z],[2.9,3.5,z],.035,'#8790a6');box(.5,.08,.22,2.9,3.47,z,'#fafaff');}
// Bike travels toward negative z. Wheelbase and handlebar width are explicit geometry.
function cyclist(color){const root=new THREE.Group();scene.add(root);const body=new THREE.Group();root.add(body);const wheels=[];
 for(const z of [-.55,.55]){const wheel=mesh(new THREE.TorusGeometry(.32,.027,8,32),dark,body);wheel.rotation.y=Math.PI/2;wheel.position.set(0,.34,z);wheels.push(wheel);rod([-.025,.34,z],[.025,.34,z],.045,'#a4adbf',body);for(let a=0;a<Math.PI;a+=Math.PI/4)rod([0,.34+Math.cos(a)*.3,z+Math.sin(a)*.3],[0,.34-Math.cos(a)*.3,z-Math.sin(a)*.3],.006,'#bbc3d1',body);}
 const nodes=[[0,.34,.55],[0,.36,0],[0,.8,.2],[0,.83,-.4],[0,.34,-.55]];
 [[0,1],[1,2],[2,0],[2,3],[3,1],[3,4]].forEach(([a,b])=>rod(nodes[a],nodes[b],.026,color,body));
 box(.17,.045,.22,0,.84,.2,dark,body);rod([0,.83,-.4],[0,1,-.5],.02,dark,body);rod([-.32,1,-.5],[.32,1,-.5],.022,dark,body);
 // Rider torso, bent arms, helmet, and articulated legs.
 const pelvis=[0,1.04,.17],shoulder=[0,1.39,-.17];rod(pelvis,shoulder,.15,color,body);sphere(.155,0,1.61,-.25,'#d9b49e',body);const helmet=sphere(.177,0,1.7,-.24,color,body);helmet.scale.y=.65;box(.21,.035,.05,0,1.64,-.4,dark,body);
 for(const side of [-1,1]){rod([side*.13,1.37,-.16],[side*.23,1.18,-.27],.047,color,body);rod([side*.23,1.18,-.27],[side*.29,1.02,-.5],.035,'#d9b49e',body);sphere(.04,side*.29,1.02,-.5,'#d9b49e',body);rod([side*.09,1.02,.16],[side*.12,.7,-.08],.065,dark,body);rod([side*.12,.7,-.08],[side*.13,.45,.08],.043,'#d9b49e',body);box(.11,.07,.2,side*.13,.43,.03,'#f6f6fa',body);}
 return {root,body,wheels};}
const lead=cyclist(coral),pass=cyclist(blue);
function ring(color){const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false});const o=new THREE.Mesh(new THREE.CircleGeometry(1,64),m);o.rotation.x=-Math.PI/2;o.position.y=.036;scene.add(o);return o;}
const leadZone=ring(coral),passZone=ring(blue);leadZone.scale.set(.8,1.35,1);passZone.scale.set(.8,1.35,1);
const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const dimension=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:blue}));scene.add(dimension);
function labelSprite(){const c=document.createElement('canvas');c.width=512;c.height=128;const tex=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));sprite.scale.set(2.5,.625,1);scene.add(sprite);return {c,tex,sprite};}const label=labelSprite();
let running=false,time=0,last=0,crashAt=null,minGap=Infinity,complete=false,top=false;
function values(){return {gap:+$('#gap').value,sway:+$('#sway').value,speed:+$('#speed').value,guard:$('#guard').checked};}
function updateUI(){const v=values(),p=prediction(v.gap,v.sway);$('#gap-out').textContent=v.gap.toFixed(2)+' m';$('#sway-out').textContent=v.sway.toFixed(2)+' m';$('#speed-out').textContent=v.speed.toFixed(1)+' km/h';$('#minimum').textContent=p.toFixed(2);$('#risk').textContent=p<=0?'Contact possible':p<THRESHOLD?'Below threshold':'Clear margin';$('#risk').style.cssText=p>=THRESHOLD?'background:#e1eee9;color:#326350':'';$('#clearance-fill').style.width=Math.max(3,Math.min(100,p/1.8*100))+'%';$('#clearance-fill').style.background=p>=THRESHOLD?'#417e69':'#da624f';$('#prediction').textContent=p<=0?'Negative clearance means the predicted handlebar envelopes overlap.':`Gap ${v.gap.toFixed(2)} − two riders × ${v.sway.toFixed(2)} m sway.`;$('#rule-eval').textContent=`${p.toFixed(2)} m ${p<THRESHOLD?'<':'≥'} 0.80 m → ${p<THRESHOLD?'WAIT':'PASS'}${v.guard?' · rule enabled':' · rule currently off'}`;}
function message(text,danger=false){$('#event').textContent=text;$('#event').classList.toggle('danger',danger);}
function reset(){running=false;time=0;crashAt=null;minGap=Infinity;complete=false;lead.body.rotation.set(0,0,0);lead.root.position.y=0;pass.body.rotation.set(0,0,0);$('#play').textContent='▶ Run the pass';$('#actual').textContent='—';$('#elapsed').textContent='0.0 s';$('#decision').textContent='Ready';$('#decision-note').textContent='The next move depends on distance.';$('#progress').style.width='0%';message('Set the gap. Then make the pass.');updateUI();drawState();}
function drawState(){const v=values(),s=sample(v.gap,v.sway,v.speed,crashAt??time);const gapBase=.64+v.gap;
 lead.root.position.set(.5-s.drift,0,0);pass.root.position.set(.5-gapBase+s.drift,0,s.z);
 lead.root.position.x=.5-s.drift;pass.root.position.x=.5-gapBase+s.drift;
 if(crashAt!==null){const f=Math.min(1,(time-crashAt)/.65),ease=1-Math.pow(1-f,3);lead.body.rotation.z=-ease*Math.PI*.48;lead.root.position.y=.1*ease;pass.body.rotation.z=.16*ease;}
 leadZone.position.x=lead.root.position.x;leadZone.position.z=0;passZone.position.x=pass.root.position.x;passZone.position.z=pass.root.position.z;
 const x1=pass.root.position.x+.32,x2=lead.root.position.x-.32;const z=(s.z/2)-.5;dimension.geometry.setFromPoints([new THREE.Vector3(x1,.12,z),new THREE.Vector3(x2,.12,z)]);
 const ctx=label.c.getContext('2d');ctx.clearRect(0,0,512,128);ctx.fillStyle='#ffffffed';ctx.beginPath();ctx.roundRect(30,20,452,88,18);ctx.fill();ctx.fillStyle=s.clearance<=0?'#ad3829':'#3659cf';ctx.font='500 38px Arial';ctx.textAlign='center';ctx.fillText(`${s.clearance.toFixed(2)} m lateral gap`,256,77);label.tex.needsUpdate=true;label.sprite.position.set((x1+x2)/2,2.55,z);
 return s;}
$('#play').onclick=()=>{if(complete)reset();if(running){running=false;$('#play').textContent='▶ Resume';return;}const v=values();if(decision(v.gap,v.sway,v.guard)==='wait'){$('#decision').textContent='Waiting';$('#decision-note').textContent='Predicted clearance is below 0.80 m.';message('Rule active: hold position. Increase the gap to pass.');return;}running=true;$('#play').textContent='Ⅱ Pause';$('#decision').textContent='Passing';$('#decision-note').textContent=v.guard?'Rule accepts the predicted gap.':'Safety rule is off.';message('Overtaking. Watch the space between the handlebars.');};
$('#reset').onclick=reset;for(const id of ['gap','speed','sway','guard'])$('#'+id).addEventListener('input',()=>{document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('selected'));reset();});
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{const k=b.dataset.preset;const p={clear:[1.4,.1,5],close:[.4,.14,5],crash:[.15,.14,5]}[k];$('#gap').value=p[0];$('#sway').value=p[1];$('#speed').value=p[2];document.querySelectorAll('[data-preset]').forEach(el=>el.classList.toggle('selected',el===b));reset();});
$('#camera').onclick=()=>{top=!top;camera.position.set(...(top?[0,18,.01]:[9,10,14]));orbit.target.set(0,0,0);orbit.update();$('#camera').textContent=top?'Perspective view':'Top view';};
const observer=new ResizeObserver(()=>{const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});observer.observe(mount);
function animate(ms){requestAnimationFrame(animate);const dt=Math.min((ms-last)/1000,.04);last=ms;if(running){const v=values();if(crashAt===null){time+=dt;const s=sample(v.gap,v.sway,v.speed,time);if(Math.abs(s.z)<.22){minGap=Math.min(minGap,s.clearance);$('#actual').textContent=minGap.toFixed(2)+' m';}if(s.contact){crashAt=time;message('Contact. The leading rider loses balance.',true);$('#decision').textContent='Collision';$('#decision-note').textContent='Handlebar envelopes touch during overlap.';}else if(s.progress>=1){running=false;complete=true;$('#play').textContent='↺ Replay';$('#decision').textContent=prediction(v.gap,v.sway)<THRESHOLD?'Near miss':'Pass complete';$('#decision-note').textContent='No contact occurred in this modeled pass.';message(prediction(v.gap,v.sway)<THRESHOLD?'No contact — but the gap remained below the rule threshold.':'Pass completed with clearance.');}$('#progress').style.width=s.progress*100+'%';}else{time+=dt;if(time-crashAt>=.85){running=false;complete=true;$('#play').textContent='↺ Replay';}}
 $('#elapsed').textContent=time.toFixed(1)+' s';drawState();}orbit.update();renderer.render(scene,camera);}
reset();requestAnimationFrame(animate);
