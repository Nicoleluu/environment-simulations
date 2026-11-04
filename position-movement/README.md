# The Wandering Stair — Aster Academy

An original interactive magical academy for Nicole Lu's Position + Movement assignment. Three-dimensional architecture replaces the earlier two-dimensional parcel study.

Run `node server.js` from the repository root and open `http://localhost:4173/position-movement/index.html`. The illustrated, animated six-slide web deck is at `position-movement/slides.html`.

## Explore

Choose a destination, align its path if necessary, and begin the journey. Click an actual staircase to turn that flight independently, or use the accessible individual-flight buttons in Field notes. “Shift the stairs” changes all three flights. Drag to orbit, scroll to zoom, and use the view buttons for the architectural or top view. Flights lock while a traveler is moving. The guided journey ascends to the observatory, returns, changes the configuration, and travels to the winter garden. Pause freezes travel; Reset restores the initial state.

## Spatial model

Seven landings have fixed 3D coordinates. Three flights each select one of two upper endpoints. Edges are undirected; breadth-first search finds a shortest route by number of flights (all flights have the same length). Alignment exhaustively evaluates all eight configurations and chooses one requiring the fewest switches. Stairs rotate smoothly, and travel is disabled until rotation completes.

Position: adjacent = distinct landings connected by one active edge with no intervening landing; above = traveler y greater than entrance y + 0.1; between = traveler strictly inside the journey polyline by path order, not straight-line collinearity.

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

Run `node --test position-movement/academy-model.test.js`. Browser checks exercise route blocking, alignment, occupied-flight locks, pause/resume, arrival and return, reset, shifting, field notes, and mobile overflow.

The web deck is the preferred animated presentation. An editable Spaces presentation accompanies it; GIF playback depends on that viewer.
