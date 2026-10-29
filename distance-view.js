import {createExample} from './model.js';
import {distanceBetween,applyScenario,locationFor} from './distance-model.js?v=5';

export function mountDistance({THREE,scene,camera,controls,renderer,setState}){
 const shell=document.createElement('div');shell.className='distance-shell';shell.innerHTML=`
 <div class="distance-heading"><div><h1>Neighborhood: distance</h1><p>How close is a neighbor when the street is closed?</p></div><nav class="distance-nav"><a href="index.html">Original simulation</a><a href="slides.html">4-slide presentation</a></nav></div>
 <section class="distance-panel" aria-label="Distance experiment controls"><h2>Two places, two distances</h2><p>Compare locations or residents in the original Maple Grove street network.</p>
 <label>Compare<select id="d-mode"><option value="places">Two locations</option><option value="people">Two occupants</option></select></label>
 <label>Location A<select id="d-a"></select></label><label>Location B<select id="d-b"></select></label>
 <label>Street scenario<select id="d-scenario"><option value="existing">Open network</option><option value="detour">Two street closures near A–B</option><option value="isolated">B frontage closed</option></select></label>
 <p id="d-closures" aria-live="polite"></p>
 <div class="actions"><button id="d-animate" class="primary">Animate route</button><button id="d-record">Record animation</button></div><p id="d-status" class="distance-status" role="status"></p>
 <details><summary>Metric definitions & assumptions</summary><p><b>Straight-line distance</b> is √((xB−xA)² + (zB−zA)²), measured in plan.</p><p><b>Walking distance</b> is the shortest weighted path through open streets, including each parcel’s 4-unit access leg. Dijkstra’s algorithm finds the minimum sum of segment lengths.</p><p>Locations are parcel centers. Each resident inherits the location of their home through resident → building → parcel. Residents of one home are co-located, so their distance is zero.</p><p>Streets are bidirectional. Buildings cannot be crossed between parcels. No traffic or travel time is modeled. Disconnected pairs have no finite walking route. Pairwise routing does not require the external gateway.</p><p>This assignment example uses the original 16 parcels and 40 street links. Scenario changes do not overwrite your saved neighborhood.</p></details>
 <p class="distance-note">Street scenarios follow your selected A and B. Change either location to update the nearby closures. Orange marks closed streets.</p></section>
 <section class="distance-readout" aria-label="Distance comparison"><h2 id="d-pair">Location A / Location B</h2><div class="distance-key"><span>Straight line</span><span>Walking route</span></div>
 <div class="distance-metric direct"><div><span>Straight line</span><span><strong id="d-direct">0</strong> <small>units</small></span></div><div class="distance-track"><i id="d-direct-bar"></i></div></div>
 <div class="distance-metric walk"><div><span>Shortest walk</span><span><strong id="d-walk">0</strong> <small id="d-walk-unit">units</small></span></div><div class="distance-track"><i id="d-walk-bar"></i></div></div>
 <p id="distance-finding" aria-live="polite"></p><p id="distance-units">Both bars use a fixed 0–80 model-unit scale. Units are schematic, not measured meters. Lines compare the same parcel centers in plan.</p></section>
 <div class="distance-footer"><p>Nicole Lu · Spatial AI · October 2026</p><div class="distance-view-controls"><button id="d-top">Plan view</button><button id="d-perspective">3D view</button><button id="d-zoom-in" aria-label="Zoom in">＋</button><button id="d-zoom-out" aria-label="Zoom out">−</button></div></div>`;
 document.body.append(shell);
 const $=id=>document.getElementById(id);let current=createExample(),result,group,marker,animation=null,frame=0;
 function populate(){const people=$('d-mode').value==='people';for(const [id,defaultParcel] of [['d-a',1],['d-b',5]]){
 const el=$(id),old=el.value;el.replaceChildren();const entries=people?current.residents.map(r=>[r.id,`${r.name} (${r.id}) · P${locationFor(current,r.id).id}`]):current.parcels.map(p=>['P:'+p.id,`P${p.id} · ${p.use==='home'?'Home':p.use==='park'?'Park':'Vacant'}`]);
 for(const [v,t] of entries){const o=document.createElement('option');o.value=v;o.textContent=t;el.append(o);}
 el.value=entries.some(([v])=>v===old)?old:people?entries.find(([v])=>locationFor(current,v).id===defaultParcel)?.[0]??entries[0][0]:'P:'+defaultParcel;
 el.parentElement.firstChild.textContent=(people?'Occupant ':'Location ')+(id==='d-a'?'A':'B');}}
 function clear(){if(group){scene.remove(group);group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}group=new THREE.Group();scene.add(group);}
 function line(points,color,dashed=false,width=.085){for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i],length=Math.hypot(q[0]-p[0],q[1]-p[1]);if(!length)continue;const step=dashed?1.1:length;for(let start=0;start<length;start+=step){const end=Math.min(length,start+(dashed?.65:length)),a=start/length,b=end/length;const from=new THREE.Vector3(p[0]+(q[0]-p[0])*a,.65,p[1]+(q[1]-p[1])*a),to=new THREE.Vector3(p[0]+(q[0]-p[0])*b,.65,p[1]+(q[1]-p[1])*b);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(width,width,to.distanceTo(from),8),new THREE.MeshBasicMaterial({color,depthTest:false}));mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(from).normalize());mesh.renderOrder=dashed?22:21;group.add(mesh);}}}
 function pin(p,label,color){const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.beginPath();ctx.arc(64,64,49,0,Math.PI*2);ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=7;ctx.stroke();ctx.fillStyle='white';ctx.font='bold 58px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,64,66);const texture=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.position.set(p.x,5,p.z);sprite.scale.set(2.8,2.8,1);sprite.renderOrder=30;group.add(sprite);}
 function stop(){cancelAnimationFrame(frame);animation=null;$('d-animate').textContent='Animate route';}
 function update(){stop();clear();result=distanceBetween(current,$('d-a').value,$('d-b').value);if(!result)return;const {a,b,direct,walking,ratio}=result;
 $('d-pair').textContent=`A: P${a.id} / B: P${b.id}`;$('d-direct').textContent=direct.toFixed(1);$('d-walk').textContent=Number.isFinite(walking)?walking.toFixed(1):'No route';$('d-walk-unit').textContent=Number.isFinite(walking)?'units':'';
 $('d-direct-bar').style.width=Math.min(100,direct/80*100)+'%';$('d-walk-bar').style.width=Number.isFinite(walking)?Math.min(100,walking/80*100)+'%':'0%';
 $('distance-finding').textContent=!Number.isFinite(walking)?`Only ${direct.toFixed(1)} units apart in plan, but no open walking route connects these locations.`:direct===0?'Both occupants or locations share one parcel center. Both distances are zero.':`The walk is ${ratio.toFixed(1)}× the straight-line distance: ${(walking-direct).toFixed(1)} extra units through the street network.`;
 $('d-animate').disabled=!Number.isFinite(walking)||walking===0;
 for(const street of current.streets.filter(s=>!s.open))line([street.a.split(',').map(Number),street.b.split(',').map(Number)],0xe89522,false,.22);
 line([[a.x,a.z],[b.x,b.z]],0xa94878,true);if(result.points.length>1)line(result.points,0x176f99);pin(a,'A','#a0386c');pin(b,'B','#176f99');
 marker=new THREE.Mesh(new THREE.SphereGeometry(.45,16,16),new THREE.MeshBasicMaterial({color:0x12658c,depthTest:false}));marker.position.set(a.x,.8,a.z);marker.renderOrder=40;marker.visible=false;group.add(marker);$('d-status').textContent='';
 }
 function scenario(){
 current=applyScenario(createExample(),$('d-scenario').value,$('d-a').value,$('d-b').value);setState(current);update();
 const {a,b}=result;
 $('d-scenario').querySelector('[value="detour"]').textContent=`Two street closures near P${a.id}–P${b.id}`;
 $('d-scenario').querySelector('[value="isolated"]').textContent=`B frontage closed · P${b.id}`;
 const closed=current.streets.filter(s=>!s.open);
 $('d-closures').textContent=closed.length?`${closed.length} nearby street${closed.length===1?'':'s'} closed (orange). `+($('d-scenario').value==='isolated'?`P${b.id} entrance is closed.`:'Both entrances stay open; the shortest available route is recalculated.'):'All streets open for the selected A–B pair.';
 }
 $('d-mode').onchange=()=>{for(const id of ['d-a','d-b'])$(id).value='';populate();scenario();};$('d-a').onchange=$('d-b').onchange=scenario;$('d-scenario').onchange=scenario;
 $('d-animate').onclick=()=>{if(animation){stop();return;}marker.visible=true;animation={start:performance.now()};$('d-animate').textContent='Pause route';const path=result.points;function tick(now){if(!animation)return;let remaining=((now-animation.start)/1000*4)%result.walking;for(let i=1;i<path.length;i++){const p=path[i-1],q=path[i],length=Math.hypot(q[0]-p[0],q[1]-p[1]);if(remaining<=length){const t=length?remaining/length:0;marker.position.set(p[0]+(q[0]-p[0])*t,.9,p[1]+(q[1]-p[1])*t);break;}remaining-=length;}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);};
 function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
 $('d-record').onclick=()=>{
   if(!Number.isFinite(result.walking)||!result.walking){$('d-status').textContent='Choose a reachable pair with a nonzero route first.';return;}
   if(!window.MediaRecorder||!renderer.domElement.captureStream){$('d-status').textContent='Video capture is unavailable in this browser. Use Animate route and screen recording.';return;}
   if(!animation)$('d-animate').click();const stream=renderer.domElement.captureStream(30),chunks=[];
   const recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   const button=$('d-record');button.disabled=true;$('d-status').textContent='Recording one route cycle…';
   recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType});const url=URL.createObjectURL(blob);download(url,'neighborhood-route.'+(recorder.mimeType.includes('mp4')?'mp4':'webm'));setTimeout(()=>URL.revokeObjectURL(url),1000);button.disabled=false;$('d-status').textContent='Route animation saved.';};recorder.start();setTimeout(()=>recorder.stop(),Math.ceil(result.walking/4*1000)+500);
 };
 $('d-top').onclick=()=>{camera.position.set(0,72,.01);controls.target.set(0,0,0);controls.update();};
 $('d-perspective').onclick=()=>{camera.position.set(43,43,53);controls.target.set(0,0,0);controls.update();};
 for(const [id,k] of [['d-zoom-in',.85],['d-zoom-out',1.18]])$(id).onclick=()=>{camera.position.multiplyScalar(k);controls.update();};
 const query=new URLSearchParams(location.search);if(['existing','detour','isolated'].includes(query.get('scenario')))$('d-scenario').value=query.get('scenario');
 if(query.get('embed')==='1'){document.body.classList.add('distance-embed');const view=document.getElementById('viewport');renderer.setSize(view.clientWidth,view.clientHeight);camera.aspect=view.clientWidth/view.clientHeight;camera.updateProjectionMatrix();}
 populate();scenario();if(query.get('view')==='plan'||(query.get('embed')==='1'&&query.get('view')!=='3d'))$('d-top').click();if(query.get('animate')==='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)$('d-animate').click();
}
