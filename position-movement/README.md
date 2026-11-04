# Position + Movement

Assignment implementation for Nicole Lu, based on William Martin's workshop brief.

Run the root server and open `/position-movement/index.html`; the six-slide deck is `/position-movement/slides.html`. The deck embeds GIF captures generated from deterministic states of the same running simulation. Assets include screenshots and the combined capture.

The scene reuses `createExample()` from the Neighborhood model for its 16 parcel locations. Three position predicates are implemented in `model.js`: strict left-of, strict collinear between, and one-step orthogonal adjacency. The lattice spacing is 8 schematic units; diagonal or two-step separation never counts as adjacency, even if the intervening location is empty.

The position-triggered system response is a meeting band for A–B–C. The robot has an intrinsic delivery capability: adjacency with B records one delivery per reset. A delivery persists after separation. Direction compares Euclidean distance over consecutive samples. Past detects a sign change across the target's perpendicular plane within a 4-unit lateral corridor. The passing scenario uses a lane between the parcel centers. It does not claim to follow the street network or avoid collisions.

Run `node --test position-movement/model.test.js model.test.js distance-model.test.js` from the repository root. Browser checks cover scene playback, reset, screenshots, and mobile horizontal overflow. Timeline seeking deterministically replays from reset; manual changes pause playback and affect live conditions. Pressing play resumes the prescribed path; Reset restores the scene.

The web deck is the animated submission version. The Spaces copy is editable; animation playback depends on its viewer. Review the public web deck for the captured animation sequence.
