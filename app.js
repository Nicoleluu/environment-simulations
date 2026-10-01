import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createExample, transition, summarize, projectParcels, buildingOn, residentsOf, access, actionReason, assertModel, PARK_REACH} from './model.js?v=2';
const $=id=>document.getElementById(id);
const STORAGE_KEY = 'neighborhood-iteration-2';
let state = createExample(), storageMessage = 'Saved on this device';
try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) { const candidate = JSON.parse(saved); assertModel(candidate); state = candidate; } }
catch { storageMessage = 'Saved model unavailable; example loaded'; }
let parcels=projectParcels(state),selected=10,mode='select',history=[],future=[],topView=false,layer='land',links;

let scene,camera,renderer,controls,plots,selection;
const colors={grass:0xadc79d,park:0x9bb98e,road:0xb3c0c3,walk:0xe0e4dc,white:0xf4eee1,wood:0xa28061};
const materials=new Map();function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.9}));return materials.get(color);}
function box(parent,w,h,d,x,y,z,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function tree(parent,x,z,scale=1){const g=new THREE.Group();g.position.set(x,.2,z);g.scale.setScalar(scale);box(g,.19,1.5,.19,0,.75,0,0x9a8260);const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry(.9,1),mat(0x73966c));foliage.scale.set(.85,1.25,.85);foliage.position.y=1.8;foliage.castShadow=true;g.add(foliage);parent.add(g);}
function bench(g,x,z){box(g,1.2,.12,.4,x,.52,z,colors.wood);box(g,1.2,.35,.09,x,.77,z+.2,colors.wood);[-.45,.45].forEach(dx=>box(g,.08,.4,.3,x+dx,.27,z,0x65726a));}
function roof(g,width,length,y,color){const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.lineTo(0,1.25);shape.lineTo(width/2,0);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false});const m=new THREE.Mesh(geo,mat(color));m.position.set(0,y,-length/2);m.castShadow=true;g.add(m);}
function house(g,p){const h=2.0+(p.id%3)*.35+(p.floors-1)*1.8;const body=[0xede8d9,0xe6c7ab,0xe9ddc9,0xcbd6d5][p.id%4];box(g,3.1,h,3.05,0,h/2+.3,-.4,body);roof(g,3.55,3.6,h+.3,[0x9d7867,0x728d90,0xb38b74][p.id%3]);box(g,.38,1,.44,.83,h+.55,-.85,0xd9c7b2);box(g,.6,1.2,.08,.5,.9,1.16,0x877763);box(g,.85,.65,.08,-.8,1.5,1.17,0x647f86);box(g,.07,.68,.1,-.8,1.5,1.21,colors.white);box(g,.88,.07,.1,-.8,1.5,1.21,colors.white);box(g,.08,.7,.8,1.56,1.5,-.6,0x70868b);box(g,.12,.07,.83,1.59,1.5,-.6,colors.white);box(g,1,.07,2.1,.5,.27,2.15,colors.walk);box(g,1.4,.16,.6,.5,.37,1.5,0xd4d5c9);tree(g,-2.15,-2.1,.85);tree(g,2.2,1.6,.65);for(let i=0;i<p.residents;i++){const x=-1.65+(i%4)*.42;const person=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.25,3,6),mat([0xd99567,0x547787,0xdab766,0x815f70][i%4]));person.position.set(x,.49,2.5+Math.floor(i/4)*.4);person.castShadow=true;g.add(person);const head=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),mat(0xe1c5a3));head.position.set(x,.8,2.5+Math.floor(i/4)*.4);g.add(head);} }
function park(g,p){box(g,1,.04,6,0,.24,0,0xd4d3b6);box(g,6,.04,.85,0,.25,.6,0xd4d3b6);[[-1.9,-1.6],[1.9,-1.9],[-2,2.1],[2,2]].forEach(([x,z],i)=>tree(g,x,z,.9+(i%2)*.25));bench(g,-1.7,.1);bench(g,1.7,1.1);const pond=new THREE.Mesh(new THREE.CylinderGeometry(.8,.9,.09,32),mat(0x81acb5));pond.position.set(1.7,.3,-.2);g.add(pond);}
function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material?.isLineBasicMaterial)o.material.dispose();});}
function renderParcels(){if(plots){scene.remove(plots);disposeGroup(plots);}plots=new THREE.Group();for(const p of parcels){const g=new THREE.Group();g.position.set(p.x,0,p.z);g.userData.parcelId=p.id;box(g,6.4,.25,6.4,0,.08,0,layer==='access'?(p.streetAccess?0x9abfae:0xd99d88):layer==='park'&&p.use==='home'?(p.served?0x93bea5:0xdfbd82):p.use==='park'?colors.park:colors.grass);if(p.use==='home')house(g,p);else if(p.use==='park')park(g,p);else {const line=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.5,.015,5.5)),new THREE.LineBasicMaterial({color:0xdde7d6}));line.position.y=.23;g.add(line);}plots.add(g);}scene.add(plots);updateSelection();}
function updateSelection(){const p=parcels.find(p=>p.id===selected);selection.position.set(p.x,.26,p.z);renderRelationships();}
function init(){scene=new THREE.Scene();scene.background=new THREE.Color(0xe7eff2);camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,250);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xe7eff2);$('viewport').append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Maple Grove 3D map. Use the parcel selector to explore with a keyboard.');controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=!matchMedia('(prefers-reduced-motion: reduce)').matches;controls.maxPolarAngle=Math.PI/2.25;controls.minDistance=28;controls.maxDistance=180;controls.target.set(0,0,0);resetCamera();scene.add(new THREE.HemisphereLight(0xffffff,0xb4c3b0,2.6));const sun=new THREE.DirectionalLight(0xfff5e2,3.3);sun.position.set(-22,38,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:100});sun.shadow.normalBias=.04;scene.add(sun);box(scene,36,.9,36,0,-.55,0,0xd7ddd3);box(scene,35.7,.12,35.7,0,-.06,0,colors.walk);for(let a=-16;a<=16;a+=8){box(scene,1.7,.04,34.7,a,.025,0,colors.road);box(scene,34.7,.045,1.7,0,.025,a,colors.road);for(let b=-14.5;b<16;b+=2){box(scene,.07,.015,.65,a,.055,b,0xe7eae3);box(scene,.65,.015,.07,b,.06,a,0xe7eae3);}}
// Street crossings and small cars make the connected street network legible.
for(const x of [-8,8])for(const z of [-8,8])for(let i=0;i<5;i++)box(scene,.16,.025,1.25,x-1.5+i*.3,.07,z,0xf0f0e8);
for(const [x,z,c,rot] of [[-8,3,0xe5ca85,0],[8,-4,0x7c99a7,0],[4,8,0xcc8b75,1],[-12,-8,0xf1eee0,1]]){const car=new THREE.Group();box(car,.65,.35,1.35,0,.25,0,c);box(car,.55,.25,.65,0,.52,0,0x69808a);car.position.set(x+.4,.05,z);car.rotation.y=rot*Math.PI/2;scene.add(car);}
const ringShape=new THREE.Shape();ringShape.moveTo(-3.35,-3.35);ringShape.lineTo(3.35,-3.35);ringShape.lineTo(3.35,3.35);ringShape.lineTo(-3.35,3.35);ringShape.closePath();const hole=new THREE.Path();hole.moveTo(-3.19,-3.19);hole.lineTo(-3.19,3.19);hole.lineTo(3.19,3.19);hole.lineTo(3.19,-3.19);hole.closePath();ringShape.holes.push(hole);selection=new THREE.Mesh(new THREE.ShapeGeometry(ringShape),new THREE.MeshBasicMaterial({color:0x3d786a,side:THREE.DoubleSide}));selection.rotation.x=-Math.PI/2;scene.add(selection);renderParcels();const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(plots.children,true)[0];if(hit){let obj=hit.object;while(obj&&!obj.userData.parcelId)obj=obj.parent;if(obj)select(obj.userData.parcelId,true);}});window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});}
function resetCamera(){topView=false;camera.position.set(43,43,53);controls.target.set(0,0,0);if(innerWidth<700)camera.position.multiplyScalar(1.95);controls.update();}
let toastTimer;function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3400);}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageMessage = 'Saved on this device'; }
  catch { storageMessage = 'Storage unavailable — export to keep changes'; }
  $('save-status').textContent = storageMessage;
}
function renderRelationships() {
  if (links) { scene.remove(links); disposeGroup(links); }
  links = new THREE.Group();
  for (const street of state.streets.filter(s => !s.open)) {
    const [ax,az] = street.a.split(',').map(Number), [bx,bz] = street.b.split(',').map(Number);
    box(links, ax===bx?.95:6.5,.08,ax===bx?6.5:.95,(ax+bx)/2,.13,(az+bz)/2,0xc37560);
    box(links,ax===bx?1.7:.2,.65,ax===bx?.2:1.7,(ax+bx)/2,.45,(az+bz)/2,0xe9b67b);
  }
  // Gateway is the graph's actual entry node, rather than a decorative marker.
  box(links,.7,1.5,.7,-16,.75,-16,0x497c96);
  const p = parcels.find(p=>p.id===selected);
  if (p.route) {
    const park = parcels.find(q=>q.id===p.route.parkId);
    const points = [[p.x,p.z],[p.x,p.z+4],...p.route.nodes.map(n=>n.split(',').map(Number)),[park.x,park.z+4],[park.x,park.z]];
    const geo = new THREE.BufferGeometry().setFromPoints(points.map(([x,z])=>new THREE.Vector3(x,.42,z)));
    const line = new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x245eaa,depthTest:false}));line.renderOrder=4;links.add(line);
  }
  scene.add(links);
}
function populateSelect(id, entries, previous) {
  const el=$(id);el.replaceChildren();
  for(const [value,label] of entries) { const option=document.createElement('option');option.value=value;option.textContent=label;el.append(option); }
  if(entries.some(([v])=>String(v)===previous))el.value=previous;
  el.disabled=!entries.length;
}
function refresh() {
  parcels=projectParcels(state);
  const p=parcels.find(p=>p.id===selected),s=summarize(state),b=buildingOn(state,p.id),a=access(state,p.id);
  for(const k of ['homes','residents','parks'])$(k).textContent=s[k];
  $('occupancy').textContent=s.occupancy+'%';$('meter').style.width=s.occupancy+'%';
  $('model-totals').textContent=`${s.homes} homes house ${s.residents} residents, with ${s.capacity-s.residents} available places. ${s.served} homes have a nearby park. ${s.disconnected} parcels are disconnected; ${s.openStreets} of 40 street links are open.`;
  $('available').textContent=s.capacity-s.residents;
  $('park-access').textContent=s.served+' / '+s.homes;
  $('disconnected').textContent=s.disconnected;$('streets-open').textContent=s.openStreets+' / 40';
  $('parcel-id').textContent='P'+String(p.id).padStart(2,'0');
  $('parcel-name').textContent=p.use==='home'?'Maple House '+p.id:p.use==='park'?'Pocket Park '+p.id:'Room to grow';
  $('parcel-description').textContent={home:'A home is a building and the people who live in it.',park:'A park changes access for the homes around it.',vacant:'Development depends on an open street connection.'}[p.use];
  $('attributes').innerHTML=`<dt>Land use</dt><dd>${{home:'Residential',park:'Green space',vacant:'Available'}[p.use]}</dd><dt>Street access</dt><dd>${p.streetAccess?'Connected':'Disconnected'}</dd><dt>Building</dt><dd>${b?b.id+' · '+b.floors+' floor'+(b.floors>1?'s':''):'None'}</dd><dt>Residents / capacity</dt><dd>${p.residents} / ${p.capacity}</dd><dt>Nearest park</dt><dd>${p.route?'P'+p.route.parkId+' · '+p.route.links+' links':'No route'}</dd>`;
  $('rule-status').textContent=!p.streetAccess?'⚠ '+a.reason:p.use==='home'?(p.served?'✓ Nearby park: within '+PARK_REACH+' street links.':'△ No park within '+PARK_REACH+' street links.'):'✓ '+a.reason;
  $('rule-status').classList.toggle('warning',!p.streetAccess||(p.use==='home'&&!p.served));
  const residents=b?residentsOf(state,b.id):[];
  populateSelect('resident-select',residents.map(r=>[r.id,r.name+' ('+r.id+')']),$('resident-select').value);
  populateSelect('destination',parcels.filter(q=>q.use==='home'&&q.id!==p.id).map(q=>[q.id,'P'+q.id+' · '+q.residents+'/'+q.capacity+(!q.streetAccess?' · disconnected':'')]),$('destination').value);
  $('relationship-info').textContent=b?`Maple Grove → P${p.id} → ${b.id} → ${residents.length} identified residents. Relocation changes a resident’s building reference.`:`Maple Grove → P${p.id} → ${p.use}. No building or resident references.`;
  $('toggle-road').textContent=a.street.open?'Close frontage street':'Reopen frontage street';
  $('toggle-road').title=a.street.id;
  populateSelect('network-street',state.streets.map(s=>[s.id,`${s.id} · ${s.open?'open':'closed'}`]),$('network-street').value);
  for(const [id,action] of [['move-in','in'],['move-out','out'],['upgrade','upgrade'],['relocate','relocate']]) { const reason=actionReason(state,p.id,action,actionOptions());$(id).disabled=!!reason;$(id).title=reason||'Apply '+action; }
  $('undo').disabled=!history.length;$('redo').disabled=!future.length;$('parcel-select').value=p.id;
  $('save-status').textContent=storageMessage;
  $('apply-tool').hidden=mode==='select';$('apply-tool').textContent={home:'Build home here',park:'Add park here',clear:'Clear this parcel'}[mode]||'';
  $('journal').replaceChildren();
  for(const event of state.journal) {const li=document.createElement('li');li.textContent=`Edit ${event.revision}: ${event.message}`;$('journal').append(li);}
  if(!state.journal.length) {const li=document.createElement('li');li.textContent='Starting example. Make an edit to see its consequences here.';$('journal').append(li);}
  if(selection)updateSelection();
}
function actionOptions(){return {residentId:$('resident-select').value,targetId:Number($('destination').value)};}
function select(id,apply=false){selected=Number(id);$('action-feedback').textContent='';refresh();if(apply&&mode!=='select')act(mode);}
function commit(next,message) {history.push(state);if(history.length>50)history.shift();future=[];state=next;parcels=projectParcels(state);persist();renderParcels();refresh();$('action-feedback').textContent=message;toast(message);}
function act(action,options=actionOptions()){try{const next=transition(state,selected,action,options);commit(next,next.journal[0].message);if($('about').open)$('network-feedback').textContent=next.journal[0].message;}catch(e){$('action-feedback').textContent=e.message;toast(e.message);}}
populateSelect('parcel-select',parcels.map(p=>[p.id,'Parcel '+String(p.id).padStart(2,'0')]));
$('parcel-select').addEventListener('change',e=>select(e.target.value));
function setMode(value){mode=value;document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});$('hint').textContent={select:'Click a parcel to explore. Drag to orbit. Scroll to zoom.',home:'Choose a vacant, connected parcel to build a home.',park:'Choose a vacant, connected parcel to add a park.',clear:'Choose a park or an unoccupied home to clear.'}[mode];refresh();}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('apply-tool').onclick=()=>act(mode);$('move-in').onclick=()=>act('in');$('move-out').onclick=()=>act('out');$('upgrade').onclick=()=>act('upgrade');$('relocate').onclick=()=>act('relocate');$('toggle-road').onclick=()=>act('road');
$('network-toggle').onclick=()=>act('road',{streetId:$('network-street').value});
$('resident-select').onchange=$('destination').onchange=refresh;
$('layer').onchange=e=>{layer=e.target.value;$('layer-legend').textContent={land:'Blue line: shortest park route. Blue post: gateway.',park:'Green homes: park within 2 links. Amber: farther away or unreachable.',access:'Green: connected to gateway. Coral: disconnected. Barriers: closed streets.'}[layer];renderParcels();};
function travelHistory(from,to,message){if(from.length){to.push(state);state=from.pop();parcels=projectParcels(state);persist();renderParcels();refresh();$('action-feedback').textContent=message;toast(message);}}
$('undo').onclick=()=>travelHistory(history,future,'Last edit undone.');$('redo').onclick=()=>travelHistory(future,history,'Edit restored.');
$('reset').onclick=()=>$('reset-dialog').showModal();$('cancel-reset').onclick=()=>$('reset-dialog').close();$('confirm-reset').onclick=()=>{commit(createExample(),'Starting example restored. You can undo this reset.');$('reset-dialog').close();};
$('help').onclick=$('model-open').onclick=()=>{refresh();$('about').showModal();};$('close-help').onclick=$('got-it').onclick=()=>$('about').close();
$('export-model').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='neighborhood-iteration-2.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('home-view').onclick=resetCamera;function zoom(scale){const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*scale,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();}$('zoom-in').onclick=()=>zoom(.85);$('zoom-out').onclick=()=>zoom(1.18);$('view').onclick=()=>{topView=!topView;if(topView){camera.position.copy(controls.target).add(new THREE.Vector3(0,65,.01));controls.update();}else resetCamera();};window.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)||document.querySelector('dialog[open]'))return;if(e.ctrlKey||e.metaKey||e.altKey)return;if('1234'.includes(e.key))setMode(['select','home','park','clear'][Number(e.key)-1]);if(e.key==='Escape')setMode('select');});
try{init();refresh();}catch(e){console.error(e);const error=document.createElement('div');error.className='error';error.textContent='The 3D view could not start. Enable WebGL in your browser and reload this page.';document.body.append(error);}
