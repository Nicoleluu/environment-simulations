# The Wandering Stair — Aster Academy

An original interactive magical academy for Nicole Lu's Position + Movement assignment. Three-dimensional architecture replaces the earlier two-dimensional parcel study.

Run `node server.js` from the repository root and open `http://localhost:4173/position-movement/index.html`. The illustrated, animated six-slide web deck is at `position-movement/slides.html`.

## Explore

Choose a destination, align its path if necessary, and begin the journey. Click an actual staircase to turn that flight independently, or use the accessible individual-flight buttons in the simulation. “Shift the stairs” changes all three flights. Drag to orbit, scroll to zoom, and use the view buttons for the architectural or top view. Flights lock while a traveler is moving. The guided journey ascends to the observatory, returns, changes the configuration, and travels to the winter garden. Pause freezes travel; Reset restores the initial state.

## Spatial model

Seven landings have fixed 3D coordinates. Three flights each select one of two upper endpoints. Edges are undirected; breadth-first search finds a shortest route by number of flights (all flights have the same length). Alignment exhaustively evaluates all eight configurations and chooses one requiring the fewest switches. Stairs rotate smoothly, and travel is disabled until rotation completes.

Position: adjacent = distinct landings connected by one active edge with no intervening landing; above = traveler y greater than entrance y + 0.1; between = traveler strictly inside a single flight’s straight 3D segment, excluding both endpoint landings.

Movement: toward = decreasing Euclidean distance to the target over a sample; ascending = increasing y; past = traveled length has crossed the entire journey's halfway mark, latched until the next journey. Stationary samples have neither toward nor ascending. Travel is sampled continuously along the polyline at 2.2 schematic units per second. Visible treads are a rendering of that slope, not a per-step gait solver.

System response: aligned configurations reveal a golden path and enable travel. Embedded capability: the student's lantern awakens the chosen portal within 1.2 units. It remains active until a new journey or reset. The entrance arrival has no physical portal mesh; returning still completes a journey.

The original fantasy design uses procedural Three.js geometry, orbit controls, stone platforms, pointed windows, brass balustrades, banners, books, floating candles, and a suspended orrery. No external artwork is required. Decorative galleries are not additional graph routes. The model does not simulate crowds or collisions. Reduced-motion preferences suppress ambient movement and shorten stair turns; travel starts only on request.

## Files and checks

- `academy-model.js`: graph, alignment, travel interpolation, condition predicates.
- `architecture.js`: procedural scene and traveler.
- `app.js`: interactions, render loop, capture hooks.
- `slides.html`: animated web presentation.
- `assets/academy-*.gif`: captures from the actual running scene.
- `model.js` and `model.test.js`: retained earlier parcel-study model, no longer imported by the academy.

Run `node --test position-movement/academy-model.test.js`. Browser checks exercise route blocking, alignment, occupied-flight locks, pause/resume, arrival and return, reset, shifting, cross-wing returns, and mobile overflow.

The web deck is the preferred animated presentation. An editable Spaces presentation accompanies it; GIF playback depends on that viewer.


## Simulation requirements audit

The simulation UI contains no presentation navigation or Field notes dialog. Existing presentation files remain separate artifacts.

- Position workshop: three live indicators evaluate adjacent (one settled graph edge), above (relative elevation), and between (strict geometric betweenness on one flight). The seven landings are modeled occupiable locations; stair slopes are transit segments. Pausing freezes simulation time rather than creating a new landing.
- Position behavior category A: a connected configuration displays its gold route and enables travel; rotation temporarily removes connectivity until docking completes.
- Position behavior category B: the student has a lantern capability; approach within 1.2 schematic units awakens a destination portal. Landings without portal meshes use ordinary arrival messaging.
- Movement workshop: toward, ascending, and past the route midpoint have live/history indicators. Pausing or resting does not report movement. Past is latched until the next journey or reset.
- Consistency: same graph drives routing, route display and adjacency; tests confirm the visual stair endpoints match graph coordinates for both angle stops. Flights lock during travel, including paused travel. No route is available midway through a rotation.
- Cross-wing transitions: if no single configuration can connect the current landing to the target, the simulation explicitly offers a return through the entrance. It does not pretend a static route exists or leave Align as a no-op.
- Verification: 12 model tests, including all 8 configurations × 7 origins × 7 destinations, geometric endpoint checks, lantern capability guards, pause/rest/descending distinctions, and strict betweenness. Browser audit verifies navigation removal, individual stair controls, mid-turn disconnection, travel locks, pause/resume, both arrival types, cross-wing recovery, reset, full guided journey, mobile width, and no JavaScript errors.

The assignment also requests class demonstration and thread submissions. Those external actions are not performed by the simulation and are not claimed complete by this audit.

## Academy life expansion

The hall now includes furnished reading tables and shelves, dining commons, a potion workshop, a glazed conservatory, an owl post with parcels, upper-gallery astronomy equipment, notices and luggage. Eighteen moving residents and five stationed specialists are present by default, with three postal owls, two familiars, and a resident ghost. Quiet study has eight moving residents; Evening gathering has twenty-four.

Moving residents follow a connected ground-floor walkway graph, choose destinations, dwell at arrivals and resume their rounds. Same-direction travelers maintain a 0.6-unit following gap; opposing movement uses offset lanes. A resident yields when within 1.4 units of the user's traveler on the ground floor. This is a simplified walkway model, not full crowd collision physics. NPCs do not use the movable stair flights; the active traveler remains the stair simulation's controlled agent.

The Academy life panel controls resident population, time scale and pause; its inspector reports the selected actor's actual current state, destination and nearest resident. Clicking a character opens the same inspector; the dropdown provides keyboard access. Stationed professors have fixed work roles. Owls follow a post–archive aerial route, and delivery counts increase on actual archive arrivals. Ghost and familiar paths are ambient routines. Pausing residents freezes their simulation time, movement and mail deliveries independently of the user's journey.

Five additional pure-model tests verify walkway connectivity, sustained arrival/dwell/departure cycles, pause invariance, traveler yielding and inspection data. Existing twelve stair/position/movement tests remain in place.
