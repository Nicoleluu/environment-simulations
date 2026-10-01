# Neighborhood

A vanilla JavaScript, single-page Three.js sandbox. A full-window 3D neighborhood, parcel inspector, camera controls, and editing toolbar demonstrate a small semantic model.

## Run

With Node.js 18 or later, run `npm start` (or `node server.js`), then open http://localhost:4173. No installation or build step is required. Three.js 0.180.0 and OrbitControls are vendored with their MIT license. Any static web server can also serve the directory; opening index.html as a file will not load ES modules correctly.

Run model tests with `npm test` or `node --test model.test.js`.

## Demonstration model

The request did not include its referenced semantic specification and the linked repository was empty. This implementation therefore uses an **illustrative model**, not an asserted interpretation of a supplied specification. The interface identifies it as a demo model.

- A neighborhood contains 16 parcels. Each has an ID, grid position, use, street-access flag, resident count, and home capacity. Parcel area is illustratively 400 m².
- Parcel use is exactly one of vacant, home, or park.
- Development requires a vacant parcel with street access. All example parcels are connected to the fixed street network.
- A home accommodates zero to four residents. Residents are represented by a count and corresponding figures, not separately identified entities.
- Parks cannot contain residents. Occupied homes cannot be cleared.
- Move out residents before clearing a home. Cleared parcels become vacant.
- Occupancy means the percentage of homes with at least one resident.

Choose a toolbar tool and click a parcel, or use the keyboard-accessible parcel selector. Number keys 1–4 change tools. Drag to orbit, right-drag to pan, scroll to zoom. Camera buttons offer zoom, top view, and reset. Undo includes resets. Edits exist in memory for the current page session.

`model.js` contains the rules independently of the renderer. `app.js` renders procedural buildings, trees, roads, and residents and connects UI actions. Replace the demo model when the intended specification is available.
