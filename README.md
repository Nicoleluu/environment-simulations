# Neighborhood — iteration 2

A vanilla JavaScript / Three.js neighborhood simulation with a full-window 3D view and a rule-driven semantic model.

**Live:** https://nicoleluu.github.io/environment-simulations/

**Deployment branch:** `codex/neighborhood-iteration-2`. GitHub Pages serves the branch root. Pushes to that branch publish updates automatically; `.nojekyll` disables Jekyll processing. `main` retains iteration one.

## Run and test

Run `npm start` or `node server.js` with Node.js 18+ and open http://localhost:4173. Run `npm test` or `node --test model.test.js` for the model tests. No install or build step is required. Three.js 0.180.0 and OrbitControls are vendored with their MIT license. Any static HTTP server can serve the project; `file://` cannot load the ES modules correctly.

## Scope and provenance

The assignment's semantic specification was not included in the original request or empty repository. These are **explicit illustrative assumptions**, not claimed compliance with an unseen course model. Iteration two deepens the existing demo. The interface's Model & history panel and [iteration notes](ITERATIONS.md) explain the rules and provide a demonstration sequence. Iteration three has not been implemented.

## Entities and relationships

| Entity | Stored attributes | Relationships |
| --- | --- | --- |
| Neighborhood | ID, name, gateway node ID | Contains 16 parcels and a street graph |
| Parcel | ID, x/z position, use (vacant/home/park) | Has a derived frontage street; hosts exactly one building when use is home |
| Building | ID, parcelId, floors, capacity | Belongs to one parcel; houses zero or more residents |
| Resident | Stable ID, display name, buildingId | Lives in exactly one building |
| Street link | ID, endpoint IDs, open flag | Joins two intersections in an undirected graph |

The fixed 5×5 intersection grid has 40 street links. A parcel's frontage is the horizontal street on its +z side. The northwest intersection `-16,-16` is the gateway. Parks are a parcel use, not separate building entities. Coordinate units are schematic, not surveyed meters.

## Enforced rules

- A vacant, connected parcel can become a home or park. A home parcel has exactly one building; other parcel types have none.
- Buildings have one or two floors; each floor provides four places. New homes start empty.
- Residents have stable IDs. Relocation updates a building reference without creating another resident or changing population.
- Moving in requires an accessible home with capacity. Relocation requires connected source and destination homes and destination capacity.
- Only a home with zero residents can be cleared. Moving out removes that resident from this neighborhood; clearing removes the empty building.
- Adding a floor requires street access and cannot exceed two floors.
- A parcel is accessible only if its frontage is open and connects through open edges to the gateway. Street closure retains existing residents but blocks development and incoming movement. A resident can leave a disconnected home as an abstract removal action; this does not simulate a physical evacuation route.
- Park routes use breadth-first search over open street edges. A home is served when the nearest accessible park is within two street links **excluding the partial frontage paths at either end**. Adjacent parcels can therefore have zero intervening links. This is a connectivity metric, not walking time or real distance.
- Parks must also be connected to the gateway to count as accessible. Closing off the gateway can make all homes unserved even when local roads still connect them to parks. This deliberate model assumption is exposed in the demonstration.
- Every accepted action validates entity references, exclusivity, capacities, and fixed graph structure. Rejected actions do not mutate state.

## Interactions and evidence

Choose a toolbar tool, then click a parcel. A keyboard user can choose a parcel in the inspector and press the explicit Apply button. The selector itself never edits the model. Keys 1–4 select tools when focus is not in a control. Drag to orbit, right-drag to pan, and scroll to zoom; camera buttons provide zoom, top view, and reset.

The inspector supports move-in, floor addition, named-resident relocation/move-out, and frontage closure. Expand Residents & relationships for stable IDs and destination selection. Model & history exposes all 40 street links, the rule descriptions, derived totals, a change journal, and JSON export. Map layers show land use, park access, or street connectivity. Blue lines trace the selected home's shortest park route; a blue post marks the gateway; coral road segments and barriers indicate closure.

Changes persist in localStorage on this browser and origin. Storage failures are reported, and invalid saved models fall back to the example. Export downloads the stored entities and journal as JSON; no import is implemented. Undo/Redo restore complete model snapshots (up to 50 prior edits) within the current page session. Reset is undoable. The journal keeps the latest 30 successful edits and is restored by Undo/Redo; it is not an immutable audit trail. There is no shared server state.

## Code map

- `model.js`: independent entity model, BFS graph queries, action guards, immutable transitions, validator, derived scene projection.
- `app.js`: procedural Three.js objects, route/closure overlays, UI actions, history, browser persistence, and export.
- `model.test.js`: nine tests covering references, atomic rejection, development, capacity, relocation, disconnection, route updates, serialization, and mixed action sequences.
- `index.html` / `style.css`: responsive controls, accessible selectors, rules dialog, and scene layout.


## October distance assignment — Nicole Lu

Open `distance.html` for the distance study and `slides.html` for the four-slide presentation, including a live route animation on slide 4. The original model remains at `index.html`.

- **Euclidean distance:** straight-line separation between parcel centers in the x/z plane.
- **Walking distance:** Dijkstra shortest path on the open undirected street graph, with edges split at frontage midpoints and 4-unit parcel access links included. This is a schematic coordinate length, not surveyed meters or travel time.
- **Occupants:** each resident resolves through their building to its parcel center. Different residents in one home have zero separation, so the induced occupant distance is a pseudometric.
- **Disconnected pairs:** walking distance is infinite internally and shown as “No route.” The external gateway is not a prerequisite for pairwise routing.
- **Demonstration:** P1 to P5 is 8 units in a straight line and 24 by walking. Closing V:-16:-4 and V:-8:-4 increases the walk to 40. Closing P5 frontage H:-12:0 makes it unreachable. Scenarios start from the original example and never overwrite the original saved neighborhood.
- **Interactions:** compare locations or occupants, choose a scenario, switch plan/3D views, animate the computed route, save a screenshot, export measurements, or record a route animation in browsers supporting MediaRecorder. The moving marker traces a route; it does not relocate the resident’s home.
- **Verification:** `node --test model.test.js distance-model.test.js` covers the existing model plus exact lengths, symmetry, geometric lower bounds, resident mapping, no-route handling, and immutable scenarios. Browser review covers desktop/mobile layouts and occupant/scenario interactions.

The assignment extends the October 1 model. It does not claim that any missed workshop has been separately submitted.
