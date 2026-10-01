/** Iteration 2: authoritative entities, relationships, derived queries, and guarded actions. */
export const MODEL_VERSION = 2;
export const PARK_REACH = 2;
const names = ['Avery', 'Jordan', 'Sam', 'Morgan', 'Riley', 'Casey', 'Robin', 'Alex'];
const nodeId = (x, z) => `${x},${z}`;
export const frontageId = p => `H:${p.x}:${p.z + 4}`;
export const residentsOf = (state, buildingId) => state.residents.filter(r => r.buildingId === buildingId);
export const buildingOn = (state, parcelId) => state.buildings.find(b => b.parcelId === parcelId);

export function createExample() {
  const uses = ['home','home','park','home','home','vacant','home','park','park','home','home','vacant','home','home','vacant','home'];
  const state = {
    version: MODEL_VERSION, nextId: 1, revision: 0,
    neighborhood: { id: 'maple-grove', name: 'Maple Grove', gatewayId: '-16,-16' },
    parcels: uses.map((use, i) => ({ id: i + 1, x: i % 4 * 8 - 12, z: Math.floor(i / 4) * 8 - 12, use })),
    buildings: [], residents: [], streets: [], journal: [],
  };
  for (let z = -16; z <= 16; z += 8) for (let x = -16; x <= 16; x += 8) {
    if (x < 16) state.streets.push({ id: `H:${x + 4}:${z}`, a: nodeId(x, z), b: nodeId(x + 8, z), open: true });
    if (z < 16) state.streets.push({ id: `V:${x}:${z + 4}`, a: nodeId(x, z), b: nodeId(x, z + 8), open: true });
  }
  for (const p of state.parcels.filter(p => p.use === 'home')) {
    const b = { id: `B${state.nextId++}`, parcelId: p.id, floors: 1, capacity: 4 };
    state.buildings.push(b);
    for (let i = 0; i < [2,3,0,4,1][(p.id - 1) % 5]; i++) addResident(state, b.id);
  }
  return state;
}
function addResident(state, buildingId) {
  const id = state.nextId++;
  state.residents.push({ id: `R${id}`, name: `${names[id % names.length]} ${id}`, buildingId });
}
export function shortestPath(state, start, target) {
  const queue = [[start]], seen = new Set([start]);
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i], node = path.at(-1);
    if (node === target) return path;
    for (const edge of state.streets.filter(s => s.open && (s.a === node || s.b === node))) {
      const next = edge.a === node ? edge.b : edge.a;
      if (!seen.has(next)) { seen.add(next); queue.push([...path, next]); }
    }
  }
  return null;
}
export function access(state, parcelId) {
  const p = state.parcels.find(p => p.id === parcelId);
  const street = p && state.streets.find(s => s.id === frontageId(p));
  if (!street?.open) return { connected: false, reason: 'Frontage street is closed.', street };
  if (!shortestPath(state, state.neighborhood.gatewayId, street.a)) return { connected: false, reason: 'No open route to the neighborhood gateway.', street };
  return { connected: true, reason: 'Frontage connects to the neighborhood gateway.', street };
}
export function parkRoute(state, parcelId) {
  const from = access(state, parcelId);
  if (!from.connected) return null;
  let best = null;
  for (const park of state.parcels.filter(p => p.use === 'park')) {
    const to = access(state, park.id);
    if (!to.connected) continue;
    for (const start of [from.street.a, from.street.b]) for (const end of [to.street.a, to.street.b]) {
      const path = shortestPath(state, start, end);
      if (path && (!best || path.length < best.nodes.length)) best = { parkId: park.id, nodes: path, links: path.length - 1 };
    }
  }
  return best;
}
export function projectParcels(state) {
  return state.parcels.map(p => {
    const b = buildingOn(state, p.id), route = p.use === 'home' ? parkRoute(state, p.id) : null;
    return { ...p, buildingId: b?.id, floors: b?.floors || 0, capacity: b?.capacity || 0,
      residents: b ? residentsOf(state, b.id).length : 0, streetAccess: access(state, p.id).connected,
      route, served: !!route && route.links <= PARK_REACH };
  });
}
export function summarize(state) {
  const parcels = projectParcels(state), homes = parcels.filter(p => p.use === 'home');
  return { homes: homes.length, residents: state.residents.length, parks: parcels.filter(p => p.use === 'park').length,
    capacity: homes.reduce((n, p) => n + p.capacity, 0),
    occupancy: homes.length ? Math.round(homes.filter(p => p.residents > 0).length / homes.length * 100) : 0,
    served: homes.filter(p => p.served).length, disconnected: parcels.filter(p => !p.streetAccess).length,
    openStreets: state.streets.filter(s => s.open).length };
}
export function actionReason(state, parcelId, action, options = {}) {
  const p = state.parcels.find(p => p.id === parcelId);
  if (!p) return 'Select a parcel first.';
  const b = buildingOn(state, p.id), residents = b ? residentsOf(state, b.id) : [], a = access(state, p.id);
  if (['home','park'].includes(action)) {
    if (p.use !== 'vacant') return 'Development requires a vacant parcel.';
    if (!a.connected) return a.reason + ' Reopen the street before developing.';
  } else if (action === 'clear') {
    if (p.use === 'vacant') return 'This parcel is already vacant.';
    if (residents.length) return 'Occupied homes cannot be cleared. Move or relocate every resident first.';
  } else if (action === 'in') {
    if (!b) return 'Residents can move into homes only.';
    if (!a.connected) return a.reason + ' New residents need street access.';
    if (residents.length >= b.capacity) return 'This home is full. Upgrade it or choose another home.';
  } else if (action === 'out' || action === 'relocate') {
    if (!b || !residents.length) return 'Select a home with residents.';
    if (!residents.some(r => r.id === options.residentId)) return 'Select a resident of this home.';
    if (action === 'relocate') {
      const target = buildingOn(state, options.targetId);
      if (!target || target.id === b.id) return 'Choose a different home as the destination.';
      if (residentsOf(state, target.id).length >= target.capacity) return 'The destination home is full.';
      if (!a.connected || !access(state, options.targetId).connected) return 'Both homes need an open route to the gateway.';
    }
  } else if (action === 'upgrade') {
    if (!b) return 'Only homes can be upgraded.';
    if (b.floors === 2) return 'The two-floor height limit has been reached.';
    if (!a.connected) return 'Construction requires street access.';
  } else if (action === 'road') {
    if (options.streetId && !state.streets.some(s => s.id === options.streetId)) return 'Choose a valid street link.';
  } else return 'Unknown action.';
  return '';
}
export function transition(state, parcelId, action, options = {}) {
  const reason = actionReason(state, parcelId, action, options);
  if (reason) throw Error(reason);
  const next = structuredClone(state), p = next.parcels.find(p => p.id === parcelId), b = buildingOn(next, p.id);
  let message;
  if (action === 'home') {
    p.use = 'home'; next.buildings.push({ id: `B${next.nextId++}`, parcelId, floors: 1, capacity: 4 });
    message = `P${parcelId}: built a home with 4 places.`;
  } else if (action === 'park') { p.use = 'park'; message = `P${parcelId}: added a park. Walking access recalculated.`; }
  else if (action === 'clear') { p.use = 'vacant'; next.buildings = next.buildings.filter(x => x.parcelId !== parcelId); message = `P${parcelId}: cleared the parcel. Park access recalculated.`; }
  else if (action === 'in') { addResident(next, b.id); message = `${next.residents.at(-1).name} moved into P${parcelId}.`; }
  else if (action === 'out') { const r = next.residents.find(r => r.id === options.residentId); message = `${r.name} left the neighborhood.`; next.residents = next.residents.filter(r => r.id !== options.residentId); }
  else if (action === 'relocate') { const r = next.residents.find(r => r.id === options.residentId); r.buildingId = buildingOn(next, options.targetId).id; message = `${r.name} relocated from P${parcelId} to P${options.targetId}; identity preserved.`; }
  else if (action === 'upgrade') { b.floors = 2; b.capacity = 8; message = `P${parcelId}: upgraded to 2 floors and 8 places.`; }
  else { const street = next.streets.find(s => s.id === (options.streetId || frontageId(p))); street.open = !street.open; message = `${street.id} ${street.open ? 'reopened' : 'closed'}. Access and park routes recalculated.`; }
  next.revision++;
  next.journal = [{ revision: next.revision, message }, ...next.journal].slice(0, 30);
  assertModel(next);
  return next;
}
/** Validate saved data as well as all successful transitions. No derived values are persisted. */
export function assertModel(state) {
  const fail = message => { throw Error(`Invalid model: ${message}`); };
  if (state?.version !== MODEL_VERSION || !Number.isInteger(state.nextId) || state.nextId < 1 || !Number.isInteger(state.revision) || state.revision < 0) fail('version or counters');
  if (state.neighborhood?.id !== 'maple-grove' || state.neighborhood.gatewayId !== '-16,-16') fail('neighborhood');
  if (![state.parcels, state.buildings, state.residents, state.streets, state.journal].every(Array.isArray)) fail('entity collections');
  if (state.parcels.length !== 16 || state.streets.length !== 40) fail('map dimensions');
  for (const collection of [state.parcels, state.buildings, state.residents, state.streets]) if (new Set(collection.map(x => x.id)).size !== collection.length) fail('duplicate IDs');
  for (let i = 0; i < 16; i++) {
    const p = state.parcels.find(p => p.id === i + 1);
    if (!p || p.x !== i % 4 * 8 - 12 || p.z !== Math.floor(i / 4) * 8 - 12 || !['home','park','vacant'].includes(p.use)) fail('parcel');
    if (state.buildings.filter(b => b.parcelId === p.id).length !== (p.use === 'home' ? 1 : 0)) fail('one building per home parcel');
  }
  const expectedStreets = new Map();
  for (let z=-16;z<=16;z+=8) for(let x=-16;x<=16;x+=8) {
    if(x<16) expectedStreets.set(`H:${x+4}:${z}`,[nodeId(x,z),nodeId(x+8,z)]);
    if(z<16) expectedStreets.set(`V:${x}:${z+4}`,[nodeId(x,z),nodeId(x,z+8)]);
  }
  for (const s of state.streets) {
    const expected = expectedStreets.get(s.id);
    if (!expected || s.a !== expected[0] || s.b !== expected[1] || typeof s.open !== 'boolean') fail('street graph');
  }
  for (const b of state.buildings) {
    if (!/^B\d+$/.test(b.id) || !state.parcels.some(p=>p.id===b.parcelId&&p.use==='home') || ![1,2].includes(b.floors) || b.capacity !== b.floors * 4 || residentsOf(state,b.id).length > b.capacity) fail('building or capacity');
  }
  for (const r of state.residents) if (!/^R\d+$/.test(r.id) || typeof r.name !== 'string' || r.name.length > 80 || !state.buildings.some(b=>b.id===r.buildingId)) fail('resident reference');
  if ([...state.buildings,...state.residents].some(e => Number(e.id.slice(1)) >= state.nextId)) fail('ID counter');
  if (state.journal.length > 30 || state.journal.some(e=>!Number.isInteger(e.revision)||e.revision>state.revision||typeof e.message!=='string'||e.message.length>300)) fail('journal');
  return true;
}
